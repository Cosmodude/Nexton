import { toNano } from 'ton-core';
import { GetgemsFIxPriceSale } from '../wrappers/GetgemsFIxPriceSale';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const getgemsFIxPriceSale = provider.open(GetgemsFIxPriceSale.createFromConfig({}, await compile('GetgemsFIxPriceSale')));

    await getgemsFIxPriceSale.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(getgemsFIxPriceSale.address);

    // run methods on `getgemsFIxPriceSale`
}
