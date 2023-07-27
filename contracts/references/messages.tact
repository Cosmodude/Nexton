import "@stdlib/deploy";

message Withdraw{
    amount: Int as coins;
}

contract Messages with Deployable {
    const MinTonForStorage: Int = ton("0.1");  // ~ 1 kB for 2.5 years
    owner: Address;
    init(){
       self.owner = sender(); 
    }

    receive(){
        
    }

    receive("withdraw all"){
        require(sender()==self.owner, "not the owner");
        send(SendParameters{
            to: sender(),
            bounce: true,
            value: 0,
            mode: SendRemainingBalance + SendIgnoreErrors
        });
    }

    receive("withdraw safe"){
        require(sender()==self.owner, "not the owner");
        send(SendParameters{
            to: sender(),
            bounce: true,
            value: myBalance() - context().value - self.MinTonForStorage,
            mode: SendIgnoreErrors + SendRemainingValue
        });
    }
    receive(msg: String){
        send(SendParameters{
            to: sender(),
            value: 0,
            mode: SendIgnoreErrors,  // if error emerges code execution goes on
            bounce: true,  // default value
            body: "hello World".asComment()
        });
        
        self.reply("Hello World".asComment());
    }

    fun notes(){
       self.requireOwner(); 
       let stake: map<Address, Int> = emptyMap();
       stake.set(sender(), 3);
       let hash: Int = sha256("String");
       self.counter = stake.get(sender())!!; // !! - denaming, error if null
       stake.set(sender(), null); // instead of delete
    }
    
    get fun balance(): Int{
        return myBalance();
    }
}