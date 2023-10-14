# Install

```
npm install @coinmeca/ethers -D
```

```
yarn add @coinmeca/ethers -D
```

# Accounts

## Initialize

```js
import { ethers } from 'hardhat' or '@coinmeca/ethers';
import { Accounts } from '@coinmeca/ethers/accounts';
import { ERC20 } from '@coinmeca/ethers/interfaces';

async function something() {
    const METH: = await ERC20(await (await ethers.getContractFactory("MockEthereum")).deploy());

    const { User } = await Accounts();

```

```js
import { ethers } from 'hardhat' or '@coinmeca/ethers';
import { Accounts } from '@coinmeca/ethers/accounts';
import { ERC20 } from '@coinmeca/ethers/interfaces';

async function something() {
    const Tokens = {
        METH: await ERC20(await (await ethers.getContractFactory("MockEthereum")).deploy()),
        MDAI: await ERC20(await (await ethers.getContractFactory("MockDai")).deploy()),
        MUSDT: await ERC20(await (await ethers.getContractFactory("MockUsdTether")).deploy()),
    }

    const { User } = await Accounts({ tokens: Tokens });
}
```

## Main Functions

### `balance`

```js
    const { User } = await Accounts({ tokens: Tokens });

    // balance of user 1 about all the tokens that registered at initialized
    await User(1).balance();
```


```js
    // METH balance of user 1
    await User(1).balance(METH);
}
```

### `faucet`

```js
import { ethers } from 'hardhat' or '@coinmeca/ethers';
import { Accounts } from '@coinmeca/ethers/accounts';
import { ERC20 } from '@coinmeca/ethers/interfaces';

async function something() {
    const Tokens = {
        METH: await ERC20(await (await ethers.getContractFactory("MockEthereum")).deploy()),
        MDAI: await ERC20(await (await ethers.getContractFactory("MockDai")).deploy()),
        MUSDT: await ERC20(await (await ethers.getContractFactory("MockUsdTether")).deploy()),
    }

    const { User } = await Accounts({ tokens: Tokens });

    // Earn 1000(auto parsed big number with 18 decimals) tokens from default hardhat signer no.1.
    await User(1).faucet(Token.METH, 1000);

    // Or it can be used with new token deploy. 
    await User(2).faucet(
        await ERC20(await (await ethers.getContractFactory("MockUsdcToken")).deploy()),
        1000
    );
}
```

### `set`

Set an alias to access a specific user as a string value from index number.

```js
User(1).set('sender');
User(2).set('receiver');

User('sender').send(METH, User('receiver'), 1000);
```

### `send`

async `send(`

- **IERC20**: This is a token contract wrapped in ERC20 provided in the interface.

- **IUser**: User will received token that created from Accounts() function. 

- **number**: Amount of will transfer. that will be parse big number with 18 decimals automatically.

`);`

It is the same function as 'transfer' in the token contract.

```js

await User(1).send(Tokens.METH, User(2), 1);

```

### `approve`

async `approve(`

- **IERC20**: This is a token contract wrapped in ERC20 provided in the interface.

- **IUser**: Target user that created from Accounts() function. 

- **number**: Amount for approve. that will be parse big number with 18 decimals automatically.

`);`

It is the same function as 'approve' in the token contract.

```js

await User(1).approve(Tokens.METH, User(2), 1);

```

### `allowance`

async `allowance(`

- **IERC20**: This is a token contract wrapped in ERC20 provided in the interface.

- **IUser**: Target user that created from Accounts() function. 

- **number**: Amount for allowance. that will be parse big number with 18 decimals automatically.

`);`


It is the same function as 'allowance' in the token contract.

```js

await User(1).approve(Tokens.METH, User(2), 1);

```

# Utils

### `a`

**`( (contract || signer): {address: string} ) => string`**

return an address as a string, from the contract or signer or type that has an `address` property.

```js
a(User(1)); // is same with User(1).address
```

### `n`

**`( number ) => Big Numberish`**

It is generally used to upload data from off-chain to on-chain. When entering a number, it is parsed as a Big number with 18 decimals. (e.g. 1000 => 1000000000000000000000)

```js
await ETH.connect(User(1).signer).transfer(a(User(1)), n(1000));
```

### `u`

**`( Big Numberish ) => number`**

It is generally used to download data from on-chain to off-chain. When entering a Big number, it is parsed as a number without 18 decimals. (e.g. 1000000000000000000000 => 1000)

```js
u(await ETH.totalSupply()); 
```

### `t`

**`( n: number | 'now', u?: 'm' | 'h' | 'd' | 'w' | 'y' ) => number`**

Converts the entered numeric value to convert as a duration and makes time pass in the code.

