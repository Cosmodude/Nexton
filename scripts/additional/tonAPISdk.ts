import {
    Configuration,
    AccountsApi
} from 'tonapi-sdk-js';
import { load } from 'ts-dotenv';

const env = load({
    TONAPI_KEY: String
});

const address = "kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu";
const collection = "EQCB47QNaFJ_Rok3GpoPjf98cKuYY1kQwgqeqdOyYJFrywUK";

async function fetchData() {
    // Token should be issued on https://tonconsole.com
    
    const accountsApi = new AccountsApi(new Configuration({
        basePath: "https://testnet.tonapi.io", // override base path
        headers: {
            Authorization: 'Bearer ' + env.TONAPI_KEY,
        },
    }));

    // Get list of nfts by owner address
    const nfts = await accountsApi.getNftItemsByOwner({
        accountId: address,
        collection: collection

    })
    console.log(nfts)
}

fetchData();