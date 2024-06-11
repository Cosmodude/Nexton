import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano, Dictionary, beginCell } from '@ton/core';
import { NexTon } from '../wrappers/NexTon';
import { NftItem } from '../wrappers/NftItem';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { randomAddress } from '@ton/test-utils';
import { toSha256, toTextCell } from '../scripts/contentUtils/onChain';

describe('NftItem', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('NftItem');
    });

    let blockchain: Blockchain;
    let nftItem: SandboxContract<NftItem>;
    let deployer: SandboxContract<TreasuryContract>;
    let nexton: SandboxContract<NexTon>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        
        nexton = blockchain.openContract(await NexTon.fromInit(await compile("NftItem"), randomAddress()));

        deployer = await blockchain.treasury('deployer');

        nftItem = blockchain.openContract(NftItem.createFromConfig({
            index: 0, 
            collectionAddress: randomAddress(),
            ownerAddress: deployer.address,
            nextonAddress: nexton.address,
            itemContent: beginCell()
            .storeUint(0,8)  // onchain prefix
            .storeDict(Dictionary.empty(Dictionary.Keys.BigUint(257), Dictionary.Values.Cell())
            .set(toSha256("name"), toTextCell("Item name"))
            .set(toSha256("description"), toTextCell("Holds information about the user's stake in the Nexton platform pool"))
            .set(toSha256("image"), toTextCell(" "))
            .set(toSha256("lockPeriod"), beginCell().storeUint(0, 8).storeUint(600, 256).endCell()))
            .endCell()
        }, code));

        const deployResult = await nftItem.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftItem.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and nftItem are ready to use
    });

    it("should get item data", async () => {
        const itemData = await nftItem.getItemData();
        const index = itemData.index;
        const itemContentSlice = itemData.itemContent.beginParse();
        const prefix = itemContentSlice.loadUint(8);
        expect(prefix).toEqual(0);
        const dict = itemContentSlice.loadDict((Dictionary.Keys.BigUint(257)), Dictionary.Values.Cell());
        const nameCell = dict.get(toSha256("name"));
        //console.log(index)
    })

    it("should transfer to nexton freely", async () => {
        const claim = await nftItem.sendTransfer(
            deployer.getSender(),
            {
                queryId: Date.now(),
                value: toNano("0.2"),
                newOwner: nexton.address,
                responseAddress: deployer.address,
                fwdAmount: toNano("0.1")
            }
        )
        //console.log(claim.transactions)
        //console.log(index)
    })

});
