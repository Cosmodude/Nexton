import { toNano, Address } from 'ton-core';
import { NexTon } from '../wrappers/NexTon';
import { NetworkProvider } from '@ton-community/blueprint';
import { randomAddress } from '@ton-community/test-utils';

const myAddress: Address = Address.parse("kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu");
const nftCollection: Address = Address.parse("EQDpNEt9Z3MVJJfxElU0m1AmrbtHJqrO4hZFSGle5pSyAgG3");

export async function run(provider: NetworkProvider) {
    const nexton = provider.open(await NexTon.fromAddress(Address.parse("EQAgm4FTha6Aj0GYRmfcmRVBvaVd-smYYkd3Jjy86-50ndq7")));
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
            lockPeriod: 600n,
            leverage: 3n
        }
    );

    console.log("Deposited!");

}
