message UserDeposit{
    queryId: Int as uint64;
    lockPeriod: Int as uint256 = (10 * 60 * 1); // in seconds 
    leverage: Int as uint32 = 1;
}

// message ChangeAddr{
//     queryId: Int as uint64;
//     address: Address;
//     entity: String;
// }

message(0x1) MintNFT{
    queryId: Int as uint64;
    itemIndex: Int as uint64;
    amount: Int as coins = ton("0.03");
    NFTMessage: Cell;
}

