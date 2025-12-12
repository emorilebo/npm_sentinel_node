import fs from 'fs';
import path from 'path';
import { AnalysisResult, PackageJson, PackageJsonSchema, Vulnerability } from '../types';

export class AnalyzerService {
    private suspiciousPatterns = [
        // Network & Shell
        { pattern: "curl ", severity: 'high', desc: "Downloads content via curl" },
        { pattern: "wget ", severity: 'high', desc: "Downloads content via wget" },
        { pattern: "| bash", severity: 'critical', desc: "Pipes content directly to bash execution" },
        { pattern: "| sh", severity: 'critical', desc: "Pipes content directly to sh execution" },
        { pattern: "cmd.exe", severity: 'high', desc: "Windows command command execution" },
        { pattern: "powershell", severity: 'high', desc: "PowerShell execution" },
        { pattern: "nc ", severity: 'high', desc: "Netcat usage" },
        { pattern: "netcat ", severity: 'high', desc: "Netcat usage" },
        // Obfuscation / Encoding
        { pattern: "base64", severity: 'medium', desc: "Base64 encoding/decoding" },
        { pattern: "Buffer.from", severity: 'medium', desc: "Buffer manipulation" },
        { pattern: "eval\\(", severity: 'critical', desc: "Arbitrary code execution via eval" },
        { pattern: "\\\\x[0-9a-fA-F]{2}", severity: 'medium', desc: "Hex encoded characters" },
    ];

    private suspiciousFiles = [
        "setup_bun.js",
        "bun_environment.js",
        "cloud.json",
        "truffleSecrets.json"
    ];

    private lifecycleEvents = ["preinstall", "install", "postinstall", "prepublish", "prepublishOnly"];

    async analyze(targetPath: string): Promise<AnalysisResult> {
        let packageJsonPath = targetPath;
        let dirPath: string | null = null;

        if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
            dirPath = targetPath;
            packageJsonPath = path.join(targetPath, 'package.json');
        } else {
            dirPath = path.dirname(targetPath);
        }

        if (!fs.existsSync(packageJsonPath)) {
            throw new Error(`No package.json found at ${packageJsonPath}`);
        }

        const content = fs.readFileSync(packageJsonPath, 'utf8');
        let pkg: PackageJson;

        try {
            const raw = JSON.parse(content);
            const parsed = PackageJsonSchema.safeParse(raw);
            if (!parsed.success) {
                console.warn("Invalid package.json format, using raw data safely.");
                pkg = raw;
            } else {
                pkg = parsed.data;
            }
        } catch (e) {
            throw new Error("Failed to parse package.json: invalid JSON.");
        }

        const vulnerabilities: Vulnerability[] = [];

        // 1. Check Scripts
        if (pkg.scripts) {
            for (const [scriptName, command] of Object.entries(pkg.scripts)) {
                this.analyzeScript(scriptName, command, vulnerabilities);
            }
        }

        // 2. Check Files
        if (dirPath) {
            try {
                const files = fs.readdirSync(dirPath);
                for (const file of files) {
                    if (this.suspiciousFiles.includes(file)) {
                        vulnerabilities.push({
                            type: 'malicious-file',
                            severity: 'critical',
                            description: `Known malicious file detected: ${file}`,
                            location: `file:${file}`
                        });
                    }
                }
            } catch (e) {
                // ignore file errors
            }
        }

        return {
            packageName: pkg.name || 'unnamed',
            version: pkg.version,
            vulnerabilities,
            meta: {}
        };
    }

    private analyzeScript(scriptName: string, command: string, vulns: Vulnerability[]) {
        // 1. Direct Pattern Matching
        this.runPatternChecks(scriptName, command, vulns);

        // 2. Base64 Decoding & Deep Analysis
        const base64Strings = this.extractBase64Strings(command);
        for (const encoded of base64Strings) {
            try {
                const decoded = Buffer.from(encoded, 'base64').toString('utf8');
                // Heuristic: If decoded contains mostly printable characters, analyze it
                // and if it triggers patterns, flag it as hidden malware
                if (this.isReadable(decoded)) {
                    // Run checks on decoded content
                    const hiddenVulns: Vulnerability[] = [];
                    this.runPatternChecks(scriptName, decoded, hiddenVulns);

                    if (hiddenVulns.length > 0) {
                        vulns.push({
                            type: 'suspect-script',
                            severity: 'critical',
                            description: `Obfuscated (Base64) payload detected: "${decoded.substring(0, 50)}..." containing suspicious commands.`,
                            location: `scripts.${scriptName} (decoded)`
                        });
                    }
                }
            } catch (e) {
                // Ignore invalid base64
            }
        }
    }

    private runPatternChecks(scriptName: string, command: string, vulns: Vulnerability[]) {
        for (const rule of this.suspiciousPatterns) {
            const regex = new RegExp(rule.pattern.startsWith("\\") ? rule.pattern : rule.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

            if (regex.test(command)) {
                vulns.push({
                    type: 'suspect-script',
                    severity: rule.severity as any,
                    description: `${rule.desc} detected in script.`,
                    location: `scripts.${scriptName}`
                });
            }
        }
    }

    private extractBase64Strings(text: string): string[] {
        // Matches strings that look like base64 (A-Z, a-z, 0-9, +, /, =) length >= 20
        // This is a rough heuristic to find potential payloads
        const base64Regex = /([A-Za-z0-9+/]{20,}={0,2})/g;
        const matches = text.match(base64Regex);
        return matches || [];
    }

    private isReadable(text: string): boolean {
        // Check if > 90% of chars are printable ASCII
        // This avoids flagging binary blobs as scripts
        const printable = text.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
        return printable.length / text.length > 0.9;
    }
}