```js
t('now')    // 1697258409 = current time.
t(86400)    // 86400 = 24 hours
t(1, 'd')   // 86400 = 1 day = 24 hours
t(3, 'h')   // 10800 = 3 hours 
t(3)        // 3 = 3 seconds 
```

### `duration`

**`( number ) => void`**

If you enter the UnixTimeStamp value as the starting point, the number of seconds that have elapsed based on the current time is returned in numeric format.

```js
duraiont(1697258409) // now - 1697258409
```

### `ft`

**`( number ) => string`**

Abbreviation for format time. If you enter a numeric value such as duration, the converted value of the period is returned in human-readable string format.

```js
ft(21646);  // 6h 00m 46s
ft(88_632); // 1d 37m 12s
```


### `repeat`

**`( fn: Function, times: number ) => void`**

A specific function or transaction is repeated the number of times entered.

```js
await repeat(
    async (i: number) =>
    await User(1).send(Tokens.METH, User(2), 1), // transaction to repeat
    5 // repeat times
);
```

### `revert`

**`( fn: Function, message?: string, value?: any) => void`**

Check whether the intended revert and error occur properly. If revert and error do not occur, it is treated as an error. The results are displayed in a terminal window.

```js
await revert(MyContract.use(User('Receiver')).claim(history[0].key));
```

```js
await revert(
    MyContract.use(User('Receiver')).claim(history[0].key),
    'NO_REWARD_YET' // If it same with your custome error function name on solidity, it could be more helpful.
);
```

```js
await revert(
    MyContract.use(User('Receiver')).claim(history[0].key),
    'NO_REWARD_YET', // If it same with your custome error function name on solidity, it could be more helpful.
    `key: ${history[0].key}`
);
```

# Diamond

## Config

It can change the initial environment settings by setting the config file separately in the root path. However, the config file is not required and if it does not exist or some entries are not present, it will act as a default setting built into the code. Therefore, if separate environment settings are not required, they can be omitted.

```js
// ~project_root/diamond.config.ts

export const config = {
    deployer: {
        address: process.env.DEPLOYER,
        privateKey: process.env.PRIVATE_KEY
    },
    artifact: {
        diamonds: [
            'MyDiamond',
            'contracts/myapp/diamond2/MyDiamond.sol:MyDiamond'
        ],
        abi: {
            include: ['facet', 'facets', 'shared'],
            exclude: ['Data', 'Facet'],
            path: 'artifacts/.diamonds',
            file: 'diamond'
        }
    },
    loupe: {
        path: 'artifacts/.diamonds',
        file: 'facet'
    }
};

export default config;
```

**None of the following fields in the config file are required. values could be added and changed if only needed.**

### `deployer`

**`address`** : `string`

The owner address is an initial value that will be used as the 'owner' property of diamond args, at the time of deploying the diamond factory. If no value is provided for the field, the default address provided by Hardhat will be used.

### `artifacts`

**`diamonds`** :  `string[]`

Define here, which diamond files required generating an integrated abi of diamonds. If a diamond contract is used with a duplicate name, it must be identified by providing an artifact name that includes the full path to the diamond.

```js
diamonds: [
    'MyDiamond',
    'contracts/myapp/diamond2/MyDiamond.sol:MyDiamond'
],
```

### `abi`

**`include`** : `string[]` or `['facet', 'facets', 'shared']` as default.

String words defined in `include` properties are used to search artifacts of facet contracts. If the 'MyDiamond' was defined as the name of the diamond in the above `artifacts.diamond`, will find facets that include the words in their path from paths that include the diamond name.

```diff
[
    'contracts/myapp/MyDiamond.sol:MyDiamond',
+   'contracts/myapp/facets/Mint.sol:Mint',
+   'contracts/myapp/facets/Burn.sol:Burn',
+   'contracts/myapp/facets/Approval.sol:Approval',
+   'contracts/myapp/facets/Transfer.sol:Transfer',
]
```

If there are some artifacts not include the filter words among this filtered result of artifacts, those artifacts as a starting point, and other facets will be excluded under those.

```diff
[
    'contracts/myapp/MyDiamond.sol:MyDiamond',
+   'contracts/myapp/facets/Mint.sol:Mint',
+   'contracts/myapp/facets/Burn.sol:Burn',
+   'contracts/myapp/facets/Approval.sol:Approval',
+   'contracts/myapp/facets/Transfer.sol:Transfer',
    'contracts/myapp/vault/MyVaultDiamond.sol:MyVaultDiamond',
#   'contracts/myapp/vault/facets/Deposit.sol:Deposit',
#   'contracts/myapp/vault/facets/Withdraw.sol:Withdraw',
#   'contracts/myapp/vault/facets/Lockup.sol:Lockup'
]
```

