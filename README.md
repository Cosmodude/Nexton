# NexTon (BlockWave Labs)
Author: Vladislav Lenskii: https://github.com/Cosmodude

Created using Blueprint framework: https://github.com/ton-org/blueprint
Contracts were written in TACT and FunC
## Project structure

-   `contracts` - source code of all the smart contracts of the project, their dependencies and references.
-   `wrappers` - wrapper classes (implementing `Contract` from ton-core) for the contracts, including any (de)serialization primitives and compilation functions.
-   `tests` - tests for the contracts.
-   `scripts` - scripts used by the project, the deployment and scripts.

## How to use

'npm i' to install the dependencies

### Build

`npx blueprint build` to compile contracts 

### Test

`npx blueprint test` to run the test suits 

### Run scripts

`npx blueprint run`
First "deployNexTon" to put contracts(NFT collection + Main NexTon contract) on chain.
Then "userDeposit" to try deposit funds mannually.

# License
MIT

## For reference:
    
    - video tutorial https://www.youtube.com/watch?v=5Muo79ZsOIg
    - Official docs https://docs.tact-lang.org/
                    https://tact-lang.org/