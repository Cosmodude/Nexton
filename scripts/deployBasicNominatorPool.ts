import { toNano } from 'ton-core';
import { BasicNominatorPool } from '../wrappers/BasicNominatorPool';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const basicNominatorPool = provider.open(BasicNominatorPool.createFromConfig({}, await compile('BasicNominatorPool')));

    await basicNominatorPool.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(basicNominatorPool.address);

    // run methods on `basicNominatorPool`
}
