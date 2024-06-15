import { Address, toNano } from '@ton/core';
import { NftFixPriceSaleData } from '../wrappers/NftFixPriceSale';
import { NetworkProvider } from '@ton/blueprint';
import { TonClient } from '@ton/ton';
import { deployFixPriceSale } from '../hooks/useFixPriceSale';

export async function run(provider: NetworkProvider) {
    const nowTimeStamp = Math.floor(Date.now() / 1000);
    const nftAddress = Address.parse("...");
    const anyAddress = Address.parse("...");


    let config: NftFixPriceSaleData = {
        isComplete: false,
        createdAt: nowTimeStamp,
        marketplaceAddress: anyAddress,
        nftAddress: nftAddress,
        nftOwnerAddress: null,
        fullPrice: toNano('3'), 
        marketplaceFeeAddress: anyAddress,
        marketplaceFee: toNano('0.5'), 
        royaltyAddress: anyAddress,
        royaltyAmount: toNano(''),
        canDeployByExternal: false
    };

    await deployFixPriceSale(
        provider.api() as TonClient,
        provider.sender(),
        toNano('0.1'),
        config
    );
}
