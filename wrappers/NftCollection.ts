import { 
    Address, 
    beginCell, 
    Cell, 
    Contract, 
    contractAddress, 
    ContractGetMethodResult, 
    ContractProvider, 
    Sender, 
    SendMode, 
    TupleItem
} from 'ton-core';

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
            itemContent: String;
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

    async getCollectionData(provider: ContractProvider, via: Sender): Promise<TupleItem>{
        const collection_data = await provider.get("get_collection_data", []);
        const stack = collection_data.stack;
        return stack.pop();
    }

    async getNextItemIndex(provider: ContractProvider, via: Sender): Promise<BigInt>{
        const collection_data = await provider.get("get_collection_data", []);
        return collection_data.stack.readBigNumber(); 
    }
}
