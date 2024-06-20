message TonDeposit{
    queryId: Int as uint64;
    //leverage: Int as uint32 = 1;
}

message(0x7362d09c) JettonDeposit{
    queryId: Int as uint64;
   
}

message(0x1) MintNFT{
    queryId: Int as uint64;
    itemIndex: Int as uint64;
    amount: Int as coins = ton("0.03");
    NFTMessage: Cell;
}

struct ItemTransferPayload {
    owner: Address;
    body: Slice;
}

message(0x05138d91) ItemTransfer{
    queryId: Int as uint64;
    payload: ItemTransferPayload;
}

struct ItemClaimPayload {
    itemIndex: Int as uint64;
    owner: Address;
    content: Cell;
}

message(0x636c616) TonClaim{
    queryId: Int as uint64;
    payload: ItemClaimPayload;
}

message OwnerWithdraw{
    queryId: Int as uint64;
    amount: Int as coins;
}

message SetLockPeriod{
    queryId: Int as uint64;
    lockPeriod: Int as uint256;
}

message SetApr{
    queryId: Int as uint64;
    apr: Int as uint256;
}