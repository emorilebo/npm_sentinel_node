"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NpmRegistryDataSchema = exports.PackageJsonSchema = void 0;
const zod_1 = require("zod");
// --- Zod Schemas ---
exports.PackageJsonSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    version: zod_1.z.string().optional(),
    scripts: zod_1.z.record(zod_1.z.string()).optional(),
    dependencies: zod_1.z.record(zod_1.z.string()).optional(),
    devDependencies: zod_1.z.record(zod_1.z.string()).optional(),
}).passthrough();
exports.NpmRegistryDataSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    'dist-tags': zod_1.z.object({
        latest: zod_1.z.string().optional(),
    }).optional(),
    time: zod_1.z.record(zod_1.z.string()).optional(),
}).passthrough();
