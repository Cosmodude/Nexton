import { toNano } from '@ton/core';
import { NftMarketplaceData } from '../wrappers/NftMarketplace';
import { NetworkProvider } from '@ton/blueprint';
import { deployMarketplace } from '../hooks/useMarketplace';
import { TonClient } from '@ton/ton';
import { mnemonicToWalletKey } from '@ton/crypto';

export async function run(provider: NetworkProvider) {
    const mnemonic = "...";
    const keyPair = await mnemonicToWalletKey(mnemonic.split(" "));
    const config: NftMarketplaceData = {
        seqno: 0,
        subwallet: 112,
        publicKey: keyPair.publicKey
    }

    await deployMarketplace(
        provider.api() as TonClient,
        provider.sender(),
        toNano('0.1'),
        config
    );
}
