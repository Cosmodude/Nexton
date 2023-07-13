message MintNFT{
    stakeInfo: StakeInfo;
}

message Deposit{
    principal: Int as coins;
    lockPeriod: Int as uint256;
    leverage: Int as uint32;
}