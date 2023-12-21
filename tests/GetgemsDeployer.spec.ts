import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { GetgemsDeployer } from '../wrappers/GetgemsDeployer';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('GetgemsDeployer', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('GetgemsDeployer');
    });

    let blockchain: Blockchain;
    let getgemsDeployer: SandboxContract<GetgemsDeployer>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        getgemsDeployer = blockchain.openContract(GetgemsDeployer.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await getgemsDeployer.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: getgemsDeployer.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and getgemsDeployer are ready to use
    });
});
