import { toNano, Address } from 'ton-core';
import { NexTon } from '../wrappers/NexTon';
import { NetworkProvider } from '@ton-community/blueprint';
import { randomAddress } from '@ton-community/test-utils';

const myAddress: Address = Address.parse("kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu");
const nftCollection: Address = Address.parse("EQBqzCDq5rq3HyZAEaH4dnPy4jCHoag6CceEwVAFTrD6Pil2");

export async function run(provider: NetworkProvider) {
    const nexton = provider.open(await NexTon.fromAddress(Address.parse("EQCY_ODi6mZJC1m7RNr6QoweWvumtebT-G21Yn_V2U7x5i2c")));
        //fromInit(myAddress, nftCollection));
    const ui = provider.ui();

    // chack if is stopped:
    const stopped = await nexton.getStopped();
    console.log("Stopped: ", stopped);
    console.log();

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
