import { toNano, Address } from '@ton/core';
import { NexTon } from '../wrappers/NexTon';
import { NetworkProvider } from '@ton/blueprint';

const myAddress: Address = Address.parse("kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu");
const nftCollection: Address = Address.parse("EQCB47QNaFJ_Rok3GpoPjf98cKuYY1kQwgqeqdOyYJFrywUK");

export async function run(provider: NetworkProvider) {
    const nexton = provider.open(await NexTon.fromAddress(Address.parse("EQDKglq77JhCczSQCYfsl3nI7SXaeiHspd5kMXuJn8UOJk2n")));
    // latest tesnet deployment
    
    const ui = provider.ui();

    const command =  await ui.input('Continue?');

    //const maxLeverage = await nexton.getMaxLeverage;

    await nexton.send(
        provider.sender(),
        {
            value: toNano('1.5'),
        },
        {
            $$type: 'UserDeposit',
            queryId: BigInt(Date.now()),
        }
    );

    console.log("Deposited!");

}
