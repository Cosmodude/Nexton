import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Cell, toNano, beginCell, Dictionary, TupleItemInt, } from 'ton-core';
import { NftCollection } from '../wrappers/NftCollection';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { sha256_sync } from 'ton-crypto';
import { NftItem } from '../wrappers/NftItem';

function toSha256(s: string): bigint {
    return BigInt('0x' + sha256_sync(s).toString('hex'))
}

function toTextCell(s: string): Cell {
    return beginCell().storeUint(0, 8).storeStringTail(s).endCell()
}

const collectionContentDict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell())
    .set(toSha256("name"), toTextCell("Collection name"))
    .set(toSha256("description"), toTextCell("Collection description"))
    .set(toSha256("image"), toTextCell("https://hipo.finance/hton.png"));

const content = beginCell().storeUint(0,8).storeDict(collectionContentDict).endCell()

describe('NftCollection', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('NftCollection');
    });

    let blockchain: Blockchain;
    let nftCollection: SandboxContract<NftCollection>;
    let nftItem: SandboxContract<NftItem>;
    let deployer: SandboxContract<TreasuryContract>;

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
            collectionContent: content,
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

        function toSha256(s: string): bigint {
            return BigInt('0x' + sha256_sync(s).toString('hex'))
        }
        
        function toTextCell(s: string): Cell {
            return beginCell().storeUint(0, 8).storeStringTail(s).endCell()
        }
        
        const itemContentDict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell())
            .set(toSha256("name"), toTextCell("Item name"))
            .set(toSha256("description"), toTextCell("Item description"))
            .set(toSha256("image"), toTextCell("https://s.getgems.io/nft/b/c/62fba50217c3fe3cbaad9e7f/image.png"));
        
        const itemContent = beginCell().storeUint(0, 8).storeDict(itemContentDict).endCell();

        const mint = await nftCollection.sendMintNft(deployer.getSender(), {
            value: toNano("0.04"),
            amount: toNano("0.025"),
            itemIndex: 0,
            itemOwnerAddress: deployer.address,
            itemContent: itemContent,
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
        const dict = cs.loadDict(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
        const nameCS = dict.get(toSha256("name"))?.beginParse()!!;
        await nameCS.loadUint(8);
        const name = await nameCS?.loadStringTail();
        expect(name).toEqual("Item name");
    });
});
