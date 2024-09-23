import axios, { AxiosResponse } from 'axios';
import { load } from 'ts-dotenv';

const env = load({
    TON_CENTER_API_KEY: String,
});
const API_KEY = env.TON_CENTER_API_KEY;

export async function getJettonWalletByUser(
    owner_address: string,
    jetton_address: string,
    limit: number = 128,
    offset: number = 0
): Promise<any | null> {
    const baseUrl = 'https://toncenter.com/api/v3/jetton/wallets';
    const params = {
        owner_address: owner_address,
        jetton_address: jetton_address,
        limit: limit,
        offset: offset
    };

    try {
        const response: AxiosResponse<any> = await axios.get<any>(baseUrl, { 
            params,
            headers: {
                'Authorization': `Bearer ${API_KEY}`  // Adding the API key to the request headers
            }
         });
        return response.data; 
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Axios error:', error.response?.status, error.response?.data);
        } else {
            console.error('Unexpected error:', error);
        }
        return null;
    }
}

export async function getJettonSupplyByJettonAddress(jetton_address: string, limit: number = 128, offset: number = 0 ): Promise<any | null> {
    const baseUrl = 'https://toncenter.com/api/v3/jetton/masters';
    const params = {
        address: jetton_address,
        limit: limit,
        offset: offset
    };

    try {
        const response: AxiosResponse<any> = await axios.get<any>(baseUrl, { 
            params,
            headers: {
                'Authorization': `Bearer ${API_KEY}`  // Adding the API key to the request headers
            } 
        });
        return response.data; 
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Axios error:', error.response?.status, error.response?.data);
        } else {
            console.error('Unexpected error:', error);
        }
        return null;
    }
}

// Example usage
(async () => {
    const owner_address = 'UQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6ddYh';
    const jetton_address = 'EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT';

    const wallets = await getJettonWalletByUser(owner_address, jetton_address);
    const wallet = wallets.jetton_wallets[0];
    if (wallet) {
        console.log("Wallet: ", wallet);
        console.log("Wallet balance: ", wallet.balance);
    }

    const jetton = await getJettonSupplyByJettonAddress(jetton_address);
    if (jetton) {
        console.log("Jetton: ", jetton);
        console.log("Jetton supply: ", jetton.jetton_masters[0].total_supply);
    }
})();