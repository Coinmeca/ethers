const config = { shell: true, stdio: 'inherit' };

export function deploy() {
    let network: string = '';
    require('child_process').spawn(
        'npx',
        [
            'hardhat run',
            `scripts/deploy/${process.argv[2].replaceAll('.', '/')}.ts`,
            process.argv[3] && process.argv[3].startsWith('--') ? '--network' : '',
            ...process.argv.map((arg, i) => {
                if (i > 2) if (arg.startsWith('--')) return network = arg.substring(2, process.argv[3].length); else arg;
            })
        ],
        config
    );

    process.argv[3] && console.log('\n' + '📡 Network:  ' + network.replaceAll('-', ' ').replaceAll('_', ' ').replaceAll('.', ' ').replaceAll('   ', ' ').replaceAll('  ', ' ') + '\n');
}

export function scenario() {
    require('child_process').spawn(
        'npx',
        [
            'hardhat test',
            `test/scenarios/${process.argv[2].replaceAll('.', '/')}`,
            ...process.argv.map((arg, i) => { if (i > 2) return arg })
        ],
        config
    );
}

export function unit() {
    require('child_process').spawn(
        'npx',
        [
            'hardhat test',
            `test/units/${process.argv[2].replaceAll('.', '/')}`,
            ...process.argv.map((arg, i) => { if (i > 2) return arg })
        ],
        config
    );
}