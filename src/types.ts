import { z } from 'zod';

// --- Domain Models ---

export interface Vulnerability {
    type: 'suspect-script' | 'malicious-file' | 'metadata-risk';
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    location: string; // e.g., "scripts.install", "file:setup.js"
}

export interface AnalysisResult {
    packageName: string;
    version?: string;
    vulnerabilities: Vulnerability[];
    meta: {
        registryAgeDays?: number;
        lastModified?: string;
    };
}

// --- Zod Schemas ---

export const PackageJsonSchema = z.object({
    name: z.string().optional(),
    version: z.string().optional(),
    scripts: z.record(z.string()).optional(),
    dependencies: z.record(z.string()).optional(),
    devDependencies: z.record(z.string()).optional(),
}).passthrough();

export type PackageJson = z.infer<typeof PackageJsonSchema>;

export const NpmRegistryDataSchema = z.object({
    name: z.string().optional(),
    'dist-tags': z.object({
        latest: z.string().optional(),
    }).optional(),
    time: z.record(z.string()).optional(),
}).passthrough();

export type NpmRegistryData = z.infer<typeof NpmRegistryDataSchema>;
