"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistryService = void 0;
const axios_1 = __importDefault(require("axios"));
const types_1 = require("../types");
class RegistryService {
    constructor() {
        this.baseUrl = 'https://registry.npmjs.org';
    }
    async getPackageMetadata(packageName) {
        try {
            const url = `${this.baseUrl}/${packageName}`;
            const response = await axios_1.default.get(url, {
                timeout: 5000,
                validateStatus: (status) => status < 500, // Resolve 404s
            });
            if (response.status === 404) {
                return null;
            }
            if (response.status !== 200) {
                throw new Error(`Registry responded with status ${response.status}`);
            }
            // Validate with Zod
            const parsed = types_1.NpmRegistryDataSchema.safeParse(response.data);
            if (!parsed.success) {
                // In production might want to log this but return partial data or null
                // For now, we return the raw data but warn (or just return what we have if schema is loose)
                // Our schema is .passthrough() so it should be fine unless types are wrong.
                return response.data;
            }
            return parsed.data;
        }
        catch (error) {
            // Network error
            throw new Error(`Failed to fetch metadata for '${packageName}': ${error.message}`);
        }
    }
}
exports.RegistryService = RegistryService;
