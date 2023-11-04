import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { WhalesNominator } from '../wrappers/WhalesNominator';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('WhalesNominator', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('WhalesNominator');
    });

    let blockchain: Blockchain;
    let whalesNominator: SandboxContract<WhalesNominator>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        whalesNominator = blockchain.openContract(WhalesNominator.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await whalesNominator.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: whalesNominator.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and whalesNominator are ready to use
    });
});
