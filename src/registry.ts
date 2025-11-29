import axios from 'axios';
import chalk from 'chalk';

interface NpmRegistryData {
    time?: {
        created?: string;
        modified?: string;
        [key: string]: string | undefined;
    };
    [key: string]: any;
}

export async function checkRegistry(name: string): Promise<void> {
    console.log(chalk.cyan(`Checking registry for '${name}'...`));
    try {
        const response = await axios.get<NpmRegistryData>(`https://registry.npmjs.org/${name}`);
        const data = response.data;

        if (data.time && data.time.created) {
            const created = new Date(data.time.created);
            const now = new Date();
            const diffDays = Math.ceil(Math.abs(now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

            let msg = `  Package created: ${data.time.created}`;
            if (diffDays < 7) {
                msg += chalk.red.bold(` (NEW! ${diffDays} days old)`);
            }
            console.log(chalk.cyan(msg));
        }
        if (data.time && data.time.modified) {
            console.log(chalk.cyan(`  Last modified: ${data.time.modified}`));
        }
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            console.log(chalk.yellow(`  [WARNING] Failed to fetch metadata for '${name}': 404 Not Found`));
        } else {
            console.log(chalk.yellow(`  [WARNING] Failed to fetch metadata: ${error.message}`));
        }
    }
}
