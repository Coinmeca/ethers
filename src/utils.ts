
import { env } from 'process';
import { error } from 'console';
import { expect } from 'chai';
import { ethers, network } from 'hardhat';
import { BigNumberish, toNumber } from 'ethers';
import { AccountLike } from 'accounts';
import { AddressString } from './types';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { time } from '@nomicfoundation/hardhat-network-helpers';

// repeat
export async function repeat(
    ...args:
        | [fn: Function, times: number]
        | [fn: Function, times: number, display: boolean]
        | [label: string, fn: Function, times: number]
        | [label: string, fn: Function, times: number, display: boolean]
): Promise<number> {
    const label = (!!args[0] && typeof args[0] === 'string') && args[0] || '';
    const fn = (args?.length && args.length > 2 ? args[1] : args[0]) as Function;
    const times = (args?.length && args.length > 2 ? args[2] : args[1]) as number;
    const display = args?.length && args.length > 3 ? args[3] : (args.length > 2 && typeof args[2]) && args[2];

    let count = 0;

    if (display) {
        const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let stop = false;
        let frame = 0;
        let msg: string | number = '';

        const interval = setInterval(() => {
            process.stdout.write('\r' + `${exports.color.cyan(spinner[frame % spinner.length])} ${(label && label !== "") ? _(exports.font.bold(`${exports.color.white(label)}:`), 14) : ''} ${msg || `${exports.color.lightGray(fn?.name || '')} ${exports.color.yellow(`${count + 1} / ${times}`)}`} \n`);
            frame++;
            process.stdout.write('\x1b[2K');
            process.stdout.write('\x1b[F');
        }, 80);

        try {
            for (let i = 0; i < times; i++) {
                const result = await fn(i);
                if (typeof result === 'boolean' && !!!result) {
                    stop = true;
                    break;
                };
                if (typeof result === "string" || typeof result === "number") msg = result;
                count++;
            }

            process.stdout.write('\r' + `${exports.color.cyan(spinner[frame % spinner.length])} ${_(exports.font.bold(exports.color.white(label)), 14)}: ${msg || `${exports.color.lightGray(fn?.name || '')} ${exports.color.yellow(`${count + 1} / ${times}`)}`} \n`);
            process.stdout.write('\x1b[2K');
            process.stdout.write('\x1b[F');
            process.stdout.write('\r');

            if (stop) console.log(exports.color.yellow(`⧖`), exports.color.lightGray(`Stopped ${label}s progress! \n`));
            else console.log(exports.color.green(`✔`), exports.color.lightGray(`All ${label}s complete! \n`));

            return count;
        } catch (error) {
            process.stdout.write('\r');
            console.log(`${exports.color.red(`✖`)} ${exports.color.lightGray(`Fail ${label}s progress! \n`)}`);
            console.error(error);
            return count;
        } finally {
            clearInterval(interval);
        }
    } else {
        try {
            for (let i = 0; i < times; i++) {
                const result = await fn(i);
                if (result === false) break;
                count++;
            }
            return count;
        } catch (error) {
            console.error(error);
            return count;
        }
    }
}

// number to big number
export function n(number: number | string, decimals?: number): BigNumberish {
    number = number.toString().replaceAll(',', '');
    const e = number.split('e');
    const d = e[0].split('.');
    return ethers.parseUnits(
        (e.length > 1
            ? e[1].startsWith('-')
                ? d[0].length > Math.abs(parseInt(e[1]))
                    ? d[0].substring(0, d[0].length - Math.abs(parseInt(e[1])) - 1) + '.' + d[0].substring(d[0].length - Math.abs(parseInt(e[1])), d[0].length) + (d?.length > 1 ? d[1] : '')
                    : '0.' + '0'.repeat(Math.abs(parseInt(e[1])) - d[0].length) + d[0] + (d?.length > 1 ? d[1] : '')
                : d.length > 1
                    ? d[1].length > parseInt(e[1])
                        ? d[0] + d[1].substring(0, d[1].length - parseInt(e[1])) + '.' + d[1].substring(d[1].length - parseInt(e[1]), d[1].length)
                        : d[0] + d[1] + '0'.repeat(parseInt(e[1]) - d[1].length)
                    : d[0] + '0'.repeat(parseInt(e[1]))
            : number).substring(0, 18),
        decimals
            ? parseInt(decimals.toString())
            : undefined
    );
}

// big number to number
export function u(number: BigNumberish, decimals?: number): number {
    return parseFloat(decimals ? ethers.formatUnits(number, decimals) : ethers.formatUnits(number));
}

export function f(n: number | string): string {
    return n?.toLocaleString();
}

// get address
export function a(
    c: AccountLike | AddressString | string | number,
    display?: boolean
): AccountLike | AddressString | string {
    const result =
        (typeof c === 'number' && c == 0
            ? '0x0000000000000000000000000000000000000000'
            : typeof c === 'string' && c.length === 42 && c.indexOf('x') === 1 && c !== ''
                ? c
                : (c as AccountLike)?.address);
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
        Math.floor((n % 2592000) / 604800),
        Math.floor((n % 604800) / 86400),
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
    console.log(color.lightGray(`-------------------------------------------------------------`));
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
    console.log(color.lightGray(`-------------------------------------------------------------`));
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
        if (gap > 0) result += ' '.repeat(gap);
    } else {
        if (gap > 0) result = ' '.repeat(gap) + result;
    }
    return result;
}

export function result(result: boolean, message: string, option?: any) {
    if (result) {
        console.log(
            color.green(font.bold('✓')),
            color.green(` ${message || 'Success'}\n`),
        );
        option && (option[0] && Array.isArray(option)) ? option.map((o) => { console.log(color.lightGray(' - ' + o), '\n') }) : console.log(color.lightGray(option))
    } else {
        console.log(color.red(font.bold('❌')), color.red(` ${message || 'Failure'}\n\n`), option && color.lightGray(option), '\n');
    }
}

export function getMultiplier(size: number, leverage: number): number {
    const margin = size - leverage;
    return size === 0 ? 0 : leverage === 0 ? 0 : size > margin ? size / margin : size;
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

    const path = (env.DEPLOY_INFO_PATH || 'scripts/deploy/address') + '/' + n.name + '/';
    const name = env.DEPLOY_INFO || 'deploy-info.json';
    const file = `${path}/${name}`;

    try {
        writeFileSync(file, JSON.stringify({ network: n.capitalize, contracts: result?.contracts ? { ...result?.contracts } : result }, null, 4));
    } catch (e: any) {
        if (e?.toString().includes('no such file or directory')) {
            mkdirSync(path!, { recursive: true });
            saveAddress(result);
        } else if (e) {
            console.error(e);
        }
    }
}

export function addAddress(contract: string, address: AddressString | AddressString[] | object) {
    const load = loadAddress();
    saveAddress({ ...load?.contracts, [`${contract}`]: address });
}

export function loadAddress() {
    const n = getNetworkName();

    const path = (env.DEPLOY_INFO_PATH || 'scripts/deploy/address') + '/' + n.name + '/';
    const name = env.DEPLOY_INFO || 'deploy-info.json';

    const file = `${path}/${name}`;

    try {
        return JSON.parse(readFileSync(file, 'utf8'));
    } catch {
        return undefined;
    }
}