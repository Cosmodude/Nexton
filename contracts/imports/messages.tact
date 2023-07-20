message MintNFT{
    principal: Int as coins;
    leverageRatio: Int as uint32 = 1;
    staker: Address;
    lockPeriod: Int as uint256 = (10 * 60 * 1);
    lockEnd: Int as uint256;
    isLent: Bool = false;
}

message(1) mintJettons{
    amount: Int as coins;
    receiverAddress: Address;
}

message Deposit{
    principal: Int as coins;
    lockPeriod: Int as uint256;
    leverage: Int as uint32;
}

message UserDeposit{
    lockPeriod: Int as uint256;
    leverage: Int as uint32;
}

message LPDeposit{
    amount: Int as coins;
    providerAddress: Address;
}

message ChangeAddr{
    address: Address;
    entity: String;
}
