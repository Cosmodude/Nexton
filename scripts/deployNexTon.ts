// Deploys NFT Collection contract + deploys Nexton core contract, funds it + changes NFT contract owner address

import { toNano, beginCell, Address } from 'ton-core';
import { NexTon } from '../wrappers/NexTon';
import { NftCollection } from '../wrappers/NftCollection';
import { compile, NetworkProvider } from '@ton-community/blueprint';
import { randomAddress } from '@ton-community/test-utils';

let myAddress: Address = Address.parse("kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu");

export async function run(provider: NetworkProvider) {
    const randomSeed= Math.floor(Math.random() * 1000);
    const ui = provider.ui();

    // Deploying Collection !!!

    const collection = provider.open(NftCollection.createFromConfig({
        ownerAddress: provider.sender().address as Address,
        nextItemIndex: 0,
        collectionContent: beginCell().storeUint(randomSeed,256).endCell(),
        nftItemCode: await compile("NftItem"),
        royaltyParams: {
            royaltyFactor: 15,
            royaltyBase: 100,
            royaltyAddress: provider.sender().address as Address
        }
    }, await compile('NftCollection')));

    await collection.sendDeploy(provider.sender(), toNano('0.2'));

    await provider.waitForDeploy(collection.address);


    // Deploying Nexton !!!

    const nexton = provider.open(await NexTon.fromInit(myAddress, collection.address));

    await nexton.send(
        provider.sender(),
        {
            value: toNano('0.1')
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );
    
    await provider.waitForDeploy(nexton.address);

    // Funding
    await nexton.send(
        provider.sender(),
        {
            value: toNano('0.5')
        },
        null
    );
    ui.write('Nexton funded !!!');

    // Changing owner !!!

    await collection.sendChangeOwner(provider.sender(),{
        value: toNano("0.11"),
        newOwnerAddress: nexton.address,
        queryId: BigInt(Date.now())
    });

    ui.write('Collection owner changed !!!');

    //const collectionData = await collection.getData(provider.sender());

}


