import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type GetgemsDeployerConfig = {};

export function getgemsDeployerConfigToCell(config: GetgemsDeployerConfig): Cell {
    return beginCell().endCell();
}

export class GetgemsDeployer implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new GetgemsDeployer(address);
    }

    static createFromConfig(config: GetgemsDeployerConfig, code: Cell, workchain = 0) {
        const data = getgemsDeployerConfigToCell(config);
        const init = { code, data };
        return new GetgemsDeployer(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
