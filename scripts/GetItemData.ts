import { Address, toNano, Dictionary} from '@ton/core';
import { NftItem, NftItemConfig} from '../wrappers/NftItem';
import { NetworkProvider, sleep } from '@ton/blueprint';
import { toSha256 } from './contentUtils/onChain';

export type ItemData = NftItemConfig & {
    name: string;
    description: string;
    image: string;
    socialLinks: string; 
    principal: bigint;
    lockPeriod: number;
    lockEnd: number;
}

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('Item address'));
    
    const nftItem = provider.open(NftItem.createFromAddress(address));

    const data = await nftItem.getItemData()
    //console.log(data);

    const contentS = data.itemContent.beginParse();
    const _dictPrefix = contentS.loadUint(8);
    //console.log(contentS.remainingBits)
    const contDict = contentS.loadDict(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
    const nameS = await contDict.get(toSha256("name"))?.beginParse();
    let prefix = nameS?.loadUint(8);
    const descS = await contDict.get(toSha256("description"))?.beginParse();
    prefix = descS?.loadUint(8);
    const imageS = await contDict.get(toSha256("image"))?.beginParse();
    prefix = imageS?.loadUint(8);
    const socialLinksS = await contDict.get(toSha256("socialLinks"))?.beginParse();
    prefix = socialLinksS?.loadUint(8);
    const principalS = await contDict.get(toSha256("principal"))?.beginParse();
    prefix = principalS?.loadUint(8);
    const lockPeriodS = await contDict.get(toSha256("lockPeriod"))?.beginParse();
    prefix = lockPeriodS?.loadUint(8);
    const lockEndS = await contDict.get(toSha256("lockEnd"))?.beginParse();
    prefix = lockEndS?.loadUint(8);
    
    // nextonAddress can't be read with this method
    const itemData: ItemData = {   
        index: Number(data.index),
        collectionAddress: data.collectionAddress,
        ownerAddress: data.itemOwner,
        nextonAddress: Address.parse("UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ"),
        itemContent: data.itemContent,
        name: nameS?.loadStringTail()!,
        description: descS?.loadStringTail()!,
        image: imageS?.loadStringTail()!,
        socialLinks: socialLinksS?.loadStringTail()!,
        principal: principalS?.loadCoins()!,
        lockPeriod: lockPeriodS?.loadUint(256)!,
        lockEnd: lockEndS?.loadUint(256)!
    };
    
    console.log(itemData);
    return itemData;
}