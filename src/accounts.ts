import { ethers } from "hardhat";
import { HardhatEthersSigner, SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { a, f, u, font, color, _, getMultiplier } from "utils";
import { c, category, s, state } from "types/stringify";
import { AddressString } from "./types";
import { ERC20, type IERC20 } from "interfaces/ERC20";
import { type IERC721 } from "./interfaces/ERC721";

export interface AccountLike {
    address: AddressString;
    [x: string | number | symbol]: unknown;
}

export type SignerLike = AccountLike | SignerWithAddress | HardhatEthersSigner;

export interface Signers {
    [x: string | number | symbol]: any;
}

export let signers: Signers;

export interface IAccounts {
    User: (indexOrName: string | number | AddressString) => IUser;
}

type Contract = { [x: string | number | symbol]: any } | Function | Promise<any>;
type History = string | string[] | number | number[];
type HistoryParsing = (x: History) => any | Promise<any>;

type HistoryArgs =
    | []
    | [data: History]
    | [address: Contract]
    | [data: History, fn: HistoryParsing]
    | [address: Contract, fn: HistoryParsing]
    | [address: Contract, data: History]
    | [address: Contract, keyOrIndex: History, HistoryParsing];

type GetHistoryArgs = [] | [keyOrIndex: History] | [address: Contract] | [keyOrIndex: History, address: Contract] | [address: Contract, keyOrIndex: History];

export interface IUser extends AccountLike {
    name: number | string;
    signer: SignerWithAddress | HardhatEthersSigner;

    as(address: AddressString): Promise<SignerLike>;
    set(name: number | string): any;

    balance(token?: IERC20 | IERC721 | AddressString, display?: boolean): Promise<any>;
    send(token: IERC20 | IERC721 | AddressString, to: AccountLike | AddressString, amount: number): Promise<boolean | void>;
    faucet(token: IERC20 | AddressString, amount: number, display?: boolean): Promise<boolean | void>;
    allowance(token: IERC20 | IERC721 | AccountLike | AddressString, spender: AccountLike | AddressString | AddressString): Promise<number | string>;
    approve(
        token: IERC20 | IERC721 | AccountLike | AddressString,
        to: AccountLike | AddressString | AddressString,
        amount: number | string | "max"
    ): Promise<boolean | void>;

    // ---- history ----
    history(): Promise<any[]>;
    history(keyOrIndex: History): Promise<any[]>;
    history(address: Contract): Promise<any[]>;
    history(keyOrIndex: History, fn: HistoryParsing): Promise<any[]>;
    history(address: Contract, fn: HistoryParsing): Promise<any[]>;
    history(address: Contract, keyOrIndex: History): Promise<any[]>;
    history(address: Contract, keyOrIndex: History, fn: HistoryParsing): Promise<any[]>;

    // ---- getHistory ----
    getHistory(): Promise<any>;
    getHistory(keyOrIndex: History): Promise<any>;
    getHistory(address: Contract): Promise<any>;
    getHistory(keyOrIndex: History, address: Contract): Promise<any>;
    getHistory(address: Contract, keyOrIndex: History): Promise<any>;
}

export async function Accounts(contracts?: {
    tokens: IERC20[] | { [x: string | number | symbol]: IERC20 };
    [x: string | number | symbol]: object;
}): Promise<IAccounts> {
    if (!signers) {
        signers = {
            ...(await Promise.all(
                (
                    await ethers.getSigners()
                ).map(async (a: any) => {
                    return a as SignerLike;
                })
            )),
        };
        signers.deployer = signers[0];
    }

    const User = (indexOrName: number | string): IUser => {
        const name: string = typeof indexOrName === "string" ? indexOrName : indexOrName.toString();
        const signer: SignerWithAddress | HardhatEthersSigner = signers[name];
        const address: AddressString = signer.address as AddressString;

        const balance = async (token?: IERC20 | IERC721 | AddressString, display?: boolean): Promise<any> => {
            const tokens: (IERC20 | IERC721)[] | undefined = token
                ? typeof token === "string"
                    ? [await ERC20(token)]
                    : [token]
                : typeof contracts?.tokens === "object"
                ? Object.values(contracts?.tokens)
                : Array.isArray(contracts?.tokens)
                ? contracts?.tokens
                : undefined;
            if (tokens) {
                let token: number = await tokens[0].balanceOf(User(name));
                if (tokens?.length > 1 || (tokens?.length === 1 && display)) {
                    console.log(color.lightGray(`--------------------- User: '${name}' Wallet ----------------------`));
                    a(User(name), true);
                    console.log(color.lightGray(`-------------------------------------------------------------`));
                    if (tokens?.length > 0) {
                        for (let i = 0; i < tokens?.length; i++) {
                            if (tokens[i]) {
                                const symbol = tokens[i].symbol;
                                const balance = tokens?.length === 1 && i === 0 ? token : await tokens[i].balanceOf(User(name));
                                if (symbol == "MECA") console.log(color.lightGray(`-------------------------------------------------------------`));
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
            const t: IERC20 | IERC721 | AccountLike = typeof token === "string" ? await ERC20(token) : token;
            return await (t as any).use(User(name)).transfer(to, amount);
        };

        const faucet = async (token: IERC20 | AddressString, amount: number, display?: boolean): Promise<boolean | void> => {
            const t: IERC20 = typeof token === "string" ? await ERC20(token) : token;
            const result = await t.use(User(name)).faucet(User(name), amount);
            if (result && display) {
                console.log(color.lightGray(`-------------------------------------------------------------`));
                console.log(`-> ✨ '${name}' earn '${amount} ${t.symbol}'`);
                console.log(color.lightGray(`-------------------------------------------------------------`));
            }
            return result;
        };

        const allowance = async (
            token: IERC20 | IERC721 | AccountLike | AddressString,
            spender: AccountLike | AddressString | AddressString
        ): Promise<number | string> => {
            const t: IERC20 | IERC721 | AccountLike = typeof token === "string" ? await ERC20(token) : token;
            return await (t as any).use(User(name))!.allowance(address, a(spender) as AddressString);
        };

        const approve = async (
            token: IERC20 | IERC721 | AccountLike | AddressString,
            to: AccountLike | AddressString | AddressString,
            amount: number | string | "max"
        ): Promise<boolean | void> => {
            const t: IERC20 | IERC721 | AccountLike = typeof token === "string" ? await ERC20(token) : token;
            return await (t as any).use(User(name))!.approve(a(to) as AddressString, amount);
        };

        const getHistory = async (...args: GetHistoryArgs): Promise<any> => {
            const key: History | undefined = args
                ? Array.isArray(args[0]) && (typeof args[0][0] === "string" || typeof args[0][0] === "number")
                    ? args[0]
                    : typeof args[0] === "string" || typeof args[0] === "number"
                    ? args[0]
                    : Array.isArray(args[1]) && (typeof args[1][0] === "string" || typeof args[1][0] === "number")
                    ? args[1]
                    : typeof args[1] === "string" || typeof args[1] === "number"
                    ? args[1]
                    : undefined
                : undefined;
            let app: any = args
                ? args?.length > 0 && (typeof args[0] === "object" || typeof args[0] === "function")
                    ? args[0]
                    : args?.length > 1 && (typeof args[1] === "object" || typeof args[1] === "function")
                    ? args[1]
                    : contracts?.app
                : contracts?.app;
            if (typeof key !== "undefined" && app) {
                app = typeof app === "function" ? await app() : app;
                return Array.isArray(key)
                    ? await Promise.all(
                          key.map(async (k: string | number) =>
                              typeof k === "string" ? await app?.getHistory(k) : await app?.["getHistoryByIndex(address, uint)"](a(User(name)), k)
                          )
                      )
                    : typeof key === "string"
                    ? await app?.getHistory(key)
                    : await app?.["getHistoryByIndex(address, uint)"](a(User(name)), key);
            } else return Array.isArray(key) ? [] : undefined;
        };

        const history = async (...args: HistoryArgs): Promise<any[]> => {
            let app: any = args && args?.length > 0 && (typeof args[0] === "object" || typeof args[0] === "function") ? args[0] : contracts?.app;
            app = typeof app === "function" ? await app() : app;

            let h: any[] =
                args &&
                (args?.length > 0 && (Array.isArray(args[0]) || typeof args[0] === "string" || typeof args[0] === "number")
                    ? typeof args[0] === "string"
                        ? await app?.getHistory(args[0])
                        : await app?.["getHistoryByIndex(address, uint)"](a(User(name)), args[0])
                    : args?.length > 1 && (Array.isArray(args[1]) || typeof args[1] === "string" || typeof args[1] === "number")
                    ? typeof args[1] === "string"
                        ? await app?.getHistory(args[1])
                        : await app?.["getHistoryByIndex(address, uint)"](a(User(name)), args[1])
                    : await app?.getAllHistory(a(User(name)))!);

            const fn: HistoryParsing | undefined =
                args &&
                (args?.length === 3 && typeof args[2] === "function" ? args[2] : args?.length === 2 && typeof args[1] === "function" ? args[1] : undefined);

            const t = Array.isArray(h?.[0]);

            if (h) {
                if (!fn || typeof fn !== "function") {
                    console.log(color.lightGray(`---------------------------  User: '${name}' History ---------------------------`));
                    console.log(`Total: ${h?.length}`);
                    console.log(color.lightGray(`--------------------------------------------------------------------------------`));
                    h = (Array.isArray(h?.[0]) ? h : [h])?.map((o) => {
                        return {
                            key: o.key,
                            owner: o.owner,
                            time: Number(o.time),
                            market: o.market,
                            category: c[o.category],
                            state: s[o.state],
                            pay: o.pay,
                            item: o.item,
                            price: u(o.price),
                            amount: u(o.amount),
                            quantity: u(o.quantity),
                            fees: u(o.fees),
                        };
                    });

                    for (let i = 0; i < h.length; i++) {
                        const p = h[i].category?.includes("Long") || h[i].category?.includes("Short");
                        console.log(color.lightGray(_(`Key:`, 14)), h[i].key);
                        console.log(color.lightGray(_(`Market:`, 14)), color.lightGray(h[i].market));
                        console.log(color.lightGray(_(`Category:`, 14)), category(c?.indexOf(h[i].category)));
                        console.log(color.lightGray(_(`State:`, 14)), state(s?.indexOf(h[i].state)));
                        console.log(color.lightGray(_(`Price:`, 14)), font.bold(color.yellow(f(h[i].price))));
                        console.log(color.lightGray(_(`Amount:`, 14)), f(h[i].amount));
                        console.log(color.lightGray(_(`Quantity:`, 14)), color.yellow(f(h[i].quantity)));
                        p && console.log(color.lightGray(_(`Leverage:`, 14)), color.white(f(h[i].fees)));
                        p && console.log(color.lightGray(_(`Multiplier:`, 14)), color.lightGray("x"), color.white(f(getMultiplier(h[i].amount, h[i].fees))));
                        console.log(color.lightGray(`--------------------------------------------------------------------------------`));
                    }
                } else {
                    h = await Promise.all((t ? h : [h])?.map(async (a) => fn(a)));
                }
                return t ? h : h?.[0];
            }
            return [];
        };

        const as = async (address: AddressString): Promise<SignerLike> => {
            const signer = await ethers.getSigner(address);
            signers = {
                ...signers,
                [`${name}`]: signer,
            };
            return module;
        };

        const set = (name: number | string): any => {
            signers = {
                ...signers,
                [`${name}`]: signer,
            };
            return module;
        };

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

        if (!address || typeof signer !== "object") return { as } as IUser;
        return module;
    };

    return { User };
}
