import chalk from 'chalk';

const SUSPICIOUS_PATTERNS: string[] = [
    // Network & Shell
    "curl", "wget", "base64", "eval", "| bash", "| sh", "cmd.exe", "powershell",
    "socket", "net", "dns", "nc ", "netcat",
    // Obfuscation / Encoding
    "Buffer.from", "atob", "btoa", "\\\\x[0-9a-fA-F]{2}", "String.fromCharCode",
    // Shai Hulud 2.0 specific
    "setup_bun.js", "bun_environment.js"
];

const SUSPICIOUS_FILES: string[] = [
    "setup_bun.js",
    "bun_environment.js",
    "cloud.json",
    "truffleSecrets.json"
];

export function checkScript(scriptName: string, command: string, verbose: boolean): boolean {
    let suspicious = false;

    // Check for patterns
    for (const pattern of SUSPICIOUS_PATTERNS) {
        // Simple string match for most, regex for hex escapes
        let found = false;
        if (pattern.startsWith("\\\\")) {
            const regex = new RegExp(pattern);
            if (regex.test(command)) found = true;
        } else {
            if (command.includes(pattern)) found = true;
        }

        if (found) {
            console.log(chalk.red.bold(`  [WARNING] Suspicious pattern '${pattern}' found in script '${scriptName}': ${command}`));
            suspicious = true;
        }
    }

    return suspicious;
}

export function checkFiles(files: string[]): void {
    for (const file of files) {
        if (SUSPICIOUS_FILES.includes(file)) {
            console.log(chalk.red.bold(`  [CRITICAL] Known malicious file found: '${file}' (Potential Shai Hulud 2.0 indicator)`));
        }
    }
}
