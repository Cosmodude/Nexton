import {load} from 'ts-dotenv';
import {mnemonicToWalletKey} from "ton-crypto";
import { TonClient, WalletContractV4, fromNano, internal } from 'ton';
import { getHttpEndpoint } from '@orbs-network/ton-access';

async function main (){
    const env = load ({
        TONKEEPER_WALLET_MNEMONIC: String,
    })
    const key = await mnemonicToWalletKey(env.TONKEEPER_WALLET_MNEMONIC.split(" "));
    const wallet = WalletContractV4.create({publicKey: key.publicKey, workchain:0});

    const endpoint = await getHttpEndpoint({network: "testnet"});
    const client = new TonClient({endpoint});

    if(!await client.isContractDeployed(wallet.address)){
        return console.log("wallet not deployed")
    }
    console.log ("wallet deployed!");

    const balance = await client.getBalance(wallet.address);
    console.log ("balance: ", fromNano(balance));

    const walletContract = client.open(wallet);
    const seqno = await walletContract.getSeqno();

    walletContract.sendTransfer({
        secretKey: key.secretKey,
        seqno: seqno,
        messages:[
            internal({
                to: "EQChHpu8-rFBQyVCXJtT1aTwODTBc1dFUAEatbYy11ZLcBST",
                value: "0.05",
                body: "NFT",
                bounce: false
            })
        ]
    })

    let currentSeqno = seqno
    while(currentSeqno==seqno){
        console.log("waiting for transaction to confirm...");
        await sleep(1500)
        currentSeqno= await walletContract.getSeqno()
    } 
    console.log("Transaction confirmed!"); 
}

main()

function sleep(ms: number){
    return new Promise(resolve => setTimeout(resolve, ms))
}