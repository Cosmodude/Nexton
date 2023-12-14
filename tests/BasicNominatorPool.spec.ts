import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { BasicNominatorPool } from '../wrappers/BasicNominatorPool';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('BasicNominatorPool', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('BasicNominatorPool');
    });

    let blockchain: Blockchain;
    let basicNominatorPool: SandboxContract<BasicNominatorPool>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        basicNominatorPool = blockchain.openContract(BasicNominatorPool.createFromConfig({
            
        }, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await basicNominatorPool.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: basicNominatorPool.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and basicNominatorPool are ready to use
    });
});
