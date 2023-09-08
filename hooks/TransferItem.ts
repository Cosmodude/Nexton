export * from '../build/FakeItem/tact_FakeItem';
import { Address, Cell, toNano } from 'ton-core';
import { TonClient } from 'ton';
import { FakeItem } from './TransferItem';
import { randomAddress } from '@ton-community/test-utils';

const itemAddress: Address = Address.parse("EQCp-JgP3iOcz1a6-sG6zjfji_1xUm-eefsDgDJDmXt9j8v7");

export async function TransferItem(
    client: TonClient,
    sender: any,
) {
    const itemInit = FakeItem.fromAddress(itemAddress);

    const item = client.open(itemInit);
    const tx = await item.send(sender,
    {
        value: toNano('0.08'),
    },
    {
        $$type: 'Transfer',
        newOwner: randomAddress()
    })

    return tx;
}
