import { Address, toNano, Dictionary, beginCell, Cell } from 'ton-core';
import { NftCollection } from '../wrappers/NftCollection';
import { NetworkProvider, sleep } from '@ton-community/blueprint';
import { sha256_sync } from 'ton-crypto';

let myAddress: Address = Address.parse("kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu");

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('Collection address'));
    
    function toSha256(s: string): bigint {
        return BigInt('0x' + sha256_sync(s).toString('hex'))
    }
    
    function toTextCell(s: string): Cell {
        return beginCell().storeUint(0, 8).storeStringTail(s).endCell()
    }
    
    const itemContentDict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell())
        .set(toSha256("name"), toTextCell("User 0"))
        .set(toSha256("description"), toTextCell("first depositor"))
        .set(toSha256("image"), toTextCell("https://hipo.finance/hton.png"));
    
    const itemContent = beginCell().storeUint(0, 8).storeDict(itemContentDict).endCell()

    const nftCollection = provider.open(NftCollection.createFromAddress(address));

    const mint = await nftCollection.sendMintNft(provider.sender(),{
        value: toNano("0.04"),
        amount: toNano("0.025"),
        itemIndex: 0,
        itemOwnerAddress: myAddress,
        itemContent: itemContent,
        queryId: Date.now()
    })
    ui.write('NFT Item deployed');
}