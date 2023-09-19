import { Address, toNano, Dictionary, beginCell, Cell } from 'ton-core';
import { NftCollection } from '../wrappers/NftCollection';
import { NetworkProvider, sleep } from '@ton-community/blueprint';
import { sha256_sync } from 'ton-crypto';
import { randomAddress } from '@ton-community/test-utils';
import { buildCollectionContentCell, setItemContentCell, toSha256 } from './collectionContent/onChain';

let myAddress: Address = Address.parse("kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu");

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const randomSeed= Math.floor(Math.random() * 10000);

    const nextonAddress = Address.parse("EQBDqObEyc8KYOuHCKm0evBNp0hJ9derp8eSIdhYMjIeMRSZ");

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('Collection address'));
    
    function toSha256(s: string): bigint {
        return BigInt('0x' + sha256_sync(s).toString('hex'))
    }
    
    function toTextCell(s: string): Cell {
        return beginCell().storeUint(0, 8).storeStringTail(s).endCell()
    }

    const nftCollection = provider.open(NftCollection.createFromAddress(address));

    const mint = await nftCollection.sendMintNft(provider.sender(),{
        value: toNano("0.04"),
        queryId: randomSeed,
        amount: toNano("0.025"),
        itemIndex: 0,
        itemOwnerAddress: myAddress,
        nextonAddress: nextonAddress,
        itemContent: setItemContentCell({
            name: "Item name",
            description: "Item description",
            image: "https://hipo.finance/hton.png"
        })
    })
    ui.write('NFT Item deployed');
}