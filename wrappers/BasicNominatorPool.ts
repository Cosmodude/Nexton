import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type InnerConfig = {
    validator_address: Address;
    validator_reward_share: number;
    max_nominators_count: number;
    min_validator_stake: number;
    min_nominator_stake: number;
}
export type BasicNominatorPoolConfig = {
    state: number;
    nominators_count: number;
    stake_amount_sent: number;
    validator_amount: number;
    config: any; //InnerConfig;
    nominators: any; //dict
    withdraw_requests: any; //dict
    stake_at: number;
    saved_validator_set_hash: bigint;
    validator_set_changes_count: bigint;
    validator_set_change_time: bigint;
    stake_held_for: bigint;
    config_proposal_votings: any; //dict
};

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
