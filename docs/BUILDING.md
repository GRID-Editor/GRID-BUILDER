# Building GRID IDE

This document provides comprehensive instructions for building GRID IDE from source using the GRID Builder system.

## Table of Contents

- [System Requirements](#system-requirements)
- [Dependencies](#dependencies)
- [Environment Variables](#environment-variables)
- [Build Process](#build-process)
- [Platform-Specific Instructions](#platform-specific-instructions)
- [Build Options](#build-options)
- [Troubleshooting](#troubleshooting)

## System Requirements

- **Node.js**: 20.14 or higher
- **npm**: Latest stable version
- **Git**: Latest stable version
- **Python**: 3.11 or higher
- **Rust/Cargo**: Latest stable (for CLI builds)
- **Disk Space**: 10-15GB free space for builds
- **Memory**: 8GB RAM minimum, 16GB recommended

## Dependencies

### Core Dependencies (All Platforms)

- `node` 20.14+
- `npm`
- `git`
- `python3` 3.11+
- `jq` (JSON processor)
- `rustc` and `cargo` (for CLI builds)

### Linux

```bash
# Debian/Ubuntu
sudo apt-get install -y \
  build-essential \
  pkg-config \
  libx11-dev \
  libxkbfile-dev \
  libsecret-1-dev \
  libkrb5-dev \
  fakeroot \
  rpm \
  dpkg \
  imagemagick \
  jq

# For AppImage builds
sudo snap install snapcraft --classic

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### macOS

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install node@20 jq python@3.11

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Xcode Command Line Tools (required)
xcode-select --install
```

### Windows

```bash
# Install via Chocolatey
choco install nodejs-lts python jq 7zip wixtoolset

# Install Rust
# Download from: https://www.rust-lang.org/tools/install

# Install Visual Studio Build Tools
# Download from: https://visualstudio.microsoft.com/downloads/
# Select "Desktop development with C++"
```

## Environment Variables

### Required Variables

These **must** be set before building:

```bash
# Application identity
export APP_NAME="GRID"                    # Application name
export BINARY_NAME="GRID"                 # Binary name

# Build configuration
export VSCODE_QUALITY="stable"            # "stable" or "insider"
export RELEASE_VERSION="1.96.0"           # Version to build

# Platform configuration
export OS_NAME="linux"                    # "linux", "osx", or "windows"
export VSCODE_ARCH="x64"                  # "x64", "arm64", "armhf", "ia32"

# Build mode
export CI_BUILD="no"                      # "no" for local, "yes" for CI
```

### Optional Variables

```bash
# Repository configuration
export ORG_NAME="GRID-Editor"
export GH_REPO_PATH="millsydotdev/GRID-BUILDER"
export ASSETS_REPOSITORY="millsydotdev/binaries"
export VERSIONS_REPOSITORY="millsydotdev/versions"

# Update configuration
export DISABLE_UPDATE="yes"               # Disable auto-updates

# Build toggles (all default to "yes" unless specified)
export SHOULD_BUILD="yes"                 # Master build switch
export SHOULD_BUILD_ZIP="yes"             # Build ZIP archives
export SHOULD_BUILD_REH="yes"             # Build Remote Extension Host
export SHOULD_BUILD_REH_WEB="yes"         # Build Web Remote Extension Host

# Linux-specific
export SHOULD_BUILD_DEB="yes"             # Build .deb packages
export SHOULD_BUILD_RPM="yes"             # Build .rpm packages
export SHOULD_BUILD_TAR="yes"             # Build .tar.gz archives
export SHOULD_BUILD_APPIMAGE="yes"        # Build AppImage (x64 only)

# macOS-specific
export SHOULD_BUILD_DMG="yes"             # Build .dmg installer

# Windows-specific
export SHOULD_BUILD_EXE_SYS="yes"         # Build system installer
export SHOULD_BUILD_EXE_USR="yes"         # Build user installer
export SHOULD_BUILD_MSI="yes"             # Build MSI (x64/ia32 only)
export SHOULD_BUILD_MSI_NOUP="yes"        # Build MSI with updates disabled

# Signing (macOS)
export CERTIFICATE_OSX_P12_DATA=""        # Base64-encoded P12 certificate
export CERTIFICATE_OSX_P12_PASSWORD=""    # P12 password
export CERTIFICATE_OSX_ID=""              # Apple ID for notarization
export CERTIFICATE_OSX_TEAM_ID=""         # Apple Team ID
export CERTIFICATE_OSX_APP_PASSWORD=""    # App-specific password

# Version metadata updates
export GITHUB_TOKEN=""                    # For updating versions repository
export GITHUB_USERNAME=""                 # For git commits
```

## Build Process

### Quick Build (Local Development)

```bash
# 1. Clone the repository
git clone https://github.com/millsydotdev/GRID-BUILDER.git
cd GRID-BUILDER

# 2. Set environment variables
export APP_NAME="GRID"
export VSCODE_QUALITY="stable"
export OS_NAME="linux"              # or "osx" or "windows"
export VSCODE_ARCH="x64"
export RELEASE_VERSION="1.96.0"
export CI_BUILD="no"

# 3. Get VSCode source
./get_repo.sh

# 4. Build the IDE
./build.sh

# 5. Package assets
./prepare_assets.sh

# 6. Find your build
ls -lh assets/
```

### Step-by-Step Build Process

#### 1. Prepare Source Code

```bash
# Clone and prepare VSCode source repository
./get_repo.sh
```

This script:
- Clones the VSCode repository at the specified version
- Applies GRID-specific customizations
- Sets up the build environment

#### 2. Compile the IDE

```bash
# Compile GRID IDE
./build.sh
```

This script:
- Installs npm dependencies
- Compiles TypeScript and React components
- Builds the Electron app
- Compiles platform-specific binaries

#### 3. Build CLI (Automatic)

The CLI is built automatically during `build.sh` via `build_cli.sh`. It:
- Compiles the Rust-based CLI
- Creates standalone CLI artifacts
- Packages for npm distribution

#### 4. Package Assets

```bash
# Create distributable packages
./prepare_assets.sh
```

This script creates platform-specific packages:
- **Linux**: .deb, .rpm, .tar.gz, AppImage
- **macOS**: .dmg, .zip
- **Windows**: .exe, .msi, .zip

#### 5. Generate Checksums

```bash
# Generate SHA1 and SHA256 checksums
./prepare_checksums.sh
```

Creates `.sha1` and `.sha256` files for all assets.

#### 6. Update Version Metadata (Optional)

```bash
# Update the versions repository (requires GITHUB_TOKEN)
./update_version.sh
```

Only needed if you're maintaining a versions repository for auto-updates.

## Platform-Specific Instructions

### Linux Build Example

```bash
#!/bin/bash

# Set build configuration
export APP_NAME="GRID"
export VSCODE_QUALITY="stable"
export OS_NAME="linux"
export VSCODE_ARCH="x64"
export RELEASE_VERSION="1.96.0"
export CI_BUILD="no"

# Optional: Select which packages to build
export SHOULD_BUILD_DEB="yes"
export SHOULD_BUILD_RPM="yes"
export SHOULD_BUILD_TAR="yes"
export SHOULD_BUILD_APPIMAGE="yes"

# Run build
./get_repo.sh
./build.sh
./prepare_assets.sh

# Results in assets/
ls -lh assets/
```

### macOS Build Example

```bash
#!/bin/bash

# Set build configuration
export APP_NAME="GRID"
export VSCODE_QUALITY="stable"
export OS_NAME="osx"
export VSCODE_ARCH="arm64"  # or "x64"
export RELEASE_VERSION="1.96.0"
export CI_BUILD="no"

# Optional: Build DMG
export SHOULD_BUILD_DMG="yes"
export SHOULD_BUILD_ZIP="yes"

# Run build
./get_repo.sh
./build.sh
./prepare_assets.sh

# Results in assets/
ls -lh assets/
```

### Windows Build Example

```powershell
# PowerShell or Git Bash

# Set build configuration
$env:APP_NAME="GRID"
$env:VSCODE_QUALITY="stable"
$env:OS_NAME="windows"
$env:VSCODE_ARCH="x64"  # or "arm64", "ia32"
$env:RELEASE_VERSION="1.96.0"
$env:CI_BUILD="no"

# Optional: Select installers
$env:SHOULD_BUILD_EXE_SYS="yes"
$env:SHOULD_BUILD_EXE_USR="yes"
$env:SHOULD_BUILD_MSI="yes"
$env:SHOULD_BUILD_ZIP="yes"

# Run build
./get_repo.sh
./build.sh
./prepare_assets.sh

# Results in assets/
dir assets/
```

## Build Options

### Insider Builds

```bash
export VSCODE_QUALITY="insider"
export RELEASE_VERSION="1.96.0-insider"
```

Insider builds:
- Use different branding and application IDs
- Can be installed alongside stable builds
- Track the insider channel for updates

### Minimal Build (Skip Packaging)

```bash
# Just compile, don't create installers
./get_repo.sh
./build.sh

# Binary is in VSCode-{platform}-{arch}/
```

### Build Without Updates

```bash
export DISABLE_UPDATE="yes"
```

Creates a build that doesn't check for updates.

### Architecture-Specific Builds

```bash
# ARM64 (Apple Silicon, ARM Linux)
export VSCODE_ARCH="arm64"

# x64 (Intel/AMD)
export VSCODE_ARCH="x64"

# ARMv7 (Raspberry Pi, etc.)
export VSCODE_ARCH="armhf"

# 32-bit x86 (Windows only)
export VSCODE_ARCH="ia32"
```

## Troubleshooting

### Common Issues

#### Out of Memory

```bash
# Increase Node.js memory limit (already set in build.sh)
export NODE_OPTIONS="--max-old-space-size=8192"
```

#### npm install failures

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and try again
cd vscode
rm -rf node_modules
npm install
```

#### Build fails with "monaco-compile-check"

The build.sh script already skips this check as it's known to fail. If you see this error, the script is likely outdated.

#### Permission denied on Linux

```bash
# Make scripts executable
chmod +x *.sh
```

#### Python version issues

```bash
# Ensure Python 3.11+ is available
python3 --version

# Set explicit Python path if needed
export PYTHON=/usr/bin/python3.11
```

### Platform-Specific Issues

#### Linux: Missing libsecret

```bash
sudo apt-get install libsecret-1-dev
```

#### macOS: Code signing fails

Code signing requires:
- Apple Developer account
- Valid P12 certificate
- App-specific password for notarization

Without these, set `CERTIFICATE_OSX_P12_DATA=""` to skip signing.

#### Windows: WiX not found

```bash
# Add WiX to PATH
$env:PATH += ";C:\Program Files (x86)\WiX Toolset v3.11\bin"
```

## Build Artifacts

After a successful build, the `assets/` directory contains:

### Linux
- `GRID-linux-x64-{version}.tar.gz` - Portable archive
- `GRID-linux-x64-{version}.deb` - Debian package
- `GRID-linux-x64-{version}.rpm` - RPM package
- `GRID-linux-x64-{version}.AppImage` - AppImage

### macOS
- `GRID-darwin-x64-{version}.zip` - Application bundle
- `GRID.x64.{version}.dmg` - Disk image installer

### Windows
- `GRIDSetup-x64-{version}.exe` - System installer
- `GRIDUserSetup-x64-{version}.exe` - User installer
- `GRID-win32-x64-{version}.zip` - Portable archive
- `GRID-x64-{version}.msi` - MSI installer

All assets include `.sha1` and `.sha256` checksum files.

## Development Workflow

### Building for Testing

```bash
# Quick build without installers
export SHOULD_BUILD_DEB="no"
export SHOULD_BUILD_RPM="no"
export SHOULD_BUILD_DMG="no"
export SHOULD_BUILD_EXE_SYS="no"
export SHOULD_BUILD_EXE_USR="no"

./get_repo.sh
./build.sh

# Run directly from build directory
./VSCode-linux-x64/bin/grid
```

### Iterative Development

If you're making changes to GRID-specific code:

```bash
# Make changes to product.json, extensions, patches, etc.

# Rebuild (VSCode source already cloned)
./prepare_vscode.sh  # Re-apply customizations
cd vscode
npm run compile
cd ..
```

## Additional Resources

- [Troubleshooting Guide](./troubleshooting.md)
- [Extensions Compatibility](./extensions-compatibility.md)
- [GRID Documentation](https://grideditor.com/docs)
- [Contributing Guide](../CONTRIBUTING.md)

## Support

For build issues:
1. Check this documentation
2. Review [troubleshooting.md](./troubleshooting.md)
3. Search existing issues on GitHub
4. Open a new issue with:
   - Your platform and architecture
   - Environment variables used
   - Full build log output
   - Error messages
