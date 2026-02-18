## Contract Address (Sepolia Scan)
```0x6638Ff547e7602240F5637e816F4c7C8dC504205```


# Assignment 1

### 1. Where are structs, mappings, and arrays stored?

It depends on where you create them:
Outside functions (at the top of your contract)

Automatically stored in storage (permanent, saved on the blockchain forever)

    contract Example {
        uint[] numbers;  // Lives on blockchain permanently
        mapping(address => uint) balances;  // Lives on blockchain permanently
    }

