import { Address, toNano } from '@ton/core';
import { NftAuctionV2Data } from '../wrappers/NftAuctionV2';
import { NetworkProvider } from '@ton/blueprint';
import { TonClient } from '@ton/ton';
import { deployAuction } from '../hooks/useAuction';

export async function run(provider: NetworkProvider) {
    const nowTimeStamp = Math.floor(Date.now() / 1000);
    const nftAddress = Address.parse("...");
    const anyAddress = Address.parse("...");


    let config: NftAuctionV2Data = {
        marketplaceFeeAddress: anyAddress,
        marketplaceFeeFactor: 5n,
        marketplaceFeeBase: 100n,


        royaltyAddress: anyAddress,
        royaltyFactor: 20n,
        royaltyBase: 100n,


        minBid: toNano('1'),
        maxBid: toNano('100'),
        minStep: toNano('1'),
        endTimestamp: nowTimeStamp + 60 * 60,

        stepTimeSeconds: 60*5,

        nftOwnerAddress: null,
        nftAddress: nftAddress,

        marketplaceAddress: anyAddress,
        end: true,
        activated: false,
        createdAtTimestamp: nowTimeStamp - 60 * 60,
    }

    await deployAuction(
        provider.api() as TonClient,
        provider.sender(),
        toNano('0.05'),
        config
    );
}
