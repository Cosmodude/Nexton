import { Address, beginCell, toNano } from 'ton-core';
import { NftCollection, buildNftCollectionContentCell, NftCollectionContent } from '../wrappers/NftCollection';
import { compile, NetworkProvider } from '@ton-community/blueprint';

let myAddress: Address = Address.parse("kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu");

export async function run(provider: NetworkProvider) {
    const nftCollection = provider.open(NftCollection.createFromConfig({
        ownerAddress: myAddress,
        nextItemIndex: 0,
        collectionContent: buildNftCollectionContentCell({
            collectionContent: 'https://github.com/Cosmodude/Invincible_LS/blob/main/sampleMetadata.json',
            commonContent: 'tonstorage://0D51A77C4BE0E59ED44D149B5FE32332AE726FE09AE83E84E363FC50A21DFB56/'
        }),
        nftItemCode: await compile("NftItem"),
        royaltyParams: {
            royaltyFactor: 15,
            royaltyBase: 100,
            royaltyAddress: provider.sender().address as Address
        }
    }, await compile('NftCollection')));

    console.log(provider.sender().address)
    await nftCollection.sendDeploy(provider.sender(), toNano('0.05'));
    console.log(provider.sender().address)
    await provider.waitForDeploy(nftCollection.address);

}
