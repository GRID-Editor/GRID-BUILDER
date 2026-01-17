# GRID Builder

This is the **standalone build infrastructure** for GRID, an AI-native code editor. It's a portable build system that compiles and packages GRID binaries for all platforms.

## Purpose

GRID Builder is a self-contained build system that:

- Builds all GRID assets (.dmg, .zip, .exe, .deb, .rpm, AppImage, etc.)
- Packages GRID IDE for Linux, macOS, and Windows
- Builds the GRID CLI for all platforms
- Generates checksums and release artifacts
- Can run **locally, in Docker, or in any CI/CD system** (GitHub Actions, GitLab CI, Jenkins, etc.)

The build scripts are platform-agnostic bash scripts that handle the entire build pipeline from source to distributable binaries.

## Quick Start

### Local Build

```bash
# Set required environment variables
export APP_NAME="GRID"
export VSCODE_QUALITY="stable"  # or "insider"
export OS_NAME="linux"          # or "osx" or "windows"
export VSCODE_ARCH="x64"        # or "arm64", "armhf"
export RELEASE_VERSION="1.0.0"
export CI_BUILD="no"

# Run the build
./get_repo.sh      # Clone and prepare VSCode source
./build.sh         # Compile the IDE
./prepare_assets.sh # Package binaries
```

### Environment Variables

**Required:**
- `APP_NAME` - Application name (default: "GRID")
- `OS_NAME` - Target OS: `linux`, `osx`, or `windows`
- `VSCODE_ARCH` - Architecture: `x64`, `arm64`, `armhf`, `ia32`
- `VSCODE_QUALITY` - Build quality: `stable` or `insider`
- `RELEASE_VERSION` - Version string (e.g., "1.0.0")

**Optional:**
- `CI_BUILD` - Set to "no" for local builds (default: "yes")
- `DISABLE_UPDATE` - Disable auto-update (default: "yes")
- `SHOULD_BUILD_ZIP` - Build ZIP archives (default: "yes")
- `SHOULD_BUILD_DEB` - Build .deb packages (Linux only)
- `SHOULD_BUILD_RPM` - Build .rpm packages (Linux only)
- `SHOULD_BUILD_DMG` - Build .dmg (macOS only)
- `SHOULD_BUILD_APPIMAGE` - Build AppImage (Linux only)

See [BUILDING.md](./docs/BUILDING.md) for comprehensive build documentation.

## Repository Architecture

GRID uses a multi-repository architecture:

- **GRID**: Core source code repository
- **GRID-BUILDER**: This repository - portable build/packaging system
- **binaries**: Release artifacts storage (GitHub releases)
- **versions**: Version metadata for auto-updates

## CI/CD Integration

While this build system can run anywhere, we provide [GitHub Actions workflows](.github/workflows/) as reference implementations:

- `stable-linux.yml` - Linux builds
- `stable-macos.yml` - macOS builds
- `stable-windows.yml` - Windows builds

These workflows demonstrate how to use the build scripts in a CI environment. You can adapt these for GitLab CI, Jenkins, CircleCI, or any other CI/CD platform.

## Customization

All GRID-specific modifications are marked with `# GRID` comments throughout the codebase for easy identification and rebasing.

The build system:
- Removes telemetry from upstream VSCode
- Configures auto-update to use GRID infrastructure
- Injects GRID Cloud extension
- Customizes branding and product metadata

## Rebasing

We periodically rebase onto upstream VSCode to keep compatibility with new features and deprecations. All customizations are clearly marked with "GRID" comments to make rebasing easier.
