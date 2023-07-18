import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Address, toNano } from 'ton-core';
import { Invicore } from '../wrappers/InviCore';
import '@ton-community/test-utils';
let deployer

describe('InviCore', () => {
    let blockchain: Blockchain;
    let invicore: SandboxContract<Invicore>;
    let myAddress: Address = new Address(0, Buffer.from("kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu"));
    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');

        invicore = blockchain.openContract(await Invicore.fromInit(deployer.address,deployer.address,deployer.address));
        
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

        expect(owner).toEqual(deployer.address)
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and invicore are ready to use
    });
});
