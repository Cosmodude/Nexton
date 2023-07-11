import "@stdlib/deploy";

message Reach{
    counterContract: Address;
    target: Int as uint32;
}

message CounterValue {
    amount: Int as uint32;
}

contract BulkAdder with Deployable {

    target: Int as uint32;
    init() {
        self.target = 0;
    }

    // step 1
    receive(msg: Reach){
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

}
