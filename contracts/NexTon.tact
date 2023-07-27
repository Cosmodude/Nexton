import "@stdlib/deploy";
import "@stdlib/ownable";
import "@stdlib/stoppable";
import "./imports/messages";

const PROTOCOL_FEE: Int = ton("0.1");
const MAX_LEVERAGE: Int = 5;
const MIN_USER_DEPOSIT: Int = ton("0.2");
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

    const MIN: Int = 60 * 60;
    sPContractAddress: Address;      // Staking Contract Address
    nFTContractAddress: Address;      // NFT Contract Address
    lpProviders: map<Address, LPProvider>;

    LPPPrinciple: Int as coins = 0;
    usersPrincipal: Int as coins = 0;
    counter: Int as uint32 = 0;      // Counter of messages to the contract 
    latestStakeBlock: Int as uint256;
    nftCounter: Int as uint32 = 0;
    
    init( _liquidStaking: Address, _nft: Address) {
        self.owner = sender();
        self.sPContractAddress = _liquidStaking;
        self.nFTContractAddress = _nft;
        self.latestStakeBlock = now();  // returns the current BlockNumber
        self.lpProviders = emptyMap();
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
        require(ctx.value >= MIN_USER_DEPOSIT, "Too small deposit amount");
        
        let nftContent: Cell = NFTContent{
            principal: ctx.value - PROTOCOL_FEE,
            leverageRatio: msg.leverage,
            lockPeriod: msg.lockPeriod,
            lockEnd: now() + msg.lockPeriod
            }.toCell();
        let nftMessage: Cell = beginCell()
            .storeAddress(ctx.sender)  //itemOwnerAddress
            .storeRef(nftContent)
            .endCell();
        let body: MintNFT =  MintNFT{
            queryId: msg.queryId,
            itemIndex: self.nftCounter, //nftItemIndex
            NFTMessage: nftMessage
        };

        self.usersPrincipal = self.usersPrincipal + ctx.value;
        self.mintNFT(body);
    }

    bounced(src: bounced<MintNFT>) {
        self.nftCounter = self.nftCounter - 1;
        //self.stopped = true;
    }

    receive("Liquidity Provider Deposit"){
        self.requireNotStopped();
        let ctx: Context = context();
        require(ctx.value >= MIN_LP_DEPOSIT, "Too small deposit amount");
        
        // let currentPosition: LPProvider = (self.lpProviders.get(sender()))!!;
        // self.lpProviders.set(ctx.sender, LPProvider{
        //     principal: currentPosition.principal + ctx.value,
        //     rewards: currentPosition.rewards,
        //     lastStakePrincipal:  currentPosition.lastStakePrincipal
        // });
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

}


