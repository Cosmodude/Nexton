import { Address, Builder, beginCell } from "@ton/ton";

export async function buildMessageCellForExternalTransferThroughMarketplace(
    destination: Address,
    amount: bigint,
    body: Builder
) {
    return beginCell()
            .storeUint(0x18, 6)
            .storeAddress(destination)
            .storeCoins(amount)
            .storeUint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
            .storeBuilder(body)
            .endCell()
}