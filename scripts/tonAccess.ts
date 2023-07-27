import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient, Address } from "ton";
import {  toNano, fromNano } from 'ton-core';
import TonWeb from "tonweb";

export async function run() {
const endpoint = await getHttpEndpoint({network: "testnet"}); // get the decentralized RPC endpoint
const client = new TonClient({ endpoint }); // initialize ton library

const address = Address.parseFriendly("EQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dYvk").address;
const balance = await client.getBalance(address)

console.log(fromNano(balance));

}
