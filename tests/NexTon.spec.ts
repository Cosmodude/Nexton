import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Address, toNano, fromNano, Cell, beginCell, TupleItemInt, ContractProvider, Dictionary } from 'ton-core';
import { NexTon } from '../wrappers/NexTon';
import { NftCollection } from '../wrappers/NftCollection';
import { NftItem } from '../wrappers/NftItem';
import { buildCollectionContentCell, setItemContentCell, toSha256 } from '../scripts/collectionContent/onChain';
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
        
        nexton = blockchain.openContract(await NexTon.fromInit(await compile("NftItem"), myAddress, nftCollection.address));

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
        // check metadata, diffrence with how item metadata is given
        //console.log(collectionData.collectionContent.refs);
        //const prefix = await collectionData.collectionContent.beginParse().loadUint(8);
        // expect(prefix).toEqual(0);
        const metadataDict = collectionData.collectionContent.beginParse().loadDictDirect(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
        //.beginParse().loadDict(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
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


    // it('Should change Staking Pool address', async() => {
    //     console.log("Changing Address!!!")
    //     const user = await blockchain.treasury('user');
    //     const addressBefore = await nexton.getStakingPool();
    //     //console.log("Address before: ", addressBefore);

    //     const userChange = await nexton.send(
    //         user.getSender(), 
    //         {
    //         value: toNano("0.2")
    //         }, 
    //         {   
    //             $$type: 'ChangeAddr',
    //             queryId: Date.now(),
    //             address: await randomAddress(),
    //             entity: "SP"
    //         }
    //     )
    //     //console.log("user message", userChange.events); // should be bounced

    //     const addressAfterUser = await nexton.getStakingPool();
    //     //console.log("Address after (user): ", addressAfterUser);

    //     const deployerChange = await nexton.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano("0.2")
    //         }, 
    //         {   
    //             $$type: 'ChangeAddr',
    //             queryId: Date.now(),
    //             address: await randomAddress(0),
    //             entity: "SP"
    //         }
    //     )
    //     //console.log("Deployer message", deployerChange.events);
        
    //     const addressAfterDeployer = await nexton.getStakingPool();
    //     //console.log("Address after (deployer): ", addressAfterDeployer);
    //     expect(addressAfterDeployer.toString()).not.toEqual(addressBefore.toString());
    //     expect(addressAfterUser.toString()).toEqual(addressBefore.toString());
    // });

    it('Should Deposit and Mint NFT with set metadata', async() => {

        console.log("User Depositing!!!");
        
        const user = await blockchain.treasury('user');

        //const balanceBefore = await nexton.getBalance();
        //console.log("Balance before deposit: ", fromNano(balanceBefore));

        //const mintMessageReceiver = await nexton.getNftContract();
        //console.log("NFTCollection: ", nftCollection.address);
        //console.log("Mint messsage is sent to ", mintMessageReceiver);
        //expect(mintMessageReceiver.equals(nftCollection.address)).toBe(true);

        const mintMessage = await nexton.send(
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
        
        const index: TupleItemInt = {
            type: "int",
            value: 0n
        }

        const itemAddress =  await nftCollection.getItemAddressByIndex(index);
        //console.log("Balance after: ", fromNano(await nexton.getBalance()));
        
        //console.log("NFTCounter: ", await nexton.getNftCounter())

        expect(mintMessage.transactions).toHaveTransaction({
            from: nftCollection.address,
            inMessageBounced: false
        });
        //console.log(mintMessage.events.at(-1)?.type)
        expect(mintMessage.events.at(-1)?.type).toMatch("account_created");
        expect(await nexton.getNftCounter()).toEqual(1n);

        nftItem = blockchain.openContract(NftItem.createFromAddress(itemAddress));
        expect(nftItem.address).toEqualAddress(itemAddress);

        const itemData = await nftItem.getItemData();
        expect(itemData.index).toEqual(0n);

        const itemMetadata = itemData.itemContent.beginParse().loadRef().beginParse().loadStringTail();
        //loadDict(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell())
        console.log(itemMetadata)
        

    });

    // it("Should Deposit and keep track of LPP", async () =>{
    //     console.log();
    //     console.log("LPP Depositing!!!");

    //     const lpProvider = await blockchain.treasury('provider');

    //     const balanceBefore = await nexton.getBalance();
    //     console.log("Balance before LP deposit: ", fromNano(balanceBefore));

    //     const depositMessage = await nexton.send(
    //         lpProvider.getSender(), 
    //         {
    //         value: toNano("20000")
    //         }, 
    //         'Liquidity Provider Deposit'
    //     )
    //     console.log(await depositMessage.events);


    //     console.log("Balance after: ", fromNano(await nexton.getBalance()));
    // });
    

//     it("Should Deposit and Claim User reward", async () =>{
//         console.log();
//         console.log("User Depositing!!!");
        
//         const user = await blockchain.treasury('user');

//         const balanceBefore = await nexton.getBalance();

//         const depositMessage = await nexton.send(
//             user.getSender(), 
//             {
//                 value: toNano("2")
//             }, 
//             {   
//                 $$type: 'UserDeposit',
//                 queryId: BigInt(Date.now()),
//                 lockPeriod: 600n,
//                 leverage: 3n
//             }
//         )
//         console.log(await depositMessage.events);

//         expect(await nexton.getBalance()).toBeGreaterThan(balanceBefore);
//         expect(await nexton.getNftCounter()).toEqual(1n);

//         const nftIndex: bigint = 0n;

//         console.log("User Depositing!!!");

//         const claimMessage = await nexton.send(
//             user.getSender(),
//             {
//                 value: toNano("1")
//             },
//             {   
//                 $$type: 'UserClaim',
//                 itemIndex: nftIndex
//             }
//         )
//         console.log(await claimMessage.events);

//         //expect(await nexton.getUserNftItemClaimed(nftIndex)).toBeTruthy;
//     });
});
