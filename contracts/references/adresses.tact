import "@stdlib/deploy";

// 1000 addresses - 0.189 Ton / year 
contract Addresses with Deployable {
    // 264 bits for an address
    a1: Address = address("EQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6dYvk"); // bouncable
    a2: Address = address("UQAXUIBw-EDVtnCxd65Z2M21KTDr07RoBL6BYf-TBCd6ddYh"); // non-bouncable
    // hex (raw)
    a3: Address;
    a4: Address;
    a5: Address;
    init() {
        self.a3 = newAddress(0, 0:17508070f840d5b670b177ae59d8cdb52930ebd3b46804be8161ff9304277a75);
        self.a4 = sender();
        self.a5 = myAddress();  // contract address
        self.a6 = newAddress(0,0);  // zero address
    }

    receive() {
        self.a1 == self.a2; // true 
    }
}
