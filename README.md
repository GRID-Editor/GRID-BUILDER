# GRID Builder

This is the build infrastructure for GRID, an AI-native code editor. The build pipeline uses GitHub Actions to compile and package GRID binaries for all platforms.

## Purpose

The GRID Builder repository runs [GitHub Actions](.github/workflows/) that:
- Build all GRID assets (.dmg, .zip, .exe, .deb, .rpm, etc.)
- Store binaries in the [`GRID-NETWORK/binaries`](https://github.com/GRID-NETWORK/binaries/releases) repository
- Update version metadata in [`GRID-NETWORK/versions`](https://github.com/GRID-NETWORK/versions) so GRID knows how to auto-update

The `.patch` files remove telemetry and modify auto-update logic to check against GRID infrastructure instead of upstream VSCode.

## Notes

- For an extensive list of modifications, search for "GRID" in the codebase
- The workflow that builds GRID for macOS is `stable-macos.yml`, Linux is `stable-linux.yml`, Windows is `stable-windows.yml`
- If you want to build GRID yourself, fork this repo and run the GitHub Workflows

## Rebasing

We periodically rebase onto upstream VSCode/VSCodium to keep the build pipeline working when deprecations happen. All changes are marked with "GRID" comments to make rebasing easier.

## Architecture

GRID uses a multi-repository architecture:
- **GRID-IDE**: Core source code repository
- **GRID-BUILDER**: This repository - build/packaging infrastructure
- **binaries**: Release artifacts storage
- **versions**: Version metadata for auto-updates
