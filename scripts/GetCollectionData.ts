import { Address, toNano, Dictionary } from '@ton/core';
import { NftCollection } from '../wrappers/NftCollection';
import { NetworkProvider, sleep } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('Collection address'));
    

    const nftCollection = provider.open(NftCollection.createFromAddress(address));

    const data = await nftCollection.getCollectionData()
    console.log(data);

    // for onchain collections only

    const content = data.collectionContent.beginParse();
    const prefix = content.loadUint(8);
    console.log(prefix);
    const dict = content.loadDict((Dictionary.Keys.BigUint(256)), Dictionary.Values.Cell());
    console.log(dict)

    
}