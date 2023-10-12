import { HardhatEthersSigner, SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { IERC20 } from "interfaces/ERC20";
export declare let signers: any;
export type AddressString = `${'0x'}${string}`;
export interface AccountLike {
    address: AddressString;
    [x: string | number | symbol]: unknown;
}
export type SignerLike = AccountLike | SignerWithAddress | HardhatEthersSigner;
export interface IUser extends AccountLike {
    name: number | string;
    signer: SignerWithAddress | HardhatEthersSigner;
    balance: () => Promise<any>;
    send: (token: any, to: any, amount: number) => Promise<boolean | void>;
    faucet: (token: any, amount: number, display?: boolean) => Promise<boolean | void>;
    allowance: (token: any, to: any, amount: number) => Promise<number | string>;
    approve: (token: any, to: any, amount: number) => Promise<boolean | void>;
    history: () => Promise<any[] | void>;
    getHistory: () => Promise<any[] | void>;
    set: (name: number | string) => void;
}
export declare function Accounts(contracts: {
    app?: any;
    tokens?: IERC20[];
}): Promise<{
    User: (indexOrName: number | string) => IUser;
}>;
//# sourceMappingURL=accounts.d.ts.map