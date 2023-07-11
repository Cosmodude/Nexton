import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { toNano } from 'ton-core';
import { Invicore } from '../wrappers/Invicore';
import '@ton-community/test-utils';

describe('InviCore', () => {
    let blockchain: Blockchain;
    let invicore: SandboxContract<Invicore>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        invicore = blockchain.openContract(await Invicore.fromInit());

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await invicore.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
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
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and invicore are ready to use
    });
});
