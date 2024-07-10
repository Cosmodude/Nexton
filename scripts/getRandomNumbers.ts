import { Address, beginCell, SendMode, toNano } from "@ton/ton";
import { NetworkProvider } from '@ton/blueprint';


export async function run(provider: NetworkProvider) {
    const res = await sendSubscribeRandom(provider);


}

async function sendSubscribeRandom(provider: NetworkProvider, consumer?: Address) {
    const sender = provider.sender();
    await sender.send( {
        value: toNano('0.07') + toNano('0.01'),
        body: beginCell().storeUint(0xAB4C4859, 32).storeAddress(sender.address).endCell(),
        sendMode: SendMode.PAY_GAS_SEPARATELY,
        to: Address.parse('EQCwaEBhdPAl8Lj5ctJjB_6dZv2qOoeuIrjVPgDFvVTvDRL-'),  // coordinator contract
    });
}


