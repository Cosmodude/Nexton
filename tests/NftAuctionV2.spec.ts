import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano, SendMode, beginCell, Address } from '@ton/core';
import {randomAddress} from '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { NFT_AUCTION_CONTRACT_CODE_CELL, NftAuctionV2,  NftAuctionV2Data, Queries } from '../wrappers/NftAuctionV2';

describe('NftAuctionV2', () => {
    const nowTimeStamp = Math.floor(Date.now() / 1000);

    let code: Cell;
    let defaultConfig: NftAuctionV2Data = {
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

        marketplaceAddress: randomAddress(),
        end: true,
        activated: false,
        createdAtTimestamp: nowTimeStamp - 60 * 60,
    }

    beforeAll(async () => {
        code = NFT_AUCTION_CONTRACT_CODE_CELL;
    });

    let blockchain: Blockchain;
    let marketplace: SandboxContract<TreasuryContract>;
    let nftContract: SandboxContract<TreasuryContract>;
    let nftAuctionV2: SandboxContract<NftAuctionV2>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        marketplace = await blockchain.treasury('marketplace');
        nftContract = await blockchain.treasury('nftContract');

        defaultConfig.marketplaceAddress = marketplace.address;
        defaultConfig.nftAddress = nftContract.address;

        nftAuctionV2 = blockchain.openContract(NftAuctionV2.createFromConfig(defaultConfig, code));

        const deployResult = await nftAuctionV2.sendDeploy(marketplace.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: marketplace.address,
            to: nftAuctionV2.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy from marketplace', async () => {
    });

    it('should deploy from other', async () => {
        let defaultConfigTemp = { ...defaultConfig };
        defaultConfigTemp.marketplaceAddress = randomAddress();
        defaultConfigTemp.nftAddress = randomAddress();

        let nftAuctionV2Temp: SandboxContract<NftAuctionV2>;
        nftAuctionV2Temp = blockchain.openContract(NftAuctionV2.createFromConfig(defaultConfigTemp, code));

        let user: SandboxContract<TreasuryContract>;
        user = await blockchain.treasury('user');

        const deployResult = await nftAuctionV2Temp.sendDeploy(user.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: user.address,
            to: nftAuctionV2Temp.address,
            deploy: true,
            success: true,
        });
    });

    it('external deploy', async () => {
        let defaultConfigTemp: NftAuctionV2Data = {
            ...defaultConfig,
            royaltyBase: 10n
        }
        let nftAuctionV2Temp = blockchain.openContract(NftAuctionV2.createFromConfig(defaultConfigTemp, code));


        let result = await marketplace.send({
            value: toNano('1'),
            to : nftAuctionV2Temp.address,
            sendMode : SendMode.PAY_GAS_SEPARATELY,
            bounce: false
        });

        expect(result.transactions).toHaveTransaction({
            from: marketplace.address,
            to: nftAuctionV2Temp.address,
            deploy: false,
        });

        const deployResult = await nftAuctionV2Temp.sendExternalDeploy();

        expect(deployResult.transactions).toHaveTransaction({
            to: nftAuctionV2Temp.address,
            deploy: true,
            success: true
        });
    });

    it('call get_sale_data method', async () => {
        const result = await nftAuctionV2.getSaleData();
        expect(result.end).toEqual(true);
        expect(result.endTimestamp).toEqual(defaultConfig.endTimestamp);
        expect(result.marketplaceAddress.equals(defaultConfig.marketplaceAddress)).toEqual(true);
        expect(result.nftAddress.equals(defaultConfig.nftAddress)).toEqual(true); 
        expect(result.nftOwnerAddress).toEqual(null);
        expect(result.lastBidAmount).toEqual(0n);
        expect(result.lastBidAddress).toEqual(null);
        expect(result.minStep).toEqual(defaultConfig.minStep);
        expect(result.marketplaceFeeAddress.equals(defaultConfig.marketplaceFeeAddress)).toEqual(true);
        expect(result.marketplaceFeeFactor).toEqual(defaultConfig.marketplaceFeeFactor);
        expect(result.marketplaceFeeBase).toEqual(defaultConfig.marketplaceFeeBase);
        expect(result.royaltyAddress.equals(defaultConfig.royaltyAddress)).toEqual(true);
        expect(result.royaltyFactor).toEqual(defaultConfig.royaltyFactor);
        expect(result.royaltyBase).toEqual(defaultConfig.royaltyBase);
        expect(result.maxBid).toEqual(defaultConfig.maxBid);
        expect(result.minBid).toEqual(defaultConfig.minBid);
        expect(result.createdAt).toEqual(defaultConfig.createdAtTimestamp);
        expect(result.lastBidAt).toEqual(0);
        expect(result.isCanceled).toEqual(false);
    });

    it('init auction and cancel by nft contract without bid', async () => {
        let nftOwnerAddress: SandboxContract<TreasuryContract>;
        nftOwnerAddress = await blockchain.treasury('nftOwnerAddress');
        let result = await nftContract.send({
            value: toNano('1'),
            to : nftAuctionV2.address,
            sendMode : SendMode.PAY_GAS_SEPARATELY,
            body : beginCell()
                    .storeUint(0x05138d91, 32) // op::ownership_assigned
                    .storeUint(0, 64) // query_id
                    .storeAddress(nftOwnerAddress.address) // nft_owner
                    .endCell()
        });

        expect(result.transactions).toHaveTransaction({
            from: nftContract.address,
            to: nftAuctionV2.address,
            success: true,
        });

        let data = await nftAuctionV2.getSaleData();

        expect(data.nftOwnerAddress?.equals(nftOwnerAddress.address)).toEqual(true);
        expect(data.end).toEqual(false);

        // send one more time to get error exit::auction_init - 1001
        result = await nftContract.send({
            value: toNano('1'),
            to : nftAuctionV2.address,
            sendMode : SendMode.PAY_GAS_SEPARATELY,
            body : beginCell()
                    .storeUint(0x05138d91, 32) // op::ownership_assigned
                    .storeUint(0, 64) // query_id
                    .storeAddress(nftOwnerAddress.address) // nft_owner
                    .endCell()
        });

        expect(result.transactions).toHaveTransaction({
            from: nftContract.address,
            to: nftAuctionV2.address,
            success: false,
            exitCode : 1001,
        });

        let user: SandboxContract<TreasuryContract>;
        user = await blockchain.treasury('user');

        result = await nftAuctionV2.sendCancel(user.getSender());

        expect(result.transactions).toHaveTransaction({
            from: user.address,
            to: nftAuctionV2.address,
            success: false,
            exitCode : 403
        });

        result = await nftAuctionV2.sendCancel(nftOwnerAddress.getSender());

        expect(result.transactions).toHaveTransaction({
            from: nftOwnerAddress.address,
            to: nftAuctionV2.address,
            success: true,
        });

        expect(result.transactions).toHaveTransaction({
            from: nftAuctionV2.address,
            to: nftContract.address,
        });

        data = await nftAuctionV2.getSaleData();

        expect(data.isCanceled).toEqual(true);
        expect(data.end).toEqual(true);

        result = await nftAuctionV2.sendCancel(nftOwnerAddress.getSender());

        // send one more time to get error exit::auction_end - 1005
        expect(result.transactions).toHaveTransaction({
            from: nftOwnerAddress.address,
            to: nftAuctionV2.address,
            success: false,
            exitCode : 1005, // exit::auction_end
        });
    });

    it('init auction and cancel by marketplace with bid', async () => {
        let nftOwnerAddress: SandboxContract<TreasuryContract>;
        nftOwnerAddress = await blockchain.treasury('nftOwnerAddress');
        let result = await nftContract.send({
            value: toNano('1'),
            to : nftAuctionV2.address,
            sendMode : SendMode.PAY_GAS_SEPARATELY,
            body : beginCell()
                    .storeUint(0x05138d91, 32) // op::ownership_assigned
                    .storeUint(0, 64) // query_id
                    .storeAddress(nftOwnerAddress.address) // nft_owner
                    .endCell()
        });

        expect(result.transactions).toHaveTransaction({
            from: nftContract.address,
            to: nftAuctionV2.address,
            success: true,
        });

        let data = await nftAuctionV2.getSaleData();

        expect(data.nftOwnerAddress?.equals(nftOwnerAddress.address)).toEqual(true);
        expect(data.end).toEqual(false);

        let buyer1: SandboxContract<TreasuryContract>;
        buyer1 = await blockchain.treasury('buyer1');

        result = await nftAuctionV2.sendBid(buyer1.getSender(), toNano('2'));

        expect(result.transactions).toHaveTransaction({
            from: buyer1.address,
            to: nftAuctionV2.address,
            success: true,
        });

        data = await nftAuctionV2.getSaleData();

        expect(data.lastBidAmount).toEqual(toNano('2'));
        expect(data.lastBidAddress?.equals(buyer1.address)).toEqual(true);


        let buyer2: SandboxContract<TreasuryContract>;
        buyer2 = await blockchain.treasury('buyer2');

        result = await nftAuctionV2.sendBid(buyer2.getSender(), toNano('2'));

        expect(result.transactions).toHaveTransaction({
            from: buyer2.address,
            to: nftAuctionV2.address,
            success: false,
            exitCode : 1000,
        });

        data = await nftAuctionV2.getSaleData();

        expect(data.lastBidAmount).toEqual(toNano('2'));
        expect(data.lastBidAddress?.equals(buyer1.address)).toEqual(true);

        result = await nftAuctionV2.sendBid(buyer2.getSender(), toNano('3'));

        expect(result.transactions).toHaveTransaction({
            from: buyer2.address,
            to: nftAuctionV2.address,
            success: true,
        });

        expect(result.transactions).toHaveTransaction({
            from: nftAuctionV2.address,
            to: buyer1.address,
            body : beginCell().storeUint(0, 32).storeBuffer(Buffer.from('Your bid has been outbid by another user.')).endCell()
        });

        data = await nftAuctionV2.getSaleData();

        expect(data.lastBidAmount).toEqual(toNano('3'));
        expect(data.lastBidAddress?.equals(buyer2.address)).toEqual(true);


        result = await nftAuctionV2.sendCancel(marketplace.getSender());

        expect(result.transactions).toHaveTransaction({
            from: marketplace.address,
            to: nftAuctionV2.address,
            success: true,
        });

        expect(result.transactions).toHaveTransaction({
            from: nftAuctionV2.address,
            to: nftContract.address,
        });

        expect(result.transactions).toHaveTransaction({
            from: nftAuctionV2.address,
            to: buyer2.address,
            body : beginCell().storeUint(0, 32).storeBuffer(Buffer.from('Auction has been cancelled.')).endCell()
        });

        data = await nftAuctionV2.getSaleData();

        expect(data.isCanceled).toEqual(true);
        expect(data.end).toEqual(true);
    });

    it('init auction and stop by nft owner without bid', async () => {
        let nftOwner: SandboxContract<TreasuryContract>;
        nftOwner = await blockchain.treasury('nftOwnerAddress');
        let result = await nftContract.send({
            value: toNano('1'),
            to : nftAuctionV2.address,
            sendMode : SendMode.PAY_GAS_SEPARATELY,
            body : beginCell()
                    .storeUint(0x05138d91, 32) // op::ownership_assigned
                    .storeUint(0, 64) // query_id
                    .storeAddress(nftOwner.address) // nft_owner
                    .endCell()
        });

        expect(result.transactions).toHaveTransaction({
            from: nftContract.address,
            to: nftAuctionV2.address,
            success: true,
        });

        let data = await nftAuctionV2.getSaleData();

        expect(data.nftOwnerAddress?.equals(nftOwner.address)).toEqual(true);
        expect(data.end).toEqual(false);

        let user: SandboxContract<TreasuryContract>;
        user = await blockchain.treasury('user');

        result = await nftAuctionV2.sendStop(user.getSender());

        expect(result.transactions).toHaveTransaction({
            from: user.address,
            to: nftAuctionV2.address,
            success: false,
            exitCode : 403
        });

        result = await nftAuctionV2.sendStop(nftOwner.getSender());

        expect(result.transactions).toHaveTransaction({
            from: nftOwner.address,
            to: nftAuctionV2.address,
            success: true,
        });

        expect(result.transactions).toHaveTransaction({
            from: nftAuctionV2.address,
            to: nftContract.address,
        });

        // should not send fee
        expect(result.transactions).not.toHaveTransaction({
            from: nftAuctionV2.address,
            to: defaultConfig.marketplaceFeeAddress,
        });

        // should send royalty
        expect(result.transactions).not.toHaveTransaction({
            from: nftAuctionV2.address,
            to: defaultConfig.royaltyAddress,
        });

        // should not send sell price to nft owner
        expect(result.transactions).not.toHaveTransaction({
            from: nftAuctionV2.address,
            to: nftOwner.address,
        });
        

        data = await nftAuctionV2.getSaleData();

        expect(data.isCanceled).toEqual(false);
        expect(data.end).toEqual(true);

        result = await nftAuctionV2.sendStop(nftOwner.getSender());

        // send one more time to get error exit::auction_end - 1005
        expect(result.transactions).toHaveTransaction({
            from: nftOwner.address,
            to: nftAuctionV2.address,
            success: false,
            exitCode : 1005, // exit::auction_end
        });
    });

    it('init auction and stop by nft owner with bid', async () => {
        let nftOwner: SandboxContract<TreasuryContract>;
        nftOwner = await blockchain.treasury('nftOwnerAddress');
        let result = await nftContract.send({
            value: toNano('1'),
            to : nftAuctionV2.address,
            sendMode : SendMode.PAY_GAS_SEPARATELY,
            body : beginCell()
                    .storeUint(0x05138d91, 32) // op::ownership_assigned
                    .storeUint(0, 64) // query_id
                    .storeAddress(nftOwner.address) // nft_owner
                    .endCell()
        });

        expect(result.transactions).toHaveTransaction({
            from: nftContract.address,
            to: nftAuctionV2.address,
            success: true,
        });

        let data = await nftAuctionV2.getSaleData();

        expect(data.nftOwnerAddress?.equals(nftOwner.address)).toEqual(true);
        expect(data.end).toEqual(false);

        let buyer1: SandboxContract<TreasuryContract>;
        buyer1 = await blockchain.treasury('buyer1');

        result = await nftAuctionV2.sendBid(buyer1.getSender(), toNano('2'));

        expect(result.transactions).toHaveTransaction({
            from: buyer1.address,
            to: nftAuctionV2.address,
            success: true,
        });

        data = await nftAuctionV2.getSaleData();

        expect(data.lastBidAmount).toEqual(toNano('2'));
        expect(data.lastBidAddress?.equals(buyer1.address)).toEqual(true);

        result = await nftAuctionV2.sendStop(nftOwner.getSender());

        expect(result.transactions).toHaveTransaction({
            from: nftOwner.address,
            to: nftAuctionV2.address,
            success: true,
        });


        // should send transfer message to nft contract
        expect(result.transactions).toHaveTransaction({
            from: nftAuctionV2.address,
            to: nftContract.address,
        });

        // should send fee
        expect(result.transactions).toHaveTransaction({
            from: nftAuctionV2.address,
            to: defaultConfig.marketplaceFeeAddress,
        });

        // should send royalty
        expect(result.transactions).toHaveTransaction({
            from: nftAuctionV2.address,
            to: defaultConfig.royaltyAddress,
        });

        // should send sell price to nft owner
        expect(result.transactions).toHaveTransaction({
            from: nftAuctionV2.address,
            to: nftOwner.address,
        });

        data = await nftAuctionV2.getSaleData();

        expect(data.isCanceled).toEqual(false);
        expect(data.end).toEqual(true);
    });


    it('bid > max_bid', async () => {
        let nftOwner: SandboxContract<TreasuryContract>;
        nftOwner = await blockchain.treasury('nftOwnerAddress');
        let result = await nftContract.send({
            value: toNano('1'),
            to : nftAuctionV2.address,
            sendMode : SendMode.PAY_GAS_SEPARATELY,
            body : beginCell()
                    .storeUint(0x05138d91, 32) // op::ownership_assigned
                    .storeUint(0, 64) // query_id
                    .storeAddress(nftOwner.address) // nft_owner
                    .endCell()
        });


        let data = await nftAuctionV2.getSaleData();

        expect(data.end).toEqual(false);


        let buyer1: SandboxContract<TreasuryContract>;
        buyer1 = await blockchain.treasury('buyer1');

        result = await nftAuctionV2.sendBid(buyer1.getSender(), toNano('105'));

        expect(result.transactions).toHaveTransaction({
            from: buyer1.address,
            to: nftAuctionV2.address,
            success: true,
        });

        // should send transfer message to nft contract
        expect(result.transactions).toHaveTransaction({
            from: nftAuctionV2.address,
            to: nftContract.address,
        });

        // should send fee
        expect(result.transactions).toHaveTransaction({
            from: nftAuctionV2.address,
            to: defaultConfig.marketplaceFeeAddress,
        });

        // should send royalty
        expect(result.transactions).toHaveTransaction({
            from: nftAuctionV2.address,
            to: defaultConfig.royaltyAddress,
        });

        // should send sell price to nft owner
        expect(result.transactions).toHaveTransaction({
            from: nftAuctionV2.address,
            to: nftOwner.address,
        });

        data = await nftAuctionV2.getSaleData();

        expect(data.end).toEqual(true);
    });


    it('max_bid = 0 is ok', async () => {
        let defaultConfigTemp = { ...defaultConfig };
        defaultConfigTemp.maxBid = toNano('0');

        let nftAuctionV2Temp: SandboxContract<NftAuctionV2>;
        nftAuctionV2Temp = blockchain.openContract(NftAuctionV2.createFromConfig(defaultConfigTemp, code));

        await nftAuctionV2Temp.sendDeploy(marketplace.getSender(), toNano('0.05'));

        let nftOwner: SandboxContract<TreasuryContract>;
        nftOwner = await blockchain.treasury('nftOwnerAddress');

        let result = await nftContract.send({
            value: toNano('1'),
            to : nftAuctionV2Temp.address,
            sendMode : SendMode.PAY_GAS_SEPARATELY,
            body : beginCell()
                    .storeUint(0x05138d91, 32) // op::ownership_assigned
                    .storeUint(0, 64) // query_id
                    .storeAddress(nftOwner.address) // nft_owner
                    .endCell()
        });


        let data = await nftAuctionV2Temp.getSaleData();

        expect(data.end).toEqual(false);


        let buyer1: SandboxContract<TreasuryContract>;
        buyer1 = await blockchain.treasury('buyer1');

        result = await nftAuctionV2Temp.sendBid(buyer1.getSender(), toNano('5'));

        expect(result.transactions).toHaveTransaction({
            from: buyer1.address,
            to: nftAuctionV2Temp.address,
            success: true,
        });

        data = await nftAuctionV2Temp.getSaleData();

        expect(data.end).toEqual(false);
    });


    it('fee, royalty factor and base are zeros', async () => {
        let defaultConfigTemp = { ...defaultConfig };
        defaultConfigTemp.marketplaceFeeBase = 0n;
        defaultConfigTemp.marketplaceFeeFactor = 0n;
        defaultConfigTemp.royaltyBase = 0n;
        defaultConfigTemp.royaltyFactor = 0n;

        let nftAuctionV2Temp: SandboxContract<NftAuctionV2>;
        nftAuctionV2Temp = blockchain.openContract(NftAuctionV2.createFromConfig(defaultConfigTemp, code));

        const deployResult = await nftAuctionV2Temp.sendDeploy(marketplace.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: marketplace.address,
            to: nftAuctionV2Temp.address,
            deploy: true,
            success: true,
        });

        let nftOwner: SandboxContract<TreasuryContract>;
        nftOwner = await blockchain.treasury('nftOwnerAddress');
        let result = await nftContract.send({
            value: toNano('1'),
            to : nftAuctionV2Temp.address,
            sendMode : SendMode.PAY_GAS_SEPARATELY,
            body : beginCell()
                    .storeUint(0x05138d91, 32) // op::ownership_assigned
                    .storeUint(0, 64) // query_id
                    .storeAddress(nftOwner.address) // nft_owner
                    .endCell()
        });


        let data = await nftAuctionV2Temp.getSaleData();

        expect(data.end).toEqual(false);


        let buyer1: SandboxContract<TreasuryContract>;
        buyer1 = await blockchain.treasury('buyer1');

        result = await nftAuctionV2Temp.sendBid(buyer1.getSender(), toNano('105'));

        expect(result.transactions).toHaveTransaction({
            from: buyer1.address,
            to: nftAuctionV2Temp.address,
            success: true,
        });

        // should send transfer message to nft contract
        expect(result.transactions).toHaveTransaction({
            from: nftAuctionV2Temp.address,
            to: nftContract.address,
        });

        // should not send fee
        expect(result.transactions).not.toHaveTransaction({
            from: nftAuctionV2Temp.address,
            to: defaultConfig.marketplaceFeeAddress,
        });

        // should not send royalty
        expect(result.transactions).not.toHaveTransaction({
            from: nftAuctionV2Temp.address,
            to: defaultConfig.royaltyAddress,
        });

        // should send sell price to nft owner
        expect(result.transactions).toHaveTransaction({
            from: nftAuctionV2Temp.address,
            to: nftOwner.address,
        });

        data = await nftAuctionV2Temp.getSaleData();

        expect(data.end).toEqual(true);
    });


    it('fee, royalty factor are zeros', async () => {
        let defaultConfigTemp = { ...defaultConfig };
        defaultConfigTemp.marketplaceFeeFactor = 0n;
        defaultConfigTemp.royaltyFactor = 0n;

        let nftAuctionV2Temp: SandboxContract<NftAuctionV2>;
        nftAuctionV2Temp = blockchain.openContract(NftAuctionV2.createFromConfig(defaultConfigTemp, code));

        const deployResult = await nftAuctionV2Temp.sendDeploy(marketplace.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: marketplace.address,
            to: nftAuctionV2Temp.address,
            deploy: true,
            success: true,
        });

        let nftOwner: SandboxContract<TreasuryContract>;
        nftOwner = await blockchain.treasury('nftOwnerAddress');
        let result = await nftContract.send({
            value: toNano('1'),
            to : nftAuctionV2Temp.address,
            sendMode : SendMode.PAY_GAS_SEPARATELY,
            body : beginCell()
                    .storeUint(0x05138d91, 32) // op::ownership_assigned
                    .storeUint(0, 64) // query_id
                    .storeAddress(nftOwner.address) // nft_owner
                    .endCell()
        });


        let data = await nftAuctionV2Temp.getSaleData();

        expect(data.end).toEqual(false);


        let buyer1: SandboxContract<TreasuryContract>;
        buyer1 = await blockchain.treasury('buyer1');

        result = await nftAuctionV2Temp.sendBid(buyer1.getSender(), toNano('105'));

        expect(result.transactions).toHaveTransaction({
            from: buyer1.address,
            to: nftAuctionV2Temp.address,
            success: true,
        });

        // should send transfer message to nft contract
        expect(result.transactions).toHaveTransaction({
            from: nftAuctionV2Temp.address,
            to: nftContract.address,
        });

        // should not send fee
        expect(result.transactions).not.toHaveTransaction({
            from: nftAuctionV2Temp.address,
            to: defaultConfig.marketplaceFeeAddress,
        });

        // should not send royalty
        expect(result.transactions).not.toHaveTransaction({
            from: nftAuctionV2Temp.address,
            to: defaultConfig.royaltyAddress,
        });

        // should send sell price to nft owner
        expect(result.transactions).toHaveTransaction({
            from: nftAuctionV2Temp.address,
            to: nftOwner.address,
        });

        data = await nftAuctionV2Temp.getSaleData();

        expect(data.end).toEqual(true);
    });


    it('bid at last moment', async () => {
        let defaultConfigTemp = { ...defaultConfig };
        defaultConfigTemp.endTimestamp = nowTimeStamp + 60;

        let nftAuctionV2Temp: SandboxContract<NftAuctionV2>;
        nftAuctionV2Temp = blockchain.openContract(NftAuctionV2.createFromConfig(defaultConfigTemp, code));

        const deployResult = await nftAuctionV2Temp.sendDeploy(marketplace.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: marketplace.address,
            to: nftAuctionV2Temp.address,
            deploy: true,
            success: true,
        });

        let nftOwner: SandboxContract<TreasuryContract>;
        nftOwner = await blockchain.treasury('nftOwnerAddress');
        let result = await nftContract.send({
            value: toNano('1'),
            to : nftAuctionV2Temp.address,
            sendMode : SendMode.PAY_GAS_SEPARATELY,
            body : beginCell()
                    .storeUint(0x05138d91, 32) // op::ownership_assigned
                    .storeUint(0, 64) // query_id
                    .storeAddress(nftOwner.address) // nft_owner
                    .endCell()
        });


        let data = await nftAuctionV2Temp.getSaleData();

        const beforeEndTime = data.endTimestamp;

        let buyer1: SandboxContract<TreasuryContract>;
        buyer1 = await blockchain.treasury('buyer1');

        result = await nftAuctionV2Temp.sendBid(buyer1.getSender(), toNano('5'));

        data = await nftAuctionV2Temp.getSaleData();

        expect(data.endTimestamp).toEqual(beforeEndTime + defaultConfigTemp.stepTimeSeconds);
    });


    it('stop auction by last member after end time', async () => {
        let nftOwner: SandboxContract<TreasuryContract>;
        nftOwner = await blockchain.treasury('nftOwnerAddress');
        let result = await nftContract.send({
            value: toNano('1'),
            to : nftAuctionV2.address,
            sendMode : SendMode.PAY_GAS_SEPARATELY,
            body : beginCell()
                    .storeUint(0x05138d91, 32) // op::ownership_assigned
                    .storeUint(0, 64) // query_id
                    .storeAddress(nftOwner.address) // nft_owner
                    .endCell()
        });


        let data = await nftAuctionV2.getSaleData();

        expect(data.end).toEqual(false);

        let buyer1: SandboxContract<TreasuryContract>;
        buyer1 = await blockchain.treasury('buyer1');

        result = await nftAuctionV2.sendBid(buyer1.getSender(), toNano('5'));

        data = await nftAuctionV2.getSaleData();

        expect(data.end).toEqual(false);
        expect(data.lastBidAddress?.equals(buyer1.address)).toEqual(true);

        blockchain.now = data.endTimestamp + 60;

        result = await nftAuctionV2.sendStop(buyer1.getSender());

        // should send transfer message to nft contract
        expect(result.transactions).toHaveTransaction({
            from: nftAuctionV2.address,
            to: nftContract.address,
        });

        // should send fee
        expect(result.transactions).toHaveTransaction({
            from: nftAuctionV2.address,
            to: defaultConfig.marketplaceFeeAddress,
        });

        // should send royalty
        expect(result.transactions).toHaveTransaction({
            from: nftAuctionV2.address,
            to: defaultConfig.royaltyAddress,
        });

        // should send sell price to nft owner
        expect(result.transactions).toHaveTransaction({
            from: nftAuctionV2.address,
            to: nftOwner.address,
        });

        data = await nftAuctionV2.getSaleData();

        expect(data.end).toEqual(true);
    });


    it('send repeat_end_auction', async () => {
        let result = await nftAuctionV2.sendRepeatEndAuction(marketplace.getSender(), toNano('1'));

        expect(result.transactions).toHaveTransaction({
            from: marketplace.address,
            to: nftAuctionV2.address,
            success : true,
        });

        expect(result.transactions).toHaveTransaction({
            from: nftAuctionV2.address,
            to: nftContract.address,
        });
    });

    it('send emergency_message', async () => {
        const rndAddress = randomAddress();
        const msg = beginCell()
                                .storeUint(0x18, 6)
                                .storeAddress(rndAddress)
                                .storeCoins(toNano('1'))
                                .storeUint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
                                .storeUint(123, 32)
                                .endCell();
        let result = await nftAuctionV2.sendEmergencyMessage(marketplace.getSender(), toNano('5'), {mode: 1, msg: msg});

        expect(result.transactions).toHaveTransaction({
            from: marketplace.address,
            to: nftAuctionV2.address,
            success : true,
        });

        expect(result.transactions).toHaveTransaction({
            from: nftAuctionV2.address,
            to: rndAddress,
            body : beginCell().storeUint(123, 32).endCell()
        });
    });

});
