import { 
    Address, 
    beginCell, 
    Cell, 
    Contract, 
    contractAddress, 
    ContractProvider, 
    Sender, 
    SendMode, 
} from 'ton-core';
import { encodeOffChainContent } from './helpFulFunctions/nftCollectionContent';

export type RoyaltyParams = {
    royaltyFactor: number;
    royaltyBase: number;
    royaltyAddress: Address;
};

export type NftCollectionConfig = {
    ownerAddress: Address;
    nextItemIndex: number;
    collectionContent: Cell;
    nftItemCode: Cell;
    royaltyParams: RoyaltyParams;
};

export type NftCollectionContent = {
    collectionContent: string;
    commonContent: string;
};


export function buildNftCollectionContentCell(uri: string): Cell {
    let contentCell = beginCell();

    let collectionContent = encodeOffChainContent(uri);

    let commonContent = beginCell();
    commonContent.storeStringTail(uri);

    contentCell.storeRef(collectionContent);
    contentCell.storeRef(commonContent);

    return contentCell.endCell();
}

export function nftCollectionConfigToCell(config: NftCollectionConfig): Cell {
    return beginCell()
        .storeAddress(config.ownerAddress)
        .storeUint(config.nextItemIndex, 64)
        .storeRef(config.collectionContent)
        .storeRef(config.nftItemCode)
        .storeRef(
            beginCell()
                .storeUint(config.royaltyParams.royaltyFactor, 16)
                .storeUint(config.royaltyParams.royaltyBase, 16)
                .storeAddress(config.royaltyParams.royaltyAddress)
        )
    .endCell();
}

export class NftCollection implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new NftCollection(address);
    }

    static createFromConfig(config: NftCollectionConfig, code: Cell, workchain = 0) {
        const data = nftCollectionConfigToCell(config);
        const init = { code, data };
        return new NftCollection(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
    
    

    async sendMintNft(provider: ContractProvider, via: Sender,
        opts: {
            value: bigint;
            queryId: number;
            itemIndex: number;
            itemOwnerAddress: Address;
            itemContent: string;
            amount: bigint;
        }
        ) {
            const nftContent = beginCell();
            nftContent.storeBuffer(Buffer.from(opts.itemContent));
            
            const nftMessage = beginCell();
            nftMessage.storeAddress(opts.itemOwnerAddress)
            nftMessage.storeRef(nftContent)
            await provider.internal(via, {
                value: opts.value,
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: beginCell()
                    .storeUint(1,32)  // operation
                    .storeUint(opts.queryId,64)
                    .storeUint(opts.itemIndex,64)
                    .storeCoins(opts.amount)
                    .storeRef(nftMessage)
                .endCell()
            })
        }

    async sendChangeOwner(provider: ContractProvider, via: Sender,
        opts: {
            value: bigint;
            queryId: bigint;
            newOwnerAddress: Address;
        }
        ) { 
            await provider.internal(via, {
                value: opts.value,
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: beginCell()
                    .storeUint(3,32) //operation
                    .storeUint(opts.queryId, 64)
                    .storeAddress(opts.newOwnerAddress)
                .endCell()
            })
    }

    async getCollectionData(provider: ContractProvider, via: Sender): Promise<[bigint,Cell, Address]>{
        const collection_data = await provider.get("get_collection_data", []);
        const a = collection_data.stack;
        const stack = await collection_data.stack;
        let nextItemId: bigint = stack.readBigNumber();
        let collectionContent = await stack.readCell();
        let ownerAddress = await stack.readAddress();
        return [nextItemId, collectionContent ,ownerAddress];
    }

    async getNextItemIndex(provider: ContractProvider, via: Sender): Promise<BigInt>{
        const collection_data = await provider.get("collection_data", []);
        return collection_data.stack.readBigNumber(); 
    }
}
