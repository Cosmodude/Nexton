import "@stdlib/deploy";
import "@stdlib/ownable";
import "./imports/messages";

const PROTOCOL_FEE: Int = ton("0.1");
const MAX_LEVERAGE: Int = 5;
const MIN_USER_DEPOSIT: Int = ton("0.5");  // inform the frontend
const MIN_LP_DEPOSIT: Int = ton("10000");

@name(store_dict)
extends native storeDict(self: Builder, c: Cell): Builder;

message StakingReward{
    principal: Int as coins;
    rewards: Int as coins;
}

message(0x05138d91) UserClaim{
    itemIndex: Int as uint32;
}

struct BasicMetadata{
    name: String;
    description: String;
    image: String;
}

struct UserStakeInfo{
    name: String;
    description: String;
    image: String;
    principal: Int as coins;
    leverageRatio: Int as uint8 = 1;
    //protocolFee: Int as coins = ton("0.1");
    lockPeriod: Int as uint256 = 600;
    lockEnd: Int as uint256;
    //isLent: Bool = false;
}

contract NexTon with Deployable, OwnableTransferable {
    const MinTonForStorage: Int = ton("0.2");
    owner: Address;
    stopped: Bool = false;
    nftItemCode: Cell;

    const MIN: Int = 60;
    sPContractAddress: Address;      // Staking Pool Contract Address
    nFTContractAddress: Address;      // NFT Contract Address

    usersPrincipal: Int as coins = 0;
    counter: Int as uint32 = 0;      // Counter of messages to the contract 
    latestStakeBlock: Int as uint256;
    itemCounter: Int as uint32 = 0;   // next_item_index
    //userItemClaimed: map<Int, Bool>;
    userItemWithdrawn: map<Int, Bool>;
    
    init(nftItemCode: Cell, _liquidStaking: Address, _nft: Address) {
        self.owner = sender();
        self.nftItemCode = nftItemCode;
        self.sPContractAddress = _liquidStaking;
        self.nFTContractAddress = _nft;
        self.latestStakeBlock = now();  // returns the current BlockNumber
       // self.lpProviders = emptyMap();
    }

    // Modifiers 

    // Receive functions 
    // receive("Resume"){...}
    // receive("Stop"){...}

    // Receive TONCoins
    receive(){}
    
    receive(msg: UserDeposit){
        require(msg.leverage <= MAX_LEVERAGE, "Too big leverage, should be less than 5");
        let ctx: Context = context();
        require(ctx.value >= MIN_USER_DEPOSIT, "Too small deposit amount, min deposit is 0.5 Ton");

        let content: map<Int, Cell> = emptyMap();
        content.set(sha256("name"), beginCell().storeUint(0, 8).storeSlice("Item name".asSlice()).endCell());
        let itemContent: Cell = 
        UserStakeInfo{
            name: "Nexton User Stake",
            description: "Holds information about the user's stake in the Nexton platform pool",
            image: "https://hipo.finance/hton.png",
            principal: ctx.value - PROTOCOL_FEE,
            leverageRatio: msg.leverage,
            lockPeriod: msg.lockPeriod,
            lockEnd: now() + msg.lockPeriod
        }.toCell();
        let nftItemMessage: Cell = beginCell()
            .storeAddress(ctx.sender)  //itemOwnerAddress
            .storeAddress(myAddress())  // setting nexton_aadress for nft_item
            .storeRef(itemContent)
            .endCell();
        let body: MintNFT =  MintNFT{
            queryId: msg.queryId,
            itemIndex: self.itemCounter, // nftItemIndex
            amount: ton("0.035"),
            NFTMessage: nftItemMessage
        };

        //self.nftOwner.set(self.itemCounter, ctx.sender);  // delete after demo
        self.usersPrincipal = self.usersPrincipal + ctx.value;
        self.mintNFT(body);
    }

    bounced(src: bounced<MintNFT>) {
        self.itemCounter = self.itemCounter - 1;
       // self.nftOwner.set(self.itemCounter, myAddress());
        //self.stopped = true;
    }

    

    // receive(msg: UserClaim){
    //     self.requireNotStopped();
    //     require(self.itemCounter > msg.itemIndex, "Claiming not exisitng NFT");
    //     //require(self.nftOwner.get(msg.itemIndex) == sender(), "Message sender is not the NFT owner!");
    //     //let ctx: Context = context();
    //     //self.userItemClaimed.set(msg.itemIndex, true);
    // }

    receive(msg: UserClaim){
        //requireOwner();
        //require(self.itemCounter >= msg.itemIndex, "Claiming not exisitng NFT");
        //require(self.nftOwner.get(msg.itemIndex) == sender(), "Message sender is not the NFT owner!");
        //require(self.userItemWithdrawn.get(msg.itemIndex) == false, "Item was already withdrawn!");
        //require(self.userItemClaimed.get(msg.itemIndex) == true, "Message sender is not the NFT owner!");
        //self.userItemWithdrawn.set(msg.itemIndex, true);
        // send(SendParameters{
        //     to: sender(),
        //     value: self.principalByAddress.get(sender())!! + ton("0.5"),
        //     mode: SendPayGasSeparately + SendIgnoreErrors
        // });
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

    fun getNftItemInit(item_index: Int): Cell {
        let data: Cell = beginCell().storeUint(item_index,64).storeSlice(self.nFTContractAddress.asSlice()).endCell();
        let itemInit: Cell = beginCell().storeUint(0, 2).storeDict(self.nftItemCode).storeDict(data).storeUint(0, 1).endCell();
        // itemInit = storeDict(itemInit, self.nftItemCode);
        // itemInit = storeDict(itemInit, data);
        // return itemInit.storeUint(0, 1).endCell();
        return itemInit;
    }


    get fun getNftAddressByIndex(item_index: Int): Slice {
        let stateInit: Cell = self.getNftItemInit(item_index);
        return beginCell().storeUint(4, 3)
                     .storeInt(0, 8)
                     .storeUint(stateInit.hash(), 256)
                     .endCell()
                     .beginParse();
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