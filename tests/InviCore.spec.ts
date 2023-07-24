import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Address, toNano, fromNano, Cell, beginCell } from 'ton-core';
import { Invicore } from '../wrappers/InviCore';
import { NftCollection } from '../wrappers/NftCollection';
import '@ton-community/test-utils';
import { randomAddress } from '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('InviCore', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('NftCollection');
    });

    let blockchain: Blockchain;
    let invicore: SandboxContract<Invicore>;
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
        }, code));
        invicore = blockchain.openContract(await Invicore.fromInit(myAddress, randomAddress(0)));

        const deployResult = await invicore.send(
            deployer.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: invicore.address,
            deploy: true,
            success: true,
        });

        const owner = await invicore.getOwner();
        expect(owner.equals( deployer.address)).toBe(true);
        
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and invicore are ready to use
    });

    it('Should change Staking Pool address', async() => {
        console.log("Changing Address!!!")
        const user = await blockchain.treasury('user');
        const addressBefore = await invicore.getStakingPool();
        console.log("Address before: ", addressBefore);

        const userMessage = await invicore.send(
            user.getSender(), 
            {
            value: toNano("0.2")
            }, 
            {   
                $$type: 'ChangeAddr',
                address: await randomAddress(),
                entity: "SP"
            }
        )
        //console.log("user message", userMessage.events); // should be bounced

        const addressAfterUser = await invicore.getStakingPool();
        console.log("Address after (user): ", addressAfterUser);

        const deployerMessage = await invicore.send(
            deployer.getSender(),
            {
                value: toNano("0.2")
            }, 
            {   
                $$type: 'ChangeAddr',
                address: await randomAddress(0),
                entity: "SP"
            }
        )
        //console.log("Deployer message", deployerMessage.events);
        
        const addressAfterDeployer = await invicore.getStakingPool();
        console.log("Address after (deployer): ", addressAfterDeployer);
        expect(addressAfterDeployer.toString()).not.toEqual(addressBefore.toString());
        expect(addressAfterUser.toString()).toEqual(addressBefore.toString());
    });

    it('Deposit and Mint NFT', async() => {
        console.log("Depositing!!!");
        const user = await blockchain.treasury('user');
        const balanceBefore = await invicore.getBalance();

        console.log("Balance before deposit: ", fromNano(balanceBefore));
        const userMessage = await invicore.send(
            user.getSender(), 
            {
            value: toNano("10000")
            }, 
            {   
                $$type: 'UserDeposit',
                lockPeriod: 600n,
                leverage: 5n
            }
        )

        console.log(userMessage.events);

        console.log("Balance after: ", fromNano(await invicore.getBalance()) )


    });
});
