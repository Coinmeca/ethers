import { AccountLike } from "./accounts";

export type AddressString = `${'0x'}${string}`;

export type Category = 'order' | 'buy' | 'sell' | 'deposit' | 'withdraw' | 'stake' | 'unstake' | 'claim' | 'long' | 'short' | 'futures' | 'perpetual' | 'earn' | 'charge';
export type Option = 'general' | 'market' | 'limit' | 'debit' | 'prepaid' | 'postpaid';
export type State = 'pending' | 'filled' | 'claimable' | 'complete' | 'cancel' | 'open' | 'close' | 'liquidation' | 'requested' | 'paid' | 'shipping';

export const c = {
    order: 0,
    buy: 1,
    sell: 2,
    deposit: 3,
    withdraw: 4,
    stake: 5,
    unstake: 6,
    claim: 7,
    long: 8,
    short: 9,
    futures: 10,
    perpetual: 11,
    earn: 12,
    charge: 13
}

export const o = {
    general: 0,
    market: 1,
    limit: 2,
    debit: 3,
    prepaid: 4,
    postpaid: 5,
}

export const s = {
    pending: 0,
    filled: 1,
    claimable: 2,
    complete: 3,
    cancel: 4,
    open: 5,
    close: 6,
    liquidation: 7,
    requested: 8,
    paid: 9,
    shipping: 10,
}

export interface Order {
    key: string;
    category: Category;
    option: Option;
    state: State;
    time: number;
    price: number;
    amount: number;
    quantity: number;
    fees: number;
    pay: AccountLike | AddressString | string;
    item: AccountLike | AddressString | string;
    owner: AccountLike | AddressString | string;
    market: AccountLike | AddressString | string;
}

export interface AppInfo {
    name: string;
    symbol: string;
    version: string;
    url: string;
    description: string;
}

export interface ServiceInfo {
    id: number;
    service: string;
}

export interface TokenInfo {
    addr: AddressString;
    name: string;
    symbol: string;
    decimals: number;
}

export interface AppInfo {
    name: string;
    symbol: string;
    version: string;
    url: string;
    description: string;
}

export interface ServiceInfo {
    id: number;
    service: string;
}

export interface UserProfile {
    name: string;
    img: string;
    user: string;
}

export interface UserCredit {
    point: number;
    score: number;
    app: string;
}

export interface UserData {
    point: number;
    score: number;
    name: string;
    img: string;
    app: string;
    user: AddressString;
}

export interface UserInfo {
    name: string;
    img: string;
    user: string;
    credit: UserCredit[];
}
