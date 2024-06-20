import { toNano } from '@ton/core';
import { JNexton } from '../wrappers/JNexton';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const jNexton = provider.open(await JNexton.fromInit());

    await jNexton.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(jNexton.address);

    // run methods on `jNexton`
}
