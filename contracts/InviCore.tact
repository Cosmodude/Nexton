import "@stdlib/deploy";
import "@stdlib/ownable";

struct StakeInfo{
    staker: Address;
    originalLeverageRatio: Int as uint32;
    leverageRatio: Int as uint32 = 1;
    protocolFee: Int as coins;
    principal: Int as coins;
    lockPeriod: Int as uint256;
    lockStart: Int as uint256;
    isLent: Bool = false;
}

message Deposit{
    principal: Int as coins;
    lockPeriod: Int as uint256;
    leverage: Int as uint32;
}

contract Invicore with Deployable, OwnableTransferable {
    owner: Address;
    jettonContractAddress: Address;  // stToken Contract Address
    lSContractAddress: Address;      // Liquidity Staking Contract Address
    latestStakeBlock: Int as uint256;

    counter: Int as coins;
    stake: map<Address, StakeInfo>;

    init(_jetton: Address, _liquidStaking: Address) {
        owner = sender();
        jettonContractAddress = _jetton;
        lSContractAddress = _liquidStaking;

        latestStakeBlock = now();  // returns the current BlockNumber
    }

    //Receive functions 

    // Receive TONCoins
    receive(){}

    receive("deposit"){
        counter = msg.value;
    }

    receive(msg: Deposit){
        let _stakeInfo: StakeInfo;
        _stakeInfo.principal = msg.principal;
        counter= msg.value;
        stake[sender()].principal = msg.principal;
    }

    fun mintNFT(stakeInfo: StakeInfo){
        
    }
}


