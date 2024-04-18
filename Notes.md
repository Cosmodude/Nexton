# Tact NOTES

    - Don't use capital letters for contract names
    - Put all the contract interaction methods in scripts folder
    - Wrappers has representation of contract as a typescript class
    - Maximum number of bits:
        257 for int
        256 for (uint)
        120 for coins (used for TonCoins and other tokens)
    (for ints 1 bit is for sign)
    - Calculations are made in NanoTons ( 9 decimals )
    - All of the variables must be initialised in constructor(init) or declaration
    - There also temporary variables
    - Math is safe by default
    - Strings are immutable
    - Get methods are free, but can be called only externally
    - On-chain interaction only through messages 
    - Text messages have no arguments now
    - Messages look same as structures