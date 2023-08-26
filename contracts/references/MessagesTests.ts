import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { fromNano, toNano } from 'ton-core';
import { Messages } from './Messages';
import '@ton-community/test-utils';

describe('Messages', () => {
    let blockchain: Blockchain;
    let messages: SandboxContract<Messages>;
    let deployer: SandboxContract<TreasuryContract>;
    beforeEach(async () => {
        blockchain = await Blockchain.create();

        messages = blockchain.openContract(await Messages.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await messages.send(
            deployer.getSender(),
            {
                value: toNano('0.5'),
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
            null
        )
    });

    it('should deploy and receive ton', async () => {
        const balance = await messages.getBalance();
        console.log("balance ", balance);
        // the check is done inside beforeEach
        // blockchain and messages are ready to use
    });

    it('should withdraw all', async() => {
        const user = await blockchain.treasury('user');
        const balanceBeforeUser = await user.getBalance()
        //console.log("Balance before: ", fromNano(balanceBeforeUser))
        await messages.send(user.getSender(), {
            value: toNano("0.2")
        }, 'withdraw all')

        const balanceAfterUser = await user.getBalance()
        //console.log("balance after: ", fromNano(balanceAfterUser))

        const balanceBeforeDeployer = await deployer.getBalance()
        //console.log("balance before for deployer: ", fromNano(balanceBeforeDeployer))
        await messages.send(deployer.getSender(), {
            value: toNano("0.2")
        }, 'withdraw all')

        const balanceAfterDeployer = await deployer.getBalance()
        //console.log("balance after for deployer: ", fromNano(balanceAfterDeployer))
    })

    it('should withdraw safe', async() => {
        console.log("Withdraw SAFE!!!")
        const user = await blockchain.treasury('user');
        const balanceBeforeUser = await user.getBalance()
        console.log("Balance before: ", fromNano(balanceBeforeUser))
        await messages.send(user.getSender(), {
            value: toNano("0.2")
        }, 'withdraw safe')

        const balanceAfterUser = await user.getBalance()
        console.log("balance after: ", fromNano(balanceAfterUser))

        const balanceBeforeDeployer = await deployer.getBalance()
        console.log("balance before for deployer: ", fromNano(balanceBeforeDeployer))
        const a = await messages.send(deployer.getSender(), {
            value: toNano("0.2")
        }, 'withdraw safe')

        console.log(a.events);
        const balanceAfterDeployer = await deployer.getBalance()
        console.log("balance after for deployer: ", fromNano(balanceAfterDeployer))

        const contractBalance = await messages.getBalance() 
        expect(contractBalance).toBeGreaterThan(0 )
        console.log("contract balance: ", fromNano(contractBalance))
    })
});
