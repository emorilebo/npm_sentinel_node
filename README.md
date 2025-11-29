# npm-sentinel

[![npm version](https://img.shields.io/npm/v/npm-sentinel.svg)](https://www.npmjs.com/package/npm-sentinel)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**npm-sentinel** is a professional-grade security tool designed to protect your development environment from supply chain attacks. By analyzing `package.json` lifecycle scripts and cross-referencing with the npm registry, it acts as an early warning system against malicious dependencies.

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

# Verbose mode
npm-sentinel --verbose
```

## Features
- **Lifecycle Script Analysis**: Detects suspicious commands (`curl`, `wget`, `base64`, etc.).
- **Registry Metadata Check**: Fetches package metadata to spot typosquatting.

## License
MIT
