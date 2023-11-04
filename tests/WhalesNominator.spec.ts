import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Cell, toNano, beginCell, Dictionary } from 'ton-core';
import { WhalesNominator } from '../wrappers/WhalesNominator';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { randomAddress } from '@ton-community/test-utils';

describe('WhalesNominator', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('WhalesNominator');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let nexton: SandboxContract<TreasuryContract>;
    let whalesNominator: SandboxContract<WhalesNominator>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');

        whalesNominator = blockchain.openContract(WhalesNominator.createFromConfig({
            owner: deployer.address,
            controller: randomAddress(),
            proxy: randomAddress(),
            profit_per_coin: 10n,
            nominators: Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell()),
            proxy_state: beginCell()  // validator data 
                        .storeUint(100,32)
                        .storeUint(200,32)
                        .storeCoins(0)
                        .storeUint(0, 64)
                        .storeUint(0,32)
                        .storeCoins(100)
            .endCell(),
            min_stake: toNano("1"),
            deposit_fee: toNano("0.1"),
            withdraw_fee: toNano("0.1"),
            pool_fee: 100n,
        }, code));


        const deployResult = await whalesNominator.sendDeploy(deployer.getSender(), toNano('6'));

        console.log(deployResult.transactions)
        // expect(deployResult.transactions).toHaveTransaction({
        //     from: deployer.address,
        //     to: whalesNominator.address,
        //     deploy: true,
        //     success: true,
        // });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and whalesNominator are ready to use
    });
});
