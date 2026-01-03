const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const https = require('https');

// Configuration - Load from environment variables
// Configuration - Load from environment variables
const API_URL = process.env.GRID_API_URL || 'https://grideditor.com/api/releases';
const API_SECRET = process.env.GRID_API_SECRET;
const VERSION = process.argv[2]; // e.g., 0.9.1
const FILE_PATH = process.argv[3]; // e.g., ./out/grid-0.9.1-x64.msi
const CHANNEL = process.argv[4] || 'stable'; // stable or insiders
const PLATFORM = process.argv[5] || 'windows'; // windows, darwin, linux
const ARCH = process.argv[6] || 'x64'; // x64, arm64
const REPO = process.argv[7]; // e.g. GRID-Editor/GRID

if (!VERSION || !FILE_PATH || !API_SECRET) {
    console.error('Usage: node publish-release.js <VERSION> <FILE_PATH> [CHANNEL] [PLATFORM] [ARCH] [REPO]');
    console.error('Environment variable GRID_API_SECRET is required.');
    process.exit(1);
}

// ... (calculateChecksum function remains same)

async function calculateChecksum(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);

        stream.on('error', err => reject(err));
        stream.on('data', chunk => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
    });
}


// ... (publishRelease function remains same)
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
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(data));
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
        // We use the official GitHub Releases URL to avoid custom subdomains
        const filename = path.basename(FILE_PATH);
        let downloadUrl;

        if (REPO) {
            // Standard GitHub Release URL format
            // https://github.com/{owner}/{repo}/releases/download/{tag}/{filename}
            // Note: Tag usually matches version or v{version}. release.sh uses RELEASE_VERSION which is passed in?
            // release.sh passes `RELEASE_VERSION` as arg 1 (which refers to tag usually)
            // Wait, process.argv[2] is VERSION.
            // In release.sh, we pass RELEASE_VERSION.

            downloadUrl = `https://github.com/${REPO}/releases/download/${VERSION}/${filename}`;
        } else {
            // Fallback if no repo provided?? Should validly fail or use a placeholder?
            console.warn("No REPO provided, using generic placeholder.");
            downloadUrl = `https://grideditor.com/downloads/${filename}`; // Placeholder
        }

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
        console.error('❌ Failed to publish release:', error.message);
        process.exit(1);
    }
}

main();
