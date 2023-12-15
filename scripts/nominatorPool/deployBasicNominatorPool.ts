import { toNano, Address, Dictionary } from 'ton-core';
import { BasicNominatorPool } from '../../wrappers/BasicNominatorPool';
import { compile, NetworkProvider } from '@ton-community/blueprint';
import { randomAddress } from '@ton-community/test-utils';

export async function run(provider: NetworkProvider) {

    let myAddress: Address = Address.parse("kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu");

    const randomSeed= Math.floor(Math.random() * 10000);

    const nextonAddress = Address.parse("EQBDqObEyc8KYOuHCKm0evBNp0hJ9derp8eSIdhYMjIeMRSZ");

    const basicNominatorPool = provider.open(BasicNominatorPool.createFromConfig(
        {
            state: 0,
            nominators_count: 0,
            stake_amount_sent: 0,
            validator_amount: 0,
            config: {
                validator_address: 100n,
                validator_reward_share: 10,
                max_nominators_count: 2, 
                min_validator_stake: 100n,
                min_nominator_stake: 100n
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
    , await compile('BasicNominatorPool')));

    await basicNominatorPool.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(basicNominatorPool.address);

    // run methods on `basicNominatorPool`
}
