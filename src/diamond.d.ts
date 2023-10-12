import { Artifact, HardhatRuntimeEnvironment, RunSuperFunction, TaskArguments } from 'hardhat/types';
import { ResolvedFile } from 'hardhat/internal/solidity/resolver';
import { CompilationJob } from 'hardhat/internal/solidity/compilation-job';
export declare const FacetCutAction: {
    Add: number;
    Replace: number;
    Remove: number;
};
export interface Cut {
    key: string;
    data: string[];
}
export interface Args {
    owner: any;
    init?: any;
    initCalldata?: any;
}
type BytesString = string | `0x${string}`;
interface DiamondDeployerConfig {
    address?: BytesString;
    privateKey?: BytesString;
}
interface DiamondExportConfig {
    path?: string;
    file?: string;
}
interface DiamondAbiConfig extends DiamondExportConfig {
    include?: string[];
    exclude?: string[];
    filter?: (abiElement: any, index: number, abi: any[], name: string) => boolean;
}
interface DiamondArtifactConfig {
    diamonds?: string[];
    abi?: DiamondAbiConfig;
}
export interface DiamondConfig {
    deployer?: DiamondDeployerConfig;
    artifact?: DiamondArtifactConfig;
    loupe?: DiamondExportConfig;
}
type ArtifactsEmittedPerFile = Array<{
    file: ResolvedFile;
    artifactsEmitted: string[];
}>;
type ArtifactsEmittedPerJob = Array<{
    compilationJob: CompilationJob;
    artifactsEmittedPerFile: ArtifactsEmittedPerFile;
}>;
export declare function createArtifact(artifact: {
    name: string;
    directory: string;
    info: any;
}, abi: unknown[]): Artifact;
export declare function diamondInfo(diamond: {
    name: string;
    address?: string;
    facets?: any[];
    init?: Args;
}): Promise<string>;
export declare function diamondABI(contract: string, contracts?: string[]): Promise<string>;
export declare function diamondCut(cuts: Cut[], display?: boolean, name?: string): Promise<any[]>;
export declare function diamondFactory(name: string, args: any[]): Promise<any>;
export declare function getSelectors(contract: any): Promise<any>;
export declare function getSelector(func: any): Promise<any>;
export declare function remove(this: any, functionNames: string[]): Promise<any>;
export declare function get(this: any, functionNames: string[]): Promise<any>;
export declare function removeSelectors(selectors: any, signatures: any): Promise<any>;
export declare function findAddressPositionInFacets(facetAddress: any, facets: any): Promise<number | undefined>;
export declare function generateDiamondAbi(args: TaskArguments, hre: HardhatRuntimeEnvironment, runSuper: RunSuperFunction<TaskArguments>): Promise<{
    artifactsEmittedPerJob: ArtifactsEmittedPerJob;
} | void>;
export {};
//# sourceMappingURL=diamond.d.ts.map