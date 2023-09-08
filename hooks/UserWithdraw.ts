export * from '../build/NexTon/tact_NexTon';
import { Address, Cell, toNano } from 'ton-core';
import { TonClient } from 'ton';
import { NexTon } from './Userwithdraw';
import { randomAddress } from '@ton-community/test-utils';

const nextonAddress: Address = Address.parse("EQCp-JgP3iOcz1a6-sG6zjfji_1xUm-eefsDgDJDmXt9j8v7");

export async function UserWithdraw(
    client: TonClient,
    sender: any,
) {
    const nextonInit =  await NexTon.fromAddress(nextonAddress);

    const item = client.open(nextonInit);
    const tx = await item.send(sender,
    {
        value: toNano('0.05'),
    },
    {
        $$type: 'UserClaimWithdraw',
        itemIndex: 0n
    })

    return tx;
}
