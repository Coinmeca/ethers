import { font, color } from "../utils";

export const c = ["Order", "Buy", "Sell", "Deposit", "Withdraw", "Stake", "Unstake", "Claim", "Long", "Short", "Futures", "Perpetual", "Earn", "Charge"];
export const o = ["General", "Market", "Limit", "Debit", "Prepaid", "Postpaid"];
export const s = ["Pending", "Filled", "Claimable", "Complete", "Cancel", "Open", "Close", "Liquidation", "Requested", "Paid", "Shipping"];

export function category(x: number): string {
    switch (c[x].toLowerCase()) {
        case 'buy':
        case 'long': {
            return font.bold(color.green(c[x]));
        }
        case 'sell':
        case 'short': {
            return font.bold(color.red(c[x]));
        }
        case 'deposit': {
            return font.bold(color.magenta(c[x]));
        }
        case 'withdraw': {
            return font.bold(color.lightCyan(c[x]));
        }
        default: return c[x];
    }
}

export function state(x: number): string {
    switch (s[x].toLowerCase()) {
        case 'pending': {
            return font.bold(color.yellow(s[x]));
        }
        case 'filled': {
            return font.bold(color.green(s[x]));
        }
        case 'claimable': {
            return font.bold(color.cyan(s[x]));
        }
        case 'complete': {
            return font.bold(color.lightGray(s[x]));
        }
        case 'open': {
            return font.bold(color.green(s[x]));
        }
        case 'cancel': {
            return font.bold(color.red(s[x]));
        }
        default: return s[x];
    }
}