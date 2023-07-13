import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { toNano } from 'ton-core';
import { IlpJetton } from '../wrappers/IlpJetton';
import '@ton-community/test-utils';

describe('IlpJetton', () => {
    let blockchain: Blockchain;
    let ilpJetton: SandboxContract<IlpJetton>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        ilpJetton = blockchain.openContract(await IlpJetton.fromInit());

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await ilpJetton.send(
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
            to: ilpJetton.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and ilpJetton are ready to use
    });
});
