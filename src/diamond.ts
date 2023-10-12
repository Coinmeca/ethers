import { ethers, artifacts } from 'hardhat';
import { Artifact, HardhatRuntimeEnvironment, RunSuperFunction, TaskArguments } from 'hardhat/types';
import { subtask } from 'hardhat/config';
import { HardhatPluginError } from 'hardhat/plugins';
import { createHash } from 'crypto';
import { ResolvedFile } from 'hardhat/internal/solidity/resolver';
import { CompilationJob } from 'hardhat/internal/solidity/compilation-job';
import { TASK_COMPILE_SOLIDITY_COMPILE_JOBS } from 'hardhat/builtin-tasks/task-names';

import { font, color, _ } from './utils';
import { mkdirSync, writeFile } from 'fs';

export const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 };

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

const diamondConfig: DiamondConfig = require(`${process.cwd()}/diamond.config.ts`).default;

type ArtifactsEmittedPerFile = Array<{
    file: ResolvedFile;
    artifactsEmitted: string[];
}>;

type ArtifactsEmittedPerJob = Array<{
    compilationJob: CompilationJob;
    artifactsEmittedPerFile: ArtifactsEmittedPerFile;
}>;

class DiamondAbiCompilationJob extends CompilationJob {
    private _file: ResolvedFile;

    private artifacts: ReturnType<typeof createArtifact>[] = [];

    constructor(directory: string, name: string) {
        // Dummy solidity version that can never be valid
        super({ version: 'X.X.X', settings: {} });

        // "sourceName": "contracts/app/App.sol"
        const sourceName: string = `${directory}/${name}.sol`;
        const absolutePath: string = directory;

        const content = { rawContent: '', imports: [], versionPragmas: [] };
        // Dummy a content hash with the plugin name & version
        const contentHash = createHash('md5').update(`${directory}/${name}.sol`).digest('hex');
        const lastModificationDate = new Date();

        this._file = new ResolvedFile(sourceName, absolutePath, content, contentHash, lastModificationDate);
    }

    emitsArtifacts() {
        return true;
    }

    hasSolc9573Bug() {
        return false;
    }

    getResolvedFiles() {
        return [this._file];
    }

    getFile() {
        return this._file;
    }

    addArtifact(artifact: ReturnType<typeof createArtifact>) {
        this.artifacts.push(artifact);
    }

    getArtifactsEmitted() {
        return this.artifacts.map((artifact) => `${artifact.contractName}.sol`);
    }
}

// function diamondConfigValidation() {
//     [diamondConfig].flat().map(function (config) {
//         const { diamond, include, exclude, filter } = config ?? {};

//         if (diamond && !Array.isArray(diamond)) {
//             throw new HardhatPluginError(`DiamondAbi`, '`diamond` config must be a string.');
//         }

//         if (include && !Array.isArray(include)) {
//             throw new HardhatPluginError(`DiamondAbi`, '`include` config must be an array if provided.');
//         }

//         if (exclude && !Array.isArray(exclude)) {
//             throw new HardhatPluginError(`DiamondAbi`, '`exclude` config must be an array if provided.');
//         }

//         if (filter && typeof filter !== 'function') {
//             throw new HardhatPluginError(`DiamondAbi`, '`filter` config must be a function if provided.');
//         }

//         return {
//             include,
//             exclude,
//             filter
//         };
//     }
// };


export function createArtifact(artifact: { name: string; directory: string; info: any }, abi: unknown[]): Artifact {
    const abis = [...artifact.info.abi, ...abi];
    abi = [];
    for (let i = 0; i < abis.length; i++) {
        abi = abi.filter((abi) => JSON.stringify(abis[i]).trim() !== JSON.stringify(abi).trim());
        abi.push(abis[i]);
    }

    const path = diamondConfig?.artifact?.abi?.path?.startsWith('artifacts') ? diamondConfig?.artifact?.abi?.path?.replace('artifacts', '') : diamondConfig?.artifact?.abi?.path;

    return {
        ...artifact.info,
        contractName: `${artifact.name}.${diamondConfig.artifact?.abi?.file || 'diamond'}`,
        sourceName: `${path || '.diamonds/'}/${artifact.name}.sol`,
        abi: Array.from(new Set(abi))
    } as const;
}

