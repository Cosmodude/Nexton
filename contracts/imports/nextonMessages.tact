// 
// Nexton
// 

message TonDeposit{
    queryId: Int as uint64;
    //leverage: Int as uint32 = 1;
}

message(0x636c616) TonClaim{
    queryId: Int as uint64;
    payload: ItemClaimPayload;
}

//
// NFT 
// 

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

// 
// Jetton
//

// SendJettons; op::transfer
message(0xf8a7ea5) TokenTransfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
    response_destination: Address;
    custom_payload: Cell?;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining; // Comment Text message when Transfer the jetton
}

// JettonDeposit; op::transfer_notification
message(0x7362d09c) TransferNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    from: Address;
    forward_payload: Slice as remaining; // Comment Text message when Transfer the jetton 
}

// between wallets 
message(0x178d4519) TokenTransferInternal {
    queryId: Int as uint64;
    amount: Int as coins;
    from: Address;
    response_destination: Address;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining; // Comment Text message when Transfer the jetton
}


// MessageForBurning; op::burn 
message(0x595f07bc) TokenBurn {
    queryId: Int as uint64;
    amount: Int as coins;
    owner: Address;
    response_destination: Address;
}

// op::burn_notification
message(0x7bdd97de) TokenBurnNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    owner: Address;
    response_destination: Address?;
}

// 0xd53276db -- Cashback to the original Sender
message(0xd53276db) TokenExcesses {
    queryId: Int as uint64;
}

//
// Admin 
//

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