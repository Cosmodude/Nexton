import "@stdlib/deploy";
import "@stdlib/ownable";
import "@stdlib/stoppable";
//import "./contracts/NFT.fc";
//import "./messages.tact";

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
    nFTContractAddress: Address;
    counter: Int as uint32 = 0;        // Counter of messages to the contract 
    latestStakeBlock: Int as uint256;
    nftCounter: Int as uint32 = 0;

    balance: Int as coins = 0;
    stake: map<Address, Int>;

    init(_jetton: Address, _liquidStaking: Address, _nft: Address) {
        self.owner = sender();
        self.jettonContractAddress = _jetton;
        self.lSContractAddress = _liquidStaking;
        self.nFTContractAddress = _nft;
        self.latestStakeBlock = now();  // returns the current BlockNumber

        self.stake = emptyMap();
    }

    // Receive functions 

    // Receive TONCoins
    receive(){}

    receive("increment"){
        self.counter = self.counter + 1;
    }

    receive(msg: Deposit){
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

    bounced(src: bounced<MintNFT>){

    }


    fun setNFTContract(_nft: Address){
        self.requireOwner();
        self.nFTContractAddress = _nft;
    } 

    fun setlSContractAddress(_liquidStaking: Address){
        self.requireOwner();
        self.lSContractAddress = _liquidStaking;
    } 

    fun mintNFT(_stakeInfo: StakeInfo): Bool {
        send(SendParameters{
            to: self.nFTContractAddress,
            value: 0,
            mode: SendRemainingValue + SendIgnoreErrors,
            body: MintNFT{stakeInfo: _stakeInfo}.toCell()
        });
        self.nftCounter = self.nftCounter + 1;
        return true;
    }

    fun notes(){
       self.requireOwner(); 
       let hash: Int = sha256("String");
       self.counter = self.stake.get(sender())!!; // !! - denaming, error if null
       self.stake.set(sender(), null); // instead of delete
    }
}


