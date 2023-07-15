import "@stdlib/deploy";

contract Messages with Deployable {

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

    get fun balance(): String{
        return myBalance().toCoinsString();
    }
}