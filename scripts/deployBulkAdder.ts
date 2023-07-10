import { toNano } from 'ton-core';
import { BulkAdder } from '../wrappers/BulkAdder';
import { NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const bulkAdder = provider.open(await BulkAdder.fromInit());

    await bulkAdder.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(bulkAdder.address);

    // run methods on `bulkAdder`
}
