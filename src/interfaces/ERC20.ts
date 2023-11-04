import { a, n, u } from "utils";
import { signers } from "accounts";
import type { AccountLike, IUser } from "accounts";
import { ethers } from "hardhat";
import { AddressLike, BaseContract, Signer } from "ethers";
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
    isNative: boolean,
    contract: BaseContract;
}

const Native = {
    address: a(0),
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
}

export async function ERC20(token: any, init = Native): Promise<IERC20> {
    const isNative = typeof token === 'string' && token === a(0);
    token = isNative ? a(0) : typeof token === 'string' ? await ethers.getContractAtFromArtifact(JSON.parse(require('fs').readFileSync(require('path').resolve(__dirname, '../artifacts/ERC20.sol/ERC20.json'))), token) : token;

    const name: string = isNative ? init.name : typeof token?.name === 'function' ? await token?.name() : typeof token?.name === 'string' ? token?.name : null;
    const symbol: string = isNative ? init.symbol : typeof token?.symbol === 'function' ? await token?.symbol() : typeof token?.symbol === 'string' ? token?.symbol : null;
    const decimals: number = isNative ? init.decimals : typeof token?.decimals === 'function' ? await token?.decimals() : typeof token?.decimals === 'number' ? token?.decimals : null;
    const address: AddressString = isNative ? init.address : typeof token?.getAddress === 'function' ? await token?.getAddress() : typeof token?.address === 'string' ? token?.address : null;

    const module = (token: any, user?: IUser | AccountLike): IERC20Module => {
        const totalSupply = async (): Promise<number> => {
            return isNative ? u(ethers.MaxUint256, decimals) : u(await token?.totalSupply(), decimals);
        }

        const balanceOf = async (owner: AccountLike | AddressString): Promise<number> => {
            return u(isNative ? await ethers.provider.getBalance(a(owner) as string) : await token.balanceOf(a(owner)), decimals);
        };

        const transfer = async (to: AccountLike | AddressString, amount: number | string): Promise<boolean | void> => {
            return isNative ? await ((user?.signer ? user?.signer : signers[0]) as Signer).sendTransaction({ to: (a(to) as AddressLike), value: n(amount) }) : await token.transfer(a(to), n(amount, decimals));
        };

        const transferFrom = async (from: IUser | AccountLike | AddressString, to: AccountLike | AddressString, amount: number): Promise<boolean | void> => {
            const signer = await ethers.getSigner((a(from) as string)) || user?.signer;
            await (signer ? token.connect(signer) : token).approve(to, n(amount));
            return isNative ? await signer.sendTransaction({ to: (a(to) as AddressLike), value: n(amount) }) : await token.transferFrom(a(from), a(to), n(amount, decimals));
        };

        const allowance = async (owner: AccountLike | AddressString, spender: AccountLike | AddressString): Promise<number> => {
            return isNative ? u(ethers.MaxUint256, decimals) : u(await token.allowance(a(owner), a(spender)), decimals);
        }

        const approve = async (spender: AccountLike | AddressString, amount: number | string): Promise<boolean | void> => {
            return isNative ? true : await token.approve(a(spender), n(amount, decimals));
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
            isNative,
            contract: isNative ? ethers.provider : token,
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