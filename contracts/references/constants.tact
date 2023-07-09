import "@stdlib/deploy";

// Declared only ones, doesn't use storage

const GlobalConst: Int = 2001;

contract Constants with Deployable {
    
    const C1: Int = 2023;
    
    init() {
        
    }

    get fun getConstant(): Int {
        return self.C1;
    }
}

contract Constant1 with Deployable {
    i1: Int = GlobalConst;
}