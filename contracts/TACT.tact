import "@stdlib/deploy";

message CounterValue {
    amount: Int as uint32;
}

message AddResponse {
    amount: Int as uint32;
}

message Add {
    amount: Int as uint32;
}

contract TACT with Deployable {
    counter: Int as uint32;

    //constructor
    init() {
        self.counter = 0;
    }

    // Just receive TONCoins
    receive(){
        throw(1);
    }

    // step 4
    receive("increment"){
        self.counter = self.counter + 1;
        self.reply(CounterValue{amount: self.counter}.toCell());
    }
    
    // step 2
    receive("query"){
        self.reply(CounterValue{amount: self.counter}.toCell());
    }

    receive(msg: Add) {
        self.counter = (self.counter + msg.amount);
        send(SendParameters{
            to: sender(),
            value: 0,
            mode: SendRemainingValue + SendIgnoreErrors,
            body: AddResponse{amount: self.counter}.toCell()
        });
    }

    bounced(src: AddResponse){
       self.counter = (self.counter - msg.amount);
    }

    // get methods
    get fun counter(): Int {
        return self.counter;
    }

}
