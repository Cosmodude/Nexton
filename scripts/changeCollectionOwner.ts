import { Address, toNano } from 'ton-core';
import { NftCollection } from '../wrappers/NftCollection';
import { NetworkProvider, sleep } from '@ton-community/blueprint';

const nextonAddress: Address = Address.parse("EQAgm4FTha6Aj0GYRmfcmRVBvaVd-smYYkd3Jjy86-50ndq7");

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('Collection address'));
    

    const nftCollection = provider.open(NftCollection.createFromAddress(address));

    await nftCollection.sendChangeOwner(provider.sender(),{
        value: toNano("0.02"),
        newOwnerAddress: nextonAddress,
        queryId: Date.now()
    })
    ui.write('Collection owner changed deployed');

    const collectionData = await nftCollection.getData(provider.sender());
    ui.write('Collection Data');
}