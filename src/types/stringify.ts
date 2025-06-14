import { font, color } from "../utils";

export const c = [
    "Order",
    "Bid",
    "Ask",
    "Buy",
    "Sell",
    "Long",
    "Short",
    "LongPerp",
    "ShortPerp",
    "Listing",
    "Deposit",
    "Withdraw",
    "Stake",
    "Unstake",
    "Claim",
    "Earn",
    "Charge",
    "Grant",
    "Lockup",
    "Vesting",
];
export const o = [
    "General",
    "Market",
    "Limit",
    "Debit",
    "Prepaid",
    "Postpaid",
    "Linear",
    "Cliff",
    "Rate",
];
export const s = [
    "Pending",
    "Filled",
    "Claimable",
    "Complete",
    "Cancel",
    "Open",
    "Close",
    "Liquidated",
    "Requested",
    "Paid",
    "Shipping",
    "Proceeding",
    "Terminated",
    "Expired",
];

export function category(x: number): string {
    switch (c[x].toLowerCase()) {
        case "bid":
        case "buy":
        case "long":
        case "longperp": {
            return font.bold(color.green(c[x]));
        }
        case "ask":
        case "sell":
        case "short":
        case "shortperp": {
            return font.bold(color.red(c[x]));
        }
        case "deposit": {
            return font.bold(color.magenta(c[x]));
        }
        case "withdraw": {
            return font.bold(color.lightCyan(c[x]));
        }
        default:
            return c[x];
    }
}

export function state(x: number): string {
    switch (s[x].toLowerCase()) {
        case "pending": {
            return font.bold(color.yellow(s[x]));
        }
        case "filled": {
            return font.bold(color.green(s[x]));
        }
        case "claimable":
        case "proceeding": {
            return font.bold(color.cyan(s[x]));
        }
        case "complete":
        case "close":
        case "expired": {
            return font.bold(color.lightGray(s[x]));
        }
        case "open": {
            return font.bold(color.cyan(s[x]));
        }
        case "cancel":
        case "terminated": {
            return font.bold(color.red(s[x]));
        }
        default:
            return s[x];
    }
}
