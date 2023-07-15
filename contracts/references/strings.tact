import "@stdlib/deploy";

contract Strings with Deployable {
    s1: String = "hi";
    s2: String = "Can have unicode, but no new lines";
    init() {
        let i1: Int = 76567;
        let i2: Int = 6800000000; // 6.8 TONCOINS

        let s3: String = i1.toString();
        let s4: String = i1.toFloatString(3);  // "76.567"
        let s5: String = i2.toCoinsString(); // "6.8"

        let sb: StringBuilder = beginString();
        sb.append(s3);
        sb.append(" , your balance is: ");
        sb.append(s5);

        let s6: String = sb.toString();

    }
}
