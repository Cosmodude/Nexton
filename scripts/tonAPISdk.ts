import {
    JettonsApi,
    DNSApi,
    NFTApi,
    BlockchainApi,
    Subscription,
    TracesApi,
    WalletApi,
    Configuration,
    AccountsApi
} from 'tonapi-sdk-js';
import { load } from 'ts-dotenv';

const env = load({
    TONAPI_KEY: String
});

const address = "kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu";

async function fetchData() {
    // Get list of transactions
    // Token should be issued on https://tonconsole.com
    const blockchainApi = new BlockchainApi(new Configuration({
        basePath: "https://testnet.tonapi.io", // override base path
        headers: {
            Authorization: 'Bearer ' + env.TONAPI_KEY,
        },
    }));

    // Receive typed array of transactions
    const { transactions } = await blockchainApi.getAccountTransactions({
        accountId: address,
        limit: 10,
    })


    const accountsApi = new AccountsApi(new Configuration({
        basePath: "https://testnet.tonapi.io", // override base path
        headers: {
            Authorization: 'Bearer ' + env.TONAPI_KEY,
        },
    }));
    
    const nfts = await accountsApi.getNftItemsByOwner({
        accountId: address,

    })
    console.log(nfts)




    // Get list of nfts by owner address
    const nftApi = new NFTApi(new Configuration({
        basePath: "https://testnet.tonapi.io", // override base path
        headers: {
            Authorization: 'Bearer ' + env.TONAPI_KEY,
        },
    }));
}

fetchData();