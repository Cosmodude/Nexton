import axios from 'axios';
import { load } from 'ts-dotenv';

const env = load({
    TONAPI_KEY: String
});

const TONAPI_URL = "https://tonapi.io/";

const userAddress = "EQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dYvk";
const collectionAddress = "EQAVGhk_3rUA3ypZAZ1SkVGZIaDt7UdvwA4jsSGRKRo-MRDN";

async function fetchItemsByAddress(collectionAddress: string, userAddress: string) {
    let data: any;

    try {
      const response = await axios.get(
        TONAPI_URL + "/v2/accounts/" + userAddress + "/nfts",
        {   
            params: {
                limit: 10,
                collection: collectionAddress
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

fetchItemsByAddress(collectionAddress, userAddress).then(data => console.log(data))
