import { ethers } from "hardhat";
import { AddressLike, BaseContract, Typed } from "ethers";
import { AccountLike, IUser } from "accounts";
import { a, color } from "utils";
import { AddressString } from "../types";

export interface IERC721 extends IERC721Module {
    use: (user: IUser) => IERC721Module;
}

export interface IERC721Module extends AccountLike {
    name: string;
    symbol: string;
    getId: (key: string, display?: boolean) => Promise<number>;
    getKey: (id: number | string, display?: boolean) => Promise<string>;
    tokenURI: (id: number | string, display?: boolean) => Promise<string>;
    tokenIMG: (id: number | string, display?: boolean) => Promise<string>;
    totalSupply: () => Promise<number>;
    balanceOf: (owner: AccountLike | AddressString, display?: boolean) => Promise<number>;
    tokensOf: (owner: AccountLike | AddressString, display?: boolean) => Promise<number[]>;
    keysOf: (owner: AccountLike | AddressString, display?: boolean) => Promise<string[]>;
    ownerOf: (id: number | string, display?: boolean) => Promise<AddressLike>;
    transfer: (to: AccountLike | AddressString, id: number | string) => Promise<any>;
    transferFrom: (from: AccountLike | AddressString, to: AccountLike | AddressString, id: number | string) => Promise<any>;
    safeTransferFrom: (from: AccountLike | AddressString, to: AccountLike | AddressString, id: number | string, data?: any) => Promise<any>;
    approve: (to: AccountLike | AddressString, id: number | string) => Promise<any>;
    getApproved: (id: number | string) => Promise<any>;
    setApprovalForAll: (operator: AccountLike | AddressString, approve: boolean) => Promise<any>;
    isApprovedForAll: (owner: AccountLike | AddressString, operator: AccountLike | AddressString) => Promise<any>;
    contract: BaseContract;
}

