import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { toNano } from 'ton-core';
import { Messages } from '../wrappers/Messages';
import '@ton-community/test-utils';

describe('Messages', () => {
    let blockchain: Blockchain;
    let messages: SandboxContract<Messages>;
    let deployer;
    beforeEach(async () => {
        blockchain = await Blockchain.create();

        messages = blockchain.openContract(await Messages.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await messages.send(
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
            to: messages.address,
            deploy: true,
            success: true,
        });

        await messages.send(
            deployer.getSender(),
            {
                value: toNano("500")
            }, 
            "null"
        )
    });

    it('should deploy and receive ton', async () => {
        const balance = await messages.getBalance();
        console.log("balance ", balance);
        // the check is done inside beforeEach
        // blockchain and messages are ready to use
    });
});
