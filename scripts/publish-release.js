// @ts-check
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const http = require('node:http');
const https = require('node:https');

/**
 * @typedef {Object} ReleaseData
 * @property {string} version
 * @property {string} channel
 * @property {string} platform
 * @property {string} arch
 * @property {string} url
 * @property {string} sha256
 * @property {string} published_at
 */

// Configuration - Load from environment variables
const API_URL = process.env.GRID_API_URL || 'https://grideditor.com/api/releases';
const API_SECRET = process.env.GRID_API_SECRET;

// Arguments
const VERSION = process.argv[2]; // e.g., 0.9.1
const FILE_PATH = process.argv[3]; // e.g., ./out/grid-0.9.1-x64.msi
const CHANNEL = process.argv[4] || 'stable'; // stable or insiders
const PLATFORM = process.argv[5] || 'windows'; // windows, darwin, linux
const ARCH = process.argv[6] || 'x64'; // x64, arm64
const REPO = process.argv[7]; // e.g. millsydotdev/GRID

if (!VERSION || !FILE_PATH) {
    console.error('Usage: node publish-release.js <VERSION> <FILE_PATH> [CHANNEL] [PLATFORM] [ARCH] [REPO]');
    console.error('Environment variable GRID_API_SECRET is required.');
    process.exit(1);
}

if (!API_SECRET) {
    console.error('❌ Error: GRID_API_SECRET environment variable is not set.');
    process.exit(1);
}

/**
 * Calculates SHA256 checksum of a file
 * @param {string} filePath
 * @returns {Promise<string>}
 */
async function calculateChecksum(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);

        stream.on('error', err => reject(err));
        stream.on('data', chunk => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
    });
}

/**
 * Publishes release data to the API
 * @param {ReleaseData} releaseData
 * @returns {Promise<any>}
 */
async function publishRelease(releaseData) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_URL);
        const lib = url.protocol === 'https:' ? https : http;

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_SECRET}`
            }
        };

        const req = lib.request(url, options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve({}); // eslint-disable-line no-empty
                    }
                } else {
                    reject(new Error(`API responded with status ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.write(JSON.stringify(releaseData));
        req.end();
    });
}

async function main() {
    try {
        console.log(`Processing release for GRID v${VERSION} (${CHANNEL})...`);

        if (!fs.existsSync(FILE_PATH)) {
            throw new Error(`File not found: ${FILE_PATH}`);
        }

        console.log('Calculating checksum...');
        const checksum = await calculateChecksum(FILE_PATH);
        console.log(`SHA256: ${checksum}`);

        // Construct download URL
        const filename = path.basename(FILE_PATH);
        let downloadUrl;

        if (REPO) {
            downloadUrl = `https://github.com/${REPO}/releases/download/${VERSION}/${filename}`;
        } else {
            console.warn("⚠️ No REPO provided, using generic placeholder.");
            downloadUrl = `https://grideditor.com/downloads/${filename}`;
        }

        /** @type {ReleaseData} */
        const releaseData = {
            version: VERSION,
            channel: CHANNEL,
            platform: PLATFORM,
            arch: ARCH,
            url: downloadUrl,
            sha256: checksum,
            published_at: new Date().toISOString()
        };

        console.log('Publishing to website API...');
        await publishRelease(releaseData);

        console.log('✅ Release published successfully!');
    } catch (error) {
        // @ts-ignore
        console.error('❌ Failed to publish release:', error.message);
        process.exit(1);
    }
}

main();
