message(0x1) MintNFT{
    queryId: Int as uint64;
    itemIndex: Int as uint64;
    amount: Int as coins = ton("0.05");
    content: NFTContent;
}

struct NFTContent{
    principal: Int as coins;
    leverageRatio: Int as uint32 = 1;
    staker: Address;
    lockPeriod: Int as uint256 = (10 * 60 * 1);
    lockEnd: Int as uint256;
    isLent: Bool = false;
}

message(0x1) mintJettons{
    amount: Int as coins;
    receiverAddress: Address;
}

message UserDeposit{
    lockPeriod: Int as uint256;
    leverage: Int as uint32;
}


message ChangeAddr{
    address: Address;
    entity: String;
}
