import { toNano } from 'ton-core';
import { FakeItem } from '../wrappers/FakeItem';
import { NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const fakeItem = provider.open(await FakeItem.fromInit());

    await fakeItem.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(fakeItem.address);

    // run methods on `fakeItem`
}
