import axios from 'axios';
import { load } from 'ts-dotenv';

const env = load({
    TONAPI_KEY: String
});

const TONAPI_URL = "https://tonapi.io/";

const userAddress = "UQABinqGRk8nJQcyRJqRI_ae4Wr9QW4SPoDQaTEy7TSmn0Yd";
const collectionAddress = "EQCA2hrbnf38nvjWuGh4eaZ2OUNjufYvOjeH9ttf6TQIeH0G";

export async function fetchItemsByAddress(collectionAddress: string, userAddress: string) {
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

// example 
fetchItemsByAddress(collectionAddress, userAddress).then(data => console.log(data))
