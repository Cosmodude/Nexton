import { toNano } from '@ton/core';
import { NftMarketplace } from '../wrappers/NftMarketplace';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const nftMarketplace = provider.open(NftMarketplace.createFromConfig({}, await compile('NftMarketplace')));

    await nftMarketplace.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(nftMarketplace.address);

    // run methods on `nftMarketplace`
}
