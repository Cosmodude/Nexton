import { NFT_MARKETPLACE_CONTRACT_CODE_CELL, NftMarketplace, NftMarketplaceData } from "../wrappers/NftMarketplace";
import { Address, Cell, StateInit, TonClient, beginCell } from "@ton/ton";
import { MsgWithMode } from "../wrappers/utils";
import { NftAuctionV2Data } from "../wrappers/NftAuctionV2";
import { deployBodyCellAuction, stateInitAuction } from "./useAuction";
import { NftFixPriceSaleData } from "../wrappers/NftFixPriceSale";
import { deployBodyCellFixPriceSale, stateInitFixPriceSale } from "./useFixPriceSale";


export async function deployMarketplace(
    ton: TonClient,
    sender: any,
    amount: bigint,
    config: NftMarketplaceData,
) {
    const code = NFT_MARKETPLACE_CONTRACT_CODE_CELL;

    let marketplace = ton.open(NftMarketplace.createFromConfig(config, code));

    await marketplace.sendDeploy(sender, amount);
}

export async function sendSignedDeployMessage(
    ton: TonClient,
    sender: any,
    amount: bigint,
    marketplaceAddress: Address,
    secretKey : Buffer,
    stateInit: StateInit,
    body: Cell
) {
    let marketplace = ton.open(NftMarketplace.createFromAddress(marketplaceAddress));

    await marketplace.sendSignedDeployMessage(sender, amount, {secretKey: secretKey, stateInit: stateInit, body: body});
}

export async function sendSignedDeployAuctionMessage(
    ton: TonClient,
    sender: any,
    amount: bigint,
    marketplaceAddress: Address,
    secretKey : Buffer,
    config: NftAuctionV2Data,
) {
    await sendSignedDeployMessage(ton, sender, amount, marketplaceAddress, secretKey, await stateInitAuction(config), await deployBodyCellAuction());
}

export async function sendSignedDeployFixPriceSaleMessage(
    ton: TonClient,
    sender: any,
    amount: bigint,
    marketplaceAddress: Address,
    secretKey : Buffer,
    config: NftFixPriceSaleData,
) {
    await sendSignedDeployMessage(ton, sender, amount, marketplaceAddress, secretKey, await stateInitFixPriceSale(config), await deployBodyCellFixPriceSale());
}

export async function sendExternalSignedMessage(
    ton: TonClient,
    marketplaceAddress: Address,
    secretKey : Buffer,
    validUntil: number,
    msgList: MsgWithMode[]
) {
    let body = beginCell();
    if (msgList.length > 4) {
        throw new Error('Maximum 4 messages')
    }

    for (let msg of msgList) {
        body.storeRef(msg.msg);
        body.storeUint(msg.mode, 8);
    }
    
    let marketplace = ton.open(NftMarketplace.createFromAddress(marketplaceAddress));

    const seqno = await marketplace.getSeqno();
    const subwallet = await marketplace.getSubwallet();

    await marketplace.sendExternalSignedMessage({secretKey: secretKey, subwallet: subwallet, validUntil: validUntil, segno: seqno, body: body.endCell()});
}

export async function getSeqnoMarketplace(
    ton: TonClient,
    marketplaceAddress: Address,
) {
    let marketplace = ton.open(NftMarketplace.createFromAddress(marketplaceAddress));
    return await marketplace.getSeqno(); 
}

export async function getPublicKeyMarketplace(
    ton: TonClient,
    marketplaceAddress: Address,
) {
    let marketplace = ton.open(NftMarketplace.createFromAddress(marketplaceAddress));
    return await marketplace.getPublicKey(); 
}

export async function getSubwalletMarketplace(
    ton: TonClient,
    marketplaceAddress: Address,
) {
    let marketplace = ton.open(NftMarketplace.createFromAddress(marketplaceAddress));
    return await marketplace.getSubwallet(); 
}