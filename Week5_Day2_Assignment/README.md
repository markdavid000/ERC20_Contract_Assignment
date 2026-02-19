## Contract Address (Sepolia Scan)
```0x6638Ff547e7602240F5637e816F4c7C8dC504205```


# Assignment 1

### Where are structs, mappings, and arrays stored?

#### It depends on where you create them:

##### Outside functions (at the top of your contract)

Automatically stored in storage (permanent, saved on the blockchain forever)

    contract Example {
        uint[] numbers;  // Lives on blockchain permanently
        mapping(address => uint) balances;  // Lives on blockchain permanently
    }

##### Inside a function (local variables)

Here you must choose the location:

**Arrays and Structs**

You must pick:

storage → A pointer to the real one saved on the blockchain
(Changes here will change the actual saved data.)

memory → A temporary copy
(Changes disappear after the function ends.)

calldata → Temporary and read-only
(Used mostly for function inputs.)

**Mappings**

Mappings are always in storage.

You cannot put a mapping in memory or calldata.

    function example() public {
        uint[] memory temp = new uint[](5);  // Temporary
        uint[] storage permanent = numbers;   // Points to blockchain data
    }

## How they behave when used
**A. storage**

Acts like a direct link to the blockchain’s data.

Changing it changes the real data forever.

Expensive because it edits the blockchain.

**B. memory**

A temporary copy that disappears after the function runs.

Changing it doesn’t affect the blockchain.

Cheaper than storage.

**C. mappings (always storage)**

You cannot loop over them (they have no length).

To find a value, Solidity uses a hash behind the scenes.

If you check a key that was never set, you get the default:

0 for numbers

false for booleans

## Why mappings don't need memory/storage keywords?
Mappings are too big for temporary memory.
Think of it this way:

Memory is like a small notepad with numbered lines (1, 2, 3, 4...)
Mappings are like a magical infinite filing cabinet where you can use ANY word or number as a label

You can't fit an infinite filing cabinet on a small notepad! So mappings can ONLY live permanently on the blockchain.
Since there's only one option (storage), you don't need to say it.

_The only time you use the storage keyword with a mapping is if you are passing it as a parameter into an internal function, just to tell the compiler you are passing a pointer to the existing storage map_
