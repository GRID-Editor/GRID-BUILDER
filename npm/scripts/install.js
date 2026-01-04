const fs = require('fs');
const path = require('path');
const axios = require('axios');
const tar = require('tar');
const unzipper = require('unzipper');
const { platform, arch } = process;

// Map platform/arch to GRID release naming convention
const PLATFORM_MAP = {
    'win32': 'win32',
    'darwin': 'darwin',
    'linux': 'linux'
};

const ARCH_MAP = {
    'x64': 'x64',
    'arm64': 'arm64',
    'ia32': 'ia32'
};

const BINARY_NAME = platform === 'win32' ? 'grid.exe' : 'grid';

async function downloadBinary() {
    const currentPlatform = PLATFORM_MAP[platform];
    const currentArch = ARCH_MAP[arch];

    if (!currentPlatform || !currentArch) {
        console.error(`Unsupported platform: ${platform} ${arch}`);
        process.exit(1);
    }

    // TODO: Update with actual GitHub Release URL structure when known
    // Example: grid-win32-x64-1.0.0.zip
    const version = 'latest';
    const ext = platform === 'linux' ? 'tar.gz' : 'zip';
    const fileName = `grid-cli-${currentPlatform}-${currentArch}.${ext}`;
    const downloadUrl = `https://github.com/millsydotdev/binaries/releases/latest/download/${fileName}`;

    console.log(`Downloading GRID CLI for ${currentPlatform}-${currentArch}...`);

    const binDir = path.join(__dirname, '../bin');
    if (!fs.existsSync(binDir)) {
        fs.mkdirSync(binDir, { recursive: true });
    }

    try {
        const response = await axios({
            method: 'get',
            url: downloadUrl,
            responseType: 'stream'
        });

        // Wrap piping in a promise to await completion
        await new Promise((resolve, reject) => {
            let stream;
            if (ext === 'zip') {
                stream = response.data.pipe(unzipper.Extract({ path: binDir }));
            } else {
                stream = response.data.pipe(tar.x({
                    C: binDir
                }));
            }
            stream.on('finish', resolve);
            stream.on('close', resolve); // unzipper uses close
            stream.on('error', reject);
        });

        // Make executable on unix
        if (platform !== 'win32') {
            const binPath = path.join(binDir, BINARY_NAME);
            try {
                if (fs.existsSync(binPath)) {
                    fs.chmodSync(binPath, '755');
                }
            } catch (err) {
                console.warn('Warning: Could not set executable permissions.', err);
            }
        }

        console.log('Download complete!');

    } catch (error) {
        console.error(`Failed to download CLI: ${error.message}`);
        console.error(`Url was: ${downloadUrl}`);
        // Don't fail install so npm doesn't error out, but upgrading won't work
    }
}

downloadBinary();
