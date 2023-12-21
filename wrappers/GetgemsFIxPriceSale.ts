import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type GetgemsFIxPriceSaleConfig = {};

export function getgemsFIxPriceSaleConfigToCell(config: GetgemsFIxPriceSaleConfig): Cell {
    return beginCell().endCell();
}

export class GetgemsFIxPriceSale implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new GetgemsFIxPriceSale(address);
    }

    static createFromConfig(config: GetgemsFIxPriceSaleConfig, code: Cell, workchain = 0) {
        const data = getgemsFIxPriceSaleConfigToCell(config);
        const init = { code, data };
        return new GetgemsFIxPriceSale(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
