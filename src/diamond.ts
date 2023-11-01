import { mkdirSync, writeFile } from 'fs';
import { createHash } from 'crypto';
import { artifacts, ethers } from 'hardhat';
import { subtask } from 'hardhat/config';
import { Artifact, HardhatRuntimeEnvironment, RunSuperFunction, TaskArguments } from 'hardhat/types';
import { ResolvedFile } from 'hardhat/internal/solidity/resolver';
import { CompilationJob } from 'hardhat/internal/solidity/compilation-job';
import { TASK_COMPILE_SOLIDITY_COMPILE_JOBS } from 'hardhat/builtin-tasks/task-names';
import { font, color, _ } from './utils';
import { BaseContract, Fragment, Interface } from 'ethers';

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

interface abiConfig extends DiamondExportConfig {
    include?: string[];
    exclude?: string[];
    filter?: (abiElement: any, index: number, abi: any[], name: string) => boolean;
}

interface DiamondArtifactConfig {
    diamonds?: string[];
    abi?: abiConfig;
}

export type Selector = `0x${string[8]}`;

export type ContractWithSelectors = Selectors & any;

export interface Selectors {
    selectors?: Selector[];
    get?: (this: ContractWithSelectors, functionNames?: (string | Selector)[]) => Selector[];
    remove?: (this: ContractWithSelectors, functionNames: (string | Selector)[]) => (Selector | undefined)[];
    [x: string | number | symbol]: any;
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

class abiCompilationJob extends CompilationJob {
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
//             throw new HardhatPluginError(`abi`, '`diamond` config must be a string.');
//         }

//         if (include && !Array.isArray(include)) {
//             throw new HardhatPluginError(`abi`, '`include` config must be an array if provided.');
//         }

//         if (exclude && !Array.isArray(exclude)) {
//             throw new HardhatPluginError(`abi`, '`exclude` config must be an array if provided.');
//         }

//         if (filter && typeof filter !== 'function') {
//             throw new HardhatPluginError(`abi`, '`filter` config must be a function if provided.');
//         }

//         return {
//             include,
//             exclude,
//             filter
//         };
//     }
// };


async function __createArtifact(contract: string, facets?: string[]) {
    let info: any;
    let path: string[];
    let folder: number;
    let directory: string;
    let name: string;

    const diamond = (await artifacts.getAllFullyQualifiedNames()).filter((f: string) => f.includes(contract)).filter((f: string) => f.includes(`${diamondConfig.artifact?.abi?.file || '.diamond'}`));

    const artifactsList: string[] = (await artifacts.getAllFullyQualifiedNames());
    const artifactName: string = contract + (contract.includes(':') ? '' : '.sol:' + contract);
    const artifactNames: string[] = artifactsList.filter(
        (f) => f.includes(artifactName)
    ).filter(
        (f) => {
            let path = diamondConfig.artifact?.abi?.path;
            path = path ? (path?.startsWith('artifacts/') && path?.length > 10 ? path?.substring(10, path.length) : path) : undefined;

            return !f.includes(path || '.diamonds')
                || !f.includes(`.${diamondConfig.artifact?.abi?.file || 'diamond'}`)
        }
    );

    if (diamond?.length === 1 && !facets) {
        info = await artifacts.readArtifact(diamond[0]);
        path = diamond[0].split('/');
        folder = path.length;
        directory = path.slice(0, folder - 1).join('/');
        name = path[folder - 1].split(':')[1].replaceAll(`.${diamondConfig.artifact?.abi?.file || 'diamond'}`, '');
    } else {

        if (artifactNames.length == 0) throw console.error(color.lightGray(`\nDiamondArtifactsError: There is no diamond contract for the given name.`));
        if (artifactNames.length > 1) throw console.error(
            color.lightGray(
                `\nDiamondArtifactsError: Couldn't create diamond artifacts via config or there are multiple contracts with the same name.\n\n${contract}:\n${artifactNames
                    .map((a) => ` - ${a}`)
                    .join('\n')
                } \n`));

        path = artifactNames[0].split('/');
        folder = path.length;
        directory = path.slice(0, folder - 1).join('/');
        name = path[folder - 1].split(':')[1];
    }

    if (!facets) {
        const config = diamondConfig?.artifact?.abi;
        const include: string[] = config?.include || ['facet', 'facets', 'shared'];
        const exclude: string[] = [`I${contract} `, ...(config?.exclude || [])];

        const base: string[] = artifactsList.filter((f: string) => !f.includes(artifactName) && f.includes(directory));
        facets = base.filter((f: string) => {
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

        if (inner.length > 0) {
            facets = base.filter((f: string) => {
                for (const n of include) {
                    return f.includes([directory, n].join('/'));
                }
            });
        }
    }

    info = info ?? await artifacts.readArtifact(contract);

    return { name, path, directory, facets, info };
}

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
        contractName: `${artifact.name}.${diamondConfig.artifact?.abi?.file || 'diamond'} `,
        sourceName: `${path || '.diamonds'} /${artifact.name}.sol`,
        abi: Array.from(new Set(abi))
    } as const;
}

export async function createInfo(diamond: { name: string; address?: string; facets?: any[]; init?: Args }) {
    const contract = await __createArtifact(diamond.name);

    const path = `${diamondConfig.loupe?.path || 'artifacts/.diamonds'}/${contract.name}.sol`;
    const file = `${path}/${contract.name}.${diamondConfig.loupe?.file || 'facets'}.json`;

    writeFile(file, JSON.stringify(diamond, null, 2), async (e) => {
        if (e?.message.includes('no such file or directory')) {
            mkdirSync(path, { recursive: true });
            await createInfo(diamond);
        } else if (e) {
            console.error(e);
        }
    });

    return file;
}

export async function abi(contract: string, contracts?: string[]): Promise<string> {
    const diamondArtifact = await __createArtifact(contract, contracts);

    const compilationJob = new abiCompilationJob(diamondArtifact.directory, diamondArtifact.name);
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

export async function cut(cuts: Cut[], display?: boolean, name?: string): Promise<any[]> {
    const diamond = [];
    for (let i = 0; i < cuts.length; i++) {
        let data = [];

        if (display) {
            console.log(color.lightGray(`---------------------------------------------------------------`));
            console.log(color.lightGray(_(`Key:`, 14)), font.bold(color.white(cuts[i].key)));
            console.log(color.lightGray(`---------------------------------------------------------------`));
        }

        for (const facetName of cuts[i].data) {
            const facet = await (await ethers.getContractFactory(facetName)).deploy();
            const address = await facet.getAddress();
            const selectors = getSelectors(facet);

            if (display) {
                console.log(color.lightGray(_(`Facet:`, 14)), facetName);
                console.log(color.lightGray(_(`Address:`, 14)), address);
                console.log(color.lightGray(_(`Selectors:`, 14)), selectors);
                console.log(color.lightGray(`---------------------------------------------------------------`));
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

export async function factory(name: string, args: any[], display?: boolean) {
    let diamond: any = { name };
    let facets: any = [];

    for (let i = 0; i < args.length; i++) {
        if (Array.isArray(args[i]) && 'key' in args[i][0] && 'data' in args[i][0]) {
            if (Array.isArray(args[i][0]?.data) && args[i][0]?.data.length > 0 && typeof args[i][0].data[0] === 'string') {
                facets = args[i].flatMap((c: Cut) => c.data);
                args[i] = await cut(args[i], display);
            }
            diamond = { ...diamond, facets: args[i] };
        }
        if (typeof args[i] === 'object' && 'owner' in args[i] && 'init' in args[i] && 'initCalldata' in args[i])
            diamond = { ...diamond, init: args[i] };
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
                contract = await ethers.getContractFactory(await abi(name, facets));
            } catch {
                try {
                    contract = await ethers.getContractFactory(`${name}.${diamondConfig.artifact?.abi?.file || 'diamond'}`);
                } catch (e) {
                    throw console.error(color.lightGray(`\nDiamondArtifactsError: Cannot find diamond artifact.\n\n${e}`));
                }
            }
        }
    }

    const deployed = await contract.deploy(...args);
    await createInfo({
        name: diamond.name,
        address: await deployed.getAddress(),
        facets: diamond.facets,
        init: diamond.init
    });

    return deployed;
}

export function getAllFunctionNames(contract: ContractWithSelectors): string[] {
    return (contract?.contract?.interface || contract?.interface).format(true).filter((f: string) => f.startsWith('function'));
}

export function getAllFunctionSelectors(contract: ContractWithSelectors): Selector[] {
    contract = contract?.contract?.interface ? contract?.contract : contract;
    return getAllFunctionNames(contract).map((f: string) => contract.interface.getFunction(f)?.selector) as Selector[];
}

function get(this: ContractWithSelectors, functionNames?: (string | Selector)[]): Selector[] {
    const contract: BaseContract & Selectors = this?.contract?.interface ? this?.contract : this;
    let selectors: Selector[] = []

    if (functionNames) {
        selectors = functionNames.map((n: string) => {
            console.log('callbefore', contract);
            const names = getAllFunctionNames(contract).filter(f => f.includes(n)).map(f => {
                return contract.interface.getFunction(f.split(' ')[1])?.selector
            }) as Selector[];
            const sigs = getAllFunctionSelectors(contract).filter(f => f === n) as Selector[];
            return names.length > 0 ? names : sigs
        }).flat();

    } else {
        selectors = getAllFunctionSelectors(contract);
    }

    this.selectors = selectors
    return selectors
}

function remove(this: ContractWithSelectors, functionNames: (string | Selector)[]): Selector[] {
    const contract: BaseContract & Selectors = this?.contract?.interface ? this?.contract : this;
    const selectors: Selector[] = contract?.selectors?.filter(
        (s: Selector) => {
            const names = functionNames.filter(f => getSelector(f) === s).includes(s);
            const sigs = functionNames.includes(s as string);
            return !names && !sigs
        }
    ).flat() || [];

    this.selectors = selectors;
    return selectors;
}

export function getSelectors(contract: ContractWithSelectors): ContractWithSelectors {
    const wrapping = contract?.contract?.interface ? true : false;
    const selectors = getAllFunctionSelectors(wrapping ? contract?.contract : contract);

    if (wrapping) {
        contract.contract.selectors = selectors;
        contract.contract.get = get;
        contract.contract.remove = remove;
    } else {
        contract.selectors = selectors;
        contract.get = get;
        contract.remove = remove;
    }

    return selectors;
}

export function getSelector(functionName: string): string | undefined {
    const fragment: Interface = new ethers.Interface('function ' + functionName);
    return fragment.getFunction(functionName)?.selector;
}

export function removeSelectors(selectors: Selector[], functionNames: (Selector | string)[]): Selector[] {
    const type = functionNames.filter((f: string) => f.startsWith('0x'));

    let removedSelectors: Selector[];
    if (type.length === 0) {
        functionNames = functionNames.map((functionName: string) => 'function ' + functionName);
        const fragments = new ethers.Interface(functionNames);
        removedSelectors = selectors.filter((s: string) => {
            return !functionNames.map((f: string) => fragments.getFunction(f)?.selector).filter(f => f === s).includes(s);
        });
    } else {
        removedSelectors = selectors.filter((s: string) => {
            return !functionNames.includes(s);
        });
    }

    return removedSelectors;
}

export async function compile(
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
            const diamondArtifact = await __createArtifact(diamond, await hre.artifacts.getAllFullyQualifiedNames());
            const compilationJob = new abiCompilationJob(diamondArtifact.directory, diamondArtifact.name);
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

// We ONLY hook this task, instead of providing a separate task to run, because
// Hardhat will clear out old artifacts on next run if we don't work around their
// caching mechanisms.
subtask(TASK_COMPILE_SOLIDITY_COMPILE_JOBS).setAction(compile);
