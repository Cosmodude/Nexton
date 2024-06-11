import { Address, toNano } from '@ton/core';
import { NftCollection } from '../wrappers/NftCollection';
import { NetworkProvider } from '@ton/blueprint';
import { setItemContentCell } from './contentUtils/onChain';

let myAddress: Address = Address.parse("kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu");

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const randomSeed= Math.floor(Math.random() * 10000);

    const nextonAddress = Address.parse("EQBDqObEyc8KYOuHCKm0evBNp0hJ9derp8eSIdhYMjIeMRSZ");

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('Collection address'));

    const nftCollection = provider.open(NftCollection.createFromAddress(address));

    const mint = await nftCollection.sendMintNft(provider.sender(),{
        value: toNano("0.04"),
        queryId: randomSeed,
        amount: 0n,
        itemIndex: 0,
        itemOwnerAddress: myAddress,
        nextonAddress: nextonAddress,
        itemContent: setItemContentCell({
            name: "Nexton Staking Derivative",
            description: "Holds information about the user's stake in the Nexton platform pool",
            image: "https://raw.githubusercontent.com/Cosmodude/TAP/main/TAP_Logo.png",
            principal: 10n,
            leverageRatio: 1n,
            lockPeriod: 600n,
            lockEnd: 10n
        })
    })
    ui.write(`NFT Item deployed at https://testnet.tonscan.org/address/${nftCollection.address}`);
}