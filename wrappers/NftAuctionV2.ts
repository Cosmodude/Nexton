import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, Builder, toNano } from '@ton/core';
import { MsgWithMode } from './utils';

export const NFT_AUCTION_CONTRACT_CODE = "b5ee9c7201021d01000593000114ff00f4a413f4bcf2c80b01020120020302014804050228f230db3c8103eef844c0fff2f2f8007ff864db3c1b1c0202ce0607028ba03859b679b679041082aa87f085f0a1f087f0a7f0a5f09df09bf099f097f095f08bf09ff08c1a22261a182224181622221614222014213e211c20fa20d820b620f420d220b11b1a0201200809020120181904f5007434c0c05c6c3c903e900c36cf3e10b03ffe10d48831c16c23b40ccc74c7c87000234127265706561745f656e645f61756374696f6e8148831c16c23a0d6f6cf380cb00023411656d657267656e63795f6d6573736167658148831c16c26b50c3434c1f50c007ec0380c383e14d48431c163a10ccc76cf3800601b120a0b001320840ee6b280006a6120015c318103e9f852d749c202f2f28103ea01d31f821005138d9112ba12f2f48040d721fa4030f87270f8627ff864db3c1c0486db3c20c0018f38308103edf823f850bef2f28103edf842c0fff2f28103f00282103b9aca00b912f2f2f8525210c705f8435220c705b1f2e193017fdb3cdb3ce020c0020c150d0e008c20c700c0ff923070e0d31f318b663616e63656c821c705923071e08b473746f70821c705923072e08b666696e697368821c705923072e08b66465706c6f79801c7059173e070018a7020f82582105fcc3d14c8cb1fcb3ff852cf165003cf1612cb0021fa02cb00c9718018c8cb05f853cf1670fa02cb6acc82080f424070fb02c98306fb007ff8627ff866db3c1c04fc8ec330328103edf842c0fff2f28103f00182103b9aca00b9f2f2f823f850be8e17f8525210c705f8435220c705b1f84d5220c705b1f2e19399f8525210c705f2e193e2db3ce0c003925f03e0f842c0fff823f850beb1975f038103edf2f0e0f84b82103b9aca00a05220bef84bc200b0e302f850f851a1f823b9e300f84e120f1011022c0270db3c21f86d82103b9aca00a1f86ef823f86fdb3c1512000ef850f851a0f87003708e95328103e8f84a5220b9f2f2f86ef86df823f86fdb3ce1f84ef84ca05220b9975f038103e8f2f0e00270db3c01f86df86ef823f86fdb3c1c151c0294f84ec0008e3d7020f82582105fcc3d14c8cb1fcb3ff852cf165003cf1612cb0021fa02cb00c9718018c8cb05f853cf1670fa02cb6acc82080f424070fb02c98306fb00e30e7ff862db3c131c02fadb3cf84e4054f00320c2008e2b70208010c8cb055007cf1622fa0216cb6a15cb1f8bf4d61726b6574706c616365206665658cf16c972fb009134e2f84e4003f00320c2008e2370208010c8cb055004cf1622fa0213cb6a12cb1f8b7526f79616c74798cf16c972fb009131e282080f424070fb02f84e58a101a120c2001a1400c08e2270208010c8cb05f852cf165003fa0212cb6acb1f8b650726f6669748cf16c972fb009130e27020f82582105fcc3d14c8cb1fcb3ff84dcf165003cf1612cb008208989680fa02cb00c9718018c8cb05f853cf1670fa02cb6accc98306fb0002f2f84ec101915be0f84ef847a1228208989680a15210bc9930018208989680a1019132e28d0a565bdd5c88189a59081a185cc81899595b881bdd5d189a5908189e48185b9bdd1a195c881d5cd95c8ba001c0ff8e1f308d06d05d58dd1a5bdb881a185cc81899595b8818d85b98d95b1b19590ba0de21c200e30f1617003870208018c8cb05f84dcf165004fa0213cb6a12cb1f01cf16c972fb0000025b001120840ee6b2802a6120001d08300024d7c0dc38167c00807c00600020f848d0fa40d31fd31ffa40d31fd31f3000caf8416edded44d0d20001f862d20001f864d20001f866fa4001f86dfa0001f86ed31f01f86fd31f01f870fa4001f872d401f868d430f869f849d0d21f01f867fa4001f863fa0001f86afa0001f86bfa0001f86cd31f01f871fa4001f873d31f30f8657ff8610054f849f848f850f84ff846f844f842c8ca00ca00ca00f84dcf16f84efa02cb1fcb1ff852cf16ccccc9ed54";

export const NFT_AUCTION_CONTRACT_CODE_CELL = Cell.fromBoc(Buffer.from(NFT_AUCTION_CONTRACT_CODE, 'hex'))[0];

export type NftAuctionV2Data = {
    marketplaceFeeAddress: Address,
    marketplaceFeeFactor: bigint,
    marketplaceFeeBase: bigint,


    royaltyAddress: Address,
    royaltyFactor: bigint,
    royaltyBase: bigint,


    minBid: bigint,
    maxBid: bigint,
    minStep: bigint,
    endTimestamp: number,
    createdAtTimestamp: number,

    stepTimeSeconds: number,

    nftOwnerAddress: Address | null,
    nftAddress: Address,

    end: boolean,
    marketplaceAddress: Address,
    activated: boolean,

}

