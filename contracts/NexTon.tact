import "@stdlib/deploy";
import "@stdlib/ownable";
import "./imports/messages";
import "./imports/stdlib.fc";

const PROTOCOL_FEE: Int = ton("0.1");
const MAX_LEVERAGE: Int = 5;
const MIN_USER_DEPOSIT: Int = ton("1");  // inform the frontend
const MIN_CONTRACT_BALANCE: Int = ton("0.2");
const DEFAULT_LOCK_PERIOD: Int = 86400; // 1 day

@name(equal_slices)
native equal_slices(s2: Slice, s1: Slice): Int;

@name(store_dict)
extends native storeDict(self: Builder, c: Cell): Builder;

struct Attribute{
            trait_type: String;
            value: Int;
}

struct DictLoadRes{
    slice: Slice;
    dict: Cell;
}

@name(load_dict)
extends native loadDict(self: Slice): DictLoadRes;

struct DictGetRes{
    cell: Cell;
    success: Int;
}

@name(udict_get_ref?)
extends native udictGetRef(self: Cell, kl: Int, k: Int): DictGetRes;

contract NexTon with Deployable, OwnableTransferable {
    const MinTonForStorage: Int = ton("0.2");
    owner: Address;
    stopped: Bool = false;
    nftItemCode: Cell;

    nFTContractAddress: Address;      // NFT Contract Address

    usersPrincipal: Int as coins = 0;
    latestStakeBlock: Int as uint256;
    itemCounter: Int as uint64 = 0;   // next_item_index
    lockPeriod: Int as uint256 = 0;
    itemClaimed: map<Int, Bool>;
    itemContent: map<Int as uint256, Cell>;
    
    init(nftItemCode: Cell, _nft: Address) {
        self.owner = sender();
        self.nftItemCode = nftItemCode;
        //self.sPContractAddress = _liquidStaking;
        self.nFTContractAddress = _nft;
        self.latestStakeBlock = 0;  
        self.lockPeriod = DEFAULT_LOCK_PERIOD;

        self.itemContent.set(sha256("name"), beginCell().storeUint(0, 8).storeSlice("Nexton Staking Derivative".asSlice()).endCell());
        self.itemContent.set(sha256("description"), beginCell().storeUint(0, 8).storeSlice("Holds information about the user's stake in the Nexton platform pool".asSlice()).endCell());
        self.itemContent.set(sha256("image"), beginCell().storeUint(0, 8).storeSlice("https://raw.githubusercontent.com/Cosmodude/Nexton/main/Item_Image.jpg".asSlice()).endCell());
    }

    // Receive functions

    receive(){} // Receive TONCoins
    
    receive(msg: UserDeposit){
        require(!self.stopped, "Contract is stopped");
        let ctx: Context = context();
        require(ctx.value >= MIN_USER_DEPOSIT, "Too small deposit amount, min deposit is 1 Ton");

        let attributes: Attribute = Attribute{ trait_type: "principal", value: ctx.value - PROTOCOL_FEE };
        self.latestStakeBlock = now(); // returns the current BlockNumber
        self.itemClaimed.set(self.itemCounter, false);

        self.itemContent.set(sha256("principal"), beginCell().storeUint(0, 8).storeCoins(ctx.value - PROTOCOL_FEE).endCell());
        // self.itemContent.set(sha256("leverageRatio"), beginCell().storeUint(0, 8).storeUint(msg.leverage, 8).endCell());
        // this needs to be calculated in contract for safety
        self.itemContent.set(sha256("lockPeriod"), beginCell().storeUint(0, 8).storeUint(self.lockPeriod, 256).endCell());
        self.itemContent.set(sha256("lockEnd"), beginCell().storeUint(0, 8).storeUint(self.lockPeriod + now(), 256).endCell());

        self.itemContent.set(sha256("attributes"), beginCell().storeUint(0, 8).storeSlice("[{'trait_type': 'principal','value': '100'}]".asSlice()).endCell());
        let itemMessage: Cell = 
            beginCell()
            .storeAddress(ctx.sender)  //itemOwnerAddress
            .storeAddress(myAddress())  // setting nexton_aadress for nft_item
            .storeRef(beginCell().storeUint(0,8).storeDict(self.itemContent.asCell()!!).endCell())
            .endCell();
        let messageBody: MintNFT =  MintNFT{
            queryId: msg.queryId,
            itemIndex: self.itemCounter, // nftItemIndex
            amount: 0,
            NFTMessage: itemMessage //  NFTMessage: buildItemMessage(sender(), ctx.value - PROTOCOL_FEE, msg.leverage, msg.lockPeriod)
        };
        self.mintNFT(messageBody);
    }

    bounced(src: bounced<MintNFT>) {
        self.itemCounter = self.itemCounter - 1;
    }

    receive(msg: UserClaim){
        require(!self.stopped, "Contract is stopped");
        let itemIndex: Int = msg.payload.itemIndex;
        require(self.itemCounter > itemIndex, "Claiming not exisitng NFT");
        require(!self.itemClaimed.get(itemIndex)!!, "Item already claimed");
        require(self.NftAddressByIndex(itemIndex) == sender(), "Invalid sender! Sent not from the nft item!"); // Safety check
        self.itemClaimed.set(itemIndex, true); // Int 

        let owner: Address = msg.payload.owner;

        // reading conentent 
        let contentS: Slice = msg.payload.content.beginParse();
        nativeThrowUnless(906, contentS.loadUint(8) == 0);
        let res: DictLoadRes = contentS.loadDict();  
        nativeThrowUnless(907, res.dict != null);
        //nativeThrowWhen(906, res.dict.beginParse().empty());
        let lockEndRes: DictGetRes = res.dict.udictGetRef(256, sha256("lockEnd"));
        nativeThrowUnless(908, lockEndRes.success == 0);
        let lockEndS: Slice = lockEndRes.cell.beginParse();
        // // skipping the prefix
        let prefix: Int = lockEndS.loadUint(8);
        //require(prefix == 0, "Invalid prefix");
        // let lockEnd: Int = lockEndS.loadUint(256);
        
        //let content: Cell = msg.payload.content.asSlice().loadDict();   
    }

    receive(msg: AdminWithdraw) {
        require(sender() == self.owner, "Only owner can withdraw");
        require(msg.amount <= myBalance(), "Not enough balance to withdraw");
        nativeReserve(MIN_CONTRACT_BALANCE, 0);
        send(SendParameters{
            to: sender(),
            value: msg.amount,
            mode: SendIgnoreErrors + SendPayGasSeparately,
            body: "Assets withdrawn".asComment()
        });
    }

    receive(msg: StopContract){
        require(sender() == self.owner, "Only owner can stop the contract");
        self.stopped = true;
    }

    receive(msg: StartContract){
        require(sender() == self.owner, "Only owner can start the contract");
        self.stopped = false;
    }

    receive(msg: SetLockPeriod){
        require(sender() == self.owner, "Only owner can set lock period");
        self.lockPeriod = msg.lockPeriod;
    }

    // Functions
    
    fun mintNFT(body: MintNFT){
        send(SendParameters{
            to: self.nFTContractAddress,
            value: ton("0.04"),
            mode: SendPayGasSeparately + SendIgnoreErrors,
            body: body.toCell()
        });
        self.itemCounter = self.itemCounter + 1;
    }

    fun getNftItemInit(itemIndex: Int): StateInit {
        let data: Cell = beginCell().storeUint(itemIndex,64).storeSlice(self.nFTContractAddress.asSlice()).endCell();
        let itemInit: StateInit = StateInit{
            data: data,
            code: self.nftItemCode
        }; 
        return itemInit;
    }

    get fun NftAddressByIndex(itemIndex: Int): Address {
        return contractAddress(self.getNftItemInit(itemIndex));        
    }

    // GET methods

    get fun collectionAddress(): Address{
        return self.nFTContractAddress;
    }

    get fun staked(): Int{
        return self.usersPrincipal;
    }

    get fun nftCounter(): Int{
        return self.itemCounter;
    }
    
    // get fun itemClaimed(index: Int): Bool{
    //     return self.itemClaimed.get(index)!!;
    // }

    get fun itemClaimed(index: Int): Bool?{
        return self.itemClaimed.get(index);
    }

    get fun lockPeriod(): Int{
        return self.lockPeriod;
    }
}

// Two ways of claiming:
// tic talk with users nfts (only one withdraw message from user), no extra reward from overtime staking(even for us)
// through 2 user messages

// receive("Liquidity Provider Deposit"){
    //     self.requireNotStopped();
    //     let ctx: Context = context();
    //     require(ctx.value >= MIN_LP_DEPOSIT, "Too small deposit amount, min LP deposit is 10000 Ton");
        
    //     // let currentPosition: LPProvider = (self.lpProviders.get(sender()))!!;
    //     // self.lpProviders.set(ctx.sender, LPProvider{
    //     //     principal: currentPosition.principal + ctx.value,
    //     //     rewards: currentPosition.rewards,
    //     //     lastStakePrincipal:  currentPosition.lastStakePrincipal
    //     // });
    // }