import { toNano } from 'ton-core';
import { Messages } from '../wrappers/Messages';
import { NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const messages = provider.open(await Messages.fromInit());

    await messages.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(messages.address);

    // run methods on `messages`
}