export function buildNftAuctionV2DataCell(data: NftAuctionV2Data) : Cell {

    const constantCell = new Builder()
    const subGasPriceFromBid = 8449000
    constantCell.storeUint(subGasPriceFromBid, 32);
    constantCell.storeAddress(data.marketplaceAddress);
    constantCell.storeCoins(data.minBid)
    constantCell.storeCoins(data.maxBid)
    constantCell.storeCoins(data.minStep)
    constantCell.storeUint(data.stepTimeSeconds, 32) // step_time
    constantCell.storeAddress(data.nftAddress);
    constantCell.storeUint(data.createdAtTimestamp, 32)

    const feesCell = new Builder()
    feesCell.storeAddress(data.marketplaceFeeAddress)      // mp_fee_addr
    feesCell.storeUint(data.marketplaceFeeFactor, 32)               // mp_fee_factor
    feesCell.storeUint(data.marketplaceFeeBase, 32)   // mp_fee_base
    feesCell.storeAddress(data.royaltyAddress)  // royalty_fee_addr
    feesCell.storeUint(data.royaltyFactor, 32)              // royalty_fee_factor
    feesCell.storeUint(data.royaltyBase, 32)   // royalty_fee_base


    const storage = new Builder()
    storage.storeBit(data.end) // end?
    storage.storeBit(data.activated) // activated
    storage.storeBit(false) // is_canceled
    storage.storeUint(0, 2)        // last_member
    storage.storeCoins(0)       // last_bid
    storage.storeUint(0, 32) // last_bid_at
    storage.storeUint(data.endTimestamp, 32)    // end_time
    if (data.nftOwnerAddress) {
        storage.storeAddress(data.nftOwnerAddress)
    } else {
        storage.storeUint(0, 2)
    }
    storage.storeRef(feesCell.endCell())
    storage.storeRef(constantCell.endCell())

    return storage.endCell()
}

export const Queries = {

    externalDeployMessage: () => {
        return beginCell();
    },

    bidMessage: () => {
        return beginCell();
    },

    stopMessage: () => {
        return beginCell().storeUint(0, 32).storeBuffer(Buffer.from('stop'));
    },

    cancelMessage: () => {
        return beginCell().storeUint(0, 32).storeBuffer(Buffer.from('cancel'));
    },

    deployMessage: () => {
        return beginCell().storeUint(3, 32).storeBuffer(Buffer.from('deploy'));
    },

    repeatEndAuctionMessage: () => {
        return beginCell().storeUint(0, 32).storeBuffer(Buffer.from('repeat_end_auction'));
    },

    emergencyMessage: (msg: MsgWithMode) => {
        return beginCell().storeUint(0, 32).storeBuffer(Buffer.from('emergency_message')).storeRef(beginCell().storeUint(msg.mode, 8).storeRef(msg.msg).endCell());
    },
}

export class NftAuctionV2 implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static queries = Queries

    static createFromAddress(address: Address) {
        return new NftAuctionV2(address);
    }

    static createFromConfig(config: NftAuctionV2Data, code: Cell, workchain = 0) {
        const data = buildNftAuctionV2DataCell(config);
        const init = { code, data };
        return new NftAuctionV2(contractAddress(workchain, init), init);
    }

    async sendBid(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value: value,
            bounce : true,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeBuilder(Queries.bidMessage()).endCell(),
        });
    }

    async sendRepeatEndAuction(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value: value,
            bounce : true,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeBuilder(Queries.repeatEndAuctionMessage()).endCell(),
        });
    }

    async sendCancel(provider: ContractProvider, via: Sender, currentBalance?: bigint) {
        await provider.internal(via, {
            value: currentBalance ? currentBalance + toNano('1') : toNano('1'),
            bounce : true,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeBuilder(Queries.cancelMessage()).endCell(),
        });
    }

    async sendStop(provider: ContractProvider, via: Sender) {
        await provider.internal(via, {
            value: toNano('1'),
            bounce : true,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeBuilder(Queries.stopMessage()).endCell(),
        });
    }

    async sendEmergencyMessage(provider: ContractProvider, via: Sender, value: bigint, msg: MsgWithMode) {
        await provider.internal(via, {
            value: value,
            bounce : true,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeBuilder(Queries.emergencyMessage(msg)).endCell(),
        });
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint, ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            bounce: false,
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

    async getSaleData(provider: ContractProvider) {
        const result = (await provider.get("get_sale_data", [])).stack;

        let saleType = result.readNumber();

        if (saleType !== 0x415543) {
            throw new Error(`Unknown sale type: ${saleType.toString()}`);
        }

        return {
            end: result.readBigNumber() != 0n,
            endTimestamp: result.readNumber(),
            marketplaceAddress: result.readAddress(),
            nftAddress: result.readAddress(),
            nftOwnerAddress: result.readAddressOpt(),
            lastBidAmount : result.readBigNumber(),
            lastBidAddress: result.readAddressOpt(),
            minStep : result.readBigNumber(),
            marketplaceFeeAddress : result.readAddress(),
            marketplaceFeeFactor : result.readBigNumber(), 
            marketplaceFeeBase : result.readBigNumber(),
            royaltyAddress : result.readAddress(),
            royaltyFactor : result.readBigNumber(), 
            royaltyBase : result.readBigNumber(),
            maxBid : result.readBigNumber(),
            minBid : result.readBigNumber(),
            createdAt: result.readNumber(),
            lastBidAt: result.readNumber(),
            isCanceled: result.readBigNumber() != 0n,
        }
    }
}
