import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { JNexton } from '../wrappers/JNexton';
import '@ton/test-utils';

describe('JNexton', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let jNexton: SandboxContract<JNexton>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        jNexton = blockchain.openContract(await JNexton.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await jNexton.send(
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
            to: jNexton.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and jNexton are ready to use
    });
});
