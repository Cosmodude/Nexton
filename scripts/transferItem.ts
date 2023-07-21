import { Address, toNano } from 'ton-core';
import { NftItem } from '../wrappers/NftItem';
import { NetworkProvider, sleep } from '@ton-community/blueprint';
import { randomAddress } from '@ton-community/test-utils';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('NFT address'));
    

    const nftItem = provider.open(NftItem.createFromAddress(address));

    await nftItem.sendTransfer(provider.sender(),{
        value: toNano("0.2"),
        fwdAmount: toNano("0.02"),
        newOwner: randomAddress(),
        responseAddress:randomAddress(),
        queryId: Date.now()
    })
    ui.write('Transfer succesful');
}