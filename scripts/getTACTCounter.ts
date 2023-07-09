import { toNano } from 'ton-core';
import { TACT } from '../wrappers/TACT';
import { NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const tACT = provider.open(await TACT.fromInit(5611n));

   const counter = await tACT.getCounter();
   const id = await tACT.getId();

   console.log(`Counter - ${counter}; Id - ${id}`);
}