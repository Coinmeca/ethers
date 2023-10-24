import { a, n, u } from "utils";
import { signers } from "accounts";
import type { AccountLike, IUser } from "accounts";
import { ethers } from "hardhat";
import { BaseContract } from "ethers";
import { AddressString } from "../types";

export interface IERC20 extends IERC20Module {
    use: (user: IUser) => IERC20Module;
}

export interface IERC20Module extends AccountLike {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: () => Promise<number>;
    balanceOf: (owner: AccountLike | AddressString) => Promise<number>;
    transfer: (to: AccountLike | AddressString, amount: number) => Promise<boolean | void>;
    transferFrom: (from: AccountLike | AddressString, to: AccountLike | AddressString, amount: number) => Promise<boolean | void>;
    allowance: (owner: AccountLike | AddressString, spender: AccountLike | AddressString) => Promise<number>;
    approve: (spender: AccountLike | AddressString, amount: number | string) => Promise<boolean | void>;
    faucet: (to: AccountLike | AddressString, amount: number) => Promise<boolean | void>;
    contract: BaseContract;
}

export async function ERC20(token: any): Promise<IERC20> {
    token = typeof token === 'string' ? await ethers.getContractAtFromArtifact(JSON.parse(require('fs').readFileSync(require('path').resolve(__dirname, '../artifacts/ERC20.sol/ERC20.json'))), token) : token;

    const name: string = typeof token?.name === 'function' ? await token?.name() : typeof token?.name === 'string' ? token?.name : null;
    const symbol: string = typeof token?.symbol === 'function' ? await token?.symbol() : typeof token?.symbol === 'string' ? token?.symbol : null;
    const decimals: number = typeof token?.decimals === 'function' ? await token?.decimals() : typeof token?.decimals === 'number' ? token?.decimals : null;
    const address: AddressString = typeof token?.getAddress === 'function' ? await token?.getAddress() : typeof token?.address === 'string' ? token?.address : null;

    const module = (token: any, user?: AccountLike): IERC20Module => {
        const totalSupply = async (): Promise<number> => {
            return u(await token?.totalSupply(), decimals);
        }

        const balanceOf = async (owner: AccountLike | AddressString): Promise<number> => {
            return u(await token.balanceOf(a(owner)), decimals);
        };

        const transfer = async (to: AccountLike | AddressString, amount: number | string): Promise<boolean | void> => {
            return await token.transfer(a(to), n(amount, decimals));
        };

        const transferFrom = async (from: AccountLike | AddressString, to: AccountLike | AddressString, amount: number): Promise<boolean | void> => {
            await (user ? token.connect(user.signer) : token).approve(to,)
            return await token.transferFrom(a(from), a(to), n(amount, decimals));
        };

        const allowance = async (owner: AccountLike | AddressString, spender: AccountLike | AddressString): Promise<number> => {
            return u(await token.allowance(a(owner), a(spender)), decimals);
        }

        const approve = async (spender: AccountLike | AddressString, amount: number | string): Promise<boolean | void> => {
            return await token.approve(a(spender), n(amount, decimals));
        };

        const faucet = async (to: AccountLike | AddressString, amount: number | string): Promise<boolean | void> => {
            return await token.connect(signers[0]).transfer(a(to), n(amount, decimals));
        }

        return {
            name,
            symbol,
            decimals,
            address,
            totalSupply,
            balanceOf,
            transfer,
            transferFrom,
            allowance,
            approve,
            faucet,
            contract: token,
        }
    }

    const use = (user: IUser): IERC20Module => {
        return module(token.connect(user.signer), user);
    }

    return {
        ...module(token),
        use
    };
}

export default ERC20;