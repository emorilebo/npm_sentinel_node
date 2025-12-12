import chalk from 'chalk';
import boxen from 'boxen';
import Table from 'cli-table3';
import ora, { Ora } from 'ora';
import { AnalysisResult } from '../types';

export class DisplayService {
    private spinner: Ora;

    constructor() {
        this.spinner = ora();
    }

    showTitle() {
        console.log(boxen(chalk.green.bold(' NPM SENTINEL '), {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'green'
        }));
    }

    startSpinner(text: string) {
        this.spinner.start(text);
    }

    succeedSpinner(text: string) {
        this.spinner.succeed(text);
    }

    failSpinner(text: string) {
        this.spinner.fail(text);
    }

    showResults(result: AnalysisResult) {
        console.log(`\n📦 Package: ${chalk.bold.cyan(result.packageName)} v${result.version || '?'}`);

        if (result.meta.registryAgeDays !== undefined) {
            const age = result.meta.registryAgeDays;
            let ageText = `${age} days ago`;
            if (age < 7) ageText = chalk.red.bold(`${ageText} (NEW!)`);
            else ageText = chalk.green(ageText);
            console.log(`📅 Registry: Created ${ageText}`);
        }

        if (result.vulnerabilities.length === 0) {
            console.log(chalk.green('\n✅ No suspicious patterns found.'));
            return;
        }

        console.log(chalk.red(`\n⚠️  Found ${result.vulnerabilities.length} potential issues:`));

        const table = new Table({
            head: [chalk.bold('Severity'), chalk.bold('Location'), chalk.bold('Description')],
            style: { head: [], border: [] }
        });

        for (const vuln of result.vulnerabilities) {
            let severity = vuln.severity.toUpperCase();
            if (vuln.severity === 'critical') severity = chalk.red.bold(severity);
            else if (vuln.severity === 'high') severity = chalk.red(severity);
            else if (vuln.severity === 'medium') severity = chalk.yellow(severity);
            else severity = chalk.blue(severity);

            table.push([severity, vuln.location, vuln.description]);
        }

        console.log(table.toString());
    }

    showError(error: Error) {
        this.spinner.stop(); // Ensure spinner is stopped
        console.error(chalk.red(`\n❌ Error: ${error.message}`));
    }
}
