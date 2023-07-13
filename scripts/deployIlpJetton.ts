import { toNano } from 'ton-core';
import { IlpJetton } from '../wrappers/IlpJetton';
import { NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const ilpJetton = provider.open(await IlpJetton.fromInit());

    await ilpJetton.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(ilpJetton.address);

    // run methods on `ilpJetton`
}
