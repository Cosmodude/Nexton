import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Cell, toNano, beginCell, Address } from 'ton-core';
import { NftCollection, buildNftCollectionContentCell} from '../wrappers/NftCollection';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('NftCollection', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('NftCollection');
    });

    let blockchain: Blockchain;
    let nftCollection: SandboxContract<NftCollection>;
    let deployer;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');

        const initConfig =  {
            owner: deployer.address,
            nextItemIndex: 0
        };
        nftCollection = blockchain.openContract(NftCollection.createFromConfig({
            ownerAddress: deployer.address,
            nextItemIndex: 0,
            collectionContent: buildNftCollectionContentCell({
                collectionContent: 'https://raw.githubusercontent.com/Cosmodude/Invincible_LS/main/sampleMetadata.json',
                commonContent: 'https://github.com/Cosmodude/Invincible_LS/blob/main/sampleMetadata.json'
            }),
            nftItemCode: await compile("NftItem"),
            royaltyParams: {
                royaltyFactor: 15,
                royaltyBase: 100,
                royaltyAddress: deployer.address
            }
        }, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await nftCollection.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftCollection.address,
            deploy: true,
            success: true,
        });

        nftCollection.getCollectionData();
       
        let collectionData = await nftCollection.getCollectionData();
        expect(collectionData.ownerAddress).toEqualAddress(deployer.address);
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and nftCollection are ready to use
    });
});
