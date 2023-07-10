import "@stdlib/deploy";

contract BulkAdder with Deployable {

    target: Int as uint32;
    init() {
        self.target = 32;
    }
}
