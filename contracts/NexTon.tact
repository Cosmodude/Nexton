import "@stdlib/deploy";
import "@stdlib/ownable";
import "./imports/messages";

const PROTOCOL_FEE: Int = ton("0.1");
const MAX_LEVERAGE: Int = 5;
const MIN_USER_DEPOSIT: Int = ton("0.5");  // inform the frontend
const MIN_LP_DEPOSIT: Int = ton("10000");

@name(store_dict)
extends native storeDict(self: Builder, c: Cell): Builder;

@name(store_slice)
extends native store_slice(self: Builder, s: Slice): Builder;

// struct DictGetRes{
//     slice: Slice;
//     dict: Cell;
// }

// @name(load_dict)
// extends native loadDict(self: Slice): DictGetRes;

// @name(udict_get?)
// extends native udictGet(self: Cell, kl: Int, k: Int): Slice;

message StakingReward{
    principal: Int as coins;
    rewards: Int as coins;
}

message(0x636c6169) UserClaim{
    itemIndex: Int as uint64;
    owner: Address;
    content: Cell;
}

// let itemContent: Cell = 
        // UserStakeInfo{
        //     name: "Nexton User Stake",
        //     description: "Holds information about the user's stake in the Nexton platform pool",
        //     image: "https://hipo.finance/hton.png",
        //     principal: ctx.value - PROTOCOL_FEE,
        //     leverageRatio: msg.leverage,
        //     lockPeriod: msg.lockPeriod,
        //     lockEnd: now() + msg.lockPeriod
        // }.toCell();
// struct UserStakeInfo{
//     name: String;
//     description: String;
//     image: String;
//     principal: Int as coins;
//     leverageRatio: Int as uint8 = 1;
//     //protocolFee: Int as coins = ton("0.1");
//     lockPeriod: Int as uint256 = 600;
//     lockEnd: Int as uint256;
//     //isLent: Bool = false;
// }

contract NexTon with Deployable, OwnableTransferable {
    const MinTonForStorage: Int = ton("0.2");
    owner: Address;
    stopped: Bool = false;
    nftItemCode: Cell;

    //const MIN: Int = 60;
    //sPContractAddress: Address;      // Staking Pool Contract Address
    nFTContractAddress: Address;      // NFT Contract Address

    //usersPrincipal: Int as coins = 0;
    counter: Int as uint32 = 0;      // Counter of messages to the contract 
    latestStakeBlock: Int as uint256;
    itemCounter: Int as uint64 = 0;   // next_item_index
    userItemClaimed: map<Int, Bool>;
    claimers: map<Int, Address>;
    
    init(nftItemCode: Cell, _nft: Address) {
        self.owner = sender();
        self.nftItemCode = nftItemCode;
        //self.sPContractAddress = _liquidStaking;
        self.nFTContractAddress = _nft;
        self.latestStakeBlock = now();  // returns the current BlockNumber
    }

    // Receive functions

    receive(){} // Receive TONCoins
    
    receive(msg: UserDeposit){
        require(msg.leverage <= MAX_LEVERAGE, "Too big leverage, should be less than 5");
        let ctx: Context = context();
        require(ctx.value >= MIN_USER_DEPOSIT, "Too small deposit amount, min deposit is 0.5 Ton");

        let content: map<Int, Cell> = emptyMap();

        content.set(sha256("name"), beginCell().storeUint(0, 8).store_slice("Item name".asSlice()).endCell());
        content.set(sha256("description"), beginCell().storeUint(0, 8).store_slice("Holds information about the user's stake in the Nexton platform pool".asSlice()).endCell());
        content.set(sha256("image"), beginCell().storeUint(0, 8).store_slice("https://raw.githubusercontent.com/Cosmodude/TAP/main/TAP_Logo.png".asSlice()).endCell());
        content.set(sha256("marketplace"), beginCell().storeUint(0, 8).store_slice("getgems.io".asSlice()).endCell());
        content.set(sha256("principal"), beginCell().storeUint(0, 8).storeCoins(ctx.value - PROTOCOL_FEE).endCell());
        content.set(sha256("leverageRatio"), beginCell().storeUint(0, 8).storeUint(msg.leverage, 8).endCell());
        content.set(sha256("lockPeriod"), beginCell().storeUint(0, 8).storeUint(msg.lockPeriod, 256).endCell());
        content.set(sha256("lockEnd"), beginCell().storeUint(0, 8).storeUint(msg.lockPeriod + now(), 256).endCell());

        

        let itemMessage: Cell = 
            beginCell()
            .storeAddress(ctx.sender)  //itemOwnerAddress
            .storeAddress(myAddress())  // setting nexton_aadress for nft_item
            .storeDict(content.asCell()!!) //itemContent)
            .endCell();
        let messageBody: MintNFT =  MintNFT{
            queryId: msg.queryId,
            itemIndex: self.itemCounter, // nftItemIndex
            amount: ton("0.035"),
            NFTMessage: itemMessage //NFTMessage: buildItemMessage(sender(), ctx.value - PROTOCOL_FEE, msg.leverage, msg.lockPeriod)
        };
        // let dict: Cell = nftItemMessage.beginParse().load_dict();
        // let res: DictGetRes = dict.udictGet(256, sha256("name"));
        // let name: Int = nameS.loadUint(256);
        // require(name == sha256("Item nam"), "  Not working ");
        //self.usersPrincipal = self.usersPrincipal + ctx.value;
        self.mintNFT(messageBody);
    }

    bounced(src: bounced<MintNFT>) {
        self.itemCounter = self.itemCounter - 1;
        //self.stopped = true;
    }

    receive(msg: UserClaim){
        //self.requireNotStopped();
        require(self.itemCounter > msg.itemIndex, "Claiming not exisitng NFT");
        require(self.getNftAddressByIndex(msg.itemIndex) == sender(), "Invalid sender! Sent not from the nft item!"); // Safety check
        //let dict: Cell = msg.content.beginParse().loadDict();
        self.userItemClaimed.set(msg.itemIndex, true);
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

    fun getNftItemInit(item_index: Int): StateInit {
        let data: Cell = beginCell().storeUint(item_index,64).storeSlice(self.nFTContractAddress.asSlice()).endCell();
        let itemInit: StateInit = StateInit{
            data: data,
            code: self.nftItemCode
        }; 
        return itemInit;
    }


    get fun getNftAddressByIndex(item_index: Int): Address {
        return contractAddress(self.getNftItemInit(item_index));        
    }

    // GET methods

    get fun nftContract(): Address{
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
    
    // get fun userNFTItemClaimed(index: Int): Bool?{
    //     return self.userItemClaimed.get(index);
    // }
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