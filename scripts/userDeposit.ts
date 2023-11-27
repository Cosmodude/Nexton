import { toNano, Address } from 'ton-core';
import { NexTon } from '../wrappers/NexTon';
import { NetworkProvider } from '@ton-community/blueprint';
import { randomAddress } from '@ton-community/test-utils';

const myAddress: Address = Address.parse("kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu");
const nftCollection: Address = Address.parse("EQCB47QNaFJ_Rok3GpoPjf98cKuYY1kQwgqeqdOyYJFrywUK");

export async function run(provider: NetworkProvider) {
    const nexton = provider.open(await NexTon.fromAddress(Address.parse("EQD1oCJtIrU4cVHE1MIiTWCYwdPsNG888aTdN0uEjfBFHUsW")));
        //fromInit(myAddress, nftCollection));
    const ui = provider.ui();

    const command =  await ui.input('Continue?');

    //const maxLeverage = await nexton.getMaxLeverage;

    await nexton.send(
        provider.sender(),
        {
            value: toNano('2'),
        },
        {
            $$type: 'UserDeposit',
            queryId: BigInt(Date.now()),
            lockPeriod: 600n,
            leverage: 3n
        }
    );

    console.log("Deposited!");

}
