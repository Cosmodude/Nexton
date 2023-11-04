import { toNano } from 'ton-core';
import { WhalesNominator } from '../wrappers/WhalesNominator';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const whalesNominator = provider.open(WhalesNominator.createFromConfig({}, await compile('WhalesNominator')));

    await whalesNominator.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(whalesNominator.address);

    // run methods on `whalesNominator`
}
