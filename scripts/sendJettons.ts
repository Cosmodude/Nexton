import TonWeb from 'tonweb'
import { type HttpProvider } from 'tonweb/dist/types/providers/http-provider'
import { mnemonicToPrivateKey } from '@ton/crypto'
import { WalletContractV4, TonClient, Address, toNano, beginCell } from '@ton/ton'
import { type WalletV4ContractR2 } from 'tonweb/dist/types/contract/wallet/v4/wallet-v4-contract-r2'
import { load } from 'ts-dotenv';
import { JettonRoot } from '@dedust/sdk'

const env = load({
    TONAPI_KEY: String,
    RPC_URL: String,
    MNEMONIC: String,
    RPC_API_KEY: String,
    JETTON: String,
    WALLET_ADDRESS: String
});

const apiKey = env.RPC_API_KEY
const workchain = 0

export const mnemonicToKeys = mnemonicToPrivateKey

export const returnTonWallet = (publicKey: Buffer): WalletContractV4 => {
  return WalletContractV4.create({ workchain, publicKey })
}

const client = new TonClient({ endpoint: env.RPC_URL, apiKey })

export async function sendJetton (amount: bigint, receiver: string, mnemonic?: string[], provider?: NetworkProvider): Promise<void> {
    let sender
    if (!mnemonic) {
        mnemonic = env.MNEMONIC.split(' ')
        const keys = await mnemonicToKeys(mnemonic)
        const wallet = returnTonWallet(keys.publicKey);
        const openedWallet = client.open(wallet)
        sender = openedWallet.sender(keys.secretKey)
    } else {
        sender = provider!.sender()
    }
    const jettonRoot = client.open(JettonRoot.createFromAddress(Address.parse(env.JETTON)))
    const jettonWallet = client.open(await jettonRoot.getWallet(Address.parse(env.WALLET_ADDRESS)))

    await jettonWallet.sendTransfer(sender, toNano('0.3'), {
        amount: amount,
        destination: Address.parse(receiver),
        responseAddress: sender.address, // return gas to user
        forwardAmount: toNano('0.25'),
    })
}


// for testing purposes
import { NetworkProvider } from '@ton/blueprint';

const myAddress: Address = Address.parse("kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu");
const nftCollection: Address = Address.parse("EQCB47QNaFJ_Rok3GpoPjf98cKuYY1kQwgqeqdOyYJFrywUK");

export async function run() {
    let sender
    // const transfer = await sendJetton(toNano("1"), myAddress.toString(), undefined , provider);
    const mnemonic = env.MNEMONIC.split(' ')
    const keys = await mnemonicToKeys(mnemonic)
    const wallet = returnTonWallet(keys.publicKey);
    console.log(wallet.address.toString());
    // console.log("Deposited!");
    // console.log(transfer);
    const openedWallet = client.open(wallet)
    sender = openedWallet.sender(keys.secretKey)
    // const hash = await sender.send({
    //     value: toNano("1"),
    //     to: Address.parse("UQABinqGRk8nJQcyRJqRI_ae4Wr9QW4SPoDQaTEy7TSmn0Yd"),
    // })

}   
