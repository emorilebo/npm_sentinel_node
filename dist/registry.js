"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRegistry = checkRegistry;
const axios_1 = __importDefault(require("axios"));
const chalk_1 = __importDefault(require("chalk"));
async function checkRegistry(name) {
    console.log(chalk_1.default.cyan(`Checking registry for '${name}'...`));
    try {
        const response = await axios_1.default.get(`https://registry.npmjs.org/${name}`);
        const data = response.data;
        if (data.time && data.time.created) {
            const created = new Date(data.time.created);
            const now = new Date();
            const diffDays = Math.ceil(Math.abs(now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            let msg = `  Package created: ${data.time.created}`;
            if (diffDays < 7) {
                msg += chalk_1.default.red.bold(` (NEW! ${diffDays} days old)`);
            }
            console.log(chalk_1.default.cyan(msg));
        }
        if (data.time && data.time.modified) {
            console.log(chalk_1.default.cyan(`  Last modified: ${data.time.modified}`));
        }
    }
    catch (error) {
        if (error.response && error.response.status === 404) {
            console.log(chalk_1.default.yellow(`  [WARNING] Failed to fetch metadata for '${name}': 404 Not Found`));
        }
        else {
            console.log(chalk_1.default.yellow(`  [WARNING] Failed to fetch metadata: ${error.message}`));
        }
    }
}
