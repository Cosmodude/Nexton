import "@stdlib/deploy";
import "@stdlib/ownable";
import "./imports/messages";
import "./imports/stdlib.fc";

const PROTOCOL_FEE: Int = ton("0.1");
const MAX_LEVERAGE: Int = 5;
const MIN_USER_DEPOSIT: Int = ton("0.5");  // inform the frontend
const MIN_LP_DEPOSIT: Int = ton("10000");

@name(equal_slices)
native equalSlices(s2: Slice, s1: Slice): Int;

@name(store_dict)
extends native storeDict(self: Builder, c: Cell): Builder;

@name(store_slice)
extends native store_slice(self: Builder, s: Slice): Builder;

struct DictGetRes{
    slice: Slice;
    success: Int;
}

struct Attribute{
            trait_type: String;
            value: Int;
}

// @name(load_dict)
// extends native loadDict(self: Slice): DictGetRes;

@name(udict_get?)
extends native udictGet(self: Cell, kl: Int, k: Int): DictGetRes;

message StakingReward{
    principal: Int as coins;
    rewards: Int as coins;
}

struct ClaimInfo{
    itemIndex: Int as uint64;
    owner: Address;
    content: Cell;
}

message(0x636c616) UserClaim{
    queryId: Int as uint64;
    info: ClaimInfo;
}

contract NexTon with Deployable, OwnableTransferable {
    const MinTonForStorage: Int = ton("0.2");
    owner: Address;
    stopped: Bool = false;
    nftItemCode: Cell;

    //sPContractAddress: Address;      // Staking Pool Contract Address
    nFTContractAddress: Address;      // NFT Contract Address

    //usersPrincipal: Int as coins = 0;
    counter: Int as uint32 = 0;      // Counter of messages to the contract 
    latestStakeBlock: Int as uint256;
    itemCounter: Int as uint64 = 0;   // next_item_index
    userItemClaimed: map<Int, Bool>;
    claimers: map<Int as uint64, Address>;
    itemContent: map<Int as uint256, Cell>;
    
    init(nftItemCode: Cell, _nft: Address) {
        self.owner = sender();
        self.nftItemCode = nftItemCode;
        //self.sPContractAddress = _liquidStaking;
        self.nFTContractAddress = _nft;
        self.latestStakeBlock = now();  // returns the current BlockNumber

        self.itemContent.set(sha256("name"), beginCell().storeUint(0, 8).store_slice("Nexton Staking Derivative".asSlice()).endCell());
        self.itemContent.set(sha256("description"), beginCell().storeUint(0, 8).store_slice("Holds information about the user's stake in the Nexton platform pool".asSlice()).endCell());
        self.itemContent.set(sha256("image"), beginCell().storeUint(0, 8).store_slice("https://raw.githubusercontent.com/Cosmodude/Nexton/main/Item_Image.jpg".asSlice()).endCell());
    }

    // Receive functions

    receive(){} // Receive TONCoins
    
    receive(msg: UserDeposit){
        require(msg.leverage <= MAX_LEVERAGE, "Too big leverage, should be less than 5");
        let ctx: Context = context();
        require(ctx.value >= MIN_USER_DEPOSIT, "Too small deposit amount, min deposit is 0.5 Ton");

        // let attr: StringBuilder = beginString();
        // attr.append("[{'trait_type': 'principal','value': '");
        // attr.append((ctx.value - PROTOCOL_FEE).toCoinsString());
        // attr.append("'}]");
        // let attributes: String = attr.toString();

        

        let attributes: Attribute = Attribute{ trait_type: "principal", value: ctx.value - PROTOCOL_FEE };

        self.itemContent.set(sha256("principal"), beginCell().storeUint(0, 8).storeCoins(ctx.value - PROTOCOL_FEE).endCell());
        self.itemContent.set(sha256("leverageRatio"), beginCell().storeUint(0, 8).storeUint(msg.leverage, 8).endCell());
        // this needs to be calculated in contract for safety
        self.itemContent.set(sha256("lockPeriod"), beginCell().storeUint(0, 8).storeUint(msg.lockPeriod, 256).endCell());
        self.itemContent.set(sha256("lockEnd"), beginCell().storeUint(0, 8).storeUint(msg.lockPeriod + now(), 256).endCell());

        self.itemContent.set(sha256("attributes"), beginCell().storeUint(0, 8).storeSlice("[{'trait_type': 'principal','value': '100'}]".asSlice()).endCell());
        let itemMessage: Cell = 
            beginCell()
            .storeAddress(ctx.sender)  //itemOwnerAddress
            .storeAddress(myAddress())  // setting nexton_aadress for nft_item
            .storeRef(beginCell().storeUint(0,8).storeDict(self.itemContent.asCell()!!).endCell())
            //.storeDict(self.itemContent.asCell()!!) //itemContent)
            .endCell();
        let messageBody: MintNFT =  MintNFT{
            queryId: msg.queryId,
            itemIndex: self.itemCounter, // nftItemIndex
            amount: 0,
            NFTMessage: itemMessage //NFTMessage: buildItemMessage(sender(), ctx.value - PROTOCOL_FEE, msg.leverage, msg.lockPeriod)
        };
        self.mintNFT(messageBody);
    }

    bounced(src: bounced<MintNFT>) {
        self.itemCounter = self.itemCounter - 1;
        //self.stopped = true;
    }

    receive(msg: UserClaim){
        require(self.itemCounter > msg.info.itemIndex, "Claiming not exisitng NFT");
        require(self.getNftAddressByIndex(msg.info.itemIndex) == sender(), "Invalid sender! Sent not from the nft item!"); // Safety check
        // let cs: Slice = msg.info.content.beginParse();
        // require(cs.bits() == 0, "0000");
        // cs.loadUint(8);
        // let dict: Cell= cs.loadRef();
        // let res: DictGetRes= dict.udictGet(257, sha256("name"));
        // require(res.success == -1, "Not found");
        // require(res.slice.bits() == 0, "0000");
        // let nameS: Slice = res.slice;
        // nameS.loadUint(8);
        // require(equalSlices(nameS,"Item name".asSlice()) == -1, "wrong name");
        self.userItemClaimed.set(msg.info.itemIndex, true);
        self.claimers.set(msg.info.itemIndex, msg.info.owner);
    }

    // Command messages
    // should be removed later or fixed
    // receive(msg: ChangeAddr){
    //     self.requireOwner();
    //     if(msg.entity.asSlice().hash() == "nft".asSlice().hash()){  // NFT
    //         self.nFTContractAddress = msg.address;
    //     }
    //     if(msg.entity.asSlice().hash() == "SP".asSlice().hash()){  // Staking Pool
    //         self.sPContractAddress  = msg.address;
    //     }
    //     else{
    //         self.reply("Wrong entity".asComment());
    //     }
    // }

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

    get fun getNftAddressByIndex(itemIndex: Int): Address {
        return contractAddress(self.getNftItemInit(itemIndex));        
    }

    // GET methods

    get fun CollectionAddress(): Address{
        return self.nFTContractAddress;
    }

    // get fun stakingPool(): Address{
    //     return self.sPContractAddress;
    // }

    get fun balance(): Int{
        return myBalance();
    }

    get fun nftCounter(): Int{
        return self.itemCounter;
    }
    
    get fun userNFTItemClaimed(index: Int): Bool?{
        return self.userItemClaimed.get(index);
    }

    get fun claimer(index: Int): Address?{
        return self.claimers.get(index);
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