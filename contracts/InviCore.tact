import "@stdlib/deploy";
import "@stdlib/ownable";
import "@stdlib/stoppable";
//import "./contracts/NFT.fc";
//import "./imports/messages";

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
    staker: Address;
    leverageRatio: Int as uint32 = 1;
    principal: Int as coins;
    lockPeriod: Int as uint256 = (24 * 60 * 60 * 1);
    lockStart: Int as uint256;
    isLent: Bool = false;
}

message UserDeposit{
    principal: Int as coins;
    lockPeriod: Int as uint256;
    leverage: Int as uint32;
}

message LPPoolDeposit{
    amount: Int as coins; 
    
}

contract Invicore with Deployable, OwnableTransferable, Resumable {
    owner: Address;
    stopped: Bool = false;
    LPPoolContractAddress: Address;          // Liquidity Pool Provider contract 
    jettonContractAddress: Address;  // stToken Contract Address
    lSContractAddress: Address;      // Liquidity Staking Contract Address
    nFTContractAddress: Address;
    counter: Int as uint32 = 0;      // Counter of messages to the contract 
    latestStakeBlock: Int as uint256;
    nftCounter: Int as uint32 = 0;

    balance: Int as coins = 0;
    stake: map<Address, Int>;

    init(_liquidtyProviderPool: Address, _jetton: Address, _liquidStaking: Address, _nft: Address) {
        self.owner = sender();
        self.LPPoolContractAddress = _liquidtyProviderPool;
        self.jettonContractAddress = _jetton;
        self.lSContractAddress = _liquidStaking;
        self.nFTContractAddress = _nft;
        self.latestStakeBlock = now();  // returns the current BlockNumber

        self.stake = emptyMap();
    }

    fun requireLPPool() {
        nativeThrowUnless(132, context().sender == self.LPPoolContractAddress);
    }
    // Receive functions 

    // Receive TONCoins
    receive(){}

    receive("increment"){
        self.counter = self.counter + 1;
    }

    receive(msg: UserDeposit){
        let ctx: Context = context();
        let _stakeInfo: StakeInfo = StakeInfo{
            staker: ctx.sender,
            principal: ctx.value,
            lockStart: now() + 600
            }; 
        //_stakeInfo.principal = msg.principal;
        self.balance = (self.balance + msg.principal);
        self.stake.set(sender(), msg.principal);
        self.mintNFT(_stakeInfo);
    }

    /*bounced(src: bounced<MintNFT>) {
        self.balance = (self.balance - src.principal);
        send(SendParameters{
            to: src.staker,
            value: src.principal,
            mode: SendRemainingValue + SendIgnoreErrors,  // vulnarable for attacks
            body: "Error: NFT not minted".toString()
        });
    }
    */


    fun setNFTContract(_nft: Address){
        self.requireOwner();
        self.nFTContractAddress = _nft;
    } 

    fun setlSContractAddress(_liquidStaking: Address){
        self.requireOwner();
        self.lSContractAddress = _liquidStaking;
    } 

    fun setLPPoolContractAddress(_liquidityProviderPool: Address){
        self.requireOwner();
        self.lSContractAddress = _liquidityProviderPool;
    } 

    fun mintNFT(_stakeInfo: StakeInfo){
        send(SendParameters{
            to: self.nFTContractAddress,
            value: 0,
            mode: SendRemainingValue + SendIgnoreErrors,
            body: MintNFT{
                staker: _stakeInfo.staker,
                principal: _stakeInfo.principal,
                lockStart: _stakeInfo.lockStart
            }.toCell()
        });
        self.nftCounter = self.nftCounter + 1;
    }

    fun notes(){
       self.requireOwner(); 
       let hash: Int = sha256("String");
       self.counter = self.stake.get(sender())!!; // !! - denaming, error if null
       self.stake.set(sender(), null); // instead of delete
    }

}


