import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, Address, Cell } from '@ton/core';
import '@ton/test-utils';
import { JNexton } from '../wrappers/JNexton';
import { NftCollection } from '../wrappers/NftCollection';
import { NftItem } from '../wrappers/NftItem';
import { buildCollectionContentCell, toSha256 } from '../scripts/contentUtils/onChain';
import { randomAddress } from '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('JNexton', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('NftCollection');
    }, 10000);

    let blockchain: Blockchain;
    let jNexton: SandboxContract<JNexton>;
    let nftCollection: SandboxContract<NftCollection>;
    let nftItem: SandboxContract<NftItem>;
    let deployer: SandboxContract<TreasuryContract>;

    let myAddress: Address = Address.parse("kQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dTBu");
    

    const nextonSetup = {
        ownerAddress: myAddress,
        lockPeriod: 5184000,
        userDeposit: toNano("2") + toNano("0.1"),
        protocolFee: toNano("0.1"),
    }
    
    beforeEach(async () => {
        blockchain = await Blockchain.create();

        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');

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

        jNexton = blockchain.openContract(await JNexton.fromInit());

        deployer = await blockchain.treasury('deployer');

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
