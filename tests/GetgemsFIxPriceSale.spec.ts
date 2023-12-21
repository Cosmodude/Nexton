import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { GetgemsFIxPriceSale } from '../wrappers/GetgemsFIxPriceSale';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('GetgemsFIxPriceSale', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('GetgemsFIxPriceSale');
    });

    let blockchain: Blockchain;
    let getgemsFIxPriceSale: SandboxContract<GetgemsFIxPriceSale>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        getgemsFIxPriceSale = blockchain.openContract(GetgemsFIxPriceSale.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await getgemsFIxPriceSale.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: getgemsFIxPriceSale.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and getgemsFIxPriceSale are ready to use
    });
});
