import { Address, beginCell, toNano } from 'ton-core';
import { NftCollection, buildNftCollectionContentCell } from '../wrappers/NftCollection';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const randomSeed= Math.floor(Math.random() * 10000)
    const nftCollection = provider.open(NftCollection.createFromConfig({
        ownerAddress: provider.sender().address as Address,
        nextItemIndex: 0,
        collectionContent: buildNftCollectionContentCell(
            {
                collectionContent: "https://github.com/ton-blockchain/token-contract/blob/main/nft/web-example/my_collection.json",
                commonContent: "https://github.com/ton-blockchain/token-contract/blob/main/nft/web-example/my_collection.json"
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
