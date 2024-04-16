import { Address, toNano } from '@ton/core';
import { NftItem } from '../wrappers/NftItem';
import { NetworkProvider, sleep } from '@ton/blueprint';
import { randomAddress } from '@ton/test-utils';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const itemAddress = Address.parse(args.length > 0 ? args[0] : await ui.input('NFT Item address'));
    let myAddress: Address = Address.parse("kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu");
    const nextonAddress = Address.parse("kQAWBJo6G0gHFVWE0GVzWHZRUCLlnKxQqID_teDeV_SO-vNu");

    const nftItem = provider.open(NftItem.createFromAddress(itemAddress));

    await nftItem.sendTransfer(provider.sender(),{
        value: toNano("0.2"),
        fwdAmount: toNano("0.1"),
        newOwner: nextonAddress,
        responseAddress: nextonAddress,
        queryId: Date.now()
    })
    ui.write('Transfer succesful');
}