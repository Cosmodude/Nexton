import { NFT_AUCTION_CONTRACT_CODE_CELL, NftAuctionV2, NftAuctionV2Data } from "../wrappers/NftAuctionV2";
import { Address, StateInit, TonClient, toNano } from "@ton/ton";
import { MsgWithMode } from "../wrappers/utils";
import { buildMessageCellForExternalTransferThroughMarketplace } from "./hookUtils";

export async function deployAuction(
    ton: TonClient,
    sender: any,
    amount: bigint,
    config: NftAuctionV2Data
) {
    const code = NFT_AUCTION_CONTRACT_CODE_CELL;
    let auction = ton.open(NftAuctionV2.createFromConfig(config, code));
    await auction.sendDeploy(sender, amount);
}

export async function stateInitAuction(
    config: NftAuctionV2Data
) {
    const code = NFT_AUCTION_CONTRACT_CODE_CELL;
    let init: StateInit = NftAuctionV2.createFromConfig(config, code).init!;
    return init;
}

export async function deployBodyCellAuction() {
    return NftAuctionV2.queries.deployMessage().endCell();
}

export async function cancelAuction(
    ton: TonClient,
    sender: any,
    amount: bigint,
    auctionAddress: Address,
) {
    let auction = ton.open(NftAuctionV2.createFromAddress(auctionAddress));
    await auction.sendCancel(sender, amount);
}

export async function cancelMessageCellAuction(
    auctionAddress: Address,
    amount?: bigint,
) {
    return buildMessageCellForExternalTransferThroughMarketplace(
        auctionAddress, 
        amount ? amount + toNano('1') : toNano('1'), 
        NftAuctionV2.queries.cancelMessage()
    );
}

export async function stopAuction(
    ton: TonClient,
    sender: any,
    auctionAddress: Address,
) {
    let auction = ton.open(NftAuctionV2.createFromAddress(auctionAddress));
    await auction.sendStop(sender);
}

export async function stopMessageCellAuction(
    auctionAddress: Address,
) {
    return buildMessageCellForExternalTransferThroughMarketplace(
        auctionAddress, 
        toNano('1'), 
        NftAuctionV2.queries.stopMessage()
    );
}

export async function sendBidToAuction(
    ton: TonClient,
    sender: any,
    amount: bigint,
    auctionAddress: Address,
) {
    let auction = ton.open(NftAuctionV2.createFromAddress(auctionAddress));
    await auction.sendBid(sender, amount);
}

export async function repeatEndAuction(
    ton: TonClient,
    sender: any,
    amount: bigint,
    auctionAddress: Address,
) {
    let auction = ton.open(NftAuctionV2.createFromAddress(auctionAddress));
    await auction.sendRepeatEndAuction(sender, amount);
}

export async function repeatEndMessageCellAuction(
    amount: bigint,
    auctionAddress: Address,
) {
    return buildMessageCellForExternalTransferThroughMarketplace(
        auctionAddress, 
        amount, 
        NftAuctionV2.queries.repeatEndAuctionMessage()
    );
}

export async function sendEmergencyMessageToAuction(
    ton: TonClient,
    sender: any,
    amount: bigint,
    auctionAddress: Address,
    msg: MsgWithMode
) {
    let auction = ton.open(NftAuctionV2.createFromAddress(auctionAddress));
    await auction.sendEmergencyMessage(sender, amount, msg);
}

export async function emergencyMessageCellAuction(
    amount: bigint,
    auctionAddress: Address,
    msg: MsgWithMode
) {
    return buildMessageCellForExternalTransferThroughMarketplace(
        auctionAddress, 
        amount, 
        NftAuctionV2.queries.emergencyMessage(msg)
    );
}

export async function externalDeployAuction(
    ton: TonClient,
    config: NftAuctionV2Data
) {
    const code = NFT_AUCTION_CONTRACT_CODE_CELL;

    let auction = ton.open(NftAuctionV2.createFromConfig(config, code));
    await auction.sendExternalDeploy();
    return auction.address;
}