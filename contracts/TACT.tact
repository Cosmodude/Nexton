import "@stdlib/deploy";

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

    }

    receive("increment"){
        self.counter = self.counter + 1;
    }
    
    receive(msg: Add) {
        self.counter = (self.counter + msg.amount);
    }

    // get methods
    get fun counter(): Int {
        return self.counter;
    }

}
