import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Address, toNano } from 'ton-core';
import { Invicore } from '../wrappers/InviCore';
import '@ton-community/test-utils';
import { randomAddress } from '@ton-community/test-utils';
let deployer: SandboxContract<TreasuryContract>

describe('InviCore', () => {
    let blockchain: Blockchain;
    let invicore: SandboxContract<Invicore>;
    let myAddress: Address = new Address(0, Buffer.from("kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu"));
    const nftContract: Address= new Address(0, Buffer.from("EQAMLDBglwTu1QwgCZPXCqTKdi7Uro4wVvydHZqx-tvGf0DT"));
    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        
        invicore = blockchain.openContract(await Invicore.fromInit(nftContract, myAddress));
        
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
        console.log("Owner: ", owner)
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and invicore are ready to use
    });

    it('should change Staking Pool address', async() => {
        console.log("Changing Address!!!")
        const user = await blockchain.treasury('user');
        const addressBefore = await invicore.getNftContract();
        console.log("Address before: ", addressBefore);

        await invicore.send(
            user.getSender(), 
            {
            value: toNano("0.2")
            }, 
            {   
                $$type: 'ChangeAddr',
                address: randomAddress(),
                entity: "nft"
            }
        )

        let addressAfter = await invicore.getNftContract();
        console.log("Address after (user): ", addressAfter);

        await invicore.send(
            deployer.getSender(),
            {
                value: toNano("0.2")
            }, 
            {   
                $$type: 'ChangeAddr',
                address: randomAddress(),
                entity: "nft"
            }
        )
        
        addressAfter = await invicore.getNftContract();
        console.log("Address after (deployer)): ", addressAfter);

    })
});
