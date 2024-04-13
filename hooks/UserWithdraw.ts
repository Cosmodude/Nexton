export * from '../build/NexTon/tact_NexTon';
import { Address, Cell, toNano } from '@ton/core';
import { TonClient } from '@ton/ton';
import { NftItem } from '../wrappers/NftItem';
import { randomAddress } from '@ton/test-utils';

const nextonAddress: Address = Address.parse("EQCp-JgP3iOcz1a6-sG6zjfji_1xUm-eefsDgDJDmXt9j8v7");

export async function UserWithdraw(
    client: TonClient,
    sender: any,
) {
    const nftItem =  await NftItem.createFromAddress(nextonAddress);

    const item = client.open(nftItem);
    const tx = await item.sendTransfer(sender, {
        value: toNano("0.3"),
        fwdAmount: toNano("0.08"),
        newOwner: nextonAddress,
        responseAddress: nextonAddress,
        queryId: Date.now()
    });

    return tx;
}
