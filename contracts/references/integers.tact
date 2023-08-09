import "@stdlib/deploy";

contract Intgers with Deployable {
    i1: Int as uint256; 
    i2: Int as int257;  // 0.184 Ton / year 
    i3: Int as coins; 
    i4: Int as int32;   // 0.023 Ton / year 

    init(){
        self.i1 = 0x83df;
        self.i2 = -1284847;
        self.i3 = ton("3.4"); // 34 * 10 ^8
        self.i4 = pow(3,4);
    }

    receive(){
        let it1: Int = 32;
        let it2: Int = 10;

        let i: Int = it1/it2; // 32/10 =3 
        i = it1 % it2; // = 2
        i = it1 >> 3; // bitwise right shift (see c++)
        i = min(it1, it2);
        i = abs( -1 * it2); // = 10
        let b: Bool = it1>=30; // true
    }
}