import { BigNumberish } from 'ethers';
import { AccountLike, AddressString, SignerLike } from 'accounts';
export declare function repeat(fn: (i: number) => Promise<void>, times: number): Promise<void>;
export declare function n(n: number | string): BigNumberish;
export declare function u(n: BigNumberish, x?: number): number;
export declare function f(n: number | string): string;
export declare function a(c: SignerLike | AccountLike | AddressString | string | number, display?: boolean): AccountLike | SignerLike | AddressString | string | number;
export declare function t(n: number | 'now', u?: 'm' | 'h' | 'd' | 'w' | 'y'): Promise<number>;
export declare function duration(start: number, display?: true): Promise<number>;
export declare function ft(n: number): string;
export declare function revert(call: any, message?: string, value?: any): Promise<void>;
export declare const font: {
    bold: (msg: any) => string;
};
export declare const color: {
    black: (msg: any) => string;
    red: (msg: any) => string;
    green: (msg: any) => string;
    yellow: (msg: any) => string;
    blue: (msg: any) => string;
    magenta: (msg: any) => string;
    cyan: (msg: any) => string;
    white: (msg: any) => string;
    normal: (msg: any) => string;
    lightGray: (msg: any) => string;
    lightRed: (msg: any) => string;
    lightGreen: (msg: any) => string;
    lightYellow: (msg: any) => string;
    lightBlue: (msg: any) => string;
    lightMagenta: (msg: any) => string;
    lightCyan: (msg: any) => string;
    lightWhite: (msg: any) => string;
};
export declare function _(x: any, s: number, d?: 'l' | 'r'): string;
export declare function getNetworkName(): any;
export declare function saveAddress(result: any): void;
export declare function addAddress(contract: string, address: string): void;
export declare function loadAddress(): any;
//# sourceMappingURL=utils.d.ts.map