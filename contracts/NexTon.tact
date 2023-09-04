import "@stdlib/deploy";
import "@stdlib/ownable";
import "@stdlib/stoppable";
import "./imports/messages";

const PROTOCOL_FEE: Int = ton("0.1");
const MAX_LEVERAGE: Int = 5;
const MIN_USER_DEPOSIT: Int = ton("0.5");  // inform the frontend
const MIN_LP_DEPOSIT: Int = ton("10000");

struct LPProvider{
    principal: Int as coins = 0;
    rewards: Int as coins = 0;
    lastStakePrincipal: Int as coins = 0;
}

message StakingReward{
    principal: Int as coins;
    rewards: Int as coins;
}

message UserClaim{
    nftIndex: Int as uint32;
}

message UserWithdraw{
    nftIndex: Int as uint32;
}

struct UserStakeInfo{
    staker: Address;
    leverageRatio: Int as uint32 = 1;
    protocolFee: Int as coins = ton("0.1");
    principal: Int as coins;
    lockPeriod: Int as uint256 = 600;
    lockEnd: Int as uint256;
    isLent: Bool = false;
}

contract NexTon with Deployable, OwnableTransferable, Resumable {
    const MinTonForStorage: Int = ton("0.1");
    owner: Address;
    stopped: Bool = false;

    const MIN: Int = 60;
    sPContractAddress: Address;      // Staking Contract Address
    nFTContractAddress: Address;      // NFT Contract Address
    //lpProviders: map<Address, LPProvider>; // delete?

    //LPPPrinciple: Int as coins = 0;
    usersPrincipal: Int as coins = 0;
    counter: Int as uint32 = 0;      // Counter of messages to the contract 
    latestStakeBlock: Int as uint256;
    nftCounter: Int as uint32 = 0;
    userNFTItemClaimed: map<Int, Bool>;
    nftOwner: map<Int, Address>;
    
    init( _liquidStaking: Address, _nft: Address) {
        self.owner = sender();
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
    receive(){
        
    }
    
    receive(msg: UserDeposit){
        self.requireNotStopped();
        require(msg.leverage <= MAX_LEVERAGE, "Too big leverage, should be less than 5");
        let ctx: Context = context();
        require(ctx.value >= MIN_USER_DEPOSIT, "Too small deposit amount, min deposit is 0.5 Ton");
        
        let nftMetadata: Cell = NFTContent{
            principal: ctx.value - PROTOCOL_FEE,
            leverageRatio: msg.leverage,
            lockPeriod: msg.lockPeriod,
            lockEnd: now() + msg.lockPeriod
            }.toCell();
        let nftItemMessage: Cell = beginCell()
            .storeAddress(ctx.sender)  //itemOwnerAddress
            .storeAddress(myAddress())  // setting nexton_aadress for nft_item
            .storeRef(nftMetadata)
            .endCell();
        let body: MintNFT =  MintNFT{
            queryId: msg.queryId,
            itemIndex: self.nftCounter, // nftItemIndex
            amount: ton("0.035"),
            NFTMessage: nftItemMessage
        };

        self.nftOwner.set(self.nftCounter, ctx.sender);
        self.usersPrincipal = self.usersPrincipal + ctx.value;
        self.mintNFT(body);
    }

    bounced(src: bounced<MintNFT>) {
        self.nftCounter = self.nftCounter - 1;
        self.nftOwner.set(self.nftCounter, myAddress());
        //self.stopped = true;
    }

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

    receive(msg: UserClaim){
        self.requireNotStopped();
        require(self.nftCounter > msg.nftIndex, "Claiming not exisitng NFT");
        require(self.nftOwner.get(msg.nftIndex) == sender(), "Message sender is not the NFT owner!");
        let ctx: Context = context();
        self.userNFTItemClaimed.set(msg.nftIndex, true);
    }

    receive(msg: UserWithdraw){
        self.requireNotStopped();
        require(self.nftCounter > msg.nftIndex, "Claiming not exisitng NFT");
        require(self.nftOwner.get(msg.nftIndex) == sender(), "Message sender is not the NFT owner!");

    }

    // Command messages

    receive(msg: ChangeAddr){
        self.requireOwner();
        if(msg.entity.asSlice().hash() == "nft".asSlice().hash()){  // NFT
            self.nFTContractAddress = msg.address;
        }
        if(msg.entity.asSlice().hash() == "SP".asSlice().hash()){  // Staking Pool
            self.sPContractAddress  = msg.address;
        }
        else{
            self.reply("Wrong entity".asComment());
        }
    }

    // Functions

    fun mintNFT(body: MintNFT){
        send(SendParameters{
            to: self.nFTContractAddress,
            value: ton("0.04"),
            mode: SendPayGasSeparately + SendIgnoreErrors,
            body: body.toCell()
        });
        self.nftCounter = self.nftCounter + 1;
    }

    // GET methods

    // get fun stopped(): Bool {...}

    get fun nftContract(): Address{
        return self.nFTContractAddress;
    }

    get fun stakingPool(): Address{
        return self.sPContractAddress;
    }

    get fun balance(): Int{
        return myBalance();
    }

    get fun nftCounter(): Int{
        return self.nftCounter;
    }

    get fun userNFTItemClaimed(index: Int): Bool?{
        return self.userNFTItemClaimed.get(index);
    }
}


// Two ways of claiming:
// tic talk with users nfts (only one withdraw message from user), no extra reward from overtime staking(even for us)
// through 2 user messages