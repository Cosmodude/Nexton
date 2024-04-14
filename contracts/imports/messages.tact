message UserDeposit{
    queryId: Int as uint64;
    //leverage: Int as uint32 = 1;
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

message(0x636c616) UserClaim{
    queryId: Int as uint64;
    payload: ItemClaimPayload;
}

message AdminWithdraw{
    queryId: Int as uint64;
    amount: Int as coins;
}

message StopContract{
    queryId: Int as uint64;
}

message StartContract{
    queryId: Int as uint64;
}

message SetLockPeriod{
    queryId: Int as uint64;
    lockPeriod: Int as uint256;
}