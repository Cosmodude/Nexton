import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, Address, Cell } from '@ton/core';
import '@ton/test-utils';
import { NftCollection } from '../wrappers/NftCollection';
import { NftItem } from '../wrappers/NftItem';
import { JNexTon } from '../wrappers/JNexton';
import { JettonWallet } from '../wrappers/jettonWallet';
import { JettonMinter } from '../wrappers/jettonMinter';
import { buildCollectionContentCell, toSha256 } from '../scripts/contentUtils/onChain';
import { randomAddress } from '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('JNexton', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('NftCollection');
    }, 10000);

    let blockchain: Blockchain;
    let jNexton: SandboxContract<JNexTon>;
    let nftCollection: SandboxContract<NftCollection>;
    let nftItem: SandboxContract<NftItem>;
    let jettonMinter: SandboxContract<JettonMinter>;
    let deployer: SandboxContract<TreasuryContract>;
    let user: SandboxContract<TreasuryContract>;

    let myAddress: Address = Address.parse("kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu");
    

    const nextonSetup = {
        ownerAddress: myAddress,
        lockPeriod: 5184000,
        userDeposit: BigInt(1e6),
        protocolFee: toNano("0.1"),
    }

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        user = await blockchain.treasury('user');
        // create nft collection
        nftCollection = blockchain.openContract(await NftCollection.createFromConfig({
            ownerAddress: deployer.address,
            nextItemIndex: 0,
            collectionContent: buildCollectionContentCell({
                name: "Collection name",
                description: "Collection description",
                image: "https://hipo.finance/hton.png"
            }),
            nftItemCode: await compile("NftItem"),
            royaltyParams: {
                royaltyFactor: 15,
                royaltyBase: 100,
                royaltyAddress: deployer.address
            }
        }, code));

        const nftCollectionDeployResult = await nftCollection.sendDeploy(deployer.getSender(), toNano('0.1'));

        expect(nftCollectionDeployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftCollection.address,
            deploy: true,
            success: true,
        });

        jettonMinter = blockchain.openContract(await JettonMinter.createFromConfig({
            admin: deployer.address,
            content: buildCollectionContentCell({
                name: "Jetton name",
                description: "Jetton description",
                image: "https://hipo.finance/hton.png"
            }),
            wallet_code: await compile("JettonWallet"),
        }, await compile("JettonMinter")));

        const jettonMinterDeployResult = await jettonMinter.sendDeploy(deployer.getSender(), toNano('0.1'));    

        expect(jettonMinterDeployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMinter.address,
            deploy: true,
            success: true,
        });

        const mintTx = await jettonMinter.sendMint(
            deployer.getSender(),
            user.address,
            0n,
            BigInt(2e6),
            toNano('0.1'),
            toNano('0.3'),
        );

        const userWalletAddr = await jettonMinter.getWalletAddress(user.address);

        const userWallet = blockchain.openContract(await JettonWallet.createFromAddress(userWalletAddr));

        expect(await userWallet.getJettonBalance()).toEqual(nextonSetup.userDeposit * 2n);

        jNexton = blockchain.openContract(await JNexTon.fromInit(await compile("NftItem"), nftCollection.address, await compile("JettonWallet"), jettonMinter.address));

        const deployResult = await jNexton.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jNexton.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and jNexton are ready to use
    });
});
