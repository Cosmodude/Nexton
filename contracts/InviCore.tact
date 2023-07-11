import "@stdlib/deploy";
import "@stdlib/ownable";

contract Invicore with Deployable, OwnableTransferable {
    owner: Address;
    jettonContractAddress: address;  // stToken Contract Address
    lSContractAddress: address;      // Liquidity Staking Contract Address
    latestStakeBlock: Int as uint256;

    init(_jetton: address, _liquidStaking: address) {
        owner = sender();
        jettonContractAddress = _jetton;
        lSContractAddress = _liquidStaking;

        latestStakeBlock = now();  // returns the current BlockNumber
    }
}


function initialize(address _stTokenAddr, address _liquidStakingAddr, uint8 _networkId) initializer public {
        __Ownable_init();
        stToken = IERC20(_stTokenAddr);
        liquidStakingContract = ILiquidStaking(_liquidStakingAddr);

        slippage = 5 * SLIPPAGE_UNIT;
        decreaseRatio = 10 * REWARD_ERROR_UNIT;
        increaseRatio = 5 * REWARD_ERROR_UNIT;
        stakingAPR = 10 * APR_UNIT;
        lpPoolRewardPortion = 700;
        inviTokenStakeRewardPortion = REWARD_PORTION_TOTAL_UNIT - lpPoolRewardPortion;
        
        latestStakeBlock = block.number;
        networkId = _networkId;

        unstakeRequestsFront = 0;
        unstakeRequestsRear = 0;
    }
