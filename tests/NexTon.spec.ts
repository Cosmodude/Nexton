import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, toNano, fromNano, Cell, TupleItemInt,  Dictionary, beginCell } from '@ton/core';
import { NexTon } from '../wrappers/NexTon';
import { NftCollection } from '../wrappers/NftCollection';
import { NftItem } from '../wrappers/NftItem';
import { buildCollectionContentCell, toSha256 } from '../scripts/contentUtils/onChain';
import '@ton/test-utils';
import { randomAddress } from '@ton/test-utils';
import { compile } from '@ton/blueprint';

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
    

    const nextonSetup = {
        ownerAddress: myAddress,
        lockPeriod: 5184000,
        userDeposit: toNano("2") + toNano("0.1"),
        protocolFee: toNano("0.1"),
    }
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
        const nextonOwner = await nexton.getOwner();

        await nexton.send(
            deployer.getSender(),
            {
                value: toNano("50")
            },
            null
        )

        expect(nextonOwner).toEqualAddress(deployer.address);

        await nftCollection.sendChangeOwner(deployer.getSender(),{
            value: toNano("0.02"),
            newOwnerAddress: nexton.address,
            queryId: BigInt(Date.now())
        });

        // checkng nft collection data
        const collectionData = await nftCollection.getCollectionData();
        const contentS = collectionData.collectionContent.beginParse();
        const outPrefix = contentS.loadUint(8);
        expect(outPrefix).toEqual(0);
        const metadataDict = contentS.loadDict(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
        
        const collectionNameS = await metadataDict.get(toSha256("name"))?.beginParse();
        const inPrefix = collectionNameS?.loadUint(8);
        expect(inPrefix).toEqual(0);
        const collectionName = collectionNameS?.loadStringTail();
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

        const depositMessage = await nexton.send(
            user.getSender(), 
            {
            value: nextonSetup.userDeposit
            }, 
            {   
                $$type: 'TonDeposit',
                
                queryId: BigInt(Date.now()),
            }
        )
        
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
        //console.log(mintMessage.events);
        expect(depositMessage.events.at(-1)?.type).toMatch("account_created");
        expect(await nexton.getNftCounter()).toEqual(1n);

        //console.log(await mintMessage.transactions);
        nftItem = blockchain.openContract(NftItem.createFromAddress(itemAddress));
        expect(nftItem.address).toEqualAddress(itemAddress);

        //console.log(nftItem.address, itemAddress)
        const itemData = await nftItem.getItemData();
        expect(itemData.index).toEqual(0n);
        const itemContentSlice = itemData.itemContent.beginParse();
        //console.log("refs ", itemContentSlice.remainingRefs);
        expect(itemContentSlice.remainingRefs).toEqual(1);

        const outPrefix = itemContentSlice.loadUint(8);
        expect(outPrefix).toEqual(0);
        
        const dict = itemContentSlice.loadDict((Dictionary.Keys.BigUint(256)), Dictionary.Values.Cell());
        const nameCell = dict.get(toSha256("name"));
        const nameS = nameCell?.beginParse();
        nameS?.loadUint(8);
        const name = nameS?.loadStringTail();
        expect(name).toMatch("Nexton Staking Derivative");
        // const descriptionCell = dict.get(toSha256("description"));
        // const imageCell = dict.get(toSha256("image"));
        const principalCell = dict.get(toSha256("principal"));
        // const leverageCell = dict.get(toSha256("leverage"));
        //const lockPeriodCell = dict.get(toSha256("lockPeriod"));
        const lockEndCell = dict.get(toSha256("lockEnd"));
        const pr = principalCell?.beginParse()!!;
        pr.loadUint(8);
        const principal = pr.loadCoins();
        // console.log("principal ", principal);
        expect(principal).toEqual(nextonSetup.userDeposit - nextonSetup.protocolFee);

        const le = lockEndCell?.beginParse()!!;
        le.loadUint(8)
        const lockEnd = le.loadUint(256)
        // console.log("Now ", Math.floor(Date.now() / 1000));
        // console.log("lockEnd ", lockEnd);
        expect(Math.floor(Date.now() / 1000) + Number(nextonSetup.lockPeriod)).toEqual(lockEnd);
        
    });

    it("Should Deposit and Claim User reward", async () =>{
        
        // console.log("User Depositing!!!");
        
        const user = await blockchain.treasury('user');

        const depositMessage = await nexton.send(
            user.getSender(), 
            {
                value: nextonSetup.userDeposit
            }, 
            {   
                $$type: 'TonDeposit',
                queryId: BigInt(Date.now()),
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

        blockchain.now = depositMessage.transactions[1].now;

        blockchain.now += nextonSetup.lockPeriod;

        const claimMessage = await nftItem.sendTransfer(
            user.getSender(),
            {
                queryId: Date.now(),
                value: toNano("0.2"),
                newOwner: nexton.address,
                responseAddress: randomAddress(), // doesn't matter
                fwdAmount: toNano("0.1")
            }
        )
    
        expect(claimMessage.transactions).toHaveTransaction({
            from: itemAddress,
            to: nexton.address,
            inMessageBounced: false,
        });

        expect(claimMessage.transactions).toHaveTransaction({
            from: nexton.address,
            to: user.address,
            inMessageBounced: false,
        });

        //console.log(claimMessage.transactions);

        const itemD = await nftItem.getItemData();
        const itemOwner = await itemD.itemOwner;
        expect(itemOwner).toEqualAddress(nexton.address);

        const usersPrinciple = await nexton.getStaked();
        expect(usersPrinciple).toEqual(0n);

        // const userBalance = await user.getBalance()
        // expect(userBalance).toEqual(toNano("0.2"));
        // console.log(await claimMessage.events);

        const nextonBalance = await nexton.getBalance();

        console.log("Nexton Balance after claim: ", fromNano(nextonBalance));
    });


    it("Should allow owner withdraw only to owner", async () =>{

        const user = await blockchain.treasury('user');
    
        await nexton.send(
            deployer.getSender(),
            {
                value: toNano("101")
            },
            null
        )

        const nextonBalance = await nexton.getBalance();
        expect(nextonBalance).toBeGreaterThan(toNano("100"));

        const withdrawAmount = toNano("50");
        const userWithdraw = await nexton.send(
            user.getSender(),
            {
                value: toNano("0.1")
            },
            {
                $$type: 'OwnerWithdraw',
                queryId: BigInt(Date.now()),
                amount: withdrawAmount
            }
        )

        expect(userWithdraw.transactions).toHaveTransaction({   
            from: nexton.address,
            to: user.address,
            inMessageBounced: true
        });

        const ownerWithdraw = await nexton.send(
            deployer.getSender(),
            {
                value: toNano("0.1")
            },
            {
                $$type: 'OwnerWithdraw',
                queryId: BigInt(Date.now()),
                amount: withdrawAmount
            }
        )

        // need to account for gas
        expect(ownerWithdraw.transactions).toHaveTransaction({   
            from: nexton.address,
            to: deployer.address,
            inMessageBounced: false,
            value:  withdrawAmount
        });

        expect(ownerWithdraw.transactions).toHaveTransaction({   
            from: nexton.address,
            to: deployer.address,
            inMessageBounced: false,
            body: beginCell().storeUint(0,32).storeStringTail("Excess gas returned").endCell()
        });

    })

    it("Should return nftItem address by index", async () =>{
        const res = await nexton.getNftAddressByIndex(0n);
        expect((await nftItem.getItemData()).index).toEqual(0n);
        // console.log("NftItem Address: ", nftItem.address);
        // console.log("Returned Address: ", res);
        expect(nftItem.address).toEqualAddress(res);
    })

    it("Should let owner set apr and only owner", async () =>{
        const oldApr = await nexton.getApr();
        expect(oldApr).toEqual(1000n);
        const newApr = 2000n;
        const ownerSetApr = await nexton.send(
            deployer.getSender(),
            {
                value: toNano("0.1")
            },
            {
                $$type: 'SetApr',
                queryId: BigInt(Date.now()),
                apr: newApr
            }
        )
        expect(ownerSetApr.transactions).toHaveTransaction({    
            from: deployer.address,
            to: nexton.address,
            inMessageBounced: false,
            value: toNano("0.1")
        });
        const updatedApr = await nexton.getApr();
        expect(updatedApr).toEqual(newApr);

        const user = await blockchain.treasury('user');

        const userSetApr = await nexton.send(
            user.getSender(),
            {
                value: toNano("0.1")
            },
            {
                $$type: 'SetApr',
                queryId: BigInt(Date.now()),
                apr: newApr
            }
        )
        expect(userSetApr.transactions).toHaveTransaction({    
            from: nexton.address,
            to: user.address,
            inMessageBounced: true
        });
    })

    it("Should return nftItem address by index", async () =>{
        const res = await nexton.getNftAddressByIndex(0n);
        expect((await nftItem.getItemData()).index).toEqual(0n);
        // console.log("NftItem Address: ", nftItem.address);
        // console.log("Returned Address: ", res);
        expect(nftItem.address).toEqualAddress(res);
    })

    it("Should let owner withdraw and only owner", async () =>{
        // await nexton.send(  
        //     deployer.getSender(),
        //     {
        //         value: toNano("100")
        //     },
        //     null
        // )
        // const oldBalance = await nexton.getBalance();
        // let deployerBalance = await deployer.getBalance();
        // console.log(deployerBalance)
        // const user = await blockchain.treasury('user');
        // const zero = await deployer.send(
        //     {
        //         to: randomAddress(),
        //         value: toNano("0.1"),
        //         sendMode: 128
        //     }
        // )
        // deployer.address = zero.address;
        // blockchain.snapshot();
        // console.log(zero.events)
        // deployerBalance = await deployer.getBalance();
        // console.log(deployerBalance)
        // //expect(deployerBalance).toEqual(0n);
    })
});
