// 
// Nexton
// 

message TonDeposit{
    queryId: Int as uint64;
    //leverage: Int as uint32 = 1;
}

struct ClaimPayload {
    itemIndex: Int as uint64;
    owner: Address;
    content: Cell;
}

message(0x636c616) ClaimNotification{
    queryId: Int as uint64;
    payload: ClaimPayload;
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

struct OwnershipAssignedPayload {
    owner: Address;
    body: Slice;
}

message(0x05138d91) OwnershipAssigned{
    queryId: Int as uint64;
    payload: OwnershipAssignedPayload;
}

// 
// Jetton
//

// SendJettons; op::transfer
message(0xf8a7ea5) JettonTransfer { // 260734629
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
    response_destination: Address;
    custom_payload: Cell?;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining; // Comment Text message when Transfer the jetton
}

// JettonDeposit; op::transfer_notification
message(0x7362d09c) TransferNotification { // 1935855772
    queryId: Int as uint64;
    amount: Int as coins;
    from: Address;
    forward_payload: Slice as remaining; // Comment Text message when Transfer the jetton 
}

message(0x2c76b973) ProvideWallet {
    queryId: Int as uint64;
    ownerAddress: Address;
    includeAddress: Bool;
}

message(0xd1735400) SetWalletAddress {
    queryId: Int as uint64;
    walletAddress: Address;
}

// between wallets 
message(0x178d4519) JettonTransferInternal { // 395134233
    queryId: Int as uint64;
    amount: Int as coins;
    from: Address;
    response_destination: Address;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining; // Comment Text message when Transfer the jetton
}


// MessageForBurning; op::burn 
message(0x595f07bc) JettonBurn {
    queryId: Int as uint64;
    amount: Int as coins;
    owner: Address;
    response_destination: Address;
}

// op::burn_notification
message(0x7bdd97de) JettonBurnNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    owner: Address;
    response_destination: Address?;
}

// 0xd53276db -- Cashback to the original Sender
message(0xd53276db) TonExcesses { // 3576854235
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