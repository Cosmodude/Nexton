fun mintJettons(_receiver: Address, _amount: Int){
    send(SendParameters{
        to: sender(),
        value: 0,
        mode: SendRemainingValue + SendIgnoreErrors,
        body: mintJettons{
            amount: _amount,
            receiverAddress: _receiver
        }.toCell()
    });
}