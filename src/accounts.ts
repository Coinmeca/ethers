import { ethers } from "hardhat";
import { HardhatEthersSigner, SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { a, f, u, font, color, _, getMultiplier } from "utils";
import { c, category, state } from "types/stringify";
import { AddressString } from "./types";
import { ERC20, type IERC20 } from "interfaces/ERC20";
import { type IERC721 } from "./interfaces/ERC721";

export interface AccountLike {
    address: AddressString;
    [x: string | number | symbol]: unknown;
}

export type SignerLike = AccountLike | SignerWithAddress | HardhatEthersSigner

export interface Signers {
    [x: string | number | symbol]: any;
}

export let signers: Signers;

export interface IAccounts { User: (indexOrName: string | number | AddressString) => IUser; };

type HistoryArgs = [] | [any] | [any[]] | [(x: any) => any] | [any[], (x: any) => any] | [any, (x: any) => any] | [any[], any, (x: any) => any];
type GetHistoryArgs = [] | [string] | [any] | [string, any] | [any, string];

export interface IUser extends AccountLike {
    name: number | string;
    signer: SignerWithAddress | HardhatEthersSigner;
    as: (address: AddressString) => Promise<SignerLike>;
    set: (name: number | string) => any;
    balance: (token?: IERC20 | IERC721 | AddressString, display?: boolean) => Promise<any>;
    send: (token: IERC20 | IERC721 | AddressString, to: AccountLike | AddressString, amount: number) => Promise<boolean | void>;
    faucet: (token: IERC20 | AddressString, amount: number, display?: boolean) => Promise<boolean | void>;
    allowance: (token: IERC20 | IERC721 | AccountLike | AddressString, spender: AccountLike | AddressString | AddressString) => Promise<number | string>;
    approve: (token: IERC20 | IERC721 | AccountLike | AddressString, to: AccountLike | AddressString | AddressString, amount: number) => Promise<boolean | void>;
    history: (...args: HistoryArgs) => Promise<any[]>;
    getHistory: (...args: GetHistoryArgs) => Promise<any>;
}

export async function Accounts(contracts?: { tokens: IERC20[] | { [x: string | number | symbol]: IERC20 }, [x: string | number | symbol]: object }): Promise<IAccounts> {
    if (!signers) {
        signers = {
            ...await Promise.all((await ethers.getSigners()).map(async (a: any) => {
                return a as SignerLike;
            }))
        };
        signers.deployer = signers[0];
    }

    const User = (indexOrName: number | string): IUser => {
        const name: string = typeof indexOrName === 'string' ? indexOrName : indexOrName.toString();
        const signer: SignerWithAddress | HardhatEthersSigner = signers[name];
        const address: AddressString = signer.address as AddressString;

        const balance = async (token?: IERC20 | IERC721 | AddressString, display?: boolean): Promise<any> => {
            const tokens: (IERC20 | IERC721)[] | undefined = token ? typeof token === 'string' ? [await ERC20(token)] : [token] : typeof contracts?.tokens === 'object' ? Object.values(contracts?.tokens) : Array.isArray(contracts?.tokens) ? contracts?.tokens : undefined;
            if (tokens) {
                let token: number = await tokens[0].balanceOf(User(name));
                if (tokens?.length > 1 || (tokens?.length === 1 && display)) {
                    console.log(color.lightGray(`--------------------- User: '${name}' Wallet ----------------------`));
                    a(User(name), true);
                    console.log(color.lightGray(`-------------------------------------------------------------`))
                    if (tokens?.length > 0) {
                        for (let i = 0; i < tokens?.length; i++) {
                            if (tokens[i]) {
                                const symbol = tokens[i].symbol;
                                const balance = (tokens?.length === 1 && i === 0) ? token : await tokens[i].balanceOf(User(name));
                                if (symbol == 'MECA') console.log(color.lightGray(`-------------------------------------------------------------`))
                                console.log(`${_(`${symbol}:`, 14)}${font.bold(color.yellow(f(balance)))}`);
                            }
                        }
                    } else {
                        console.log(`There are no tokens deployed yet.`);
                    }
                    console.log(color.lightGray(`-------------------------------------------------------------`));
                }
                return tokens?.length == 1 ? token : tokens;
            }
        };

        const send = async (token: IERC20 | IERC721 | AddressString, to: AccountLike | AddressString, amount: number): Promise<boolean | void> => {
            const t: IERC20 | IERC721 | AccountLike = typeof token === 'string' ? await ERC20(token) : token;
            return await (t as any).use(User(name)).transfer(to, amount);
        }

        const faucet = async (token: IERC20 | AddressString, amount: number, display?: boolean): Promise<boolean | void> => {
            const t: IERC20 = typeof token === 'string' ? await ERC20(token) : token;
            const result = await t.use(User(name)).faucet(User(name), amount);
            if (result && display) {
                console.log(color.lightGray(`-------------------------------------------------------------`));
                console.log(`-> ✨ '${name}' earn '${amount} ${t.symbol}'`);
                console.log(color.lightGray(`-------------------------------------------------------------`));
            }
            return result;
        }

        const allowance = async (token: IERC20 | IERC721 | AccountLike | AddressString, spender: AccountLike | AddressString | AddressString): Promise<number | string> => {
            const t: IERC20 | IERC721 | AccountLike = typeof token === 'string' ? await ERC20(token) : token;
            return await (t as any).use(User(name))!.allowance(address, a(spender) as AddressString);
        }

        const approve = async (token: IERC20 | IERC721 | AccountLike | AddressString, to: AccountLike | AddressString | AddressString, amount: number): Promise<boolean | void> => {
            const t: IERC20 | IERC721 | AccountLike = typeof token === 'string' ? await ERC20(token) : token;
            return await (t as any).use(User(name))!.approve(a(to) as AddressString, amount);
        }

        const getHistory = async (...args: GetHistoryArgs): Promise<any> => {
            const key = (args && args[0] && typeof args[0] === 'string') ? args[0] : (args && args?.length === 2 && typeof args[1] === 'string') ? args[1] : undefined;
            const app = (args && args[0] && typeof args[0] !== 'string') ? args[0] : (args && args?.length === 2 && typeof args[1] !== 'string') ? args[1] : contracts?.app;
            if (app) {
                return key ? await app.historyGet(key) : await app.historyGetAll(a(User(name)));
            }
            return [];
        }

        const history = async (...args: HistoryArgs): Promise<any[]> => {
            const app = args
                && args[0]
                && (typeof args[0] === 'object'
                    || (typeof args[0] !== 'function' && !Array.isArray(args[0])))
                ? args[0]
                : args
                    && args?.length === 2
                    && (typeof args[1] === 'object'
                        || (typeof args[1] !== 'function' && !Array.isArray(args[1])))
                    ? args[1]
                    : contracts?.app;

            const h = args[0]
                && Array.isArray(args[0])
                && typeof args[0] !== 'object'
                && typeof args[0] !== 'function'
                ? args[0]
                : await app?.historyGetAll(a(User(name)))!;

            const fn = args
                && args[0]
                && typeof args[0] === "function"
                && typeof args[0] !== 'object' &&
                !Array.isArray(args[0])
                ? args[0]
                : args
                    && args?.length === 2
                    && typeof args[1] === "function"
                    && typeof args[1] !== 'object'
                    && !Array.isArray(args[1])
                    ? args[1]
                    : args
                        && args?.length === 3
                        && typeof args[2] === "function"
                        && typeof args[2] !== 'object'
                        && !Array.isArray(args[2])
                        ? args[2]
                        : undefined;

            if (app) {
                if (!fn || typeof fn !== 'function') {
                    console.log(color.lightGray(`---------------------------  User: '${name}' History ---------------------------`));
                    console.log(`Total: ${h?.length}`);
                    console.log(color.lightGray(`--------------------------------------------------------------------------------`));
                    for (let i = 0; i < h.length; i++) {
                        const p = c[h[i].category] === 'Long' || c[h[i].category] === 'Short';
                        console.log(color.lightGray(_(`Key:`, 14)), h[i].key);
                        console.log(color.lightGray(_(`Market:`, 14)), color.lightGray(h[i].market));
                        console.log(color.lightGray(_(`Category:`, 14)), category(h[i].category));
                        console.log(color.lightGray(_(`State:`, 14)), state(h[i].state));
                        console.log(color.lightGray(_(`Price:`, 14)), font.bold(color.yellow(f(u(h[i].price)))));
                        console.log(color.lightGray(_(`Amount:`, 14)), f(u(h[i].amount)));
                        console.log(color.lightGray(_(`Quantity:`, 14)), color.yellow(f(u(h[i].quantity))));
                        p && console.log(color.lightGray(_(`Leverage:`, 14)), color.white(f(u(h[i].fees))));
                        p && console.log(color.lightGray(_(`Multiplier:`, 14)), color.lightGray('x'), color.white(f(getMultiplier(u(h[i].amount), u(h[i].fees)))));
                        console.log(color.lightGray(`--------------------------------------------------------------------------------`));
                    }
                } else fn(h);
                return h;
            }
            return [];
        };

        const as = async (address: AddressString): Promise<SignerLike> => {
            const signer = await ethers.getSigner(address)
            signers = {
                ...signers,
                [`${name}`]: signer
            }
            return module;
        }

        const set = (name: number | string): any => {
            signers = {
                ...signers,
                [`${name}`]: signer
            }
            return module;
        }

        const module: IUser = {
            ...signer,
            signer,
            address,
            name,
            as,
            set,
            faucet,
            balance,
            allowance,
            approve,
            send,
            history,
            getHistory,
        };

        if (!address || typeof signer !== 'object') return { as } as IUser;
        return module
    }

    return { User }
}