#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

const SUSPICIOUS_PATTERNS = [
    "curl", "wget", "base64", "eval", "| bash", "| sh", "cmd.exe", "powershell",
    "socket", "net", "dns"
];

const LIFECYCLE_EVENTS = ["preinstall", "install", "postinstall", "prepublish", "prepublishOnly"];

program
    .version('1.0.0')
    .option('-p, --path <path>', 'Path to the package.json file or directory to analyze', '.')
    .option('-v, --verbose', 'Enable verbose output')
    .parse(process.argv);

const options = program.opts();

async function analyzePackage(targetPath) {
    let packageJsonPath = targetPath;

    if (fs.statSync(targetPath).isDirectory()) {
        packageJsonPath = path.join(targetPath, 'package.json');
    }

    if (!fs.existsSync(packageJsonPath)) {
        console.error(chalk.red('Error: No package.json found at ' + packageJsonPath));
        process.exit(1);
    }

    try {
        const content = fs.readFileSync(packageJsonPath, 'utf8');
        const pkg = JSON.parse(content);
        const name = pkg.name || 'unnamed';

        console.log(chalk.blue(`Analyzing package: ${name}`));

        if (pkg.scripts) {
            checkScripts(pkg.scripts, name);
        } else {
            console.log(chalk.green('No scripts found.'));
        }

        return name;
    } catch (error) {
        console.error(chalk.red('Failed to parse package.json: ' + error.message));
        process.exit(1);
    }
}

function checkScripts(scripts, pkgName) {
    for (const [name, command] of Object.entries(scripts)) {
        const isLifecycle = LIFECYCLE_EVENTS.includes(name);

        if (isLifecycle) {
            console.log(chalk.yellow(`  [INFO] Lifecycle script found: '${name}'`));
        }

        let suspicious = false;
        for (const pattern of SUSPICIOUS_PATTERNS) {
            if (command.includes(pattern)) {
                console.log(chalk.red.bold(`  [WARNING] Suspicious pattern '${pattern}' found in script '${name}': ${command}`));
                suspicious = true;
            }
        }

        if (!suspicious && isLifecycle && options.verbose) {
            console.log(`    Command: ${command}`);
        }
    }
}

async function checkRegistry(name) {
    console.log(chalk.cyan(`Checking registry for '${name}'...`));
    try {
        const response = await axios.get(`https://registry.npmjs.org/${name}`);
        const data = response.data;

        if (data.time && data.time.created) {
            console.log(chalk.cyan(`  Package created: ${data.time.created}`));
        }
        if (data.time && data.time.modified) {
            console.log(chalk.cyan(`  Last modified: ${data.time.modified}`));
        }
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.log(chalk.yellow(`  [WARNING] Failed to fetch metadata for '${name}': 404 Not Found`));
        } else {
            console.log(chalk.yellow(`  [WARNING] Failed to fetch metadata: ${error.message}`));
        }
    }
}

async function main() {
    console.log(chalk.green.bold('npm-sentinel: Starting analysis...'));
    if (options.verbose) {
        console.log(`Target: ${options.path}`);
    }

    const name = await analyzePackage(options.path);
    if (name) {
        await checkRegistry(name);
    }

    console.log(chalk.green.bold('\nAnalysis complete.'));
}

main();
