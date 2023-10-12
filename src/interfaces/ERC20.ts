import { formatUnits } from "ethers";
import { a, n, u } from "utils";
import { signers } from "accounts";
import type { AccountLike, IUser } from "accounts";

export interface IERC20 extends IERC20Module {
    use: (user: IUser) => IERC20Module;
}

export interface IERC20Module extends AccountLike {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: number | string;
    balanceOf: (owner: AccountLike) => Promise<number | string>;
    transfer: (to: AccountLike, amount: number) => Promise<boolean | void>;
    transferFrom: (from: AccountLike, to: AccountLike, amount: number) => Promise<boolean | void>;
    allowance: (owner: AccountLike, spender: any) => Promise<number | string>;
    approve: (spender: AccountLike, amount: number | string) => Promise<boolean | void>;
    faucet: (to: AccountLike, amount: number) => Promise<boolean | void>;
}

export default async function ERC20(token: any): Promise<IERC20> {
    const name = await token.name();
    const symbol = await token.symbol();
    const decimals = parseInt(formatUnits(await token.decimals()));
    const address = await token.getAddress();
    const totalSupply = u(await token.totalSupply());

    const module = (token: any, user?: AccountLike): IERC20Module => {

        const balanceOf = async (owner: AccountLike): Promise<number | string> => {
            return u(await token.balanceOf(a(owner)));
        };

        const transfer = async (to: AccountLike, amount: number): Promise<boolean | void> => {
            return await token.transfer(a(to), n(amount));
        };

        const transferFrom = async (from: AccountLike, to: AccountLike, amount: number): Promise<boolean | void> => {
            await (user ? token.connect(user.signer) : token).approve(to,)
            return await token.transferFrom(a(from), a(to), n(amount));
        };

        const allowance = async (owner: AccountLike, spender: AccountLike): Promise<number | string> => {
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
            faucet
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