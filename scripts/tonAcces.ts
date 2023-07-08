import {load} from 'ts-dotenv';


async function main (){
    const env = load ({
        TONKEEPER_WALLET_MNEMONIC: String,
    })
}