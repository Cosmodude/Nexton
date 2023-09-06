import { Address, toNano } from 'ton-core';
import { NftItem } from '../wrappers/NftItem';
import { NetworkProvider, sleep } from '@ton-community/blueprint';
import { randomAddress } from '@ton-community/test-utils';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const itemAddress = Address.parse(args.length > 0 ? args[0] : await ui.input('NFT address'));
    let myAddress: Address = Address.parse("kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu");
    const nextonAddress = Address.parse("EQBDqObEyc8KYOuHCKm0evBNp0hJ9derp8eSIdhYMjIeMRSZ");

    const nftItem = provider.open(NftItem.createFromAddress(itemAddress));

    await nftItem.sendTransfer(provider.sender(),{
        value: toNano("0.2"),
        fwdAmount: toNano("0.02"),
        newOwner: randomAddress(),
        responseAddress: randomAddress(),
        queryId: Date.now()
    })
    ui.write('Transfer succesful');
}