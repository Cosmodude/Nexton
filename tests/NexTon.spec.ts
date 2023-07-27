import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Address, toNano, fromNano, Cell, beginCell } from 'ton-core';
import { NexTon } from '../wrappers/NexTon';
import { NftCollection } from '../wrappers/NftCollection';
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
    let deployer: SandboxContract<TreasuryContract>;

    let myAddress: Address = Address.parse("kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu");
    
    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');

        nftCollection = blockchain.openContract(await NftCollection.createFromConfig({
            ownerAddress: deployer.address,
            nextItemIndex: 0,
            collectionContent: beginCell().storeUint(58594,256).endCell(),
            nftItemCode: await compile("NftItem"),
            royaltyParams: {
                royaltyFactor: 15,
                royaltyBase: 100,
                royaltyAddress: deployer.address
            }
        }, code))

        const nftCollectionDeployResult = await nftCollection.sendDeploy(deployer.getSender(), toNano('0.1'));

        expect(nftCollectionDeployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftCollection.address,
            deploy: true,
            success: true,
        });
        
        nexton = blockchain.openContract(await NexTon.fromInit(myAddress, nftCollection.address));

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

        
        const owner = await nexton.getOwner();
        expect(owner.equals( deployer.address)).toBe(true);
        
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

    it('Should Deposit and Mint NFT', async() => {
        console.log("Changing collection owner!!!");

        nftCollection.sendChangeOwner(deployer.getSender(),{
            value: toNano("0.02"),
            newOwnerAddress: nexton.address,
            queryId: Date.now()
        });

       //expect(nftCollection.getData)

        console.log("Collection Owner changed!!!");

        console.log("Depositing!!!");
        
        const user = await blockchain.treasury('user');

        const balanceBefore = await nexton.getBalance();
        console.log("Balance before deposit: ", fromNano(balanceBefore));

        const mintMessageReceiver = await nexton.getNftContract();
        console.log("NFTCollection: ", nftCollection.address);
        console.log("Mint messsage is sent to ", mintMessageReceiver);
        expect(mintMessageReceiver.equals(nftCollection.address)).toBe(true);

        const mintMessage = await nexton.send(
            user.getSender(), 
            {
            value: toNano("2")
            }, 
            {   
                $$type: 'UserDeposit',
                lockPeriod: 600n,
                leverage: 3n
            }
        )
        console.log(await mintMessage.events);


        console.log("Balance after: ", fromNano(await nexton.getBalance()));

        console.log("NFTCounter: ", await nexton.getNftCounter())

        expect(mintMessage.transactions).toHaveTransaction({
            from: nftCollection.address,
            inMessageBounced: false
        });

        expect(await nexton.getNftCounter()).toEqual(1n);
        await mintMessage.events
    
    });

    it("Should Deposit and keep track")
});
