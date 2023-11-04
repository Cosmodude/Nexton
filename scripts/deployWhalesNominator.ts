import { toNano, Address, Dictionary, beginCell } from 'ton-core';
import { WhalesNominator } from '../wrappers/WhalesNominator';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const whalesNominator = provider.open(WhalesNominator.createFromConfig({
        owner: provider.sender().address!!,
        controller: provider.sender().address!!,
        proxy: provider.sender().address!!,
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
    }, await compile('WhalesNominator')));

    await whalesNominator.sendDeploy(provider.sender(), toNano('6'));

    await provider.waitForDeploy(whalesNominator.address);

    // run methods on `whalesNominator`
}
