import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type BasicNominatorPoolConfig = {};

export function basicNominatorPoolConfigToCell(config: BasicNominatorPoolConfig): Cell {
    return beginCell().endCell();
}

export class BasicNominatorPool implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new BasicNominatorPool(address);
    }

    static createFromConfig(config: BasicNominatorPoolConfig, code: Cell, workchain = 0) {
        const data = basicNominatorPoolConfigToCell(config);
        const init = { code, data };
        return new BasicNominatorPool(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
