import "@stdlib/deploy";
import "@stdlib/ownable";

trait Trackable with Ownable {
    numMessagesReceived: Int;
    owner: Address;
    abstract const STH: Int; // can be initialised in inheriting contract 
    virtual const ENABLE_RESET: Bool = true;

    fun receiveNewMessage(){
        if(self.filterMessage()){
            self.numMessagesReceived = self.numMessagesReceived + 1; 
        }
    }

    receive("reset stats"){
        if(self.ENABLE_RESET){
            self.requireOwner();
            self.numMessagesReceived = 0;
            self.reply("reset done".asComment());
        }
    }

    get fun stats(): Int {
        return self.numMessagesReceived;
    }

    virtual fun filterMessage(): Bool{
        if(sender()==self.owner){
            return false;
        }
        return true;
    }
}

contract NeedsTracking with Trackable{
    numMessagesReceived: Int = 0;
    owner: Address;
    override const ENABLE_RESET = false;

    init(){
        self.owner = sender();
    }

    receive(msg: String){
        self.receiveNewMessage();
        self.reply("received".asComment());
    }

    override fun filterMessage(): Bool{
        return true;
    }
}