const axios = require('axios');
const chalk = require('chalk');

async function checkRegistry(name) {
    console.log(chalk.cyan(`Checking registry for '${name}'...`));
    try {
        const response = await axios.get(`https://registry.npmjs.org/${name}`);
        const data = response.data;

        if (data.time && data.time.created) {
            const created = new Date(data.time.created);
            const now = new Date();
            const diffDays = Math.ceil(Math.abs(now - created) / (1000 * 60 * 60 * 24));

            let msg = `  Package created: ${data.time.created}`;
            if (diffDays < 7) {
                msg += chalk.red.bold(` (NEW! ${diffDays} days old)`);
            }
            console.log(chalk.cyan(msg));
        }
        if (data.time && data.time.modified) {
            console.log(chalk.cyan(`  Last modified: ${data.time.modified}`));
        }
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.log(chalk.yellow(`  [WARNING] Failed to fetch metadata for '${name}': 404 Not Found`));
        } else {
            console.log(chalk.yellow(`  [WARNING] Failed to fetch metadata: ${error.message}`));
        }
    }
}

module.exports = {
    checkRegistry
};
