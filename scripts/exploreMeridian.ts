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
import { Address } from 'ton-core';

const env = load({
    TONAPI_KEY: String
});

const TONAPI_URL = "https://tonapi.io/";
const TONAPI_TESTNET_URL= "https://testnet.tonapi.io/";
const address = "kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu";
const MERIDIAN_COLLECTION = "EQAVGhk_3rUA3ypZAZ1SkVGZIaDt7UdvwA4jsSGRKRo-MRDN";
const WHALES_COLLECTION = "EQDvRFMYLdxmvY3Tk-cfWMLqDnXF_EclO2Fp4wwj33WhlNFT";

async function fetchData() {
    // Token should be issued on https://tonconsole.com
    
    const accountsApi = new AccountsApi(new Configuration({
        basePath: "https://tonapi.io", // override base path
        headers: {
            Authorization: 'Bearer ' + env.TONAPI_KEY,
        },
    }));

}

async function fetchCollection(collectionAddress: string) {
    let data: any;
    try {
      const response = await axios.get(
        TONAPI_URL + "/v2/nfts/collections/" + collectionAddress,
        {
            headers: {
                Authorization: 'Bearer ' + env.TONAPI_KEY,
            }
        }
      )
      data = response.data;
      console.log(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    
}

//fetchCollection(MERIDIAN_COLLECTION)
//fetchCollection(WHALES_COLLECTION)

async function fetchItems(collectionAddress: string) {
    let data: any;
    try {
      const response = await axios.get(
        TONAPI_URL + "/v2/nfts/collections/" + collectionAddress + "/items",
        {   
            params: {
                limit: 10
            },
            headers: {
                Authorization: 'Bearer ' + env.TONAPI_KEY,
            }
        }
      )
      data = response.data;
      //console.log(data);
      return data
    } catch (error) {
      console.error('Error fetching data:', error);
    }
}

fetchItems(MERIDIAN_COLLECTION).then(data => {console.log(data.nft_items[0].metadata)})
  
  