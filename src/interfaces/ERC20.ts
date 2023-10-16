import { a, n, u } from "utils";
import { signers } from "accounts";
import type { AccountLike, AddressString, IUser } from "accounts";
import { ethers } from "hardhat";

export interface IERC20 extends IERC20Module {
    use: (user: IUser) => IERC20Module;
}

export interface IERC20Module extends AccountLike {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: Function | number;
    balanceOf: (owner: AccountLike) => Promise<number>;
    transfer: (to: AccountLike, amount: number) => Promise<boolean | void>;
    transferFrom: (from: AccountLike, to: AccountLike, amount: number) => Promise<boolean | void>;
    allowance: (owner: AccountLike, spender: AccountLike) => Promise<number>;
    approve: (spender: AccountLike, amount: number | string) => Promise<boolean | void>;
    faucet: (to: AccountLike, amount: number) => Promise<boolean | void>;
}

export async function ERC20(token: any): Promise<IERC20> {
    typeof token === 'string' ? await ethers.getContractAtFromArtifact(JSON.parse(require('fs').readFileSync(require('path').resolve(__dirname, '../artifacts/ERC20.sol/ERC20.json'))), token) : token;

    const name: string = typeof token?.name === 'function' ? await token?.name() : typeof token?.name === 'string' ? token?.name : null;
    const symbol: string = typeof token?.symbol === 'function' ? await token?.symbol() : typeof token?.symbol === 'string' ? token?.symbol : null;
    const decimals: number = typeof token?.decimals === 'function' ? await token?.decimals() : typeof token?.decimals === 'number' ? token?.decimals : null;
    const address: AddressString = typeof token?.getAddress === 'function' ? await token?.getAddress() : typeof token?.address === 'string' ? token?.address : null;
    const totalSupply: Function | number = typeof token?.totalSupply === 'function' ? async (): Promise<number> => u(await token?.totalSupply(), decimals) : typeof token?.totalSupply === 'string' ? parseFloat(token?.totalSupply) : typeof token?.totalSupply === 'number' ? token?.totalSupply : null

    const module = (token: any, user?: AccountLike): IERC20Module => {

        const balanceOf = async (owner: AccountLike): Promise<number> => {
            return u(await token.balanceOf(a(owner)), decimals);
        };

        const transfer = async (to: AccountLike, amount: number): Promise<boolean | void> => {
            return await token.transfer(a(to), n(amount, decimals));
        };

        const transferFrom = async (from: AccountLike, to: AccountLike, amount: number): Promise<boolean | void> => {
            await (user ? token.connect(user.signer) : token).approve(to,)
            return await token.transferFrom(a(from), a(to), n(amount, decimals));
        };

        const allowance = async (owner: AccountLike, spender: AccountLike): Promise<number> => {
            return u(await token.allowance(a(owner), a(spender)), decimals);
        }

        const approve = (spender: AccountLike, amount: number | string): Promise<boolean | void> => {
            return token.approve(a(spender), n(amount, decimals));
        };

        const faucet = async (to: AccountLike, amount: number): Promise<boolean | void> => {
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