#!/usr/bin/env node

import { program } from 'commander';
import { AnalyzerService } from './services/AnalyzerService';
import { RegistryService } from './services/RegistryService';
import { DisplayService } from './ui/DisplayService';
import path from 'path';

interface CliOptions {
    path: string;
    verbose: boolean;
}

program
    .version('2.1.0')
    .option('-p, --path <path>', 'Path to the package.json file or directory to analyze', '.')
    .option('-v, --verbose', 'Enable verbose output')
    .parse(process.argv);

const options = program.opts<CliOptions>();

async function main() {
    const display = new DisplayService();
    const analyzer = new AnalyzerService();
    const registry = new RegistryService();

    // Preserve the original CLI flow's feel but upgraded
    display.showTitle();

    try {
        const targetPath = path.resolve(options.path);

        display.startSpinner(`Analyzing package at ${targetPath}...`);

        // 1. Analyze Local
        const result = await analyzer.analyze(targetPath);
        display.succeedSpinner('Local analysis complete.');

        // 2. Check Registry
        if (result.packageName && result.packageName !== 'unnamed') {
            display.startSpinner(`Checking npm registry for '${result.packageName}'...`);
            try {
                const metadata = await registry.getPackageMetadata(result.packageName);
                if (metadata) {
                    if (metadata.time && metadata.time.created) {
                        const created = new Date(metadata.time.created);
                        const diffDays = Math.ceil(Math.abs(new Date().getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
                        result.meta.registryAgeDays = diffDays;
                        result.meta.lastModified = metadata.time.modified;

                        // Add metadata risks if needed, e.g. very new package
                        if (diffDays < 7) {
                            result.vulnerabilities.push({
                                type: 'metadata-risk',
                                severity: 'medium',
                                description: `Package is very new (${diffDays} days old)`,
                                location: 'registry.metadata'
                            });
                        }
                    }
                    display.succeedSpinner('Registry check complete.');
                } else {
                    display.failSpinner('Package not found in registry (might be private or local-only).');
                }
            } catch (regError: any) {
                // Don't fail the whole process if registry check fails (user might be offline)
                display.failSpinner(`Registry check failed: ${regError.message}`);
            }
        }

        // 3. Show Report
        display.showResults(result);

        if (result.vulnerabilities.some(v => v.severity === 'critical')) {
            process.exitCode = 1;
        }

    } catch (error: any) {
        display.showError(error);
        process.exit(1);
    }
}

main();
