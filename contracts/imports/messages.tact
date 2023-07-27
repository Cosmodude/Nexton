message UserDeposit{
    lockPeriod: Int as uint256 = (10 * 60 * 1);
    leverage: Int as uint32 = 1;
}

message ChangeAddr{
    queryId: Int as uint64;
    address: Address;
    entity: String;
}

message(0x1) MintNFT{
    queryId: Int as uint64;
    itemIndex: Int as uint64;
    amount: Int as coins = ton("0.05");
    NFTMessage: Cell;
}

struct NFTContent{
    principal: Int as coins;
    leverageRatio: Int as uint32 = 1;
    lockPeriod: Int as uint256 = (10 * 60 * 1);
    lockEnd: Int as uint256;
}

message(0x1) mintJettons{
    queryId: Int as uint64;
    amount: Int as coins;
    receiverAddress: Address;
}