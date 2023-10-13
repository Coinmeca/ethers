import { ethers } from "hardhat";
import { HardhatEthersSigner, SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { IERC20 } from "interfaces/ERC20";
import { a, f, u, font, color, _ } from "utils";
import { category, state } from "types/stringify";
import { error } from "console";

export let signers: any;

export type AddressString = `${'0x'}${string}`;

export interface AccountLike {
    address: AddressString;
    [x: string | number | symbol]: unknown;
}

export type SignerLike = AccountLike | SignerWithAddress | HardhatEthersSigner

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

export async function Accounts(contracts?: { app?: any; tokens?: IERC20[] }) {
    if (!signers) {
        signers = signers || {
            ...await Promise.all((await ethers.getSigners()).map(async (a: any) => {
                return a;
            }))
        };
        signers.deployer = signers[0];
    }

    const User = (indexOrName: number | string): IUser => {
        const name: string = typeof indexOrName === 'string' ? indexOrName : indexOrName.toString();
        const signer: SignerWithAddress | HardhatEthersSigner = signers[name];
        const address: AddressString = signer.address as AddressString;

        if (!address || typeof signer !== 'object') throw error('Not found user: ', name);

        const balance = async (token?: IERC20): Promise<any> => {
            if (contracts?.tokens && Array.isArray(contracts?.tokens)) {
                const tokens = token ? [token] : contracts?.tokens;
                console.log(color.black(`--------------------- User: '${name}' Wallet ----------------------`));
                a(User(name), true);
                console.log(color.black(`-------------------------------------------------------------`))
                if (tokens?.length > 0) {
                    for (let i = 0; i < tokens?.length; i++) {
                        if (tokens[i]) {
                            const symbol = tokens[i].symbol;
                            const balance = await tokens[i].balanceOf({ address });
                            if (symbol == 'MECA') console.log(color.black(`-------------------------------------------------------------`))
                            console.log(`${_(`${symbol}:`, 14)}${font.bold(color.yellow(f(balance)))}`);
                        }
                    }
                } else {
                    console.log(`There are no tokens deployed yet.`);
                }
                console.log(color.black(`-------------------------------------------------------------`));

                return tokens.length == 1 ? tokens[0] : tokens;
            }
        };

        const send = async (token: IERC20, to: AccountLike, amount: number): Promise<boolean | void> => {
            return await token.use(User(name)).transfer(to, amount);
        }

        const faucet = async (token: IERC20, amount: number, display?: boolean): Promise<boolean | void> => {
            const result = await token.faucet({ address }, amount);
            if (result && display) {
                console.log(color.black(`-------------------------------------------------------------`));
                console.log(`-> ✨ '${name}' earn '${amount} ${token.symbol}'`);
                console.log(color.black(`-------------------------------------------------------------`));
            }
            return result;
        }

        const allowance = async (token: IERC20, to: AccountLike, amount: number): Promise<number | string> => {
            return u(await token.use(User(name)).allowance(to, amount))
        }

        const approve = async (token: IERC20, to: AccountLike, amount: number): Promise<boolean | void> => {
            return await token.use(User(name)).approve(to, amount)
        }

        const getHistory = async (app?: any): Promise<any[] | void> => {
            const App = app || contracts?.app;
            if (App) {
                return await App.historyGetAll(User(name));
            }
        }

        const history = async (history?: any, app?: any): Promise<any[] | void> => {
            const App = app || contracts?.app;
            if (App) {
                const h = history ? history : await App.historyGetAll(User(name));
                console.log(color.black(`---------------------------  User: '${name}' History ---------------------------`));
                console.log(`Total: ${h.length}`);
                console.log(color.black(`--------------------------------------------------------------------------------`));
                for (let i = 0; i < h.length; i++) {
                    console.log(`${color.lightGray(`Key:`)}          ${h[i].key}`);
                    console.log(`${color.lightGray(`Market:`)}       ${color.lightGray(h[i].market)}`);
                    console.log(`${color.lightGray(`Category:`)}     ${category(h[i].category)}`);
                    console.log(`${color.lightGray(`State:`)}        ${state(h[i].state)}`);
                    console.log(`${color.lightGray(`Price:`)}        ${font.bold(color.yellow(f(u(h[i].price))))}`);
                    console.log(`${color.lightGray(`Amount:`)}       ${f(u(h[i].amount))}`);
                    console.log(`${color.lightGray(`Quantity:`)}     ${color.yellow(f(u(h[i].quantity)))}`);
                    console.log(color.black(`--------------------------------------------------------------------------------`));
                }
                return h;
            }
        };

        const set = (name: number | string): void => {
            signers = {
                ...signers,
                [`${name}`]: signer
            }
        }

        const module: IUser = {
            ...signer,
            signer,
            address,
            name,
            set,
            faucet,
            balance,
            allowance,
            approve,
            send,
            history,
            getHistory,
        }

        return module;
    }

    return { User }
}