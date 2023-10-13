const config = { shell: true, stdio: 'inherit' };

export function deploy() {
    require('child_process').spawn(
        'npx',
        [
            'hardhat run',
            `scripts/deploy/${process.argv[2]}.ts`,
            process.argv[3] && '--network',
            ...process.argv.map((arg, i) => {
                if (i > 2) return arg;
            })
        ],
        config
    );

    console.log(process.argv[3] && '\n' + '📡 Network:  ' + process.argv[3].replaceAll('_', ' ').replaceAll('.', ' '));
}

export function scenario() {
    require('child_process').spawn(
        'npx',
        [
            'hardhat test',
            `test/scenarios/${process.argv[2]}`,
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
            `test/units/${process.argv[2]}`,
            ...process.argv.map((arg, i) => { if (i > 2) return arg })
        ],
        config
    );
}