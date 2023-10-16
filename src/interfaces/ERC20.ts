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
    totalSupply: () => Promise<number>;
    balanceOf: (owner: AccountLike) => Promise<number>;
    transfer: (to: AccountLike, amount: number) => Promise<boolean | void>;
    transferFrom: (from: AccountLike, to: AccountLike, amount: number) => Promise<boolean | void>;
    allowance: (owner: AccountLike, spender: AccountLike) => Promise<number>;
    approve: (spender: AccountLike, amount: number | string) => Promise<boolean | void>;
    faucet: (to: AccountLike, amount: number) => Promise<boolean | void>;
}

export async function ERC20(token: any): Promise<IERC20> {
    typeof token === 'string' ? await ethers.getContractAtFromArtifact(JSON.parse(require('fs').readFileSync('../artifacts/ERC20.sol/ERC20.json')), token) : token;

    const name: string = await token.name();
    const symbol: string = await token.symbol();
    const decimals: number = u(await token.decimals());
    const address: AddressString = await token.getAddress();
    const totalSupply: () => Promise<number> = async () => u(await token.totalSupply());

    const module = (token: any, user?: AccountLike): IERC20Module => {

        const balanceOf = async (owner: AccountLike): Promise<number> => {
            return u(await token.balanceOf(a(owner)));
        };

        const transfer = async (to: AccountLike, amount: number): Promise<boolean | void> => {
            return await token.transfer(a(to), n(amount));
        };

        const transferFrom = async (from: AccountLike, to: AccountLike, amount: number): Promise<boolean | void> => {
            await (user ? token.connect(user.signer) : token).approve(to,)
            return await token.transferFrom(a(from), a(to), n(amount));
        };

        const allowance = async (owner: AccountLike, spender: AccountLike): Promise<number> => {
            return u(await token.allowance(a(owner), a(spender)));
        }

        const approve = (spender: AccountLike, amount: number | string): Promise<boolean | void> => {
            return token.approve(a(spender), n(amount));
        };

        const faucet = async (to: AccountLike, amount: number): Promise<boolean | void> => {
            return await token.connect(signers[0]).transfer(a(to), n(amount));
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