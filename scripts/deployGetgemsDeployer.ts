import { toNano } from 'ton-core';
import { GetgemsDeployer } from '../wrappers/GetgemsDeployer';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const getgemsDeployer = provider.open(GetgemsDeployer.createFromConfig({}, await compile('GetgemsDeployer')));

    await getgemsDeployer.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(getgemsDeployer.address);

    // run methods on `getgemsDeployer`
}
