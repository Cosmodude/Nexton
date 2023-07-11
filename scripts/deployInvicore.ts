import { toNano } from 'ton-core';
import { Invicore } from '../wrappers/InviCore';
import { NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const invicore = provider.open(await Invicore.fromInit());

    await invicore.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(invicore.address);

    // run methods on `invicore`
}
