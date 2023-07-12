import "@stdlib/deploy";
import "@stdlib/ownable";
import "@stdlib/stoppable";

struct StakeInfo{
    staker: Address;
}
    /*originalLeverageRatio: Int as uint32;
    leverageRatio: Int as uint32 = 1;
    protocolFee: Int as coins;
    principal: Int as coins;
    lockPeriod: Int as uint256;
    lockStart: Int as uint256;
    isLent: Bool = false;
}*/

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
    count: Int as uint32 = 0;        // Counter of messages to the contract 
    latestStakeBlock: Int as uint256;

    balance: Int as coins = 0;
    stake: map<Address, Int> = emptyMap();

    init(_jetton: Address, _liquidStaking: Address) {
        self.owner = sender();
        self.jettonContractAddress = _jetton;
        self.lSContractAddress = _liquidStaking;
        self.latestStakeBlock = now();  // returns the current BlockNumber

        self.stake = emptyMap();
    }

    //Receive functions 

    // Receive TONCoins
    receive(){}

    receive("deposit"){
        self.count = 1;
    }

    receive(msg: Deposit){
        let _stakeInfo: StakeInfo = StakeInfo{staker: sender() };  // emptyMap()
        //_stakeInfo.principal = msg.principal;
        self.balance= msg.principal;
        self.stake.set(sender(), msg.principal);
        self.count = self.stake.get(sender())!!; // !! - denaming, error if null
    }

    fun mintNFT(stakeInfo: StakeInfo){
        
        
    }

    fun notes(){
       self.requireOwner(); 
       let hash: Int = sha256("String");
    }
}


