import { toNano } from 'ton-core';
import { TACT } from '../wrappers/TACT';
import { NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const tACT = provider.open(await TACT.fromInit(BigInt(Math.floor(Math.random() * 10000))));

    await tACT.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(tACT.address);

    console.log('ID', await tACT.getId());
}
