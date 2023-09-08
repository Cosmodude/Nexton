import "@stdlib/deploy";

message Transfer{
    newOwner: Address;
}

contract FakeItem with Deployable {
    const MinTonForStorage: Int = ton("0.02");
    owner: Address;
    
    init() {
        self.owner = sender();
    }

    receive(){}

    receive(msg: Transfer){
        self.owner = msg.newOwner;
        require(context().value>= ton("0.07"), "not enough to pay for gas");
        send(SendParameters{
            to: sender(),
            value: context().value - ton("0.05"),
            mode: SendIgnoreErrors,
            body: "Ownership transfered!".asComment()
        });
    }

    get fun owner(): Address{
        return self.owner;
    }
}
