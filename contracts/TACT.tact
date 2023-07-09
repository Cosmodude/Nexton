import "@stdlib/deploy";

message Add {
    contractId: Int as uint64;
    amount: Int as uint32;
}

contract TACT with Deployable {
    id: Int as uint32; 
    counter: Int as uint32;

    //constructor
    init(id: Int) {
        self.id = id;
        self.counter = 0;
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

    get fun id(): Int {
        return self.id;
    }
}
