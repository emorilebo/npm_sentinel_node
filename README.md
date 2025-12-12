# npm-sentinel

[![npm version](https://img.shields.io/npm/v/npm-sentinel.svg)](https://www.npmjs.com/package/npm-sentinel)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Security](https://img.shields.io/badge/security-policy-green.svg)](SECURITY.md)

**npm-sentinel** is an advanced, professional-grade security tool designed to protect your development environment from sophisticated supply chain attacks. By analyzing `package.json` lifecycle scripts, scanning for known malware signatures (like Shai Hulud 2.0), and cross-referencing with the npm registry, it acts as a robust early warning system.

> "In a world of compromised packages, be the sentinel."

## Features

-   **Deep Heuristics**: Detects not just patterns, but **extracts and analyzes Base64 obfuscated payloads** to find hidden threats.
-   **Malware Signatures**: Specific detection for known threats like **Shai Hulud 2.0** (`setup_bun.js`, `bun_environment.js`).
-   **Beautiful UI**: Interactive CLI with spinners, clean tables, and color-coded severity reports.
-   **Robust Validation**: Built with `Zod` schemas to handle malformed packages gracefully.
-   **Lifecycle Script Analysis**: Scans `preinstall`, `install`, `postinstall` for dangerous commands.
-   **Registry Metadata Check**: Identifies potential **typosquatting** by alerting on recently created packages (< 7 days old).

## Installation

```bash
npm install -g npm-sentinel
# OR run directly
npx npm-sentinel
```

## Usage

### Basic Scan
Analyze the current directory for threats.
```bash
npm-sentinel
```

### Targeted Scan
Analyze a specific package directory.
```bash
npm-sentinel --path /path/to/suspicious-package
```

### Verbose Mode
See detailed logs of what is being checked.
```bash
npm-sentinel --verbose
```

## How It Works

1.  **Parse**: Reads `package.json` and strict-validates it.
2.  **Analyze Scripts**: Checks `scripts` for regex patterns (e.g., `curl|bash`, `netcat`) and recursively decodes Base64 strings to find hidden commands.
3.  **Scan Files**: Checks the directory for known malicious filenames.
4.  **Verify Registry**: Fetches metadata from npm to warn about suspicious package age or maintenance status.
5.  **Report**: Displays a beautiful summary table of findings.

## Example Output

<img src="https://via.placeholder.com/800x400?text=npm-sentinel+UI+Demo" alt="UI Demo" width="100%">

```text
📦 Package: my-app v1.0.0
📅 Registry: Created 365 days ago

⚠️  Found 1 potential issues:
┌──────────┬───────────────────┬────────────────────────────────────────────────────────┐
│ Severity │ Location          │ Description                                            │
├──────────┼───────────────────┼────────────────────────────────────────────────────────┤
│ CRITICAL │ scripts.install   │ Obfuscated (Base64) payload detected: "curl evil.com..."         │
└──────────┴───────────────────┴────────────────────────────────────────────────────────┘
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Security

For security concerns, please refer to [SECURITY.md](SECURITY.md).

## License

MIT

## Author

**Godfrey Lebo** - [GitHub](https://github.com/emorilebo)
