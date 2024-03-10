import { AccountLike } from "./accounts";

export type AddressString = `0x${string[40]}`;

export type Category = 'order' | 'buy' | 'sell' | 'deposit' | 'withdraw' | 'stake' | 'unstake' | 'claim' | 'long' | 'short' | 'futures' | 'perpetual' | 'earn' | 'charge' | 'grant' | 'lockup' | 'vesting' | 'listing';
export type Option = 'general' | 'market' | 'limit' | 'debit' | 'prepaid' | 'postpaid' | 'linear' | 'cliff' | 'rate';
export type State = 'pending' | 'filled' | 'claimable' | 'complete' | 'cancel' | 'open' | 'close' | 'liquidation' | 'requested' | 'paid' | 'shipping' | 'proceeding' | 'terminated';

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
    charge: 13,
    grant: 14,
    lockup: 15,
    vesting: 16,
    listing: 17
}

export const o = {
    general: 0,
    market: 1,
    limit: 2,
    debit: 3,
    prepaid: 4,
    postpaid: 5,
    linear: 6,
    cliff: 7,
    rate: 8,
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
    proceeding: 11,
    terminated: 12
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
    logo: string;
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