async function createDiamondArtifact(contract: string, contracts?: string[]) {
    contracts = (contracts || (await artifacts.getAllFullyQualifiedNames())).filter((f: string) => !f.includes('.diamond'));
    const artifactName: string = contract + (contract.includes(':') ? '' : '.sol:' + contract);

    const artifactNames: string[] = contracts.filter(
        (f) => f.includes(artifactName)
    ).filter(
        (f) => !f.includes(diamondConfig.artifact?.abi?.path || '.diamond')
            && !f.includes(`${artifactName}.${diamondConfig.artifact?.abi?.file || '.diamond'}`)
    );

    if (artifactNames.length == 0)
        throw new HardhatPluginError(`\nDiamondArtifactsError`, `There is no contract for the given name.\n\n - ${contract}\n`);
    if (artifactNames.length > 1)
        throw new HardhatPluginError(
            `\nDiamondArtifactsError`,
            `Couldn't create diamond artifacts via config or there are multiple contracts with the same name.\n\n${contract}:\n${artifactNames
                .map((a) => ` - ${a}`)
                .join('\n')}\n`
        );

    const path: string[] = artifactNames[0].split('/');
    const folder: number = path.length;
    const directory: string = path.slice(0, folder - 1).join('/');

    const name: string = path[folder - 1].split(':')[1];

    const config = diamondConfig?.artifact?.abi;
    const include: string[] = config?.include || ['facet', 'facets', 'shared'];
    const exclude: string[] = [`I${contract}`, ...(config?.exclude || [])];

    const base: string[] = contracts.filter((f: string) => !f.includes(artifactName) && f.includes(directory));
    const facets: string[] = base.filter((f: string) => {
        for (const n of include) {
            return f.includes(n);
        }
    });

    const others: string[] = facets.filter((f: string) => {
        const other = f.split(directory + '/')[1].split('/');
        for (const n of include) {
            return !other[0].includes(n);
        }
    });

    let inner: string[] = [];
    if (others.length > 0) {
        inner = base.filter((f: string) => {
            for (const n of include) {
                return !f.includes(n);
            }
        });

        for (const e of exclude) {
            inner = inner.filter((f: string) => !f.includes(e));
        }
        inner = inner.filter((f: string) => {
            const path = f.split('/');
            !path[path.length - 1].startsWith('I');
        });
    }

    let result: string[] = facets;
    if (inner.length > 0) {
        result = base.filter((f: string) => {
            for (const n of include) {
                return f.includes([directory, n].join('/'));
            }
        });
    }

    const info = await artifacts.readArtifact(contract);

    return { name, path, directory, facets: result, info };
}

export async function diamondInfo(diamond: { name: string; address?: string; facets?: any[]; init?: Args }) {
    const contract = await createDiamondArtifact(diamond.name);

    const path = `${diamondConfig.loupe?.path || 'artifacts/.diamonds'}/${contract.name}.sol`;
    const file = `${path}/${contract.name}.${diamondConfig.loupe?.file || 'facets'}.json`;

    writeFile(file, JSON.stringify(diamond, null, 2), async (e) => {
        if (e?.message.includes('no such file or directory')) {
            mkdirSync(path, { recursive: true });
            await diamondInfo(diamond);
        } else if (e) {
            console.error(e);
        }
    });

    return file;
}

export async function diamondABI(contract: string, contracts?: string[]): Promise<string> {
    const diamondArtifact = await createDiamondArtifact(contract, contracts);

    const compilationJob = new DiamondAbiCompilationJob(diamondArtifact.directory, diamondArtifact.name);
    const abis: string[] = [];

    for (const facet of diamondArtifact.facets) {
        const { abi } = await artifacts.readArtifact(facet);
        abis.push(
            ...abi.filter((abiElement: any, index: number, abi: any[]) => {
                if (abiElement.type === 'constructor') {
                    return false;
                }
                if (abiElement.type === 'fallback') {
                    return false;
                }
                if (abiElement.type === 'receive') {
                    return false;
                }
                if (typeof diamondConfig?.artifact?.abi?.filter === 'function') {
                    return diamondConfig?.artifact?.abi?.filter(abiElement, index, abi, facet);
                }
                return true;
            })
        );
    }

    const diamond: Artifact = createArtifact(diamondArtifact, abis);
    await artifacts.saveArtifactAndDebugFile(diamond);

    compilationJob.addArtifact(diamond);
    compilationJob.getFile();
    compilationJob.getArtifactsEmitted();

    return diamond.contractName;
}

export async function diamondCut(cuts: Cut[], display?: boolean, name?: string): Promise<any[]> {
    const diamond = [];
    for (let i = 0; i < cuts.length; i++) {
        let data = [];

        if (display) {
            console.log(color.black(`---------------------------------------------------------------`));
            console.log(color.lightGray(_(`Key:`, 14)), font.bold(color.white(cuts[i].key)));
            console.log(color.black(`---------------------------------------------------------------`));
        }

        for (const facetName of cuts[i].data) {
            const facet = await (await ethers.getContractFactory(facetName)).deploy();
            const address = await facet.getAddress();
            const selectors = await getSelectors(facet);

            if (display) {
                console.log(color.lightGray(_(`Facet:`, 14)), facetName);
                console.log(color.lightGray(_(`Address:`, 14)), address);
                console.log(color.lightGray(_(`Selectors:`, 14)), selectors);
                console.log(color.black(`---------------------------------------------------------------`));
            }

            data.push({
                facetAddress: address,
                action: FacetCutAction.Add,
                functionSelectors: selectors
            });
        }
        diamond.push({ key: cuts[i].key, data: data });
    }
    return diamond;
}

