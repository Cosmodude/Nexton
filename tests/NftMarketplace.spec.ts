import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { NftMarketplace } from '../wrappers/NftMarketplace';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('NftMarketplace', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('NftMarketplace');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let nftMarketplace: SandboxContract<NftMarketplace>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        nftMarketplace = blockchain.openContract(NftMarketplace.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await nftMarketplace.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftMarketplace.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and nftMarketplace are ready to use
    });
});
