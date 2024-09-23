import axios, { AxiosResponse } from 'axios';
import { load } from 'ts-dotenv';

const env = load({
    TON_CENTER_API_KEY: String,
});
const API_KEY = env.TON_CENTER_API_KEY;

export async function getTransactionsByAccount(account: string, limit: number = 128, offset: number = 0, sort: string = 'desc'): Promise<any | null> {
    const baseUrl = 'https://toncenter.com/api/v3/transactions';
    const params = {
        account: account,
        limit: limit,
        offset: offset,
        sort: sort
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

async function getMessagesByDestinationOrSource(
    source: string | null,
    destination: string | null,
    limit: number = 128,
    offset: number = 0
): Promise<any | null> {
    const baseUrl = 'https://toncenter.com/api/v3/messages';
    const params = {
        source: source,
        destination: destination,
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
        return response.data;  // You can modify this line to handle the response data as needed
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Axios error:', error.response?.status, error.response?.data);
        } else {
            console.error('Unexpected error:', error);
        }
        return null;
    }
}


async function main() {
    const account = 'EQC59StGK304XjZ1U9sS2BIAyWhhcJc6AIg9E4hFlJtwzvYS';
    const limit = 128;
    const offset = 0;
    const sort = 'desc';

    const transactions = await getTransactionsByAccount(account);
    
    if (transactions) {
        console.log(transactions.transactions.length, 'transactions found');
        //console.log(transactions.transactions[0]);
    }

    const messages = await getMessagesByDestinationOrSource(null, account);
    console.log(messages.messages.length, 'messages found');
    console.log(messages.messages[messages.messages.length - 1]);
}

main()
