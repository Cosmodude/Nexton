import "@stdlib/deploy";
import "@stdlib/ownable";
import "@stdlib/stoppable";
import "./imports/messages";

const DAY: Int = (24 * 60 * 60);
const YEAR: Int =  24 * 60 * 60 * 365;
const HOUR: Int = 60 * 60;

struct LPProvider{
    principal: Int as coins = 0;
    rewards: Int as coins = 0;
    lastStakePrincipal: Int as coins = 0;
}

message StakingReward{

}

struct UserStakeInfo{
    staker: Address;
    originalLeverageRatio: Int as uint32 = 1;
    leverageRatio: Int as uint32 = 1;
    protocolFee: Int as coins = ton("0.1");
    principal: Int as coins;
    lockPeriod: Int as uint256 = 600;
    lockEnd: Int as uint256;
    isLent: Bool = false;
}

contract Invicore with Deployable, OwnableTransferable, Resumable {
    owner: Address;
    stopped: Bool = false;

    const MIN: Int = 60 * 60;
    LPPoolContractAddress: Address;  // Liquidity Pool Provider contract 
    SPContractAddress: Address;      // Staking Contract Address
    nFTContractAddress: Address;
    stake: map<Address, LPProvider> = emptyMap();

    LPPBalance: Int as coins = 0;
    stakeAmount: Int as coins = 0;
    counter: Int as uint32 = 0;      // Counter of messages to the contract 
    latestStakeBlock: Int as uint256;
    nftCounter: Int as uint32 = 0;

    balance: Int as coins = 0;
    

    init(_liquidtyProviderPool: Address, _liquidStaking: Address, _nft: Address) {
        self.owner = sender();
        self.LPPoolContractAddress = _liquidtyProviderPool;
        self.SPContractAddress = _liquidStaking;
        self.nFTContractAddress = _nft;
        self.latestStakeBlock = now();  // returns the current BlockNumber

    }

    // Modifiers 

    fun requireLPPool() {
        nativeThrowUnless(132, context().sender == self.LPPoolContractAddress);
        require(context().value >= ton("10000"), "Deposited not enough Ton");
    }

    // Receive functions 

    // Receive TONCoins
    receive(){}
    // receive("Resume"){...}
    // receive("Stop"){...}
    receive("increment"){
        self.requireNotStopped();
        self.counter = self.counter + 1;
    }

    receive(msg: UserDeposit){
        self.requireNotStopped();
        let ctx: Context = context();
        let _stakeInfo: StakeInfo = StakeInfo{
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
        if(msg.entity.asSlice().hash() == "LPP".asSlice().hash()){  // Liquidity Provider Pool
            self.LPPoolContractAddress  = msg.address;
        }
        if(msg.entity.asSlice().hash() == "SP".asSlice().hash()){  // Staking Pool
            self.SPContractAddress  = msg.address;
        }
        else{
            self.reply("Wrong entity".asComment());
        }
    }

    fun mintNFT(_stakeInfo: StakeInfo){
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
            to: self.LPPoolContractAddress,
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

    // get fun stopped(): Bool {...}
}


