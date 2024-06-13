import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, Builder, toNano, StateInit, storeStateInit, CommonMessageInfoExternalIn, storeCommonMessageInfo } from '@ton/core';
import { MsgWithMode } from './utils';

export const NFT_FIXPRICESALE_CONTRACT_CODE = "b5ee9c7201020b010002b9000114ff00f4a413f4bcf2c80b0102012002030201480405007ef230ed44d0d300d31ffa40fa40fa40fa00d4d30030c0018e1df8007007c8cb0016cb1f5004cf1658cf1601cf1601fa02cccb00c9ed54e05f078200fffef2f00202cd06070057a03859da89a1a601a63ff481f481f481f401a9a6006061a1f481f401f481f4006104208c92b0a0158002ab0101f7d00e8698180b8d8492f82707d201876a2686980698ffd207d207d207d006a69801818382984e38060004a9884e98f856f10e1804a1804e99fc708c5b31b0b731b2b6415e382c939996f280571156000c92f86f0126ba4e10115c08115dd1560009159d8d829dc6382d84e8eaf86ea18686983ea1800fd807014e000c0801f7660840ee6b280149828148c2fbcb87089343e903e803e903e800c14e4a848685421e845a814a41c20043232c15400f3c5807e80b2dab25c7ec00970800975d27080ac2385d4115c20043232c15400f3c5807e80b2dab25c7ec00408e48d0d38969c20043232c15400f3c5807e80b2dab25c7ec01c08208417f30f4520a01e8f2d194b38e42313339395352c705925f09e05151c705f2e1f4821005138d9116baf2e1f503fa403046501034597007c8cb0016cb1f5004cf1658cf1601cf1601fa02cccb00c9ed54e0303728c003e30228c0009c36371038476514433070f005e008c00298554410241023f005e05f0a840ff2f00900d4383982103b9aca0018bef2e1c95346c7055152c70515b1f2e1ca702082105fcc3d14218010c8cb0528cf1621fa02cb6acb1f15cb3f27cf1627cf1614ca0023fa0213ca00c98306fb007150664515047007c8cb0016cb1f5004cf1658cf1601cf1601fa02cccb00c9ed540096c8cb1f13cb3f23cf165003cf16ca008209c9c380fa02ca00c9718018c8cb0526cf1670fa02cb6accc98306fb007155507007c8cb0016cb1f5004cf1658cf1601cf1601fa02cccb00c9ed54";

export const NFT_FIXPRICESALE_CONTRACT_CODE_CELL = Cell.fromBoc(Buffer.from(NFT_FIXPRICESALE_CONTRACT_CODE, 'hex'))[0];

export type NftFixPriceSaleData = {
    isComplete: boolean
    createdAt: number
    marketplaceAddress: Address
    nftAddress: Address
    nftOwnerAddress: Address | null
    fullPrice: bigint
    marketplaceFeeAddress: Address
    marketplaceFee: bigint
    royaltyAddress: Address
    royaltyAmount: bigint
    canDeployByExternal: boolean
}

export function buildNftFixPriceSaleDataCell(data: NftFixPriceSaleData) : Cell {
    const feesCell = beginCell()
                        .storeAddress(data.marketplaceFeeAddress)
                        .storeCoins(data.marketplaceFee)
                        .storeAddress(data.royaltyAddress)
                        .storeCoins(data.royaltyAmount)
                        .endCell();

    const dataCell = beginCell()
                        .storeBit(data.isComplete)
                        .storeUint(data.createdAt, 32)
                        .storeAddress(data.marketplaceAddress)
                        .storeAddress(data.nftAddress)
                        .storeAddress(data.nftOwnerAddress)
                        .storeCoins(data.fullPrice)
                        .storeBit(data.canDeployByExternal)
                        .storeRef(feesCell)
                        .endCell();
    
    return dataCell;
}

export const Queries = {
    deployMessage: () => {
        return beginCell().storeUint(1, 32).storeUint(0, 64);
    },

    buyMessage: () => {
        return beginCell().storeUint(0, 32);
    },

    buyWithQueryIdMessage: (query: number) => {
        return beginCell().storeUint(0, 32).storeUint(query, 64);
    },

    acceptCoinsMessage: (query: number) => {
        return beginCell().storeUint(1, 32).storeUint(query, 64);
    },

    cancelMessage: () => {
        return beginCell().storeUint(0, 32).storeBuffer(Buffer.from('cancel'));
    },

    emergencyMessage: (query: number, msg: MsgWithMode) => {
        return beginCell().storeUint(555, 32).storeUint(query, 64).storeRef(beginCell().storeUint(msg.mode, 8).storeRef(msg.msg).endCell());
    },

    externalDeployMessage: () => {
        return beginCell();
    },

}

export class NftFixPriceSale implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static queries = Queries

    static createFromAddress(address: Address) {
        return new NftFixPriceSale(address);
    }

    static createFromConfig(config: NftFixPriceSaleData, code: Cell, workchain = 0) {
        const data = buildNftFixPriceSaleDataCell(config);
        const init = { code, data };
        return new NftFixPriceSale(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeBuilder(Queries.deployMessage()).endCell(),
        });
    }

    async sendExternalDeploy(
        provider: ContractProvider
    ) {
        await provider.external(
            beginCell().storeBuilder(Queries.externalDeployMessage()).endCell()
        );
    }

    async sendEmergency(provider: ContractProvider, via: Sender, value: bigint, query_id: number, msg: MsgWithMode) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeBuilder(Queries.emergencyMessage(query_id, msg)).endCell(),
        });
    }

    async sendCancel(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeBuilder(Queries.cancelMessage()).endCell(),
        });
    }

    async sendBuy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeBuilder(Queries.buyMessage()).endCell(),
        });
    }

    async sendBuyWithQueryId(provider: ContractProvider, via: Sender, value: bigint, query_id: number) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeBuilder(Queries.buyWithQueryIdMessage(query_id)).endCell(),
        });
    }

    async sendCoins(provider: ContractProvider, via: Sender, value: bigint, query_id: number) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeBuilder(Queries.acceptCoinsMessage(query_id)).endCell(),
        });
    }

    async getSaleData(provider: ContractProvider) {
        const result = (await provider.get("get_sale_data", [])).stack;

        let saleType = result.readNumber();

        if (saleType !== 0x46495850) {
            throw new Error(`Unknown sale type: ${saleType.toString()}`);
        }

        return { 
            isComplete : result.readBigNumber() != 0n,
            createdAt : result.readNumber(),
            marketplaceAddress: result.readAddress(),
            nftAddress: result.readAddress(),
            nftOwnerAddress: result.readAddressOpt(),
            fullPrice : result.readBigNumber(),
            marketplaceFeeAddress : result.readAddress(),
            marketplaceFee : result.readBigNumber(),
            royaltyAddress : result.readAddress(),
            royaltyAmount : result.readBigNumber(), 
        };
    }
}