export async function diamondFactory(name: string, args: any[]) {
    let diamond: any = { name };
    for (const arg of args) {
        if (Array.isArray(arg) && 'key' in arg[0] && 'data' in arg[0]) diamond = { ...diamond, facets: arg };
        if (typeof arg === 'object' && 'owner' in arg && 'init' in arg && 'initCalldata' in arg)
            diamond = { ...diamond, init: arg };
    }

    let contract: any;
    try {
        const artifact = name + '.diamond';
        contract = await ethers.getContractFactoryFromArtifact(
            await artifacts.readArtifact(
                `${artifact.includes(':')
                    ? artifact.split(':')[1]
                    : artifact.includes('/')
                        ? artifact.split('/')[artifact.split('/').length - 1]
                        : artifact
                }`
            )
        );
    } catch (error) {
        if (JSON.stringify(error).includes('not found')) {
            try {
                contract = await ethers.getContractFactory(await diamondABI(name));
            } catch {
                try {
                    contract = await ethers.getContractFactory(`${name}.${diamondConfig.artifact?.abi?.file || 'diamond'}`);
                } catch {
                    throw new HardhatPluginError(`\nDiamondArtifactsError`, `Cannot find diamond artifact.`);
                }
            }
        }
    }

    const deployed = await contract.deploy(...args);
    await diamondInfo({
        name: diamond.name,
        address: await deployed.getAddress(),
        facets: diamond.facets,
        init: diamond.init
    });

    return deployed;
}

export async function getSelectors(contract: any) {
    const selectors: any = [];
    for (const fragment of contract.interface.fragments) {
        if (fragment.type === 'function') {
            const selector = ethers.keccak256(ethers.toUtf8Bytes(fragment.format('sighash')));
            selectors.push(selector.slice(0, 10));
        }
    }
    selectors.contract = contract;
    selectors.remove = remove;
    selectors.get = get;
    return selectors;
}

export async function getSelector(func: any) {
    const abiInterface: any = new ethers.Interface([func]);
    return abiInterface.getSighash(ethers.Fragment.from(func));
}

export async function remove(this: any, functionNames: string[]) {
    const selectors: any = this.filter((v: any) => {
        for (const functionName of functionNames) {
            if (v === this.contract.interface.getSighash(functionName)) {
                return false;
            }
        }
        return true;
    });
    selectors.contract = this.contract;
    selectors.remove = this.remove;
    selectors.get = this.get;
    return selectors;
}

export async function get(this: any, functionNames: string[]) {
    const selectors = this.filter((v: any) => {
        for (const functionName of functionNames) {
            if (v === this.contract.interface.getSighash(functionName)) {
                return true;
            }
        }
        return false;
    });
    selectors.contract = this.contract;
    selectors.remove = this.remove;
    selectors.get = this.get;
    return selectors;
}

export async function removeSelectors(selectors: any, signatures: any) {
    const iface: any = new ethers.Interface(signatures.map((v: string) => 'function ' + v));
    const removeSelectors = signatures.map((v: any) => iface.getSighash(v));
    selectors = selectors.filter((v: any) => !removeSelectors.includes(v));
    return selectors;
}

export async function findAddressPositionInFacets(facetAddress: any, facets: any) {
    for (let i = 0; i < facets.length; i++) {
        if (facets[i].facetAddress === facetAddress) {
            return i;
        }
    }
}

// We ONLY hook this task, instead of providing a separate task to run, because
// Hardhat will clear out old artifacts on next run if we don't work around their
// caching mechanisms.
subtask(TASK_COMPILE_SOLIDITY_COMPILE_JOBS).setAction(generateDiamondAbi);

export async function generateDiamondAbi(
    args: TaskArguments,
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>
): Promise<{ artifactsEmittedPerJob: ArtifactsEmittedPerJob } | void> {
    const out: { artifactsEmittedPerJob: ArtifactsEmittedPerJob } = await runSuper(args);

    if (out.artifactsEmittedPerJob.length === 0) {
        return out;
    }

    const diamonds = diamondConfig?.artifact?.diamonds;
    if (Array.isArray(diamonds) && diamonds?.length > 0) {
        for (const diamond of diamonds) {
            const diamondArtifact = await createDiamondArtifact(diamond, await hre.artifacts.getAllFullyQualifiedNames());
            const compilationJob = new DiamondAbiCompilationJob(diamondArtifact.directory, diamondArtifact.name);
            const file = compilationJob.getFile();
            const artifactsEmitted = compilationJob.getArtifactsEmitted();

            return {
                artifactsEmittedPerJob: [
                    ...out.artifactsEmittedPerJob,
                    // Add as another job to the list
                    {
                        compilationJob,
                        artifactsEmittedPerFile: [
                            {
                                file,
                                artifactsEmitted
                            }
                        ]
                    }
                ]
            };
        }
    }
}
