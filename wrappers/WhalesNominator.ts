import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type WhalesNominatorConfig = {};

export function whalesNominatorConfigToCell(config: WhalesNominatorConfig): Cell {
    return beginCell().endCell();
}

export class WhalesNominator implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new WhalesNominator(address);
    }

    static createFromConfig(config: WhalesNominatorConfig, code: Cell, workchain = 0) {
        const data = whalesNominatorConfigToCell(config);
        const init = { code, data };
        return new WhalesNominator(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
