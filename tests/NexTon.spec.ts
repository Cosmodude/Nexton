import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Address, toNano, fromNano, Cell, Slice, beginCell, TupleItemInt, ContractProvider, Dictionary } from 'ton-core';
import { NexTon } from '../wrappers/NexTon';
import { NftCollection } from '../wrappers/NftCollection';
import { NftItem } from '../wrappers/NftItem';
import { buildCollectionContentCell, itemContent, setItemContentCell, toSha256 } from '../scripts/collectionContent/onChain';
import '@ton-community/test-utils';
import { randomAddress } from '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('NexTon', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('NftCollection');
    }, 10000);

    let blockchain: Blockchain;
    let nexton: SandboxContract<NexTon>;
    let nftCollection: SandboxContract<NftCollection>;
    let nftItem: SandboxContract<NftItem>;
    let deployer: SandboxContract<TreasuryContract>;

    let myAddress: Address = Address.parse("kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu");
    
    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');

        nftCollection = blockchain.openContract(await NftCollection.createFromConfig({
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

        const nftCollectionDeployResult = await nftCollection.sendDeploy(deployer.getSender(), toNano('0.1'));

        expect(nftCollectionDeployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftCollection.address,
            deploy: true,
            success: true,
        });
        
        nexton = blockchain.openContract(await NexTon.fromInit(await compile("NftItem"), nftCollection.address));

        const nexTonDeployResult = await nexton.send(
            deployer.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(nexTonDeployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nexton.address,
            deploy: true,
            success: true,
        });

        await nftCollection.sendChangeOwner(deployer.getSender(),{
            value: toNano("0.02"),
            newOwnerAddress: nexton.address,
            queryId: BigInt(Date.now())
        });

        const collectionData = await nftCollection.getCollectionData();
        const metadataDict = collectionData.collectionContent.beginParse().loadDictDirect(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
        const prefix = await metadataDict.get(toSha256("name"))?.beginParse().loadUint(8);
        expect(prefix).toEqual(0);
        const collectionName = await metadataDict.get(toSha256("name"))?.beginParse().loadStringTail();
        // console.log("Metadata.name: ", collectionName);
        expect(collectionData.ownerAddress).toEqualAddress(nexton.address);
        expect(collectionName).toMatch("Collection name");
        expect(collectionData.nextItemId).toEqual(0n);
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and invicore are ready to use
    });

    it('Should Deposit and Mint NFT with set metadata', async() => {

        //console.log("User Depositing!!!");
        
        const user = await blockchain.treasury('user');
        const lockP = 600n;
        const leverageR = 3n;

        const mintMessage = await nexton.send(
            user.getSender(), 
            {
            value: toNano("2")
            }, 
            {   
                $$type: 'UserDeposit',
                
                queryId: BigInt(Date.now()),
                lockPeriod: lockP,
                leverage: leverageR
            }
        )
        
        const index: TupleItemInt = {
            type: "int",
            value: 0n
        }

        const itemAddress =  await nftCollection.getItemAddressByIndex(index);

        expect(mintMessage.transactions).toHaveTransaction({
            from: nftCollection.address,
            to: itemAddress,
            inMessageBounced: false
        });
        //console.log(mintMessage.events.at(-1)?.type)
        expect(mintMessage.events.at(-1)?.type).toMatch("account_created");
        expect(await nexton.getNftCounter()).toEqual(1n);

        nftItem = blockchain.openContract(NftItem.createFromAddress(itemAddress));
        expect(nftItem.address).toEqualAddress(itemAddress);

        const itemData = await nftItem.getItemData();
        expect(itemData.index).toEqual(0n);
        const itemContentSlice = itemData.itemContent.beginParse();
        //console.log("refs ", itemContentSlice.remainingRefs);
        expect(itemContentSlice.remainingRefs).toEqual(1);

        const prefix = itemContentSlice.loadUint(8);
        expect(prefix).toEqual(0);
        console.log("Metadata Prefix", prefix);
        const dict = itemContentSlice.loadDict((Dictionary.Keys.BigUint(256)), Dictionary.Values.Cell());
        const nameCell = dict.get(toSha256("name"));
        const descriptionCell = dict.get(toSha256("description"));
        const imageCell = dict.get(toSha256("image"));
        const principalCell = dict.get(toSha256("principal"));
        const leverageCell = dict.get(toSha256("leverage"));
        const lockPeriodCell = dict.get(toSha256("lockPeriod"));
        const lockEndCell = dict.get(toSha256("lockEnd"));
        console.log("name ", nameCell?.beginParse().loadStringTail());
        // await console.log("desc ", descriptionCell?.beginParse().loadStringTail());
        // console.log("principal ", principalCell?.beginParse().loadCoins());
        // console.log("leverage ", leverageCell?.beginParse().loadUint(8));
        console.log("lockPeriod ", lockPeriodCell?.beginParse().loadUint(256));
        // //expect(lockPeriodCell?.beginParse().loadUint(256)).toEqual(600);
        console.log("Now ", Math.floor(Date.now() / 1000));
        console.log("lockEnd ", lockEndCell?.beginParse().loadUint(256));
        
    });

    it("Should Deposit and Claim User reward", async () =>{
        //console.log();
        
        //console.log("User Depositing!!!");
        
        const user = await blockchain.treasury('user');
        const lockP = 1n;
        const leverageR = 3n;

        const depositMessage = await nexton.send(
            user.getSender(), 
            {
                value: toNano("2")
            }, 
            {   
                $$type: 'UserDeposit',
                queryId: BigInt(Date.now()),
                lockPeriod: 600n,
                leverage: 3n
            }
        )
        //console.log(await depositMessage.events);
        const index: TupleItemInt = {
            type: "int",
            value: 0n
        }

        const itemAddress =  await nftCollection.getItemAddressByIndex(index);

        expect(depositMessage.transactions).toHaveTransaction({
            from: nftCollection.address,
            to: itemAddress,
            inMessageBounced: false
        });
        expect(await nexton.getNftCounter()).toEqual(1n);

        nftItem = blockchain.openContract(NftItem.createFromAddress(itemAddress));
        expect(nftItem.address).toEqualAddress(itemAddress);
        const itemData = await nftItem.getItemData();
        expect(itemData.index).toEqual(0n);

        //console.log(Date.now())
        //await new Promise(resolve => setTimeout(resolve, 4000));
        //console.log(Date.now())

        //console.log("User Claiming!!!");

        const claimMessage = await nftItem.sendTransfer(
            user.getSender(),
            {
                queryId: Date.now(),
                value: toNano("0.2"),
                newOwner: nexton.address,
                responseAddress: user.address,
                fwdAmount: toNano("0.1")
            }

        )
        console.log(await claimMessage.transactions);

        //expect(await nexton.getUserNftItemClaimed(nftIndex)).toBeTruthy;
    });
});
