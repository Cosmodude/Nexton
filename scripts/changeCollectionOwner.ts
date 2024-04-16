import { Address, toNano } from '@ton/core';
import { NftCollection } from '../wrappers/NftCollection';
import { NetworkProvider, sleep } from '@ton/blueprint';


export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const collectionAddress = Address.parse(args.length > 0 ? args[0] : await ui.input('Collection address'));
    const nextonAddress = Address.parse(args.length > 0 ? args[0] : await ui.input('New owner address'));

    const nftCollection = provider.open(NftCollection.createFromAddress(collectionAddress));

    const tx = await nftCollection.sendChangeOwner(provider.sender(),{
        value: toNano("0.02401"),
        newOwnerAddress: nextonAddress,
        queryId: BigInt(Date.now())
    })
    ui.write('Collection owner changed');

    //ui.write();
    

    //const collectionData = await nftCollection.getCollectionData(provider.sender());
    //ui.write('Collection Data');
}