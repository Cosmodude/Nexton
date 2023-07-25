import "@stdlib/deploy";
import "@stdlib/ownable";
import "@stdlib/stoppable";
import "./imports/messages";

const DAY: Int = (24 * 60 * 60);
const YEAR: Int =  24 * 60 * 60 * 365;
const HOUR: Int = 60 * 60;
const PROTOCOL_FEE: Int = ton("100");
const MAX_LEVERAGE: Int = 5;

message LPDeposit{
    principal: Int as coins = 0;
    rewards: Int as coins = 0;
    lastStakePrincipal: Int as coins = 0;
}

message StakingReward{

}

struct UserStakeInfo{
    staker: Address;
    leverageRatio: Int as uint32 = 1;
    protocolFee: Int as coins = ton("100");
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
    stake: map<Address, LPDeposit>;

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
    }

    // Modifiers 


    // Receive functions 

    // receive("Resume"){...}
    // receive("Stop"){...}

    // Receive TONCoins
    receive(){}
    
    receive("increment"){
        self.requireNotStopped();
        self.counter = self.counter + 1;
    }

    receive(msg: UserDeposit){
        self.requireNotStopped();
        require(msg.leverage<=MAX_LEVERAGE, "Too big leverage, should be less than 5");
        let ctx: Context = context();

        let nftContent: Cell = NFTContent{
            principal: ctx.value - PROTOCOL_FEE,
            leverageRatio: msg.leverage,
            lockPeriod: msg.lockPeriod,
            lockEnd: now() + 600
            }.toCell();
        let nftMessage: Cell = beginCell()
            .storeAddress(ctx.sender)
            .storeRef(nftContent)
            .endCell();
        let _body: MintNFT =  MintNFT{
            queryId: now(),
            itemIndex: self.nftCounter,
            amount: ton("0.05"),
            NFTMessage: nftMessage
        };

        self.usersPrincipal = self.usersPrincipal + ctx.value;
        //_stakeInfo.principal = msg.principal;
        self.mintNFT(_body);
    }

    bounced(src: bounced<MintNFT>) {
        self.usersPrincipal = (self.usersPrincipal - src.queryId);
        self.stopped = true;
        send(SendParameters{
            to: sender(),
            value: 0,
            mode: SendRemainingValue + SendIgnoreErrors,  // vulnarable for attacks
            body: "Error: NFT not minted".asComment()
        });
    }

    receive(msg: LPDeposit){
        self.requireNotStopped();
        let ctx: Context = context(); 
        self.LPPPrinciple = (self.LPPPrinciple + ctx.value);
        self.mintJettons(ctx.sender, ctx.value);
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

    fun mintNFT(_body: MintNFT){
        send(SendParameters{
            to: self.nFTContractAddress,
            value: 0,
            mode: SendIgnoreErrors,
            body: _body.toCell() 
        });
        self.nftCounter = self.nftCounter + 1;
    }

    fun mintJettons(_receiver: Address, _amount: Int){
        send(SendParameters{
            to: sender(),
            value: 0,
            mode: SendRemainingValue + SendIgnoreErrors,
            bounce: false,
            body: mintJettons{
                amount: _amount,
                receiverAddress: _receiver
            }.toCell()
        });
    }

    fun notes(){
       self.requireOwner(); 
       let stake: map<Address, Int> = emptyMap();
       stake.set(sender(), 3);
       let hash: Int = sha256("String");
       self.counter = stake.get(sender())!!; // !! - denaming, error if null
       stake.set(sender(), null); // instead of delete
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
}

