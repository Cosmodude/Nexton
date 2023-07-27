import { getHttpEndpoint } from "@orbs-network/ton-access";
import TonWeb from "tonweb";

export async function run() {
    const endpoint = await getHttpEndpoint({network: "testnet"}); // get the decentralized RPC endpoint
    const tonweb = new TonWeb(new TonWeb.HttpProvider(endpoint)); // initialize tonweb library

   
    const balance = await tonweb.provider.getWalletInfo("EQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dYvk");
    console.log(balance)
}
