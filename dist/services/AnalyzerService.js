"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyzerService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const types_1 = require("../types");
class AnalyzerService {
    constructor() {
        this.suspiciousPatterns = [
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
        this.suspiciousFiles = [
            "setup_bun.js",
            "bun_environment.js",
            "cloud.json",
            "truffleSecrets.json"
        ];
        this.lifecycleEvents = ["preinstall", "install", "postinstall", "prepublish", "prepublishOnly"];
    }
    async analyze(targetPath) {
        let packageJsonPath = targetPath;
        let dirPath = null;
        if (fs_1.default.existsSync(targetPath) && fs_1.default.statSync(targetPath).isDirectory()) {
            dirPath = targetPath;
            packageJsonPath = path_1.default.join(targetPath, 'package.json');
        }
        else {
            dirPath = path_1.default.dirname(targetPath);
        }
        if (!fs_1.default.existsSync(packageJsonPath)) {
            throw new Error(`No package.json found at ${packageJsonPath}`);
        }
        const content = fs_1.default.readFileSync(packageJsonPath, 'utf8');
        let pkg;
        try {
            const raw = JSON.parse(content);
            const parsed = types_1.PackageJsonSchema.safeParse(raw);
            if (!parsed.success) {
                console.warn("Invalid package.json format, using raw data safely.");
                pkg = raw;
            }
            else {
                pkg = parsed.data;
            }
        }
        catch (e) {
            throw new Error("Failed to parse package.json: invalid JSON.");
        }
        const vulnerabilities = [];
        // 1. Check Scripts
        if (pkg.scripts) {
            for (const [scriptName, command] of Object.entries(pkg.scripts)) {
                this.analyzeScript(scriptName, command, vulnerabilities);
            }
        }
        // 2. Check Files
        if (dirPath) {
            try {
                const files = fs_1.default.readdirSync(dirPath);
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
            }
            catch (e) {
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
    analyzeScript(scriptName, command, vulns) {
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
                    const hiddenVulns = [];
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
            }
            catch (e) {
                // Ignore invalid base64
            }
        }
    }
    runPatternChecks(scriptName, command, vulns) {
        for (const rule of this.suspiciousPatterns) {
            const regex = new RegExp(rule.pattern.startsWith("\\") ? rule.pattern : rule.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
            if (regex.test(command)) {
                vulns.push({
                    type: 'suspect-script',
                    severity: rule.severity,
                    description: `${rule.desc} detected in script.`,
                    location: `scripts.${scriptName}`
                });
            }
        }
    }
    extractBase64Strings(text) {
        // Matches strings that look like base64 (A-Z, a-z, 0-9, +, /, =) length >= 20
        // This is a rough heuristic to find potential payloads
        const base64Regex = /([A-Za-z0-9+/]{20,}={0,2})/g;
        const matches = text.match(base64Regex);
        return matches || [];
    }
    isReadable(text) {
        // Check if > 90% of chars are printable ASCII
        // This avoids flagging binary blobs as scripts
        const printable = text.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
        return printable.length / text.length > 0.9;
    }
}
exports.AnalyzerService = AnalyzerService;
