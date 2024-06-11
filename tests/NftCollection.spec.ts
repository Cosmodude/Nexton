import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano, beginCell, Dictionary, TupleItemInt, Address, } from '@ton/core';
import { NftCollection } from '../wrappers/NftCollection';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { sha256_sync } from 'ton-crypto';
import { NftItem } from '../wrappers/NftItem';
import { buildCollectionContentCell, setItemContentCell, toSha256 } from '../scripts/contentUtils/onChain';
import { randomAddress } from '@ton/test-utils';

describe('NftCollection', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('NftCollection');
    });

    let blockchain: Blockchain;
    let nftCollection: SandboxContract<NftCollection>;
    let nftItem: SandboxContract<NftItem>;
    let deployer: SandboxContract<TreasuryContract>;
    let nexton: SandboxContract<TreasuryContract>;
    
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
                name: "Nexton",
                description: "Nexton description",
                image: "https://hipo.finance/hton.png"
            }),
            nftItemCode: await compile("NftItem"),
            royaltyParams: {
                royaltyFactor: 15,
                royaltyBase: 100,
                royaltyAddress: deployer.address
            }
        }, code));

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

    it('should set and read Item metadata properly', async () => {

        deployer = await blockchain.treasury('deployer');
        nexton = await blockchain.treasury('nexton');

        let collectionData = await nftCollection.getCollectionData();
        expect(collectionData.ownerAddress).toEqualAddress(deployer.address);

        const mint = await nftCollection.sendMintNft(deployer.getSender(), {
            value: toNano("0.6"),
            amount: toNano("0.5"),
            itemIndex: 0,
            itemOwnerAddress: randomAddress(),
            nextonAddress: nexton.address,
            itemContent: setItemContentCell({
                name: "Item name",
                description: "Holds information about the user's stake in the Nexton platform pool",
                image: "https://raw.githubusercontent.com/Cosmodude/TAP/main/TAP_Logo.png",
                principal: 10n,
                leverageRatio: 1n,
                lockPeriod: 600n,
                lockEnd: 10n
            }),
            queryId: Date.now()
        })
        //console.log("EVENT: ", mint.events);

        

        const index: TupleItemInt = {
            type: "int",
            value: 0n
        }
       
        // const itemAddress = await nftCollection.getItemAddressByIndex(index);
        // //console.log("Address", itemAddress);

        // expect(mint.transactions).toHaveTransaction({
        //     from: nftCollection.address,
        //     to: itemAddress,
        //     deploy: true,
        //     success: true,
        // });

        // nftItem = blockchain.openContract(NftItem.createFromAddress(itemAddress));
        // expect(nftItem.address).toEqualAddress(itemAddress);
        // const itemData = await nftItem.getItemData();
        // expect(itemData.collectionAddress).toEqualAddress(nftCollection.address);
        // expect(itemData.nextonAddress).toEqualAddress(nexton.address);

        // //console.log(itemData.itemContent);
        // const cs = itemData.itemContent.beginParse();
        // const tag = cs.loadUint(8);
        // //console.log("Tag", tag)
        // expect(tag).toEqual(0);
        // const dict = cs.loadDict(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
        // const nameCS = dict.get(toSha256("name"))?.beginParse()!!;
        // //console.log(nameCS);
        // await nameCS.loadUint(8);
        // const name = await nameCS?.loadStringTail();
        // //console.log(name);
        // expect(name).toMatch("Item name");
    });

    // it('should send items to nexton freely (withdraw)', async() => {
    //     deployer = await blockchain.treasury('deployer');
    //     nexton = await blockchain.treasury('nexton');
    //     let initialOwner = await blockchain.treasury('owner');

    //     let collectionData = await nftCollection.getCollectionData();
    //     expect(collectionData.ownerAddress).toEqualAddress(deployer.address);

    //     const mint = await nftCollection.sendMintNft(deployer.getSender(), {
    //         value: toNano("0.6"),
    //         amount: toNano("0.5"),
    //         itemIndex: 0,
    //         itemOwnerAddress: initialOwner.address,
    //         nextonAddress: nexton.address,
    //         itemContent: setItemContentCell({
    //             name: "Item name",
    //             description: "Item description",
    //             image: "https://hipo.finance/hton.png"
    //         }),
    //         queryId: Date.now()
    //     })
    //     //console.log("EVENT: ", mint.events);

    //     const index: TupleItemInt = {
    //         type: "int",
    //         value: 0n
    //     }
       
    //     const itemAddress = await nftCollection.getItemAddressByIndex(index);
    //     //console.log("Item Address", itemAddress);

    //     nftItem = blockchain.openContract(NftItem.createFromAddress(itemAddress));
    //     expect(nftItem.address).toEqualAddress(itemAddress);

    //     const itemData = await nftItem.getItemData();
    //     const nextonAddress = itemData.nextonAddress;
    //     expect(nextonAddress).toEqualAddress(nexton.address);

    //     const returnTx = await nftItem.sendTransfer(initialOwner.getSender(),{
    //         queryId: Date.now(),
    //         value:  toNano("10"),
    //         newOwner: nextonAddress,
    //         responseAddress: initialOwner.address,
    //         fwdAmount: toNano("5")
    //         }
    //     );

    //     //console.log("Return Tx: ", returnTx.transactions);
    //     expect(returnTx.transactions).toHaveTransaction({
    //         from: nftItem.address,
    //         to: nexton.address,
    //         success: true,
    //         inMessageBounced: false
    //     });
    //     // console.log("init owner  ", initialOwner.address);
    //     // console.log("deployer owner  ", deployer.address);
    //     // console.log(" Item   ", itemAddress)
    // })
});
