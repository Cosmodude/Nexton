import { Address, toNano, Dictionary} from 'ton-core';
import { NftItem } from '../wrappers/NftItem';
import { NetworkProvider, sleep } from '@ton-community/blueprint';
import { toSha256 } from '../scripts/collectionContent/onChain';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('Item address'));
    

    const nftItem = provider.open(NftItem.createFromAddress(address));

    const data = await nftItem.getItemData()
    //console.log(data);

    const contentS = data.itemContent.beginParse();
    console.log(contentS.remainingBits)
    const contDict = contentS.loadDict(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
    const nameS = await contDict.get(toSha256("name"))?.beginParse();
    const prefix1 = nameS?.loadUint(8);
    
    console.log(nameS?.loadStringTail());
}