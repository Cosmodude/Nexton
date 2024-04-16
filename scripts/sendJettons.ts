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

export const returnTonWebWallet = (provider: HttpProvider, publicKey: Buffer): WalletV4ContractR2 => {
  const tonweb = new TonWeb(provider)
  const WalletClass = tonweb.wallet.all.v4R2
  return new WalletClass(provider, { publicKey })
}

const httpProvider = new TonWeb.HttpProvider(env.RPC_URL, { apiKey })
const client = new TonClient({ endpoint: env.RPC_URL, apiKey })

export async function swap (jetton: string, amount: bigint, receiver: string, mnemonic: string[] ): Promise<void> {
   

    const keys = await mnemonicToKeys(mnemonic)
    const wallet = returnTonWebWallet(httpProvider, keys.publicKey)
    const openedWallet = client.open(wallet)
    const sender = openedWallet.sender(keys.secretKey)
    let swapParams

    const jettonRoot = client.open(JettonRoot.createFromAddress(Address.parse(env.JETTON)))
    const jettonWallet = client.open(await jettonRoot.getWallet(Address.parse(env.WALLET_ADDRESS)))

    await jettonWallet.sendTransfer(sender, toNano('0.3'), {
        amount: amount,
        destination: Address.parse(receiver),
        responseAddress: sender.address, // return gas to user
        forwardAmount: toNano('0.25'),
    })
}