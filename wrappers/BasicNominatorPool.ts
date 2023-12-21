import { Address, beginCell, Cell, Contract, contractAddress, Slice, ContractProvider, Sender, SendMode } from 'ton-core';

export type InnerConfig = {
    validator_address: bigint;
    validator_reward_share: number;
    max_nominators_count: number;
    min_validator_stake: bigint;
    min_nominator_stake: bigint;
}

export function InnerConfigToCell(config: InnerConfig): Cell {
    return beginCell()
        .storeUint(config.validator_address, 256)
        .storeUint(config.validator_reward_share, 16)
        .storeUint(config.max_nominators_count, 16)
        .storeCoins(config.min_validator_stake)
        .storeCoins(config.min_nominator_stake)
    .endCell();
}
export function InnerConfigFromCell(cell: Cell): InnerConfig{
    let cs: Slice = cell.beginParse();

    return  {
        validator_address: BigInt(cs.loadUint(256)),
        validator_reward_share: cs.loadUint(16),
        max_nominators_count: cs.loadUint(16),
        min_validator_stake:  cs.loadCoins(),
        min_nominator_stake: cs.loadCoins()
    }
}

export type BasicNominatorPoolConfig = {
    state: number;
    nominators_count: number;
    stake_amount_sent: number;
    validator_amount: number;
    config: InnerConfig; //InnerConfig;
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
    return beginCell()
        .storeUint(config.state,8)
        .storeUint(config.nominators_count, 16)
        .storeCoins(config.stake_amount_sent)
        .storeCoins(config.validator_amount)
        .storeRef(InnerConfigToCell(config.config))
        .storeDict(config.nominators)
        .storeDict(config.withdraw_requests)
        .storeUint(config.stake_at, 32)
        .storeUint(config.saved_validator_set_hash, 256)
        .storeUint(config.validator_set_changes_count, 8)
        .storeUint(config.validator_set_change_time, 32)
        .storeUint(config.stake_held_for, 32)
        .storeDict(config.config_proposal_votings)
    .endCell();
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
            body: beginCell()
               // .storeUint(1000,32) 
            .endCell()
        });
    }

    async getPoolData(provider: ContractProvider){
        const res = await provider.get("get_pool_data", [] );
        const data: BasicNominatorPoolConfig = {
            state: res.stack.readNumber(),
            nominators_count: res.stack.readNumber(),
            stake_amount_sent: res.stack.readNumber(),
            validator_amount: res.stack.readNumber(),
            config: InnerConfigFromCell(res.stack.readCell()),
            nominators: res.stack.readCell(),
            withdraw_requests: res.stack.readCell(),
            stake_at: res.stack.readNumber(),
            saved_validator_set_hash: res.stack.readBigNumber(),
            validator_set_changes_count: res.stack.readBigNumber(),
            validator_set_change_time: res.stack.readBigNumber(),
            stake_held_for: res.stack.readBigNumber(),
            config_proposal_votings: res.stack.readCell(),

        }
        return data;
    }
}
