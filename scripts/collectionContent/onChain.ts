import { Dictionary, beginCell, Cell } from '@ton/core';
import { sha256_sync } from '@ton/crypto'

export function toSha256(s: string): bigint {
    return BigInt('0x' + sha256_sync(s).toString('hex'))
}

export function toTextCell(s: string): Cell {
    return beginCell().storeUint(0, 8).storeStringTail(s).endCell()
}

export type collectionContent = {
    name: string,
    description: string,
    image: string, 
    social_links?: string[]
}

export type itemContent = {
    name: string,
    description: string,
    image: string,
    principal: bigint,
    leverageRatio: bigint,
    lockPeriod: bigint,
    lockEnd: bigint
}

export function buildCollectionContentCell(content: collectionContent): Cell {
    const collectionContentDict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell())
        .set(toSha256("name"), toTextCell(content.name))
        .set(toSha256("description"), toTextCell(content.description))
        .set(toSha256("image"), toTextCell(content.image));
        if (content.social_links) {
            let links = '[ "' + content.social_links.join('", "') + '" ]';
            content.social_links.join(',');
            console.log(links)
            collectionContentDict.set(toSha256("social_links"), toTextCell(links));
        }
    return beginCell() // need to fix 
            .storeUint(0,8)
            .storeDict(collectionContentDict)
            .endCell(); 
    }

export function setItemContentCell(content: itemContent): Cell {
    const itemContentDict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell())
        .set(toSha256("name"), toTextCell(content.name))
        .set(toSha256("description"), toTextCell(content.description))
        .set(toSha256("image"), toTextCell(content.image))
        .set(toSha256("principal"), beginCell().storeUint(content.principal, 256).endCell())
        .set(toSha256("leverageRatio"), beginCell().storeUint(content.leverageRatio, 256).endCell()) // strange, doesn't like uint 8 
        .set(toSha256("lockPeriod"), beginCell().storeUint(content.lockPeriod, 256).endCell()) 
        .set(toSha256("lockEnd"), beginCell().storeUint(content.lockEnd, 256).endCell());
    return beginCell()
            .storeUint(0,8)
            .storeDict(itemContentDict)
            .endCell(); 
}