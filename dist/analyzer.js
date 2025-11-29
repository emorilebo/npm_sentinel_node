"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzePackage = analyzePackage;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const heuristics = __importStar(require("./heuristics"));
const LIFECYCLE_EVENTS = ["preinstall", "install", "postinstall", "prepublish", "prepublishOnly"];
async function analyzePackage(targetPath, verbose) {
    let packageJsonPath = targetPath;
    let dirPath = null;
    if (fs_1.default.statSync(targetPath).isDirectory()) {
        dirPath = targetPath;
        packageJsonPath = path_1.default.join(targetPath, 'package.json');
    }
    else {
        dirPath = path_1.default.dirname(targetPath);
    }
    if (!fs_1.default.existsSync(packageJsonPath)) {
        console.error(chalk_1.default.red('Error: No package.json found at ' + packageJsonPath));
        process.exit(1);
    }
    try {
        const content = fs_1.default.readFileSync(packageJsonPath, 'utf8');
        const pkg = JSON.parse(content);
        const name = pkg.name || 'unnamed';
        console.log(chalk_1.default.blue(`Analyzing package: ${name}`));
        // Check scripts
        if (pkg.scripts) {
            for (const [scriptName, command] of Object.entries(pkg.scripts)) {
                const isLifecycle = LIFECYCLE_EVENTS.includes(scriptName);
                if (isLifecycle) {
                    console.log(chalk_1.default.yellow(`  [INFO] Lifecycle script found: '${scriptName}'`));
                }
                const suspicious = heuristics.checkScript(scriptName, command, verbose);
                if (!suspicious && isLifecycle && verbose) {
                    console.log(`    Command: ${command}`);
                }
            }
        }
        else {
            console.log(chalk_1.default.green('No scripts found.'));
        }
        // Check files if directory
        if (dirPath) {
            try {
                const files = fs_1.default.readdirSync(dirPath);
                heuristics.checkFiles(files);
            }
            catch (e) {
                if (verbose)
                    console.log(chalk_1.default.gray(`  Could not scan directory files: ${e.message}`));
            }
        }
        return name;
    }
    catch (error) {
        console.error(chalk_1.default.red('Failed to parse package.json: ' + error.message));
        process.exit(1);
    }
}
