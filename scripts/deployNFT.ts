import { toNano } from 'ton-core';
import { NFT } from '../wrappers/NFT';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const nFT = provider.open(NFT.createFromConfig({}, await compile('NFT')));

    await nFT.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(nFT.address);

    // run methods on `nFT`
}
