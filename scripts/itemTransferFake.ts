import { Address, toNano } from 'ton-core';
import { FakeItem } from '../wrappers/FakeItem';
import { NetworkProvider, sleep } from '@ton-community/blueprint';
import { randomAddress } from '@ton-community/test-utils';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const itemAddress = Address.parse(args.length > 0 ? args[0] : await ui.input('NFT address'));
    let myAddress: Address = Address.parse("kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu");

    const nftItem = provider.open(FakeItem.fromAddress(itemAddress));

    await nftItem.send(provider.sender(),
    {
        value: toNano('2'),
    },
    {
        $$type: 'Transfer',
        newOwner: randomAddress()
    })
    
    ui.write('Transfer succesful');
}