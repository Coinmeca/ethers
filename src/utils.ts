import { ethers, network } from 'hardhat';
import { time } from '@nomicfoundation/hardhat-network-helpers';
import { BigNumberish, toNumber } from 'ethers';
import { AccountLike, AddressString, SignerLike } from 'accounts';
import { expect } from 'chai';
import { env } from 'process';
import { error } from 'console';
import { mkdirSync, writeFile } from 'fs';

// repeat
export async function repeat(fn: (i: number) => Promise<void>, times: number) {
    for (let i = 0; i < times; i++) {
        await fn(i);
    }
}

// number to big number
export function n(n: number | string): BigNumberish {
    if (typeof n === 'string') n?.replaceAll(',', '');
    return ethers.parseUnits(n?.toString());
}

// big number to number
export function u(n: BigNumberish, x?: number): number {
    const num = parseFloat(ethers.formatUnits(n));
    return x ? parseFloat(num.toFixed(x)) : num;
}

export function f(n: number | string): string {
    return n?.toLocaleString();
}

// get address
export function a(
    c: SignerLike | AccountLike | AddressString | string | number,
    display?: boolean
): AccountLike | SignerLike | AddressString | string | number {
    const result =
        (typeof c === 'number' && c == 0
            ? '0x0000000000000000000000000000000000000000'
            : typeof c === 'string' && c !== ''
                ? c
                : (c as AccountLike).address) || c;
    typeof result === 'string' && display && console.log(_('Address:', 13), result);
    return result;
}

// spend time
export async function t(n: number | 'now', u?: 'm' | 'h' | 'd' | 'w' | 'y'): Promise<number> {
    if (typeof n === 'number') {
        if (u) {
            switch (u) {
                case 'm': {
                    n *= 60;
                    break;
                }
                case 'h': {
                    n *= 3600;
                    break;
                }
                case 'd': {
                    n *= 86400;
                    break;
                }
                case 'w': {
                    n *= 86400 * 7;
                }
                case 'y': {
                    n *= 86400 * 365;
                }
            }
        }
        await time.increase(n);
        return n;
    } else if (n === 'now') {
        return toNumber(BigInt(await time.latest()));
    }
    return 0;
}

export async function duration(start: number, display?: true): Promise<number> {
    const duration: number = (await t('now')) - toNumber(BigInt(start));
    display &&
        console.log(
            _('Duration:', 13),
            _(`${font.bold(color.yellow(duration))}`, 26),
            ' from ',
            _(`${font.bold(color.yellow(start))}`, 26),
            '  ',
            color.lightGray('('),
            ft(duration),
            color.lightGray(')')
        );
    return duration;
}

// format time
export function ft(n: number): string {
    n = toNumber(BigInt(n));
    const format: string[] = ['Y', 'M', 'w', 'd', 'h', 'm', 's'];
    const date: number[] = [
        Math.floor(n / 31536000),
        Math.floor((n % 31536000) / 2592000),
        Math.floor((n % 31536000) / 604800),
        Math.floor((n % 2592000) / 86400),
        Math.floor((n % 86400) / 3600),
        Math.floor((n % 3600) / 60),
        Math.floor(n % 60)
    ];
    let check: boolean = false;
    let start: number = 0;
    let time: any[] = date.map((t: number, i: number) => {
        if (!check && t !== 0) {
            check = true;
            start = i;
        }
        if (check) {
            return `${font.bold(start <= 4 && i > start && t < 10 ? `0${t}` : t)}${color.lightGray(format[i])}`;
        }
    });
    let result: string = time.join(' ');
    return result
        .substring(result[0] === ' ' ? 1 : 0, result.length)
        .replaceAll('   ', '')
        .replaceAll('  ', '');
}

