// https://github.com/ton-core/tact/blob/main/stdlib/libs/jetton/master.tact
import "@stdlib/jetton";
import "@stdlib/ownable";

message Mint {
    amount: Int;
}

contract ILPJetton with Jetton {

    totalSupply: Int as coins;
    owner: Address;
    content: Cell?;
    mintable: Bool;

    init(owner: Address, content: Cell?) {
        self.totalSupply = 0;
        self.owner = owner;
        self.mintable = true;
        self.content = content;
    }

    receive(msg: Mint) {
        let ctx: Context = context();
        self.mint(ctx.sender, msg.amount, ctx.sender); // (to, amount, responseAddr)
    }

    receive("Mint!") {
        let ctx: Context = context();
        self.mint(ctx.sender, 1000000000, ctx.sender);
    }
}
