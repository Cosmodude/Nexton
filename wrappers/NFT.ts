import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type NFTConfig = {};

export function nFTConfigToCell(config: NFTConfig): Cell {
    return beginCell().endCell();
}

export class NFT implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new NFT(address);
    }

    static createFromConfig(config: NFTConfig, code: Cell, workchain = 0) {
        const data = nFTConfigToCell(config);
        const init = { code, data };
        return new NFT(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
