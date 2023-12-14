import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Cell, toNano, Dictionary } from 'ton-core';
import { BasicNominatorPool } from '../wrappers/BasicNominatorPool';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { randomAddress } from '@ton-community/test-utils';

describe('BasicNominatorPool', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('BasicNominatorPool');
    });

    let blockchain: Blockchain;
    let basicNominatorPool: SandboxContract<BasicNominatorPool>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        basicNominatorPool = blockchain.openContract(BasicNominatorPool.createFromConfig(
            {
                state: 0,
                nominators_count: 0,
                stake_amount_sent: 0,
                validator_amount: 0,
                config: {
                    validator_address: 100n,
                    validator_reward_share: 10,
                    max_nominators_count: 2, 
                    min_validator_stake: 100,
                    min_nominator_stake: 100
                },
                nominators: Dictionary.empty(Dictionary.Keys.BigUint(256),Dictionary.Values.Cell() ),
                withdraw_requests: Dictionary.empty(Dictionary.Keys.BigUint(256),Dictionary.Values.Cell()),
                stake_at: 0,
                saved_validator_set_hash: 25n,
                validator_set_changes_count: 0n,
                validator_set_change_time: 0n,
                stake_held_for: 10n,
                config_proposal_votings: Dictionary.empty(Dictionary.Keys.BigUint(256),Dictionary.Values.Cell())
            }

        , code));

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
