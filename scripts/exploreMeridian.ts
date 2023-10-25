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
import axios from 'axios';
import { load } from 'ts-dotenv';

const env = load({
    TONAPI_KEY: String
});
const TONAPI_URL = "https://tonapi.io/";
const address = "kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu";
const collection = "EQCB47QNaFJ_Rok3GpoPjf98cKuYY1kQwgqeqdOyYJFrywUK";

async function fetchData() {
    // Token should be issued on https://tonconsole.com
    
    const accountsApi = new AccountsApi(new Configuration({
        basePath: "https://tonapi.io", // override base path
        headers: {
            Authorization: 'Bearer ' + env.TONAPI_KEY,
        },
    }));

}

async function fetchDataWithHeaders() {
    try {
      const response = await axios.get(
        TONAPI_URL + "/" ,
        {
            headers: {
                Authorization: 'Bearer ' + env.TONAPI_KEY,
            }
        }
      )
      const data = response.data;
      console.log(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
}


  
  