import { Address, toNano } from 'ton-core';
import { NftCollection } from '../wrappers/NftCollection';
import { NetworkProvider, sleep } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('Collection address'));
    

    const nftCollection = provider.open(NftCollection.createFromAddress(address));

    const data = await nftCollection.getCollectionData()
    console.log(data);
}