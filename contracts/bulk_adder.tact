import "@stdlib/deploy";

message Reach{
    counterContract: Address;
    target: Int as uint32;
}

message CallAdd {
    counterContract: Address;
    amount: Int as uint32;
}

message Add {
    amount: Int as uint32;
}

message AddResponse {
    amount: Int as uint32;
    adr: Address;
}

message CounterValue {
    amount: Int as uint32;
}

contract BulkAdder with Deployable {

    target: Int as uint32;

    init() {
        self.target = 0;
    }

    receive(){}
    // step 1
    receive(msg: Reach){
        require(msg.target<=10, "Target can't be more than 10");
        self.target = msg.target;
        send(SendParameters{
            to: msg.counterContract,
            value: 0,
            mode: SendRemainingValue + SendIgnoreErrors,
            body: "query".asComment()
        });
    }

    // step 3
    receive(msg: CounterValue){
        if(self.target>msg.amount){
            send(SendParameters{
                to: sender(),
                value: 0,
                mode: SendRemainingValue + SendIgnoreErrors,
                body: "increment".asComment()
        });
        }
    }

    receive(msg: CallAdd){
        send(SendParameters{
            to: msg.counterContract,
            value: 0,
            mode: SendRemainingValue + SendIgnoreErrors,
            body: Add{amount: msg.amount}.toCell()
        });
    }

   

}
