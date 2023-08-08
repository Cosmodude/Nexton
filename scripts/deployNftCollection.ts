import { Address, beginCell, toNano } from 'ton-core';
import { NftCollection, buildNftCollectionContentCell } from '../wrappers/NftCollection';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const nftCollection = provider.open(NftCollection.createFromConfig({
        ownerAddress: provider.sender().address as Address,
        nextItemIndex: 0,
        collectionContent: buildNftCollectionContentCell(
            {
                collectionContent: "https://github.com/Cosmodude/Invincible_LS/blob/main/sampleMetadata.json",
                commonContent: ""
            }
        ),
        nftItemCode: await compile("NftItem"),
        royaltyParams: {
            royaltyFactor: 15,
            royaltyBase: 100,
            royaltyAddress: provider.sender().address as Address
        }
    }, await compile('NftCollection')));

    await nftCollection.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(nftCollection.address);

    // run methods on `nftCollection`
}
