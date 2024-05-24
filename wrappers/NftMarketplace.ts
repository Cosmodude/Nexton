import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, Builder, toNano, StateInit, storeStateInit, TupleReader } from '@ton/core';
import { KeyPair, sign } from '@ton/crypto';

export const NFT_MARKETPLACE_CONTRACT_CODE = "b5ee9c7201020e01000103000114ff00f4a413f4bcf2c80b01020120020302014804050078f28308d71820d31fd31fd31f02f823bbf263f0015132baf2a15144baf2a204f901541055f910f2a3f8009320d74a96d307d402fb00e83001a402f0020202ce06070201200a0b02012008090017402c8cb1fcb1fcbffc9ed54800a91b088831c02456f8007434c0cc1c6c244c383c005b084074c7c07000638d20c235c6083e405000fe443ca8f5350c087e401c323281f2fff2741ddd20063232c172c09633c59c3e80b2dac4b3333260103ec03816e000153b513434c7f4c7f4ffcc200201200c0d0019bfdddf6a26840106b90eb858fc0017bb39ced44d0d33f31d70bff80011b8c97ed44d0d70b1f8";

export const NFT_MARKETPLACE_CONTRACT_CODE_CELL = Cell.fromBoc(Buffer.from(NFT_MARKETPLACE_CONTRACT_CODE, 'hex'))[0];

export type NftMarketplaceData = {
    seqno: number
    subwallet: number
    publicKey: Buffer
}

export function buildNftMarketplaceDataCell(data: NftMarketplaceData) : Cell {

    const storage = beginCell()
        .storeUint(data.seqno, 32)
        .storeUint(data.subwallet, 32)
        .storeBuffer(data.publicKey)

    return storage.endCell()
}

export function buildSignature(opts: { secretKey: Buffer, stateInit: Cell, body: Cell }): Buffer {
    let bodyCell = beginCell().storeRef(opts.stateInit).storeRef(opts.body).endCell();

    return sign(bodyCell.hash(), opts.secretKey);
}

export function buildSignatureForExternalMessage(opts: { secretKey: Buffer, subwallet: number, validUntil: number, segno: number, body: Cell }): Buffer {
    let bodyCell = beginCell()
                    .storeUint(opts.subwallet, 32)
                    .storeUint(opts.validUntil, 32)
                    .storeUint(opts.segno, 32)
                    .storeBuilder(opts.body.asBuilder())
                    .endCell();

    return sign(bodyCell.hash(), opts.secretKey);
}

export const Queries = {

    deployMessage: () => {
        return beginCell().storeUint(0, 32);
    },

    signedDeployMessage(opts: { secretKey: Buffer, stateInit: Cell, body: Cell }): Cell {
        const signature = buildSignature({secretKey: opts.secretKey, stateInit: opts.stateInit, body: opts.body});
        let bodyCell = beginCell().storeUint(1, 32).storeBuffer(signature).storeRef(opts.stateInit).storeRef(opts.body).endCell();
    
        return bodyCell;
    },

    externalSignedMessage(opts: { secretKey: Buffer, subwallet: number, validUntil: number, segno: number, body: Cell }): Cell {
        const signature = buildSignatureForExternalMessage(opts);
    
        return beginCell()
                .storeBuffer(signature)
                .storeUint(opts.subwallet, 32)
                .storeUint(opts.validUntil, 32)
                .storeUint(opts.segno, 32)
                .storeBuilder(opts.body.asBuilder())
                .endCell();
    }
}

export class NftMarketplace implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static queries = Queries

    static createFromAddress(address: Address): NftMarketplace {
        return new NftMarketplace(address);
    }

    static createFromConfig(config: NftMarketplaceData, code: Cell, workchain = 0): NftMarketplace {
        const data: Cell = buildNftMarketplaceDataCell(config);
        const init = { code, data };
        return new NftMarketplace(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeBuilder(Queries.deployMessage()).endCell(),
        });
    }

    async sendSignedDeployMessage(provider: ContractProvider, via: Sender, value: bigint, opts: { secretKey: Buffer, stateInit: StateInit, body: Cell } ) {
        let init: Builder = beginCell();
        storeStateInit(opts.stateInit)(init);
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: Queries.signedDeployMessage({secretKey: opts.secretKey, stateInit: init.endCell(), body: opts.body}),
        });
    }

    async sendExternalSignedMessage(provider: ContractProvider, opts: { secretKey: Buffer, subwallet: number, validUntil: number, segno: number, body: Cell } ) {
        await provider.external(Queries.externalSignedMessage(opts));
    }

    async getSeqno(provider: ContractProvider): Promise<number> {
        const result: TupleReader = (await provider.get("seqno", [])).stack;
        return result.readNumber();
    }

    async getPublicKey(provider: ContractProvider): Promise<Buffer>{
        const result: TupleReader = (await provider.get("get_public_key", [])).stack;
        return Buffer.from(result.readBigNumber().toString(16), "hex");
    }

    async getSubwallet(provider: ContractProvider): Promise<number> {
        const result: TupleReader = (await provider.get("get_subwallet", [])).stack;
        return result.readNumber();
    }
}
