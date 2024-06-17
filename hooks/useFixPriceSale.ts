import { NFT_FIXPRICESALE_CONTRACT_CODE_CELL, NftFixPriceSale, NftFixPriceSaleData } from "../wrappers/NftFixPriceSale";
import { Address, StateInit, TonClient } from "@ton/ton";
import { MsgWithMode } from "../wrappers/utils";
import { buildMessageCellForExternalTransferThroughMarketplace } from "./hookUtils";

export async function deployFixPriceSale(
    ton: TonClient,
    sender: any,
    amount: bigint,
    config: NftFixPriceSaleData
) {
    const code = NFT_FIXPRICESALE_CONTRACT_CODE_CELL;
    let fixPriceSale = ton.open(NftFixPriceSale.createFromConfig(config, code));
    await fixPriceSale.sendDeploy(sender, amount);
}


export async function stateInitFixPriceSale(
    config: NftFixPriceSaleData
) {
    const code = NFT_FIXPRICESALE_CONTRACT_CODE_CELL;
    let init: StateInit = NftFixPriceSale.createFromConfig(config, code).init!;
    return init;
}

export async function deployBodyCellFixPriceSale() {
    return NftFixPriceSale.queries.deployMessage().endCell()
}

export async function cancelFixPriceSale(
    ton: TonClient,
    sender: any,
    amount: bigint,
    fixPriceSaleAddress: Address,
) {
    let fixPriceSale = ton.open(NftFixPriceSale.createFromAddress(fixPriceSaleAddress));
    await fixPriceSale.sendCancel(sender, amount);
}

export async function cancelMessageCellFixPriceSale(
    amount: bigint,
    fixPriceSaleAddress: Address,
) {
    return buildMessageCellForExternalTransferThroughMarketplace(
        fixPriceSaleAddress, 
        amount, 
        NftFixPriceSale.queries.cancelMessage()
    );
}

export async function buyFixPriceSale(
    ton: TonClient,
    sender: any,
    amount: bigint,
    fixPriceSaleAddress: Address,
) {
    let fixPriceSale = ton.open(NftFixPriceSale.createFromAddress(fixPriceSaleAddress));
    await fixPriceSale.sendBuyWithQueryId(sender, amount, Math.floor(Math.random() * 1000));
}

export async function sendEmergencyMessageToFixPriceSale(
    ton: TonClient,
    sender: any,
    amount: bigint,
    fixPriceSaleAddress: Address,
    msg: MsgWithMode
) {
    let fixPriceSale = ton.open(NftFixPriceSale.createFromAddress(fixPriceSaleAddress));
    await fixPriceSale.sendEmergency(sender, amount, Math.floor(Math.random() * 1000), msg);
}

export async function emergencyMessageCellFixPriceSale(
    amount: bigint,
    fixPriceSaleAddress: Address,
    msg: MsgWithMode
) {
    return buildMessageCellForExternalTransferThroughMarketplace(
        fixPriceSaleAddress, 
        amount, 
        NftFixPriceSale.queries.emergencyMessage(Math.floor(Math.random() * 1000), msg)
    );
}

export async function externalDeployFixPriceSale(
    ton: TonClient,
    config: NftFixPriceSaleData
) {
    const code = NFT_FIXPRICESALE_CONTRACT_CODE_CELL;

    let fixPriceSale = ton.open(NftFixPriceSale.createFromConfig(config, code));
    await fixPriceSale.sendExternalDeploy();
    return fixPriceSale.address;
}

export async function getSaleDataPriceSale(
    ton: TonClient,
    fixPriceSaleAddress: Address
) {
    let fixPriceSale = ton.open(NftFixPriceSale.createFromAddress(fixPriceSaleAddress));
    return await fixPriceSale.getSaleData();
}