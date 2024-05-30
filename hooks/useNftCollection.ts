import { NFT_COLLECTION_CONTRACT_CODE_CELL, NftCollection, NftCollectionConfig, ItemMintInfo, RoyaltyParams } from "../wrappers/NftCollection";
import { Address, TonClient, TupleItemInt } from "@ton/ton";
import { NftCollectionContent, buildCollectionContentCell } from "../scripts/contentUtils/offChain";
import { NFT_ITEM_CONTRACT_CODE_CELL } from "../wrappers/NftItem";
import { setItemContentCell } from "../scripts/contentUtils/onChain";


export async function deployNftCollection(
    ton: TonClient,
    sender: any,
    amount: bigint,
    params: {
        ownerAddress: Address;
        nextItemIndex: number;
        collectionContent: NftCollectionContent;
        royaltyParams: RoyaltyParams;
    }
) {
    const config: NftCollectionConfig = {
        ownerAddress: params.ownerAddress,
        nextItemIndex: params.nextItemIndex,
        collectionContent: buildCollectionContentCell(params.collectionContent),
        nftItemCode: NFT_ITEM_CONTRACT_CODE_CELL,
        royaltyParams: params.royaltyParams
    };
    let collection = ton.open(NftCollection.createFromConfig(config, NFT_COLLECTION_CONTRACT_CODE_CELL));
    await collection.sendDeploy(sender, amount);
}

export async function mintNftItem(
    ton: TonClient,
    sender: any,
    amount: bigint,
    collectionAddress: Address,
    nftInfo: ItemMintInfo
) {
    let collection = ton.open(NftCollection.createFromAddress(collectionAddress));
    await collection.sendMintNft(sender, {value: amount, 
        queryId: Math.floor(Math.random() * 1000),
        amount: nftInfo.amount,  // to send with nft
        itemIndex: nftInfo.itemIndex,
        itemOwnerAddress: nftInfo.itemOwnerAddress,
        nextonAddress: nftInfo.editor,
        itemContent: setItemContentCell(nftInfo.itemContent)
     });
}

export async function mintBatchNftItems(
    ton: TonClient,
    sender: any,
    amount: bigint,
    collectionAddress: Address,
    nftsInfo: ItemMintInfo[]
) {
    let collection = ton.open(NftCollection.createFromAddress(collectionAddress));
    await collection.sendMintBatchNft(sender, {value: amount, queryId: Math.floor(Math.random() * 1000), nftsInfo: nftsInfo});
}

export async function changeOwnerNftCollection(
    ton: TonClient,
    sender: any,
    amount: bigint,
    collectionAddress: Address,
    newOwner: Address
) {
    let collection = ton.open(NftCollection.createFromAddress(collectionAddress));
    await collection.sendChangeOwner(sender, {value: amount, queryId: BigInt(Math.floor(Math.random() * 1000)), newOwnerAddress: newOwner});
}


export async function getNftCollectionData(
    ton: TonClient,
    collectionAddress: Address
) {
    let collection = ton.open(NftCollection.createFromAddress(collectionAddress));
    await collection.getCollectionData();
}

export async function getNftItemAddressByIndex(
    ton: TonClient,
    collectionAddress: Address,
    index: bigint
) {
    const i: TupleItemInt = {
        type: "int",
        value: index
    }
    let collection = ton.open(NftCollection.createFromAddress(collectionAddress));
    await collection.getItemAddressByIndex(i);
}
