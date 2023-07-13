import "@stdlib/deploy";
import "@stdlib/ownable";
import "@stdlib/stoppable";
//import "./utils";

const day: Int = (24 * 60 * 60);
const year: Int =  24 * 60 * 60 * 365;

struct StakeInfo{
    staker: Address;
    originalLeverageRatio: Int as uint32 = 1;
    leverageRatio: Int as uint32 = 1;
    protocolFee: Int as coins = ton("0.1");
    principal: Int as coins;
    lockPeriod: Int as uint256 = (24 * 60 * 60 * 1);
    lockStart: Int as uint256;
    isLent: Bool = false;
}

message MintNFT{
    stakeInfo: StakeInfo;
}

message Deposit{
    principal: Int as coins;
    lockPeriod: Int as uint256;
    leverage: Int as uint32;
}

contract Invicore with Deployable, OwnableTransferable, Resumable {
    owner: Address;
    stopped: Bool = false;
    jettonContractAddress: Address;  // stToken Contract Address
    lSContractAddress: Address;      // Liquidity Staking Contract Address
    NFTContractAddress: Address;
    count: Int as uint32 = 0;        // Counter of messages to the contract 
    latestStakeBlock: Int as uint256;

    balance: Int as coins = 0;
    stake: map<Address, Int>;

    init(_jetton: Address, _liquidStaking: Address, _nft: Address) {
        self.owner = sender();
        self.jettonContractAddress = _jetton;
        self.lSContractAddress = _liquidStaking;
        self.NFTContractAddress = _nft;
        self.latestStakeBlock = now();  // returns the current BlockNumber

        self.stake = emptyMap();
    }

    // Receive functions 

    // Receive TONCoins
    receive(){}

    receive("increment"){
        self.count = (self.count + 1);
    }

    receive(msg: Deposit){
        let _stakeInfo: StakeInfo = StakeInfo{
            staker: sender(),
            principal: context().value,
            lockStart: now()
            }; 
        //_stakeInfo.principal = msg.principal;
        self.balance = (self.balance + msg.principal);
        self.stake.set(sender(), msg.principal);
        
    }

    bounced(src: bounced<MintNFT>){

    }

    fun mintNFT(_stakeInfo: StakeInfo){

        
        
    }

    fun notes(){
       self.requireOwner(); 
       let hash: Int = sha256("String");
       self.count = self.stake.get(sender())!!; // !! - denaming, error if null
       self.stake.set(sender(), null); // instead of delete
    }
}


