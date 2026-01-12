#!/usr/bin/env bash
# GRID Builder - Version Detection Script
# Works in standalone mode, GitHub Actions, or any CI/CD system

if [[ -z "${BUILD_SOURCEVERSION}" ]]; then
    echo "[version.sh] Detecting build source version..."

    # Check if vscode directory exists (post-checkout)
    if [[ -d "./vscode" ]]; then
        echo "[version.sh] Using vscode git commit as BUILD_SOURCEVERSION"
        # Get the current commit hash from the vscode repository
        cd ./vscode || exit 1
        BUILD_SOURCEVERSION=$(git rev-parse HEAD)
        cd ..
    else
        echo "[version.sh] vscode directory not found, generating checksum from RELEASE_VERSION"

        # Install checksum utility if not available
        if ! command -v checksum &> /dev/null; then
            echo "[version.sh] Installing checksum utility..."
            npm install -g checksum
        fi

        BUILD_SOURCEVERSION=$( echo "${RELEASE_VERSION/-*/}" | checksum )
    fi

    echo "[version.sh] BUILD_SOURCEVERSION=\"${BUILD_SOURCEVERSION}\""

    # Export to GitHub Actions environment if running in GHA
    if [[ -n "${GITHUB_ENV}" ]]; then
        echo "[version.sh] Detected GitHub Actions, exporting to GITHUB_ENV"
        echo "BUILD_SOURCEVERSION=${BUILD_SOURCEVERSION}" >> "${GITHUB_ENV}"
    fi
fi

export BUILD_SOURCEVERSION
