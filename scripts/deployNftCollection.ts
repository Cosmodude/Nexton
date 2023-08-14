import { Address, Dictionary, beginCell, toNano } from 'ton-core';
import { NftCollection, buildNftCollectionContentCell, NftCollectionContent } from '../wrappers/NftCollection';
import { compile, NetworkProvider } from '@ton-community/blueprint';


let myAddress: Address = Address.parse("kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu");

const sha256 = (message: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    return data;
};

export async function run(provider: NetworkProvider) {
    let collectionContent = Dictionary.empty(Dictionary.Keys.Uint(8), Dictionary.Values.Buffer(32));
    collectionContent.set(sha256("name"), Buffer.from("NexTon User"));
    collectionContent.set(Buffer.from("description"), Buffer.from("NFts proving users' deposits"));
    console.log(collectionContent)
    const nftCollection = provider.open(NftCollection.createFromConfig({
        ownerAddress: myAddress, 
        nextItemIndex: 0,
        collectionContent: beginCell().storeDict(collectionContent).endCell(),
        nftItemCode: await compile("NftItem"),
        royaltyParams: {
            royaltyFactor: 5,
            royaltyBase: 100,
            royaltyAddress: provider.sender().address as Address
        }
    }, await compile('NftCollection')));

    console.log(provider.sender().address as Address)
    await nftCollection.sendDeploy(provider.sender(), toNano('0.05'));
    console.log()
    await provider.waitForDeploy(nftCollection.address);
}
