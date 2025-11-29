# npm-sentinel

[![npm version](https://img.shields.io/npm/v/npm-sentinel.svg)](https://www.npmjs.com/package/npm-sentinel)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Security](https://img.shields.io/badge/security-policy-green.svg)](SECURITY.md)

**npm-sentinel** is an advanced, professional-grade security tool designed to protect your development environment from sophisticated supply chain attacks. By analyzing `package.json` lifecycle scripts, scanning for known malware signatures (like Shai Hulud 2.0), and cross-referencing with the npm registry, it acts as a robust early warning system.

> "In a world of compromised packages, be the sentinel."

## Features

-   **Advanced Heuristics**: Detects obfuscated code (`\x` hex escapes, base64 decoding) and suspicious network activity.
-   **Malware Signatures**: Specifically flags known threats like **Shai Hulud 2.0** (`setup_bun.js`, `bun_environment.js`).
-   **Lifecycle Script Analysis**: Scans `preinstall`, `install`, `postinstall` for dangerous commands.
-   **Registry Metadata Check**: Identifies typosquatting by analyzing package creation dates.
-   **Modular Architecture**: Built for extensibility and performance.

## Installation

```bash
npm install -g npm-sentinel
# OR
npx npm-sentinel
```

## Usage

```bash
# Analyze current directory
npm-sentinel

# Analyze specific path
npm-sentinel --path /path/to/project

# Verbose mode (recommended for deep inspection)
npm-sentinel --verbose
```

## Architecture

`npm-sentinel` is built on a modular Node.js architecture:
-   `src/cli.js`: CLI entry point and argument parsing.
-   `src/analyzer.js`: Orchestrates analysis logic.
-   `src/heuristics.js`: Regex engine and signature matching.
-   `src/registry.js`: npm registry API interaction.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Security

For security concerns, please refer to [SECURITY.md](SECURITY.md).

## License
MIT

## Author
**Godfrey Lebo** - [GitHub](https://github.com/emorilebo)
