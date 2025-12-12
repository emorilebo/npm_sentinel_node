"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisplayService = void 0;
const chalk_1 = __importDefault(require("chalk"));
const boxen_1 = __importDefault(require("boxen"));
const cli_table3_1 = __importDefault(require("cli-table3"));
const ora_1 = __importDefault(require("ora"));
class DisplayService {
    constructor() {
        this.spinner = (0, ora_1.default)();
    }
    showTitle() {
        console.log((0, boxen_1.default)(chalk_1.default.green.bold(' NPM SENTINEL '), {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'green'
        }));
    }
    startSpinner(text) {
        this.spinner.start(text);
    }
    succeedSpinner(text) {
        this.spinner.succeed(text);
    }
    failSpinner(text) {
        this.spinner.fail(text);
    }
    showResults(result) {
        console.log(`\n📦 Package: ${chalk_1.default.bold.cyan(result.packageName)} v${result.version || '?'}`);
        if (result.meta.registryAgeDays !== undefined) {
            const age = result.meta.registryAgeDays;
            let ageText = `${age} days ago`;
            if (age < 7)
                ageText = chalk_1.default.red.bold(`${ageText} (NEW!)`);
            else
                ageText = chalk_1.default.green(ageText);
            console.log(`📅 Registry: Created ${ageText}`);
        }
        if (result.vulnerabilities.length === 0) {
            console.log(chalk_1.default.green('\n✅ No suspicious patterns found.'));
            return;
        }
        console.log(chalk_1.default.red(`\n⚠️  Found ${result.vulnerabilities.length} potential issues:`));
        const table = new cli_table3_1.default({
            head: [chalk_1.default.bold('Severity'), chalk_1.default.bold('Location'), chalk_1.default.bold('Description')],
            style: { head: [], border: [] }
        });
        for (const vuln of result.vulnerabilities) {
            let severity = vuln.severity.toUpperCase();
            if (vuln.severity === 'critical')
                severity = chalk_1.default.red.bold(severity);
            else if (vuln.severity === 'high')
                severity = chalk_1.default.red(severity);
            else if (vuln.severity === 'medium')
                severity = chalk_1.default.yellow(severity);
            else
                severity = chalk_1.default.blue(severity);
            table.push([severity, vuln.location, vuln.description]);
        }
        console.log(table.toString());
    }
    showError(error) {
        this.spinner.stop(); // Ensure spinner is stopped
        console.error(chalk_1.default.red(`\n❌ Error: ${error.message}`));
    }
}
exports.DisplayService = DisplayService;
