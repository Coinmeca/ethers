import { AddressLike } from "ethers";
import { AccountLike, IUser } from "accounts";
import { a, color } from "utils";

export interface IERC721 extends IERC721Module {
    use: (user: IUser) => IERC721Module;
}

export interface IERC721Module extends AccountLike {
    name: string;
    symbol: string;
    totalSupply: () => Promise<Number>;
    getId: (key: string, display?: boolean) => Promise<number>;
    getKey: (id: number, display?: boolean) => Promise<string>;
    tokenURI: (id: number | string, display?: boolean) => Promise<string>;
    tokenIMG: (id: number | string, display?: boolean) => Promise<string>;
    balanceOf: (owner: any, display?: boolean) => Promise<number>;
    tokensOf: (owner: any, display?: boolean) => Promise<number[]>;
    keysOf: (owner: any, display?: boolean) => Promise<string[]>;
    ownerOf: (id: number | string, display?: boolean) => Promise<AddressLike>;
    transferFrom: (from: any, to: any, id: number | string) => Promise<any>;
    safeTransferFrom: (from: any, to: any, id: number | string, data?: any) => Promise<any>;
    approve: (to: any, id: number) => Promise<any>;
    getApproved: (id: number | string) => Promise<any>;
    setApprovalForAll: (operator: any, approve: boolean) => Promise<any>;
    isApprovedForAll: (owner: any, operator: any) => Promise<any>;
}

export default async function ERC721(token: any): Promise<IERC721> {
    const name = await token.name();
    const symbol = await token.symbol();
    const address = await token.getAddress();

    const module = (token: any, user?: IUser): IERC721Module => {
        const getId = async (key: string, display?: boolean): Promise<number> => {
            const id: number = await token.getId(key);
            if (display) {
                console.log(color.black(`------------------------- Order NFT --------------------------`));
                console.log(`🖼️ Token ID:     ${id}`);
                console.log(color.black(`--------------------------------------------------------------`));
            }
            return id;
        };

        const getKey = async (id: number, display?: boolean): Promise<string> => {
            const key: string = await token.getKey(id);
            if (display) {
                console.log(color.black(`------------------------- Order NFT --------------------------`));
                console.log(`🔑 Order Key:     ${key}`);
                console.log(color.black(`--------------------------------------------------------------`));
            }
            return key;
        }

        const tokenURI = async (id: number | string, display?: boolean): Promise<string> => {
            const uri = await token.tokenURI(id);
            if (display) {
                console.log(color.black(`------------------------- Order NFT --------------------------`));
                console.log(`Token ID:     ${id}`);
                console.log(`Token IMG:    ${uri}`);
                console.log(color.black(`--------------------------------------------------------------`));
            }
            return uri;
        }

        const tokenIMG = async (id: number | string, display?: boolean): Promise<string> => {
            const img = await token.tokenIMG(id);
            if (display) {
                console.log(color.black(`------------------------- Order NFT --------------------------`));
                console.log(`Token ID:     ${id}`);
                console.log(`Token IMG:    ${img}`);
                console.log(color.black(`--------------------------------------------------------------`));
            }
            return img;
        }

        const balanceOf = async (owner: any, display?: boolean): Promise<number> => {
            const balance = await token.balanceOf(a(owner))
            if (display) {
                console.log(color.black(`------------------------- Order NFT --------------------------`));
                console.log(`Owner:        ${a(owner)}`);
                console.log(`Tokens:       ${balance}`);
                console.log(color.black(`--------------------------------------------------------------`));
            }
            return balance;
        }

        const tokensOf = async (owner: any, display?: boolean): Promise<number[]> => {
            const tokens = await token.tokensOf(a(owner));
            if (display) {
                console.log(color.black(`------------------------- Order NFT --------------------------`));
                console.log(`Owner:         ${a(owner)}`);
                console.log(`Tokens:        ${tokens}`);
                console.log(color.black(`--------------------------------------------------------------`));
            }
            return tokens;
        }

        const keysOf = async (owner: any, display?: boolean): Promise<string[]> => {
            const keys = await token.keysOf(a(owner));
            if (display) {
                console.log(color.black(`------------------------- Order NFT --------------------------`));
                console.log(`Owner:         ${a(owner)}`);
                console.log(`Keys:          ${keys}`);
                console.log(color.black(`--------------------------------------------------------------`));
            }
            return keys;
        }

        const ownerOf = async (id: number | string, display?: boolean): Promise<AddressLike> => {
            const owner = await token.ownerOf(id);
            if (display) {
                console.log(color.black(`------------------------- Order NFT --------------------------`));
                console.log(`Owner:        ${a(owner)}`);
                console.log(`Token ID:     ${id}`);
                console.log(color.black(`--------------------------------------------------------------`));
            }
            return owner;
        };

        const totalSupply = async (): Promise<Number> => {
            return await token.totalSupply()
        }

        const transferFrom = async (from: any, to: any, id: number | string): Promise<any> => {
            return await token.transferFrom(a(from), a(to), id);
        };

        const safeTransferFrom = async (from: any, to: any, id: number | string, data?: any): Promise<any> => {
            return data
                ? await token.safeTransferFrom(a(from), a(to), id)
                : await token.safeTransferFrom(a(from), a(to), id, data);
        }

        const approve = async (to: any, id: number): Promise<any> => {
            return await token.approve(a(to), id);
        };

        const getApproved = async (id: number | string): Promise<any> => {
            return await token.getApproved(id)
        }

        const setApprovalForAll = async (operator: any, approve: boolean): Promise<any> => {
            await token.setApprovalForAll(a(operator), approve);
        };

        const isApprovedForAll = async (owner: any, operator: any): Promise<any> => {
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
            transferFrom,
            safeTransferFrom,
            approve,
            getApproved,
            setApprovalForAll,
            isApprovedForAll,
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