export async function ERC721(token: any): Promise<IERC721> {
    token = typeof token === 'string' ? await ethers.getContractAtFromArtifact(JSON.parse(require('fs').readFileSync(require('path').resolve(__dirname, '../artifacts/ERC721.sol/ERC721.json'))), token) : token;

    const name: string = typeof token?.name === 'function' ? await token?.name() : typeof token?.name === 'string' ? token?.name : null;
    const symbol: string = typeof token?.symbol === 'function' ? await token?.symbol() : typeof token?.symbol === 'string' ? token?.symbol : null;
    const address: AddressString = typeof token?.getAddress === 'function' ? await token?.getAddress() : typeof token?.address === 'string' ? token?.address : null;

    const module = (token: any, user?: IUser): IERC721Module => {
        const getId = async (key: string, display?: boolean): Promise<number> => {
            const id: number = await token.getId(key);
            if (display) {
                console.log(color.lightGray(`------------------------- Order NFT --------------------------`));
                console.log(`🖼️ Token ID:     ${id}`);
                console.log(color.lightGray(`--------------------------------------------------------------`));
            }
            return id;
        };

        const getKey = async (id: number | string, display?: boolean): Promise<string> => {
            const key: string = await token.getKey(typeof id === 'number' ? Typed.uint(id) : Typed.bytes32(id));
            if (display) {
                console.log(color.lightGray(`------------------------- Order NFT --------------------------`));
                console.log(`🔑 Order Key:     ${key}`);
                console.log(color.lightGray(`--------------------------------------------------------------`));
            }
            return key;
        }

        const tokenURI = async (id: number | string, display?: boolean): Promise<string> => {
            const uri = await token.tokenURI(typeof id === 'number' ? Typed.uint(id) : Typed.bytes32(id));
            if (display) {
                console.log(color.lightGray(`------------------------- Order NFT --------------------------`));
                console.log(`Token ID:     ${id}`);
                console.log(`Token IMG:    ${uri}`);
                console.log(color.lightGray(`--------------------------------------------------------------`));
            }
            return uri;
        }

        const tokenIMG = async (id: number | string, display?: boolean): Promise<string> => {
            const img = await token.tokenIMG(typeof id === 'number' ? Typed.uint(id) : Typed.bytes32(id));
            if (display) {
                console.log(color.lightGray(`------------------------- Order NFT --------------------------`));
                console.log(`Token ID:     ${id}`);
                console.log(`Token IMG:    ${img}`);
                console.log(color.lightGray(`--------------------------------------------------------------`));
            }
            return img;
        }

        const totalSupply = async (): Promise<number> => {
            return await token?.totalSupply();
        }

        const balanceOf = async (owner: AccountLike | AddressString, display?: boolean): Promise<number> => {
            const balance = await token.balanceOf(a(owner))
            if (display) {
                console.log(color.lightGray(`------------------------- Order NFT --------------------------`));
                console.log(`Owner:        ${a(owner)}`);
                console.log(`Tokens:       ${balance}`);
                console.log(color.lightGray(`--------------------------------------------------------------`));
            }
            return balance;
        }

        const tokensOf = async (owner: AccountLike | AddressString, display?: boolean): Promise<number[]> => {
            const tokens = await token.tokensOf(a(owner));
            if (display) {
                console.log(color.lightGray(`------------------------- Order NFT --------------------------`));
                console.log(`Owner:         ${a(owner)}`);
                console.log(`Tokens:        ${tokens}`);
                console.log(color.lightGray(`--------------------------------------------------------------`));
            }
            return tokens;
        }

        const keysOf = async (owner: AccountLike | AddressString, display?: boolean): Promise<string[]> => {
            const keys = await token.keysOf(a(owner));
            if (display) {
                console.log(color.lightGray(`------------------------- Order NFT --------------------------`));
                console.log(`Owner:         ${a(owner)}`);
                console.log(`Keys:          ${keys}`);
                console.log(color.lightGray(`--------------------------------------------------------------`));
            }
            return keys;
        }

        const ownerOf = async (id: number | string, display?: boolean): Promise<AddressLike> => {
            const owner = await token.ownerOf(typeof id === 'number' ? Typed.uint(id) : Typed.bytes32(id));
            if (display) {
                console.log(color.lightGray(`------------------------- Order NFT --------------------------`));
                console.log(`Owner:        ${a(owner)}`);
                console.log(`Token ID:     ${id}`);
                console.log(color.lightGray(`--------------------------------------------------------------`));
            }
            return owner;
        };

        const transfer = async (to: AccountLike | AddressString, id: number | string): Promise<any> => {
            return await token.transfer(a(to), typeof id === 'number' ? Typed.uint(id) : Typed.bytes32(id));
        }

        const transferFrom = async (from: AccountLike | AddressString, to: AccountLike | AddressString, id: number | string): Promise<any> => {
            return await token.transferFrom(a(from), a(to), typeof id === 'number' ? Typed.uint(id) : Typed.bytes32(id));
        };

        const safeTransferFrom = async (from: AccountLike | AddressString, to: AccountLike | AddressString, id: number | string, data?: any): Promise<any> => {
            return data
                ? await token['safeTransferFrom(address,address,uint256)'](a(from), a(to), typeof id === 'number' ? Typed.uint(id) : Typed.bytes32(id))
                : await token['safeTransferFrom(address,address,uint256,bytes)'](a(from), a(to), typeof id === 'number' ? Typed.uint(id) : Typed.bytes32(id), data);
        }

        const approve = async (to: AccountLike | AddressString, id: number | string): Promise<any> => {
            return await token.approve(a(to), id);
        };

        const getApproved = async (id: number | string): Promise<any> => {
            return await token.getApproved(id)
        }

        const setApprovalForAll = async (operator: AccountLike | AddressString, approve: boolean): Promise<any> => {
            await token.setApprovalForAll(a(operator), approve);
        };

        const isApprovedForAll = async (owner: AccountLike | AddressString, operator: AccountLike | AddressString): Promise<any> => {
            return token.isApprovedForAll(a(owner), a(operator));
        };

        return {
            name,
            symbol,
            address,
            totalSupply,
            getId,
            getKey,
            tokenURI,
            tokenIMG,
            balanceOf,
            tokensOf,
            keysOf,
            ownerOf,
            transfer,
            transferFrom,
            safeTransferFrom,
            approve,
            getApproved,
            setApprovalForAll,
            isApprovedForAll,
            contract: token,
        }
    }

    const use = (user: IUser): IERC721Module => {
        return module(token.connect(user.signer), user);
    }

    return {
        ...module(token),
        use
    };
}

export default ERC721;