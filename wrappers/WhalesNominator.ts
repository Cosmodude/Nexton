import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Dictionary, Sender, SendMode } from '@ton/core';

export type WhalesNominatorConfig = {
    owner: Address;
    controller: Address;
    proxy: Address;
    profit_per_coin: bigint;
    nominators: Dictionary<bigint,Cell>; 
    proxy_state: Cell;
    min_stake: bigint;
    deposit_fee: bigint;
    withdraw_fee: bigint;
    pool_fee: bigint;
};

export function whalesNominatorConfigToCell(config: WhalesNominatorConfig): Cell {
    return beginCell()
        .storeInt(0n,1)  // locked 
        .storeAddress(config.owner)
        .storeAddress(config.controller)
        .storeAddress(config.proxy)
        .storeRef(  // balance cell
            beginCell()
                .storeInt(config.profit_per_coin,128)
                .storeCoins(0n) // balance 
                .storeCoins(0n) // balance sent 
                .storeCoins(0n) // blance withdraw 
                .storeCoins(0n) 
                .storeCoins(0n) // pending deposits
            .endCell()
        )
        .storeDict(config.nominators)
        .storeRef(config.proxy_state)
        .storeRef(  // extras cell
                beginCell()
                    .storeInt(-1n,1)  // enabled
                    .storeInt(0n,1) // updates enabled
                    .storeCoins(config.min_stake)
                    .storeCoins(config.deposit_fee)
                    .storeCoins(config.withdraw_fee)
                    .storeCoins(config.pool_fee)
                    .storeCoins(0) // receipt price
                .endCell()
        )
    .endCell();
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
