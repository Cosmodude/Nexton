import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, StateInit, beginCell, storeStateInit, toNano, contractAddress, SendMode, external } from '@ton/core';
import { NFT_FIXPRICESALE_CONTRACT_CODE_CELL, NftFixPriceSale, NftFixPriceSaleData } from '../wrappers/NftFixPriceSale';
import { randomAddress } from '@ton/test-utils';
import { compile, sleep } from '@ton/blueprint';
import { KeyPair, mnemonicNew, mnemonicToPrivateKey } from 'ton-crypto';

export async function randomKeyPair() {
    let mnemonics = await mnemonicNew()
    return mnemonicToPrivateKey(mnemonics)
}

describe('NftFixPriceSale', () => {
    let code: Cell;

    const nowTimeStamp = Math.floor(Date.now() / 1000);

    beforeAll(async () => {
        code =  NFT_FIXPRICESALE_CONTRACT_CODE_CELL;
    });

    let blockchain: Blockchain;
    let marketplace: SandboxContract<TreasuryContract>;
    let nftContract: SandboxContract<TreasuryContract>;
    let nftFixPriceSale: SandboxContract<NftFixPriceSale>;
    let defaultConfig: NftFixPriceSaleData;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        marketplace = await blockchain.treasury('marketplace');
        nftContract = await blockchain.treasury('nftContract');

        defaultConfig = {
            isComplete: false,
            createdAt: nowTimeStamp,
            marketplaceAddress: marketplace.address,
            nftAddress: nftContract.address,
            nftOwnerAddress: null,
            fullPrice: toNano('10'), 
            marketplaceFeeAddress: randomAddress(),
            marketplaceFee: toNano('2'), 
            royaltyAddress: randomAddress(),
            royaltyAmount: toNano('2'),
            canDeployByExternal: false
        };

        nftFixPriceSale = blockchain.openContract(NftFixPriceSale.createFromConfig(defaultConfig, code));

        const deployResult = await nftFixPriceSale.sendDeploy(marketplace.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: marketplace.address,
            to: nftFixPriceSale.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
    });

    it('call get_sale_data method', async () => {
        const result = await nftFixPriceSale.getSaleData();
        expect(result.isComplete).toEqual(false);
        expect(result.createdAt).toEqual(defaultConfig.createdAt);
        expect(result.marketplaceAddress.equals(defaultConfig.marketplaceAddress)).toEqual(true);
        expect(result.nftAddress.equals(defaultConfig.nftAddress)).toEqual(true);
        expect(result.nftOwnerAddress).toEqual(null);
        expect(result.fullPrice).toEqual(defaultConfig.fullPrice);
        expect(result.marketplaceFeeAddress.equals(defaultConfig.marketplaceAddress)).toEqual(false);
        expect(result.marketplaceFee).toEqual(defaultConfig.marketplaceFee);
        expect(result.royaltyAddress.equals(defaultConfig.royaltyAddress)).toEqual(true);
        expect(result.royaltyAmount).toEqual(defaultConfig.royaltyAmount);
    });

    it('init sale', async () => {
        const nftOwnerAddress = randomAddress();

        let user: SandboxContract<TreasuryContract>  = await blockchain.treasury('user');

        let result = await nftContract.send({
            value: toNano('1'),
            to : nftFixPriceSale.address,
            sendMode : SendMode.PAY_GAS_SEPARATELY,
            body : beginCell()
                    .storeUint(0, 32) // op::ownership_assigned
                    .storeUint(0, 64) // query_id
                    .storeAddress(nftOwnerAddress) // nft_owner
                    .endCell()
        });
        
        
        expect(result.transactions).toHaveTransaction({
            from: nftContract.address,
            to: nftFixPriceSale.address,
            success: false,
            exitCode: 501
        });

        result = await user.send({
            value: toNano('1'),
            to : nftFixPriceSale.address,
            sendMode : SendMode.PAY_GAS_SEPARATELY,
            body : beginCell()
                    .storeUint(0x05138d91, 32) // op::ownership_assigned
                    .storeUint(0, 64) // query_id
                    .storeAddress(nftOwnerAddress) // nft_owner
                    .endCell()
        });
        
        
        expect(result.transactions).toHaveTransaction({
            from: user.address,
            to: nftFixPriceSale.address,
            success: false,
            body : beginCell()
                    .storeUint(0x05138d91, 32) // op::ownership_assigned
                    .storeUint(0, 64) // query_id
                    .storeAddress(nftOwnerAddress) // nft_owner
                    .endCell(),
            exitCode : 500
        });

        result = await nftContract.send({
            value: toNano('1'),
            to : nftFixPriceSale.address,
            sendMode : SendMode.PAY_GAS_SEPARATELY,
            body : beginCell()
                    .storeUint(0x05138d91, 32) // op::ownership_assigned
                    .storeUint(0, 64) // query_id
                    .storeAddress(nftOwnerAddress) // nft_owner
                    .endCell()
        });
        
        
        expect(result.transactions).toHaveTransaction({
            from: nftContract.address,
            to: nftFixPriceSale.address,
            success: true,
            body : beginCell()
                    .storeUint(0x05138d91, 32) // op::ownership_assigned
                    .storeUint(0, 64) // query_id
                    .storeAddress(nftOwnerAddress) // nft_owner
                    .endCell()
        });

        let data = await nftFixPriceSale.getSaleData();

        expect(data.nftOwnerAddress!.equals(nftOwnerAddress)).toEqual(true);
    });


    it('init sale and buy', async () => {
        const nftOwnerAddress = randomAddress();

        let user: SandboxContract<TreasuryContract>  = await blockchain.treasury('user');

        let result = await nftContract.send({
            value: toNano('1'),
            to : nftFixPriceSale.address,
            sendMode : SendMode.PAY_GAS_SEPARATELY,
            body : beginCell()
                    .storeUint(0x05138d91, 32) // op::ownership_assigned
                    .storeUint(0, 64) // query_id
                    .storeAddress(nftOwnerAddress) // nft_owner
                    .endCell()
        });
        
        
        expect(result.transactions).toHaveTransaction({
            from: nftContract.address,
            to: nftFixPriceSale.address,
            success: true,
            body : beginCell()
                    .storeUint(0x05138d91, 32) // op::ownership_assigned
                    .storeUint(0, 64) // query_id
                    .storeAddress(nftOwnerAddress) // nft_owner
                    .endCell()
        });

        let data = await nftFixPriceSale.getSaleData();

        expect(data.nftOwnerAddress!.equals(nftOwnerAddress)).toEqual(true);

        result = await nftFixPriceSale.sendBuy(user.getSender(), toNano('1'));


        expect(result.transactions).toHaveTransaction({
            from: user.address,
            to: nftFixPriceSale.address,
            success: false,
            exitCode: 450
        });


        result = await nftFixPriceSale.sendBuy(user.getSender(), toNano('11'));


        expect(result.transactions).toHaveTransaction({
            from: user.address,
            to: nftFixPriceSale.address,
            success: true,
            body: beginCell().storeBuilder(NftFixPriceSale.queries.buyMessage()).endCell()
        });

        expect(result.transactions).toHaveTransaction({
            from: nftFixPriceSale.address,
            to: defaultConfig.marketplaceFeeAddress,
        });

        expect(result.transactions).toHaveTransaction({
            from: nftFixPriceSale.address,
            to: defaultConfig.royaltyAddress,
        });

        expect(result.transactions).toHaveTransaction({
            from: nftFixPriceSale.address,
            to: nftOwnerAddress,
        });

        expect(result.transactions).toHaveTransaction({
            from: nftFixPriceSale.address,
            to: nftContract.address,
        });

        data = await nftFixPriceSale.getSaleData();

        expect(data.isComplete).toEqual(true);

    });

    it('init sale and buy with query_id', async () => {
        const nftOwnerAddress = randomAddress();

        let user: SandboxContract<TreasuryContract>  = await blockchain.treasury('user');

        let result = await nftContract.send({
            value: toNano('1'),
            to : nftFixPriceSale.address,
            sendMode : SendMode.PAY_GAS_SEPARATELY,
            body : beginCell()
                    .storeUint(0x05138d91, 32) // op::ownership_assigned
                    .storeUint(0, 64) // query_id
                    .storeAddress(nftOwnerAddress) // nft_owner
                    .endCell()
        });
        
        
        expect(result.transactions).toHaveTransaction({
            from: nftContract.address,
            to: nftFixPriceSale.address,
            success: true,
            body : beginCell()
                    .storeUint(0x05138d91, 32) // op::ownership_assigned
                    .storeUint(0, 64) // query_id
                    .storeAddress(nftOwnerAddress) // nft_owner
                    .endCell()
        });

        let data = await nftFixPriceSale.getSaleData();

        expect(data.nftOwnerAddress!.equals(nftOwnerAddress)).toEqual(true);

        result = await nftFixPriceSale.sendBuyWithQueryId(user.getSender(), toNano('1'), 123);


        expect(result.transactions).toHaveTransaction({
            from: user.address,
            to: nftFixPriceSale.address,
            success: false,
            body: beginCell().storeBuilder(NftFixPriceSale.queries.buyWithQueryIdMessage(123)).endCell(),
            exitCode: 450
        });


        result = await nftFixPriceSale.sendBuyWithQueryId(user.getSender(), toNano('11'), 123);


        expect(result.transactions).toHaveTransaction({
            from: user.address,
            to: nftFixPriceSale.address,
            body: beginCell().storeBuilder(NftFixPriceSale.queries.buyWithQueryIdMessage(123)).endCell(),
            success: true
        });

        expect(result.transactions).toHaveTransaction({
            from: nftFixPriceSale.address,
            to: defaultConfig.marketplaceFeeAddress,
        });

        expect(result.transactions).toHaveTransaction({
            from: nftFixPriceSale.address,
            to: defaultConfig.royaltyAddress,
        });

        expect(result.transactions).toHaveTransaction({
            from: nftFixPriceSale.address,
            to: nftOwnerAddress,
        });

        expect(result.transactions).toHaveTransaction({
            from: nftFixPriceSale.address,
            to: nftContract.address,
        });

        data = await nftFixPriceSale.getSaleData();

        expect(data.isComplete).toEqual(true);


        result = await nftFixPriceSale.sendBuyWithQueryId(user.getSender(), toNano('1'), 123);


        expect(result.transactions).toHaveTransaction({
            from: user.address,
            to: nftFixPriceSale.address,
            success: false,
            body: beginCell().storeBuilder(NftFixPriceSale.queries.buyWithQueryIdMessage(123)).endCell(),
            exitCode: 404
        });

    });


    it('send coins', async () => {
        let result = await nftFixPriceSale.sendCoins(marketplace.getSender(), toNano('11'), 123);


        expect(result.transactions).toHaveTransaction({
            from: marketplace.address,
            to: nftFixPriceSale.address,
            body: beginCell().storeBuilder(NftFixPriceSale.queries.acceptCoinsMessage(123)).endCell(),
            success: true
        });
    });


    it('royalty is zero', async () => {
        const nftOwnerAddress = randomAddress();

        let defaultConfigTemp: NftFixPriceSaleData = {
            ...defaultConfig,
            royaltyAmount: 0n,
        };
        let user: SandboxContract<TreasuryContract>  = await blockchain.treasury('user');
        let nftFixPriceSaleTemp: SandboxContract<NftFixPriceSale> = blockchain.openContract(NftFixPriceSale.createFromConfig(defaultConfigTemp, code));
        await nftFixPriceSaleTemp.sendDeploy(marketplace.getSender(), toNano('0.05'));

        let result = await nftContract.send({
            value: toNano('1'),
            to : nftFixPriceSaleTemp.address,
            sendMode : SendMode.PAY_GAS_SEPARATELY,
            body : beginCell()
                    .storeUint(0x05138d91, 32) // op::ownership_assigned
                    .storeUint(0, 64) // query_id
                    .storeAddress(nftOwnerAddress) // nft_owner
                    .endCell()
        });

        result = await nftFixPriceSaleTemp.sendBuyWithQueryId(user.getSender(), toNano('11'), 123);


        expect(result.transactions).toHaveTransaction({
            from: user.address,
            to: nftFixPriceSaleTemp.address,
            body: beginCell().storeBuilder(NftFixPriceSale.queries.buyWithQueryIdMessage(123)).endCell(),
            success: true
        });

        expect(result.transactions).toHaveTransaction({
            from: nftFixPriceSaleTemp.address,
            to: defaultConfig.marketplaceFeeAddress,
        });

        expect(result.transactions).not.toHaveTransaction({
            from: nftFixPriceSaleTemp.address,
            to: defaultConfig.royaltyAddress,
        });

        expect(result.transactions).toHaveTransaction({
            from: nftFixPriceSaleTemp.address,
            to: nftOwnerAddress,
        });

        expect(result.transactions).toHaveTransaction({
            from: nftFixPriceSaleTemp.address,
            to: nftContract.address,
        });

        let data = await nftFixPriceSaleTemp.getSaleData();

        expect(data.isComplete).toEqual(true);

    });

    it('init sale and cancel', async () => {
        const nftOwnerAddress = randomAddress();

        let result = await nftContract.send({
            value: toNano('1'),
            to : nftFixPriceSale.address,
            sendMode : SendMode.PAY_GAS_SEPARATELY,
            body : beginCell()
                    .storeUint(0x05138d91, 32) // op::ownership_assigned
                    .storeUint(0, 64) // query_id
                    .storeAddress(nftOwnerAddress) // nft_owner
                    .endCell()
        });
        
        
        expect(result.transactions).toHaveTransaction({
            from: nftContract.address,
            to: nftFixPriceSale.address,
            success: true,
            body : beginCell()
                    .storeUint(0x05138d91, 32) // op::ownership_assigned
                    .storeUint(0, 64) // query_id
                    .storeAddress(nftOwnerAddress) // nft_owner
                    .endCell()
        });

        let data = await nftFixPriceSale.getSaleData();

        expect(data.nftOwnerAddress!.equals(nftOwnerAddress)).toEqual(true);
        expect(data.isComplete).toEqual(false);


        result = await nftFixPriceSale.sendCancel(marketplace.getSender(), toNano('1'));


        expect(result.transactions).toHaveTransaction({
            from: marketplace.address,
            to: nftFixPriceSale.address,
            body: beginCell().storeBuilder(NftFixPriceSale.queries.cancelMessage()).endCell(),
            success: true
        });

        data = await nftFixPriceSale.getSaleData();

        expect(data.isComplete).toEqual(true);

    });

    it('send emergency after buy', async () => {
        const nftOwnerAddress = randomAddress();

        let user: SandboxContract<TreasuryContract>  = await blockchain.treasury('user');

        let result = await nftContract.send({
            value: toNano('1'),
            to : nftFixPriceSale.address,
            sendMode : SendMode.PAY_GAS_SEPARATELY,
            body : beginCell()
                    .storeUint(0x05138d91, 32) // op::ownership_assigned
                    .storeUint(0, 64) // query_id
                    .storeAddress(nftOwnerAddress) // nft_owner
                    .endCell()
        });

        result = await nftFixPriceSale.sendBuyWithQueryId(user.getSender(), toNano('11'), 123);

        let data = await nftFixPriceSale.getSaleData();

        expect(data.isComplete).toEqual(true);

        const rndAddress = randomAddress();

        let msg = beginCell()
                    .storeUint(0x18, 6)
                    .storeAddress(rndAddress)
                    .storeCoins(toNano('1'))
                    .storeUint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
                    .storeUint(1234, 32)
                    .endCell();
        
        result = await nftFixPriceSale.sendEmergency(marketplace.getSender(), toNano('10'), 123, {mode: 1, msg: msg});
        
        expect(result.transactions).toHaveTransaction({
            from: marketplace.address,
            to: nftFixPriceSale.address,
            success: true,
        });

        expect(result.transactions).toHaveTransaction({
            from: nftFixPriceSale.address,
            to: rndAddress,
            body: beginCell().storeUint(1234, 32).endCell(),
        });

    });

    it('send emergency before init', async () => {
        const rndAddress = randomAddress();

        let msg = beginCell()
                    .storeUint(0x18, 6)
                    .storeAddress(rndAddress)
                    .storeCoins(toNano('1'))
                    .storeUint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
                    .storeUint(1234, 32)
                    .endCell();
        
        let result = await nftFixPriceSale.sendEmergency(marketplace.getSender(), toNano('1'), 123, {mode: 1, msg: msg});
        
        expect(result.transactions).toHaveTransaction({
            from: marketplace.address,
            to: nftFixPriceSale.address,
            success: true,
        });

        expect(result.transactions).toHaveTransaction({
            from: nftFixPriceSale.address,
            to: rndAddress,
            body: beginCell().storeUint(1234, 32).endCell(),
        });

    });

    it('external deploy', async () => {
        let defaultConfigTemp: NftFixPriceSaleData = {
            ...defaultConfig,
            royaltyAddress: randomAddress(),
            canDeployByExternal: true
        }
        let nftFixPriceSaleTemp = blockchain.openContract(NftFixPriceSale.createFromConfig(defaultConfigTemp, code));


        let result = await marketplace.send({
            value: toNano('1'),
            to : nftFixPriceSaleTemp.address,
            sendMode : SendMode.PAY_GAS_SEPARATELY,
            bounce: false
        });

        expect(result.transactions).toHaveTransaction({
            from: marketplace.address,
            to: nftFixPriceSaleTemp.address,
            deploy: false,
        });

        const deployResult = await nftFixPriceSaleTemp.sendExternalDeploy();

        expect(deployResult.transactions).toHaveTransaction({
            to: nftFixPriceSaleTemp.address,
            deploy: true,
            success: true
        });
    });

});
