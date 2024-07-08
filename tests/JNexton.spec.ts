import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, Address, Cell, Dictionary, beginCell, TupleItemInt, fromNano } from '@ton/core';
import '@ton/test-utils';
import { NftCollection } from '../wrappers/NftCollection';
import { NftItem } from '../wrappers/NftItem';
import { JNexTon } from '../wrappers/JNexton';
import { JettonWallet } from '../wrappers/jettonWallet';
import { JettonMinter } from '../wrappers/jettonMinter';
import { buildCollectionContentCell, toSha256 } from '../scripts/contentUtils/onChain';
import { randomAddress } from '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { getTupleItemInt } from '../scripts/utils/tuples';


describe('JNexton', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('NftCollection');
    }, 10000);

    let blockchain: Blockchain;
    let jNexton: SandboxContract<JNexTon>;
    let nftCollection: SandboxContract<NftCollection>;
    let nftItem: SandboxContract<NftItem>;
    let jettonMinter: SandboxContract<JettonMinter>;
    let deployer: SandboxContract<TreasuryContract>;
    let user: SandboxContract<TreasuryContract>;

    let myAddress: Address = Address.parse("kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu");
    

    const nextonSetup = {
        ownerAddress: myAddress,
        lockPeriod: 5184000,
        userDeposit: toNano("50"),
        protocolFee: toNano("0.1"),
        minDeposit: toNano("1"),
        fundingAmount: toNano("50"),
    }

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        user = await blockchain.treasury('user');

        // create nft collection
        nftCollection = blockchain.openContract(await NftCollection.createFromConfig({
            ownerAddress: deployer.address,
            nextItemIndex: 0,
            collectionContent: buildCollectionContentCell({
                name: "JCollection name",
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

        // Jetton setup
        jettonMinter = blockchain.openContract(await JettonMinter.createFromConfig({
            admin: deployer.address,
            content: buildCollectionContentCell({
                name: "Jetton name",
                description: "Jetton description",
                image: "https://hipo.finance/hton.png"
            }),
            wallet_code: await compile("JettonWallet"),
        }, await compile("JettonMinter")));

        const jettonMinterDeployResult = await jettonMinter.sendDeploy(deployer.getSender(), toNano('0.1'));    

        expect(jettonMinterDeployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMinter.address,
            deploy: true,
            success: true,
        });

        const mintTx = await jettonMinter.sendMint(
            deployer.getSender(),
            user.address,
            0n,
            nextonSetup.userDeposit * 2n,
            toNano('0.1'),
            toNano('0.3'),
        );

        const userWalletAddr = await jettonMinter.getWalletAddress(user.address);

        expect(mintTx.transactions).toHaveTransaction({
            from: jettonMinter.address,
            to: userWalletAddr,    
        });

        const userWallet = blockchain.openContract(await JettonWallet.createFromAddress(userWalletAddr));
        //console.log(await userWallet.getJettonBalance())
        expect(await userWallet.getJettonBalance()).toEqual(nextonSetup.userDeposit * 2n);

        // jNexton Deploy
        jNexton = blockchain.openContract(await JNexTon.fromInit(await compile("NftItem"), nftCollection.address, await compile("JettonWallet"), jettonMinter.address));

        const deployResult = await jNexton.send(
            deployer.getSender(),
            {
                value: toNano('0.5'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jNexton.address,
            deploy: true,
            success: true,
        });

        // console.log("Deployed JNexton ", deployResult.events)
        // console.log("JettonMinter ", jettonMinter.address)
        // console.log("deployer ", deployer.address)

        // console.log(deployResult.events);
        expect(deployResult.transactions).toHaveTransaction({
            from: jNexton.address,
            to: jettonMinter.address,
        });

        const jNextonOwner = await jNexton.getOwner();

        await jNexton.send(
            deployer.getSender(),
            {
                value: toNano("5")
            },
            null
        )

        expect(jNextonOwner).toEqualAddress(deployer.address);

        const fundTx = await jettonMinter.sendMint(
            deployer.getSender(),
            jNexton.address,
            1n,
            nextonSetup.fundingAmount,
            toNano('0.1'),
            toNano('0.3'),
        );

        const jNextonWalletAddr = await jettonMinter.getWalletAddress(jNexton.address);

        expect(fundTx.transactions).toHaveTransaction({
            from: jettonMinter.address,
            to: jNextonWalletAddr,    
        });

        await nftCollection.sendChangeOwner(deployer.getSender(),{
            value: toNano("0.02"),
            newOwnerAddress: jNexton.address,
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
        expect(collectionData.ownerAddress).toEqualAddress(jNexton.address);
        expect(collectionName).toMatch("JCollection name");
        expect(collectionData.nextItemId).toEqual(0n);

        // checking jNexton data
        expect(await jNexton.getJettonAddress()).toEqualAddress(jettonMinter.address);
        expect(await jNexton.getCollectionAddress()).toEqualAddress(nftCollection.address);
        expect(await jNexton.getMyJettonWallet()).toEqualAddress(await jettonMinter.getWalletAddress(jNexton.address));
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and jNexton are ready to use
    });

    it('Should Deposit and Mint NFT with set metadata', async() => {

        //console.log("User Depositing!!!");
        
        //const user = await blockchain.treasury('user');

        const userWalletAddr = await jettonMinter.getWalletAddress(user.address);

        const userWallet = blockchain.openContract(await JettonWallet.createFromAddress(userWalletAddr));

        const depositMessage = await userWallet.sendTransfer(
            user.getSender(),
            toNano("0.15"),
            nextonSetup.userDeposit,
            jNexton.address,
            user.address,
            beginCell().storeStringTail("Deposited to JNexton").endCell(),
            toNano("0.1"),
            beginCell().endCell(),
        );
        

        const itemAddress =  await nftCollection.getItemAddressByIndex(getTupleItemInt(0n));

        expect(depositMessage.transactions).toHaveTransaction({
            from: nftCollection.address,
            to: itemAddress,
            inMessageBounced: false
        });

        expect(depositMessage.events.at(-1)?.type).toMatch("account_created");
        expect(await jNexton.getNftCounter()).toEqual(1n);
        expect(await jNexton.getStaked()).toEqual(nextonSetup.userDeposit - nextonSetup.protocolFee);

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

    it('Should return jettons to user in case of too low stake', async() => {

        //console.log("User Depositing!!!");
        
        //const user = await blockchain.treasury('user');

        const userWalletAddr = await jettonMinter.getWalletAddress(user.address);

        const userWallet = blockchain.openContract(await JettonWallet.createFromAddress(userWalletAddr));

        const depositMessage = await userWallet.sendTransfer(
            user.getSender(),
            toNano("0.15"),
            nextonSetup.minDeposit - toNano("0.1"),
            jNexton.address,
            user.address,
            beginCell().storeStringTail("Deposited to JNexton").endCell(),
            toNano("0.1"),
            beginCell().endCell(),
        );
        
        const jNextonWalletAddr = await jettonMinter.getWalletAddress(jNexton.address);

        const jNextonWallet = blockchain.openContract(await JettonWallet.createFromAddress(jNextonWalletAddr));

        expect(depositMessage.transactions).toHaveTransaction({
            from: jNexton.address,
            to: jNextonWallet.address,
            inMessageBounced: false
        });

        expect(depositMessage.transactions).toHaveTransaction({
            from: jNextonWallet.address,
            to: userWallet.address,
            inMessageBounced: false
        });

        expect(depositMessage.transactions).toHaveTransaction({
            from: userWallet.address,
            to: user.address,
            value: 1n
        });
        
        expect(await jNextonWallet.getJettonBalance()).toEqual(nextonSetup.fundingAmount);
        const userBalance = await userWallet.getJettonBalance();
        //console.log("User balance ", userBalance);
        //console.log("User deposit ", nextonSetup.userDeposit);
        expect(userBalance).toEqual(nextonSetup.userDeposit * 2n);
    });

    it("Should let User Claim reward", async () =>{
        
        // console.log("User Depositing!!!");
        
        const userWallet = blockchain.openContract(await JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(user.address)));
        const depositMessage = await userWallet.sendTransfer(
            user.getSender(),
            toNano("0.15"),
            nextonSetup.userDeposit,
            jNexton.address,
            user.address,
            beginCell().storeStringTail("Deposited to JNexton").endCell(),
            toNano("0.1"),
            beginCell().endCell(),
        );

        const itemAddress =  await nftCollection.getItemAddressByIndex(getTupleItemInt(0n));

        expect(depositMessage.transactions).toHaveTransaction({
            from: nftCollection.address,
            to: itemAddress,
            inMessageBounced: false
        });
        expect(await jNexton.getNftCounter()).toEqual(1n);

        nftItem = blockchain.openContract(NftItem.createFromAddress(itemAddress));
        expect(nftItem.address).toEqualAddress(itemAddress);
        const itemData = await nftItem.getItemData();
        expect(itemData.index).toEqual(0n);

        blockchain.now = depositMessage.transactions[3].now;

        blockchain.now += nextonSetup.lockPeriod;

        const claimMessage = await nftItem.sendTransfer(
            user.getSender(),
            {
                queryId: Date.now(),
                value: toNano("0.23"),
                newOwner: jNexton.address,
                responseAddress: randomAddress(), // doesn't matter
                fwdAmount: toNano("0.2")
            }
        )
    
        expect(claimMessage.transactions).toHaveTransaction({
            from: itemAddress,
            to: jNexton.address,
            inMessageBounced: false,
        });

        const jNextonWalletAddr = await jNexton.getMyJettonWallet();

        expect(claimMessage.transactions).toHaveTransaction({
            from: jNexton.address,
            to: jNextonWalletAddr,
            inMessageBounced: false,
        });

        expect(claimMessage.transactions).toHaveTransaction({
            from: jNextonWalletAddr,
            to: userWallet.address,
        });

        // //console.log(claimMessage.transactions);

        const itemD = await nftItem.getItemData();
        const itemOwner = await itemD.itemOwner;
        expect(itemOwner).toEqualAddress(jNexton.address);

        // check contract data
        const usersPrinciple = await jNexton.getStaked();
        expect(usersPrinciple).toEqual(0n);

        // check user balance
        const userBalance = await userWallet.getJettonBalance();
        //console.log(userBalance)
        const expectedReward = (nextonSetup.userDeposit - nextonSetup.protocolFee) * 1000n * BigInt(nextonSetup.lockPeriod) / (10000n * 31536000n);
        const expectedBalance = nextonSetup.userDeposit * 2n - nextonSetup.protocolFee + expectedReward;
        //console.log(nextonSetup.userDeposit - nextonSetup.protocolFee + (nextonSetup.userDeposit - nextonSetup.protocolFee) * 1000n * BigInt(nextonSetup.lockPeriod) / (10000n * 31536000n))
        expect(userBalance).toEqual(expectedBalance);

        // check nexton wallet balance
        const jNextonWallet = blockchain.openContract(await JettonWallet.createFromAddress(jNextonWalletAddr));
        const jNextonBalance = await jNextonWallet.getJettonBalance();
        expect(jNextonBalance).toEqual(nextonSetup.fundingAmount + nextonSetup.protocolFee - expectedReward);
    });

    it("Should allow owner withdraw only to owner", async () =>{

        const user = await blockchain.treasury('user');
        const jNextonWalletAddr = await jNexton.getMyJettonWallet();
        const deployerWalletAddr = await jettonMinter.getWalletAddress(deployer.address);

        await jNexton.send(
            deployer.getSender(),
            {
                value: toNano("101")
            },
            null
        )

        const userWithdraw = await jNexton.send(
            user.getSender(),
            {
                value: toNano("0.3")
            },
            {
                $$type: 'OwnerWithdraw',
                queryId: BigInt(Date.now()),
                amount: nextonSetup.userDeposit
            }
        )

        expect(userWithdraw.transactions).toHaveTransaction({   
            from: jNexton.address,
            to: user.address,
            inMessageBounced: true
        });

        const ownerWithdraw = await jNexton.send(
            deployer.getSender(),
            {
                value: toNano("0.3")
            },
            {
                $$type: 'OwnerWithdraw',
                queryId: BigInt(Date.now()),
                amount: nextonSetup.userDeposit
            }
        )
        
        expect(ownerWithdraw.transactions).toHaveTransaction({   
            from: jNexton.address,
            to: jNextonWalletAddr,
            inMessageBounced: false,
        });
        
        expect(ownerWithdraw.transactions).toHaveTransaction({   
            from: jNextonWalletAddr,
            to: deployerWalletAddr,
            inMessageBounced: false,
        });

        expect(ownerWithdraw.transactions).toHaveTransaction({   
            from: deployerWalletAddr,
            to: deployer.address,
            inMessageBounced: false,
        });

    })

    it("Should let owner set apr and only owner", async () =>{
        const oldApr = await jNexton.getApr();
        expect(oldApr).toEqual(1000n);
        const newApr = 2000n;
        const ownerSetApr = await jNexton.send(
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
            to: jNexton.address,
            inMessageBounced: false,
            value: toNano("0.1")
        });
        const updatedApr = await jNexton.getApr();
        expect(updatedApr).toEqual(newApr);

        const user = await blockchain.treasury('user');

        const userSetApr = await jNexton.send(
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
            from: jNexton.address,
            to: user.address,
            inMessageBounced: true
        });
    })

    it("Should return nftItem address by index", async () =>{
        const res = await jNexton.getNftAddressByIndex(0n);
        expect((await nftItem.getItemData()).index).toEqual(0n);
        // console.log("NftItem Address: ", nftItem.address);
        // console.log("Returned Address: ", res);
        expect(nftItem.address).toEqualAddress(res);
    })


    it("Should return nftItem address by index", async () =>{
        const res = await jNexton.getNftAddressByIndex(0n);
        const itemData = await nftItem.getItemData()
        expect(itemData.index).toEqual(0n);
        expect(nftItem.address).toEqualAddress(res);
    })

    it("Should return jetton wallet by address", async () =>{
        const res = await jNexton.getWalletAddressByOwner(user.address);
        const walletAddr = await jettonMinter.getWalletAddress(user.address);
        expect(res).toEqualAddress(walletAddr);
    })
});
