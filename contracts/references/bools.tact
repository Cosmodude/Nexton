import "@stdlib/deploy";

// 1000 bools = 0.00075 Ton / year

contract Bools with Deployable {
    
    b1: Bool = true;
    b2: Bool;
    b: Bool;
    init() {
        self.b2 = !self.b1
        self.b3 = false;
    }

    receive() {
        let b: Bool = true; 
        
        b = self.b1 && self.b2 || self.b3;
    }
}
