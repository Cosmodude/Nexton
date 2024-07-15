import { Address, beginCell, SendMode, toNano } from "@ton/ton";
import { NetworkProvider } from '@ton/blueprint';

// https://tonviewer.com/EQCsqvWl5zT1dG6JTU7Vpp3mGRZTy_WQ5hkTVLIyjA6-ph6-
const fightJettonAddr = Address.parse("EQCsqvWl5zT1dG6JTU7Vpp3mGRZTy_WQ5hkTVLIyjA6-ph6-")
const operation = 0x6cd3e4b0;

export async function run(provider: NetworkProvider) {
    const res = await sendBuyGas(provider, fightJettonAddr, toNano('1'));
}

async function sendBuyGas(provider: NetworkProvider, jetton: Address, value: bigint) {
    const sender = provider.sender();
    await sender.send( {
        to: fightJettonAddr,
        value: value,
        body: beginCell().storeUint(operation, 32).endCell(),
        sendMode: SendMode.PAY_GAS_SEPARATELY,
    });
}


