import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Cell, toNano, beginCell, Dictionary, TupleItemInt, Address, } from 'ton-core';
import { NftCollection } from '../wrappers/NftCollection';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { sha256_sync } from 'ton-crypto';
import { NftItem } from '../wrappers/NftItem';
import { buildCollectionContentCell, setItemContentCell, toSha256 } from '../wrappers/collectionContent/onChain';
import { randomAddress } from '@ton-community/test-utils';
   

describe('NftCollection', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('NftCollection');
    });

    let blockchain: Blockchain;
    let nftCollection: SandboxContract<NftCollection>;
    let nftItem: SandboxContract<NftItem>;
    let deployer: SandboxContract<TreasuryContract>;
    const nextonAddress: Address = randomAddress();

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');

        const initConfig =  {
            owner: deployer.address,
            nextItemIndex: 0
        };
        nftCollection = blockchain.openContract(NftCollection.createFromConfig({
            ownerAddress: deployer.address,
            nextItemIndex: 0,
            collectionContent: buildCollectionContentCell({
                name: "Collection name",
                description: "Collection description",
                image: "https://hipo.finance/hton.png"
            }),
            nftItemCode: await compile("NftItem"),
            royaltyParams: {
                royaltyFactor: 15,
                royaltyBase: 100,
                royaltyAddress: deployer.address
            }
        }, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await nftCollection.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftCollection.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and nftCollection are ready to use
    });

    it('should set and read metadata properly', async () => {

        deployer = await blockchain.treasury('deployer');

        let collectionData = await nftCollection.getCollectionData();
        expect(collectionData.ownerAddress).toEqualAddress(deployer.address);

        const mint = await nftCollection.sendMintNft(deployer.getSender(), {
            value: toNano("0.04"),
            amount: toNano("0.025"),
            itemIndex: 0,
            itemOwnerAddress: deployer.address,
            nextonAddress: nextonAddress,
            itemContent: setItemContentCell({
                name: "Item name",
                description: "Item description",
                image: "https://hipo.finance/hton.png"
            }),
            queryId: Date.now()
        })
        console.log("EVENT: ", mint.events[1]);

        const index: TupleItemInt = {
            type: "int",
            value: 0n
        }
       
        const itemAddress = await nftCollection.getNFTAddressByIndex(index);

        nftItem = blockchain.openContract(NftItem.createFromAddress(itemAddress));

        const itemData = await nftItem.getNFTData();
        expect(itemData.collectionAddress).toEqualAddress(nftCollection.address);
        
        //console.log(itemData.itemContent);
        const cs = itemData.itemContent.beginParse();
        const tag = cs.loadUint(8);
        console.log(tag)
        const dict = cs.loadDict(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
        const nameCS = dict.get(toSha256("name"))?.beginParse()!!;
        console.log(nameCS)
        await nameCS.loadUint(8);
        const name = await nameCS?.loadStringTail();
        expect(name).toEqual("Item name");
    });

    it('should transfer tokens freely', async() => {
        deployer = await blockchain.treasury('deployer');

        let collectionData = await nftCollection.getCollectionData();
        expect(collectionData.ownerAddress).toEqualAddress(deployer.address);

        const mint = await nftCollection.sendMintNft(deployer.getSender(), {
            value: toNano("0.04"),
            amount: toNano("0.025"),
            itemIndex: 0,
            itemOwnerAddress: deployer.address,
            nextonAddress: nextonAddress,
            itemContent: setItemContentCell({
                name: "Item name",
                description: "Item description",
                image: "https://hipo.finance/hton.png"
            }),
            queryId: Date.now()
        })
        console.log("EVENT: ", mint.events[1]);
    })
});
