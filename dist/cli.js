#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const AnalyzerService_1 = require("./services/AnalyzerService");
const RegistryService_1 = require("./services/RegistryService");
const DisplayService_1 = require("./ui/DisplayService");
const path_1 = __importDefault(require("path"));
commander_1.program
    .version('2.1.0')
    .option('-p, --path <path>', 'Path to the package.json file or directory to analyze', '.')
    .option('-v, --verbose', 'Enable verbose output')
    .parse(process.argv);
const options = commander_1.program.opts();
async function main() {
    const display = new DisplayService_1.DisplayService();
    const analyzer = new AnalyzerService_1.AnalyzerService();
    const registry = new RegistryService_1.RegistryService();
    // Preserve the original CLI flow's feel but upgraded
    display.showTitle();
    try {
        const targetPath = path_1.default.resolve(options.path);
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
                }
                else {
                    display.failSpinner('Package not found in registry (might be private or local-only).');
                }
            }
            catch (regError) {
                // Don't fail the whole process if registry check fails (user might be offline)
                display.failSpinner(`Registry check failed: ${regError.message}`);
            }
        }
        // 3. Show Report
        display.showResults(result);
        if (result.vulnerabilities.some(v => v.severity === 'critical')) {
            process.exitCode = 1;
        }
    }
    catch (error) {
        display.showError(error);
        process.exit(1);
    }
}
main();
