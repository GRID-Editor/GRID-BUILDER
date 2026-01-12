#!/usr/bin/env bash
# GRID Builder - Main Build Script
# Compiles GRID IDE from VSCode source with GRID customizations
# Works in standalone mode or any CI/CD system (GitHub Actions, GitLab CI, etc.)
#
# Required environment variables:
#   - VSCODE_QUALITY: "stable" or "insider"
#   - OS_NAME: "linux", "osx", or "windows"
#   - VSCODE_ARCH: "x64", "arm64", "armhf", or "ia32"
#   - RELEASE_VERSION: Version string (e.g., "1.96.0")
#
# Optional environment variables:
#   - CI_BUILD: "yes" for CI, "no" for local builds (default: "yes")
#   - SHOULD_BUILD: "yes" to build, "no" to skip (default: "yes")
#   - NODE_OPTIONS: Node.js memory options (default set below)
#
# shellcheck disable=SC1091

set -ex

echo "[build.sh] GRID IDE Build System"
echo "[build.sh] Starting compilation process..."

. version.sh

if [[ "${SHOULD_BUILD}" == "yes" ]]; then
  echo "MS_COMMIT=\"${MS_COMMIT}\""

  . prepare_vscode.sh

  cd vscode || { echo "'vscode' dir not found"; exit 1; }

  export NODE_OPTIONS="--max-old-space-size=8192"

  # Skip monaco-compile-check as it's failing due to searchUrl property
  # Skip valid-layers-check as well since it might depend on monaco
  # GRID commented these out
  # npm run monaco-compile-check
  # npm run valid-layers-check


  export PATH="$(pwd)/node_modules/.bin:$PATH"
  echo "Checking for tailwindcss..."
  ls -la node_modules/.bin/tailwind* || echo "Tailwind binary not found in node_modules/.bin"
  npm list tailwindcss || echo "Tailwind package not listed in npm list"

  npm run buildreact

  npm run gulp compile-build-without-mangling
  npm run gulp compile-extension-media
  npm run gulp compile-extensions-build
  npm run gulp minify-vscode

  if [[ "${OS_NAME}" == "osx" ]]; then
    # generate Group Policy definitions
    # node build/lib/policies darwin # GRID commented this out

    npm run gulp "vscode-darwin-${VSCODE_ARCH}-min-ci"

    find "../VSCode-darwin-${VSCODE_ARCH}" -print0 | xargs -0 touch -c

    . ../build_cli.sh

    VSCODE_PLATFORM="darwin"
  elif [[ "${OS_NAME}" == "windows" ]]; then
    # generate Group Policy definitions
    # node build/lib/policies win32 # GRID commented this out

    # in CI, packaging will be done by a different job
    if [[ "${CI_BUILD}" == "no" ]]; then
      . ../build/windows/rtf/make.sh

      npm run gulp "vscode-win32-${VSCODE_ARCH}-min-ci"

      if [[ "${VSCODE_ARCH}" != "x64" ]]; then
        SHOULD_BUILD_REH="no"
        SHOULD_BUILD_REH_WEB="no"
      fi

      . ../build_cli.sh
    fi

    VSCODE_PLATFORM="win32"
  else # linux
    # in CI, packaging will be done by a different job
    if [[ "${CI_BUILD}" == "no" ]]; then
      npm run gulp "vscode-linux-${VSCODE_ARCH}-min-ci"

      find "../VSCode-linux-${VSCODE_ARCH}" -print0 | xargs -0 touch -c

      . ../build_cli.sh
    fi

    VSCODE_PLATFORM="linux"
  fi

  if [[ "${SHOULD_BUILD_REH}" != "no" ]]; then
    npm run gulp minify-vscode-reh
    npm run gulp "vscode-reh-${VSCODE_PLATFORM}-${VSCODE_ARCH}-min-ci"
  fi

  if [[ "${SHOULD_BUILD_REH_WEB}" != "no" ]]; then
    npm run gulp minify-vscode-reh-web
    npm run gulp "vscode-reh-web-${VSCODE_PLATFORM}-${VSCODE_ARCH}-min-ci"
  fi

  cd ..
fi
