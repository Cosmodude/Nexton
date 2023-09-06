
import * as dotenv from "dotenv";
import { load } from 'ts-dotenv';

const env = load({
    TONAPI_KEY: String
});

import axios from 'axios';

async function fetchData() {
    const method = 'getBids'
    const pref= 'auction'
    const url = `https://tonapi.io/v2/${pref}/${method}`
    try {
        const response = await axios.get(url); // Replace with your API endpoint

        console.log('API Response:', response.data);
    } catch (error: any) {
        console.error('Error fetching data:', error.message);
    }
}

fetchData();

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

import fetch, { Headers } from 'node-fetch'; // Use 'node-fetch' for Node.js environment or 'fetch' for browsers

async function fetchDataa() {
  const apiEndpoint = 'https://tonapi.io/v1/blockchain/getAccount';
  const account = 'EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N';
  const serverSideKey = env.TONAPI_KEY; 

  const queryParams = new URLSearchParams({ account });
  const url = `${apiEndpoint}?${queryParams}`;

  const headers = new Headers({
    'Authorization': 'Bearer ' + serverSideKey,
  });

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      throw new Error('Network response was not ok.');
    }

    const data = await response.json();
    console.log('API Response:', data);
  } catch (error: any) {
    console.error('Error fetching data:', error.message);
  }
}

// Call the function to fetch the data
fetchData();