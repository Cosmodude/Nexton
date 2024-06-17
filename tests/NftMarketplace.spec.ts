import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, StateInit, beginCell, storeStateInit, toNano, contractAddress } from '@ton/core';
import { NFT_MARKETPLACE_CONTRACT_CODE_CELL, NftMarketplace, NftMarketplaceData } from '../wrappers/NftMarketplace';
import { randomAddress } from '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { KeyPair, mnemonicNew, mnemonicToPrivateKey } from 'ton-crypto';
import { NftAuctionV2,  NftAuctionV2Data, Queries, buildNftAuctionV2DataCell } from '../wrappers/NftAuctionV2';

export async function randomKeyPair() {
    let mnemonics = await mnemonicNew()
    return mnemonicToPrivateKey(mnemonics)
}

describe('NftMarketplace', () => {
    let code: Cell;
    let keyPair: KeyPair;

    beforeAll(async () => {
        code = NFT_MARKETPLACE_CONTRACT_CODE_CELL;
        keyPair = await randomKeyPair();
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let nftMarketplace: SandboxContract<NftMarketplace>;
    let defaultConfig: NftMarketplaceData;

    beforeEach(async () => {
        defaultConfig = {
            seqno: 10,
            publicKey: keyPair.publicKey,
            subwallet: 228
        };
    
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');

        nftMarketplace = blockchain.openContract(NftMarketplace.createFromConfig(defaultConfig, code));

        const deployResult = await nftMarketplace.sendDeploy(deployer.getSender(), toNano('5'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftMarketplace.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
    });

    it('return seqno', async () => {
        const result = await nftMarketplace.getSeqno();

        expect(result).toEqual(defaultConfig.seqno);
    });

    it('return public key', async () => {
        const result = await nftMarketplace.getPublicKey();

        expect(result.equals(defaultConfig.publicKey)).toEqual(true);
    });


    it('send singed message for deploy', async () => {
        let body = beginCell().storeUint(111, 32).endCell();
        let state: StateInit = { 
            code: beginCell().storeUint(1, 32).endCell(),
            data: beginCell().storeUint(11, 32).endCell()
        };
        const result = await nftMarketplace.sendSignedDeployMessage(deployer.getSender(), toNano('2'), { secretKey : keyPair.secretKey, stateInit: state, body : body});

        expect(result.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftMarketplace.address,
            success: true,
        });

        expect(result.transactions).toHaveTransaction({
            from: nftMarketplace.address,
            to: contractAddress(0, state),
            deploy: true,
            body: body
        });
    });

    it('send external message', async () => {
        let msg1 = beginCell()
                    .storeUint(0x18, 6)
                    .storeAddress(deployer.address)
                    .storeCoins(toNano('0.1'))
                    .storeUint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
                    .storeUint(123, 32)
                    .endCell();
        let msg2 = beginCell()
                    .storeUint(0x18, 6)
                    .storeAddress(deployer.address)
                    .storeCoins(toNano('0.1'))
                    .storeUint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
                    .storeUint(1234, 32)
                    .endCell();
        let body = beginCell()
                    .storeRef(msg1)
                    .storeUint(1, 8)
                    .storeRef(msg2)
                    .storeUint(1, 8)
                    .endCell();

        const subwallet = await nftMarketplace.getSubwallet();

        expect(subwallet).toEqual(defaultConfig.subwallet);

        let result = await nftMarketplace.sendExternalSignedMessage({
                                                                secretKey : keyPair.secretKey, 
                                                                subwallet: subwallet, 
                                                                validUntil: Math.floor(Date.now() / 1000) + 1000, 
                                                                segno: defaultConfig.seqno, body: body
        });

        expect(result.transactions).toHaveTransaction({
            to: nftMarketplace.address,
            success: true
        });

        expect(result.transactions).toHaveTransaction({
            from: nftMarketplace.address,
            to: deployer.address,
            body: beginCell()
                    .storeUint(123, 32)
                    .endCell()
        });

        expect(result.transactions).toHaveTransaction({
            from: nftMarketplace.address,
            to: deployer.address,
            body: beginCell()
                    .storeUint(1234, 32)
                    .endCell()
        });
    });

    it('send singed message for deploy auction and repeat_end_auction', async () => {
        const nowTimeStamp = Math.floor(Date.now() / 1000);

        let aucDefaultConfig: NftAuctionV2Data = {
            marketplaceFeeAddress: randomAddress(),
            marketplaceFeeFactor: 5n,
            marketplaceFeeBase: 100n,
    
    
            royaltyAddress: randomAddress(),
            royaltyFactor: 20n,
            royaltyBase: 100n,
    
    
            minBid: toNano('1'),
            maxBid: toNano('100'),
            minStep: toNano('1'),
            endTimestamp: nowTimeStamp + 60 * 60,
    
            stepTimeSeconds: 60*5,
    
            nftOwnerAddress: null,
            nftAddress: randomAddress(),
    
            marketplaceAddress: nftMarketplace.address,
            end: true,
            activated: false,
            createdAtTimestamp: nowTimeStamp - 60 * 60,
        }
        let body = beginCell().storeBuilder(NftAuctionV2.queries.deployMessage()).endCell();
        let state: StateInit = { 
            code: await compile('NftAuctionV2'),
            data: buildNftAuctionV2DataCell(aucDefaultConfig)
        };
        let result = await nftMarketplace.sendSignedDeployMessage(deployer.getSender(), toNano('2'), { secretKey : keyPair.secretKey, stateInit: state, body : body});

        const aucAddress = contractAddress(0, state);

        expect(result.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftMarketplace.address,
            success: true,
        });

        expect(result.transactions).toHaveTransaction({
            from: nftMarketplace.address,
            to: aucAddress,
            deploy: true,
            success: true,
            body: body
        });

        body = beginCell().storeBuilder(NftAuctionV2.queries.repeatEndAuctionMessage()).endCell();

        result = await nftMarketplace.sendSignedDeployMessage(deployer.getSender(), toNano('2'), { secretKey : keyPair.secretKey, stateInit: state, body : body});

        expect(result.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftMarketplace.address,
            success: true,
        });

        expect(result.transactions).toHaveTransaction({
            from: nftMarketplace.address,
            to: aucAddress,
            success: true,
            body: body
        });

        expect(result.transactions).toHaveTransaction({
            from: aucAddress,
            to: aucDefaultConfig.nftAddress,
        });
    });
});
