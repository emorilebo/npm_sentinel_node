#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const analyzer = require('./analyzer');
const registry = require('./registry');

program
    .version('2.0.0')
    .option('-p, --path <path>', 'Path to the package.json file or directory to analyze', '.')
    .option('-v, --verbose', 'Enable verbose output')
    .parse(process.argv);

const options = program.opts();

async function main() {
    console.log(chalk.green.bold('npm-sentinel v2.0.0: Advanced Supply Chain Analysis'));
    if (options.verbose) {
        console.log(`Target: ${options.path}`);
    }

    const name = await analyzer.analyzePackage(options.path, options.verbose);
    if (name) {
        await registry.checkRegistry(name);
    }

    console.log(chalk.green.bold('\nAnalysis complete.'));
}

main();
