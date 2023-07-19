import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { toNano } from 'ton-core';
import { BulkAdder } from '../wrappers/BulkAdder';
import { TACT } from '../wrappers/TACT';
import '@ton-community/test-utils';

describe('BulkAdder and Counter', () => {
    let blockchain: Blockchain;
    let bulkAdder: SandboxContract<BulkAdder>;
    let counter: SandboxContract<TACT>;
    let deployer: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        bulkAdder = blockchain.openContract(await BulkAdder.fromInit());
        counter = blockchain.openContract(await TACT.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResultBulkAdder = await bulkAdder.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        const deployResultCounter = await counter.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResultCounter.transactions).toHaveTransaction({
            from: deployer.address,
            to: counter.address,
            deploy: true,
            success: true,
        });

        expect(deployResultBulkAdder.transactions).toHaveTransaction({
            from: deployer.address,
            to: bulkAdder.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and bulkAdder are ready to use
    });

    it("should increase to target", async () => {
        const target = 5n;
        const res = await bulkAdder.send(deployer.getSender(), {
        value: toNano("0.2")
        },{
            $$type: 'Reach',
            counterContract: counter.address,
            target
        }
        )

        const count = await counter.getCounter();
        expect(count).toEqual(target);
    });

    it("should add", async () => {
        const amount = 10n;
        const res = await bulkAdder.send(deployer.getSender(), {
            value: toNano("0.2")
            },{
                $$type: 'CallAdd',
                counterContract: counter.address,
                amount
            }
            )
            
            const count = await counter.getCounter();
            console.log(res.events);
            expect(count).toEqual(amount)
    });
        
});