If there is no artifact not included in the filter among this result of artifacts, all of these artifacts will be combined to the name of the diamond.

```diff
[
    'contracts/myapp/MyDiamond.sol:MyDiamond',
-   'contracts/myapp/IMyDiamond:MyDiamond',
-   'contracts/myapp/Data.sol:Data',
+   'contracts/myapp/facets/Mint.sol:Mint',
+   'contracts/myapp/facets/Burn.sol:Burn',
+   'contracts/myapp/facets/Approval.sol:Approval',
+   'contracts/myapp/facets/Transfer.sol:Transfer',
!   'contracts/myapp/vault/facets/Deposit.sol:Deposit',
!   'contracts/myapp/vault/facets/Withdraw.sol:Withdraw',
!   'contracts/myapp/vault/facets/Lockup.sol:Lockup'
]
```

**`exclude`**: `string[]` or `[`I${DiamondName}`]` as default (interface with given diamond name).

The words defined in the `exclude` property will be used for excluding some artifacts in the final result. 

In the path of the diamond, If there are some other contract files that those not the diamond, have to be defined into the exclude filter. If not, it will not work correctly because of cannot recognize what is the diamond in those files.

```diff
[
    'contracts/myapp/MyDiamond.sol:MyDiamond',
-   'contracts/myapp/Data.sol:Data',
+   'contracts/myapp/facets/Mint.sol:Mint',
+   'contracts/myapp/facets/Burn.sol:Burn',
+   'contracts/myapp/facets/Approval.sol:Approval',
+   'contracts/myapp/facets/Transfer.sol:Transfer',
]
```

**`path`**: `string` or `artifacts/.diamond` as default.

Defines the path that will generate artifacts incorporating abi for a specific diamond. The default is to create a diamond artifact in the '.diamond' folder under the 'artifacts' folder in the project root path.

- `file`: `string` or ``.diamond`` as default.

Add a suffix to the name of the file to identify the diamond artifact file that integrates abi. The default is 'diamond'. (Example: MyApp.diamond.sol)

**`loupe`**

After deployment a diamond, the information on the facets registered in the diamond and its selectors is exported to a file. 

**`path`**: `string` or `artifacts/.diamond` as default.

By default, it uses the same path as the diamond artifacts path. (artifacts/.diamond)

- `file`: `string` or ``.diamond`` as default.

After deploying the Diamond contract, add a suffix to the file name to identify the file from which you extracted the facet information registered in Diamond. The default is 'facet'. (e.g. MyApp.facets.sol)

## Main Functions

### `factory`

This feature makes diamond contract deployment easier. Each time this function is executed, a new integrated abi is created.

async `factory(`

- **artifacts**: The name of  diamond that is trying to deploy artifact.

- **cut data**: Diamond cut data for diamond. ( {key: string, data: [ facet artifacts ]})

- **init args**: Values for diamond args for initializing.

`);`

```js
import { diamond } from '@coinmeca/ethers/diamond';

function deploy() {
    const contract = await diamond.factory(
        'contracts/myapp/MyDiamond.sol:MyDiamond',
        [
            // If your diamond contract's constructor has other args.
            MyDiamondArg1, // parameter's order has to match with 
            MyDiamondArg2, // your diamond contract's args order of a constructor.
            // Diamond cut, args data.
            await diamond.cut(
                [
                    key: 'myDiamond.app',
                    data: [
                        'contracts/myapp/facets/Mint.sol:Mint',
                        'contracts/myapp/facets/Burn.sol:Mint',
                        'contracts/myapp/facets/Apporval.sol:Apporval',
                        'contracts/myapp/facets/Transfer.sol:Transfer'
                    ]
                ]
            ),
            {
                owner: addressOf.owner,
                init: addressOf.initContract,
                initCalldata: addressOf.initData
            }
        ]
    );
}

```


### `abi`

**`( artifactName: string ) => void`**

If you pass the diamond's artifact name, it finds the facets that need to be integrated into the specific diamond in a path and creates an integrated artifact.

```js
import { diamond } from '@coinmeca/ethers';

await diamond.abi('contracts/myapp/MyDiamond.sol:MyDiamond');
```

### `cut`

lightweight-diamond If you pass in diamond cut information that matches the configuration, the diamond cut data needed when factory the diamond is generated and returned.

```js

import { diamond } from '@coinmeca/ethers';

await diamond.cut([
    {
        key: 'myDiamond.app',
        data: [
            'contracts/myapp/facets/Mint.sol:Mint',
            'contracts/myapp/facets/Burn.sol:Mint',
            'contracts/myapp/facets/Apporval.sol:Apporval',
            'contracts/myapp/facets/Transfer.sol:Transfer'
        ]
    }
]);
```
