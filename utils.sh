#!/usr/bin/env bash
# GRID Builder - Utility Functions and Environment Defaults
# This script provides common functions and sets default environment variables
# for the GRID build system. It works in standalone, GitHub Actions, or any CI/CD system.

# Application identity
APP_NAME="${APP_NAME:-GRID}"
APP_NAME_LC="$( echo "${APP_NAME}" | awk '{print tolower($0)}' )"
BINARY_NAME="${BINARY_NAME:-GRID}"

# Repository configuration
GH_REPO_PATH="${GH_REPO_PATH:-millsydotdev/GRID-BUILDER}"
ORG_NAME="${ORG_NAME:-GRID-Editor}"
ASSETS_REPOSITORY="${ASSETS_REPOSITORY:-${GITHUB_REPOSITORY_OWNER:-millsydotdev}/binaries}"
VERSIONS_REPOSITORY="${VERSIONS_REPOSITORY:-${GITHUB_REPOSITORY_OWNER:-millsydotdev}/versions}"

# Build configuration defaults
CI_BUILD="${CI_BUILD:-yes}"
DISABLE_UPDATE="${DISABLE_UPDATE:-yes}"
SHOULD_BUILD="${SHOULD_BUILD:-yes}"

# Build toggles (default to yes if not specified)
SHOULD_BUILD_ZIP="${SHOULD_BUILD_ZIP:-yes}"
SHOULD_BUILD_REH="${SHOULD_BUILD_REH:-yes}"
SHOULD_BUILD_REH_WEB="${SHOULD_BUILD_REH_WEB:-yes}"

echo "---------- GRID Builder Utils -----------"
echo "APP_NAME=\"${APP_NAME}\""
echo "APP_NAME_LC=\"${APP_NAME_LC}\""
echo "BINARY_NAME=\"${BINARY_NAME}\""
echo "GH_REPO_PATH=\"${GH_REPO_PATH}\""
echo "ORG_NAME=\"${ORG_NAME}\""
echo "CI_BUILD=\"${CI_BUILD}\""
echo "VSCODE_QUALITY=\"${VSCODE_QUALITY:-stable}\""
echo "OS_NAME=\"${OS_NAME:-linux}\""
echo "VSCODE_ARCH=\"${VSCODE_ARCH:-x64}\""
echo "----------------------------------------"

# All common functions can be added to this file

apply_patch() {
  if [[ -z "$2" ]]; then
    echo applying patch: "$1";
  fi
  # grep '^+++' "$1"  | sed -e 's#+++ [ab]/#./vscode/#' | while read line; do shasum -a 256 "${line}"; done

  cp $1{,.bak}

  replace "s|!!APP_NAME!!|${APP_NAME}|g" "$1"
  replace "s|!!APP_NAME_LC!!|${APP_NAME_LC}|g" "$1"
  replace "s|!!BINARY_NAME!!|${BINARY_NAME}|g" "$1"
  replace "s|!!GH_REPO_PATH!!|${GH_REPO_PATH}|g" "$1"
  replace "s|!!ORG_NAME!!|${ORG_NAME}|g" "$1"
  replace "s|!!RELEASE_VERSION!!|${RELEASE_VERSION}|g" "$1"

  if ! git apply --ignore-whitespace "$1"; then
    echo failed to apply patch "$1" >&2
    exit 1
  fi

  mv -f $1{.bak,}
}

exists() { type -t "$1" &> /dev/null; }

is_gnu_sed() {
  sed --version &> /dev/null
}

replace() {
  if is_gnu_sed; then
    sed -i -E "${1}" "${2}"
  else
    sed -i '' -E "${1}" "${2}"
  fi
}

if ! exists gsed; then
  if is_gnu_sed; then
    function gsed() {
      sed -i -E "$@"
    }
  else
    function gsed() {
      sed -i '' -E "$@"
    }
  fi
fi
