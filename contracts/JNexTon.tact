import "@stdlib/deploy";
import "@stdlib/ownable";
import "@stdlib/stoppable";
import "./imports/nextonMessages";
import "./imports/stdlib.fc";
import "./imports/consts.fc";

const PROTOCOL_FEE: Int = ton("0.1");
const MIN_USER_DEPOSIT: Int = ton("1"); 
const MIN_CONTRACT_BALANCE: Int = ton("0.2");
const DEFAULT_LOCK_PERIOD: Int = 5184000; // 60 days
// 60 days = 5184000; 90 days = 7776000; 180 days = 15552000; 365 days = 31536000
const APR_BASE_DEVISOR: Int = 10000;  // 10000 = 100%

@name(equal_slices)
native equal_slices(s2: Slice, s1: Slice): Int;

@name(store_dict)
extends native storeDict(self: Builder, c: Cell): Builder;

struct DictLoadRes{
    slice: Slice;
    dict: Cell;
}

@name(load_dict)
extends native loadDict(self: Slice): DictLoadRes;

struct DictGetRes{
    cell: Cell;
    success: Int;
}

@name(udict_get_ref?)
extends native udictGetRef(self: Cell, kl: Int, k: Int): DictGetRes;

contract JNexTon with Deployable, OwnableTransferable, Resumable{
    const MinTonForStorage: Int = ton("0.2");
    owner: Address;
    stopped: Bool = false;
    nftItemCode: Cell;
    jettonWalletCode: Cell;

    nFTContractAddress: Address;  // NFT Collection Address
    jettonMinterAddress: Address;  // Jetton Minter Address

    myWallet: Address?;      // Jetton Wallet address for this contract 
    apr: Int = 1000; // 10% per year
    itemContent: map<Int as uint256, Cell>;
    itemCounter: Int as uint64 = 0;   // next_item_index

    usersPrincipal: Int as coins = 0;
    latestStakeBlockTime: Int as uint256;
    lockPeriod: Int as uint256 = 0;
    
    init(nftItemCode: Cell, _nft: Address, jettonWalletCode: Cell, _jetton: Address) {
        self.owner = sender();
        self.nftItemCode = nftItemCode;
        self.nFTContractAddress = _nft;
        self.jettonWalletCode = jettonWalletCode;
        self.jettonMinterAddress = _jetton;
        self.latestStakeBlockTime = 0;  
        self.lockPeriod = DEFAULT_LOCK_PERIOD;
        self.myWallet = null;

        self.itemContent.set(sha256("name"), beginCell().storeUint(0, 8).storeSlice("Nexton Staking Derivative".asSlice()).endCell());
        self.itemContent.set(sha256("description"), beginCell().storeUint(0, 8).storeSlice("Holds information about the user's stake in the Nexton platform pool".asSlice()).endCell());
        self.itemContent.set(sha256("image"), beginCell().storeUint(0, 8).storeSlice("https://raw.githubusercontent.com/Nex-TON/Nexton_Contracts/main/NewItem_Image.jpg".asSlice()).endCell());
        self.itemContent.set(sha256("social_links"), beginCell().storeUint(0, 8).storeSlice("['https://twitter.com/NextonNode', 'https://www.nexton.solutions/', 'https://t.me/nextonglobal' ]".asSlice()).endCell());
        
        send(SendParameters{
                to: self.jettonMinterAddress,
                value: ton("0.05") + context().readForwardFee(), // int  transfer_val = CONF::MAX_GAS + msg::fwd_fee;
                mode: SendIgnoreErrors | SendPayGasSeparately,
                body: ProvideWallet {
                    queryId: 1,
                    ownerAddress: myAddress(),
                    includeAddress: false
                }.toCell()
        });
    }

    // Receive functions
    receive(msg: SetWalletAddress) {
        require(self.myWallet == null, "Wallet Address already set");
        require(sender() == self.jettonMinterAddress, "Wrong Wallet Address sender");
        self.myWallet = msg.walletAddress;
        send(SendParameters{
                to: self.owner,
                value: 1,
                mode: SendIgnoreErrors | SendRemainingValue,
                body: "Jetton Wallet Address Set".asComment()
        });
    }

    receive(){} // Receive TONCoins

    // todo add atributes using stringBuilder
    receive(msg: TransferNotification){
        self.requireNotStopped();
        let ctx: Context = context();
        require(self.myWallet == ctx.sender, "Invalid transfer notification sender!");

        nativeReserve(max(MIN_CONTRACT_BALANCE, myBalance() - ctx.value), 0);

        if(msg.amount < MIN_USER_DEPOSIT){
            send(SendParameters{
                to: ctx.sender,
                value: 0,
                mode: SendIgnoreErrors | SendRemainingValue,
                body: JettonTransfer {
                    queryId: msg.queryId,
                    amount: msg.amount,
                    destination: msg.from,
                    response_destination: msg.from,
                    custom_payload: null,
                    forward_ton_amount: 1,
                    forward_payload: "Too small jettons deposit amount".asComment().asSlice()
                }.toCell()
            });
            return;
        }

        self.latestStakeBlockTime = now(); // returns the current unix time in seconds

        self.itemContent.set(sha256("principal"), beginCell().storeUint(0, 8).storeCoins(msg.amount - PROTOCOL_FEE).endCell());
        self.itemContent.set(sha256("lockPeriod"), beginCell().storeUint(0, 8).storeUint(self.lockPeriod, 256).endCell());
        self.itemContent.set(sha256("lockEnd"), beginCell().storeUint(0, 8).storeUint(self.lockPeriod + self.latestStakeBlockTime, 256).endCell());
        
        let itemMessage: Cell = 
            beginCell()
            .storeAddress(msg.from)  //itemOwnerAddress
            .storeAddress(myAddress())  // setting nexton_aadress for nft_item
            .storeRef(beginCell().storeUint(0,8).storeDict(self.itemContent.asCell()!!).endCell())
            .endCell();
        let messageBody: MintNFT =  MintNFT{
            queryId: msg.queryId,
            itemIndex: self.itemCounter, // nftItemIndex
            amount: 0,
            NFTMessage: itemMessage //  NFTMessage: buildItemMessage(sender(), ctx.value - PROTOCOL_FEE, msg.leverage, msg.lockPeriod)
        };
        self.mintNFT(messageBody);

        self.usersPrincipal = self.usersPrincipal + msg.amount - PROTOCOL_FEE;
        self.itemContent.set(sha256("principal"), beginCell().storeUint(0, 8).storeCoins(0).endCell());
        self.itemContent.set(sha256("lockEnd"), beginCell().storeUint(0, 8).storeUint(0, 256).endCell());
    }

    bounced(src: bounced<MintNFT>) {
        self.itemCounter = self.itemCounter - 1;
    }

    receive(msg: ClaimNotification){
        self.requireNotStopped();
        let itemIndex: Int = msg.payload.itemIndex;
        require(self.itemCounter > itemIndex, "Claiming not exisitng NFT");
        let ctx: Context = context();
        require(self.nftAddressByIndex(itemIndex) == ctx.sender, "Invalid sender! Sent not from the nft item!"); // Safety check
        nativeReserve(max(MIN_CONTRACT_BALANCE, myBalance() - ctx.value), 0);

        let owner: Address = msg.payload.owner;
        // reading content 
        let contentS: Slice = msg.payload.content.beginParse();
        nativeThrowUnless(905, contentS.loadUint(8) == 0);
        let contDict: DictLoadRes = contentS.loadDict();  
        nativeThrowUnless(906, contDict.dict != null);

        // checking lockEnd
        let lockEndRes: DictGetRes = contDict.dict.udictGetRef(256, sha256("lockEnd"));
        nativeThrowUnless(907, lockEndRes.success == -1);
        let lockEndS: Slice = lockEndRes.cell.beginParse();
        // skipping the prefix
        let prefix: Int = lockEndS.loadUint(8);
        nativeThrowUnless(908, prefix == 0);
        let lockEnd: Int = lockEndS.loadUint(256);
        nativeThrowUnless(909, lockEnd >= now());

        // reading principal
        let principalRes: DictGetRes = contDict.dict.udictGetRef(256, sha256("principal"));
        nativeThrowUnless(910, principalRes.success == -1);
        let principalS: Slice = principalRes.cell.beginParse();
        // skipping the prefix
        prefix = principalS.loadUint(8);
        nativeThrowUnless(911, prefix == 0);
        let principal: Int = principalS.loadCoins();
        nativeThrowUnless(912, principal > 0);

        self.usersPrincipal = self.usersPrincipal - principal;

        //reading lockPeriod
        let lockPeriodRes: DictGetRes = contDict.dict.udictGetRef(256, sha256("lockPeriod"));
        nativeThrowUnless(913, lockPeriodRes.success == -1);
        let lockPeriodS: Slice = lockPeriodRes.cell.beginParse();
        // skipping the prefix
        prefix = lockPeriodS.loadUint(8);
        nativeThrowUnless(914, prefix == 0);   
        let lockPeriod: Int = lockPeriodS.loadUint(256);
        nativeThrowUnless(915, lockPeriod > 0);

        let reward: Int = principal * lockPeriod * self.apr / 31536000 / APR_BASE_DEVISOR; // 31536000 = seconds in a year

        send(SendParameters{
                to: self.myWallet!!,
                value: 0,
                mode: SendIgnoreErrors | SendRemainingValue,
                body: JettonTransfer {
                    queryId: msg.queryId,
                    amount: reward + principal,
                    destination: owner,
                    response_destination: owner,
                    custom_payload: null,
                    forward_ton_amount: 1,
                    forward_payload: "Nexton reward".asComment().asSlice()
                }.toCell()
        });

    }

    // todo: test
    receive(msg: OwnerWithdraw) {
        self.requireOwner();
        let ctx: Context = context();
        nativeReserve(max(MIN_CONTRACT_BALANCE, myBalance() - ctx.value), 0);
        require(ctx.value >= ton("0.02"), "Not enough Ton to proccess withdraw");
        send(SendParameters{
            to: self.myWallet!!,
            value: 0,
            mode: SendIgnoreErrors | SendRemainingValue,
            body: JettonTransfer {
                queryId: msg.queryId,
                amount: msg.amount,
                destination: ctx.sender,
                response_destination: ctx.sender,
                custom_payload: null,
                forward_ton_amount: 1,
                forward_payload: "Owner Withdraw".asComment().asSlice()
            }.toCell()
        });
    }

    receive(msg: SetLockPeriod){
        self.requireOwner();
        self.lockPeriod = msg.lockPeriod;
    }

    receive(msg: SetApr){
        self.requireOwner();
        self.apr= msg.apr;
    }

    // Functions
    
    fun mintNFT(body: MintNFT){
        send(SendParameters{
            to: self.nFTContractAddress,
            value: ton("0.04"),
            mode: SendPayGasSeparately | SendIgnoreErrors,
            body: body.toCell()
        });
        self.itemCounter = self.itemCounter + 1;
    }

    fun getNftItemInit(itemIndex: Int): StateInit {
        let data: Cell = beginCell().storeUint(itemIndex,64).storeSlice(self.nFTContractAddress.asSlice()).endCell();
        let itemInit: StateInit = StateInit{
            data: data,
            code: self.nftItemCode
        }; 
        return itemInit;
    }

    fun getJettonWalletInit(owner: Address): StateInit {
        let data: Cell = beginCell().storeCoins(0).storeSlice(owner.asSlice()).storeSlice(self.jettonMinterAddress.asSlice()).storeRef(self.jettonWalletCode).endCell();
        let walletInit: StateInit = StateInit{
            data: data,
            code: self.jettonWalletCode
        }; 
        return walletInit;
    }

    // GET methods

    get fun nftAddressByIndex(itemIndex: Int): Address {
        return contractAddress(self.getNftItemInit(itemIndex));        
    }

    get fun walletAddressByOwner(owner: Address): Address {
        return contractAddress(self.getJettonWalletInit(owner));        
    }

    get fun collectionAddress(): Address{
        return self.nFTContractAddress;
    }

    get fun jettonAddress(): Address{
        return self.jettonMinterAddress;
    }

    get fun myJettonWallet(): Address{
        return self.myWallet!!;
    }

    get fun staked(): Int{
        return self.usersPrincipal;
    }

    get fun nftCounter(): Int{
        return self.itemCounter;
    }

    get fun lockPeriod(): Int{
        return self.lockPeriod;
    }

    get fun apr(): Int{
        return self.apr;
    }
}
