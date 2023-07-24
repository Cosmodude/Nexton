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

contract Invicore with Deployable, OwnableTransferable, Resumable {
    const MinTonForStorage: Int = ton("0.1");
    owner: Address;
    stopped: Bool = false;

    const MIN: Int = 60 * 60;
    sPContractAddress: Address;      // Staking Contract Address
    nFTContractAddress: Address;      // NFT Contract Address
    stake: map<Address, LPDeposit>;

    LPPBalance: Int as coins = 0;
    stakeAmount: Int as coins = 0;
    counter: Int as uint32 = 0;      // Counter of messages to the contract 
    latestStakeBlock: Int as uint256;
    nftCounter: Int as uint32 = 0;

    balance: Int as coins = 0;
    

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
        require(msg.leverage<=MAX_LEVERAGE, "Too big leverage");
        let ctx: Context = context();
        let _stakeInfo: UserStakeInfo = UserStakeInfo{
            staker: ctx.sender,
            principal: ctx.value,
            lockEnd: now() + 600
            }; 
        self.stakeAmount = self.stakeAmount + ctx.value;
        //_stakeInfo.principal = msg.principal;
        self.balance = (self.balance + ctx.value);
        self.mintNFT(_stakeInfo);
    }

    bounced(src: bounced<MintNFT>) {
        self.balance = (self.balance - src.principal);
        self.stopped = true;
        send(SendParameters{
            to: sender(),
            value: src.principal,
            mode: SendRemainingValue + SendIgnoreErrors,  // vulnarable for attacks
            body: "Error: NFT not minted".asComment()
        });
    }

    receive(msg: LPDeposit){
        self.requireNotStopped();
        let ctx: Context = context(); 
        self.LPPBalance = self.LPPBalance + ctx.value;
        //_stakeInfo.principal = msg.principal;
        self.balance = (self.balance + ctx.value);
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

    fun mintNFT(_stakeInfo: UserStakeInfo){
        send(SendParameters{
            to: self.nFTContractAddress,
            value: 0,
            mode: SendRemainingValue + SendIgnoreErrors,
            body: MintNFT{
                staker: _stakeInfo.staker,
                principal: _stakeInfo.principal,
                lockEnd: _stakeInfo.lockEnd 
            }.toCell()
        });
        self.nftCounter = self.nftCounter + 1;
    }

    fun mintJettons(_receiver: Address, _amount: Int){
        send(SendParameters{
            to: sender(),
            value: 0,
            mode: SendRemainingValue + SendIgnoreErrors,
            body: mintJettons{
                amount: _amount,
                receiverAddress: _receiver
            }.toCell()
        });
        self.nftCounter = self.nftCounter + 1;
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


