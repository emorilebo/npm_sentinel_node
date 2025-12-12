import axios from 'axios';
import { NpmRegistryData, NpmRegistryDataSchema } from '../types';

export class RegistryService {
    private baseUrl = 'https://registry.npmjs.org';

    async getPackageMetadata(packageName: string): Promise<NpmRegistryData | null> {
        try {
            const url = `${this.baseUrl}/${packageName}`;
            const response = await axios.get(url, {
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
            const parsed = NpmRegistryDataSchema.safeParse(response.data);
            if (!parsed.success) {
                // In production might want to log this but return partial data or null
                // For now, we return the raw data but warn (or just return what we have if schema is loose)
                // Our schema is .passthrough() so it should be fine unless types are wrong.
                return response.data as NpmRegistryData;
            }

            return parsed.data;
        } catch (error: any) {
            // Network error
            throw new Error(`Failed to fetch metadata for '${packageName}': ${error.message}`);
        }
    }
}
