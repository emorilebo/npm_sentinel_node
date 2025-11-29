import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import * as heuristics from './heuristics';

const LIFECYCLE_EVENTS = ["preinstall", "install", "postinstall", "prepublish", "prepublishOnly"];

interface PackageJson {
    name?: string;
    scripts?: { [key: string]: string };
    [key: string]: any;
}

export async function analyzePackage(targetPath: string, verbose: boolean): Promise<string | null> {
    let packageJsonPath = targetPath;
    let dirPath: string | null = null;

    if (fs.statSync(targetPath).isDirectory()) {
        dirPath = targetPath;
        packageJsonPath = path.join(targetPath, 'package.json');
    } else {
        dirPath = path.dirname(targetPath);
    }

    if (!fs.existsSync(packageJsonPath)) {
        console.error(chalk.red('Error: No package.json found at ' + packageJsonPath));
        process.exit(1);
    }

    try {
        const content = fs.readFileSync(packageJsonPath, 'utf8');
        const pkg: PackageJson = JSON.parse(content);
        const name = pkg.name || 'unnamed';

        console.log(chalk.blue(`Analyzing package: ${name}`));

        // Check scripts
        if (pkg.scripts) {
            for (const [scriptName, command] of Object.entries(pkg.scripts)) {
                const isLifecycle = LIFECYCLE_EVENTS.includes(scriptName);

                if (isLifecycle) {
                    console.log(chalk.yellow(`  [INFO] Lifecycle script found: '${scriptName}'`));
                }

                const suspicious = heuristics.checkScript(scriptName, command, verbose);

                if (!suspicious && isLifecycle && verbose) {
                    console.log(`    Command: ${command}`);
                }
            }
        } else {
            console.log(chalk.green('No scripts found.'));
        }

        // Check files if directory
        if (dirPath) {
            try {
                const files = fs.readdirSync(dirPath);
                heuristics.checkFiles(files);
            } catch (e: any) {
                if (verbose) console.log(chalk.gray(`  Could not scan directory files: ${e.message}`));
            }
        }

        return name;
    } catch (error: any) {
        console.error(chalk.red('Failed to parse package.json: ' + error.message));
        process.exit(1);
    }
}
