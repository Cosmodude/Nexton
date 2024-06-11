import { Address, toNano } from '@ton/core';
import { NftCollection } from '../wrappers/NftCollection';
import { compile, NetworkProvider } from '@ton/blueprint';
import { buildCollectionContentCell, setItemContentCell } from './contentUtils/onChain';

let myAddress: Address = Address.parse("kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu");

const randomSeed= Math.floor(Math.random() * 10000);

const nextonAddress = Address.parse("EQBDqObEyc8KYOuHCKm0evBNp0hJ9derp8eSIdhYMjIeMRSZ");

export async function run(provider: NetworkProvider) {
    const nftCollection = provider.open(NftCollection.createFromConfig({
        ownerAddress: myAddress, 
        nextItemIndex: 0,
        collectionContent: buildCollectionContentCell({
            name: "NexTon Liquid Derivatives Staking",
            description: "Collection of liquidity staking derivatives, issued by NexTon",
            image: "https://raw.githubusercontent.com/Cosmodude/Nexton/main/Nexton_Logo.jpg"
        }),
        //off chain
        // collectionContent: buildCollectionContentCell({
        //     collectionContent: "https://raw.githubusercontent.com/Cosmodude/Nexton/main/collectionMetadata.json",
        //     commonContent: " "
        // }),
        nftItemCode: await compile("NftItem"),
        royaltyParams: {
            royaltyFactor: Math.floor(Math.random() * 500), 
            royaltyBase: 1000,
            royaltyAddress: provider.sender().address as Address
        }
    }, await compile('NftCollection')));

    console.log(provider.sender().address as Address)
    await nftCollection.sendDeploy(provider.sender(), toNano('0.05'));
    console.log()
    await provider.waitForDeploy(nftCollection.address);

    const mint = await nftCollection.sendMintNft(provider.sender(),{
        value: toNano("0.04"),
        queryId: randomSeed,
        amount: 0n,
        itemIndex: 0,
        itemOwnerAddress: myAddress,
        nextonAddress: nextonAddress,
        itemContent: setItemContentCell({
            name: "Nexton Staking Derivative",
            description: "Holds information about the user's stake in the Nexton platform pool",
            image: "https://raw.githubusercontent.com/Cosmodude/TAP/main/TAP_Logo.png",
            principal: 10n,
            leverageRatio: 1n,
            lockPeriod: 600n,
            lockEnd: 10n
        })
    })
    console.log(`NFT Item deployed at https://testnet.tonscan.org/address/${nftCollection.address}`);
}
