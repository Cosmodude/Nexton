import { toNano } from 'ton-core';
import { TACT } from '../wrappers/TACT';
import { NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const tACT = provider.open(await TACT.fromInit(5611n));

    await tACT.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Add',
            amount: 10n,
            contractId: 5611n,
        }
    );


    console.log('Previous counter', await tACT.getCounter());
}