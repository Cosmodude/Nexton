import { toNano, Address } from '@ton/core';
import { NexTon } from '../wrappers/NexTon';
import { NetworkProvider } from '@ton/blueprint';

const myAddress: Address = Address.parse("kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu");
const nftCollection: Address = Address.parse("EQCB47QNaFJ_Rok3GpoPjf98cKuYY1kQwgqeqdOyYJFrywUK");

export async function run(provider: NetworkProvider) {
    const nexton = provider.open(await NexTon.fromAddress(Address.parse("EQAWBJo6G0gHFVWE0GVzWHZRUCLlnKxQqID_teDeV_SO-kjk")));
    // latest tesnet deployment
    
    const ui = provider.ui();

    const command =  await ui.input('Continue?');

    //const maxLeverage = await nexton.getMaxLeverage;

    await nexton.send(
        provider.sender(),
        {
            value: toNano('0.1'),
        },
        {
            $$type: 'OwnerWithdraw',
            queryId: BigInt(Date.now()),
            amount: toNano('6'),
        }
    );

    console.log("Deposited!");

}