export async function revert(call: any, message?: string, value?: any) {
    console.log(color.black(`-------------------------------------------------------------`));
    try {
        await expect(call, message).to.be.reverted;
        if (message && value)
            console.warn(
                font.bold(
                    `${color.lightGreen(`emit`)} ${color.lightCyan(`Revert: ${message}(`)}${color.lightWhite(
                        value
                    )}${color.lightCyan(`)`)}`
                )
            );
        else if (message && !value)
            console.warn(font.bold(`${color.lightGreen(`emit`)} ${color.lightCyan(`Revert: ${message}`)}`));
        else if (!message && !value) console.warn(font.bold(`${color.lightGreen(`emit`)} ${color.lightCyan(`Revert`)}`));
    } catch (e) {
        if (message && value)
            throw error(
                `${font.bold(`${color.red(`Wrong Revert: ${message}(`)}${color.white(value)}${color.red(`)`)}`)}${e ? `\n\n${color.red(e)}` : ''
                }`
            );
        else if (message && !value) throw error(`${font.bold(color.red(`Wrong Revert: ${message}`))}${e ? color.red(e) : ''}`);
        else if (!message && !value) throw error(`${font.bold(color.red(`Wrong Revert`))}${e ? color.red(e) : ''}`);
    }
    console.log(color.black(`-------------------------------------------------------------`));
}

export const font = {
    bold: (msg: any): string => `\x1b[1m${msg}\x1b[0m`
};

export const color = {
    black: (msg: any): string => `\x1b[30m${msg}\x1b[39m`,
    red: (msg: any): string => `\x1b[31m${msg}\x1b[39m`,
    green: (msg: any): string => `\x1b[32m${msg}\x1b[39m`,
    yellow: (msg: any): string => `\x1b[33m${msg}\x1b[39m`,
    blue: (msg: any): string => `\x1b[34m${msg}\x1b[39m`,
    magenta: (msg: any): string => `\x1b[35m${msg}\x1b[39m`,
    cyan: (msg: any): string => `\x1b[36m${msg}\x1b[39m`,
    white: (msg: any): string => `\x1b[37m${msg}\x1b[39m`,
    normal: (msg: any): string => `\x1b[39m${msg}\x1b[39m`,
    lightGray: (msg: any): string => `\x1b[90m${msg}\x1b[39m`,
    lightRed: (msg: any): string => `\x1b[91m${msg}\x1b[39m`,
    lightGreen: (msg: any): string => `\x1b[92m${msg}\x1b[39m`,
    lightYellow: (msg: any): string => `\x1b[93m${msg}\x1b[39m`,
    lightBlue: (msg: any): string => `\x1b[94m${msg}\x1b[39m`,
    lightMagenta: (msg: any): string => `\x1b[95m${msg}\x1b[39m`,
    lightCyan: (msg: any): string => `\x1b[96m${msg}\x1b[39m`,
    lightWhite: (msg: any): string => `\x1b[97m${msg}\x1b[39m`
};

export function _(x: any, s: number, d: 'l' | 'r' = 'l'): string {
    const msg = x.toString();
    const length = msg.length;
    const gap = s <= length ? 0 : s - length;
    let result: string = msg;
    if (d === 'l') {
        if (gap > 0) {
            result += ' '.repeat(gap);
        }
    } else {
        if (gap > 0) {
            result = ' '.repeat(gap) + result;
        }
    }
    return result;
}

export function getNetworkName(): any {
    const filter = ['.', '-', '_'];
    const name = filter.map((f: string) => {
        return network.name.includes(f) ? network.name.replaceAll(f, ' ') : network.name;
    })[0];
    const capitalize = name
        .split(' ')
        .map((word: string) => word.substring(0, 1).toUpperCase() + word.substring(1, word.length).toLowerCase())[0];
    return { name, capitalize };
}

export function saveAddress(result: any) {
    const n = getNetworkName();

    const path = (env.DEPLOY_INFO_PATH || 'scripts/deploy/address/') + n.name + '/';
    const name = env.DEPLOY_INFO || 'deploy-info.json';
    const file = `${path}/${name}`;

    writeFile(
        file,
        JSON.stringify({ network: n.capitalize, contracts: result?.contracts ? { ...result?.contracts } : result }, null, 4),
        (e) => {
            if (e?.message.includes('no such file or directory')) {
                mkdirSync(path!, { recursive: true });
                saveAddress(result);
            } else if (e) {
                console.error(e);
            }
        }
    );
}

export function addAddress(contract: string, address: string) {
    const load = loadAddress();
    saveAddress({ ...load?.contracts, [`${contract}`]: address });
}

export function loadAddress() {
    const n = getNetworkName();

    const path = (env.DEPLOY_INFO_PATH || 'scripts/deploy/address/') + n.name + '/';
    const name = env.DEPLOY_INFO || 'deploy-info.json';

    const file = `${path}/${name}`;

    try {
        return JSON.parse(require('fs').readFileSync(file));
    } catch {
        return undefined;
    }
}