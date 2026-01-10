#!/usr/bin/env bash
# shellcheck disable=SC2129
. ./utils.sh

set -e

# Echo all environment variables used by this script
echo "----------- get_repo -----------"
echo "Environment variables:"
echo "CI_BUILD=${CI_BUILD}"
echo "GITHUB_REPOSITORY=${GITHUB_REPOSITORY}"
echo "RELEASE_VERSION=${RELEASE_VERSION}"
echo "VSCODE_LATEST=${VSCODE_LATEST}"
echo "VSCODE_QUALITY=${VSCODE_QUALITY}"
echo "GITHUB_ENV=${GITHUB_ENV}"

echo "SHOULD_DEPLOY=${SHOULD_DEPLOY}"
echo "SHOULD_BUILD=${SHOULD_BUILD}"
echo "-------------------------"

# git workaround
if [[ "${CI_BUILD}" != "no" ]]; then
  git config --global --add safe.directory "/__w/$( echo "${GITHUB_REPOSITORY}" | awk '{print tolower($0)}' )"
fi

GRID_BRANCH="main"
echo "Cloning GRID ${GRID_BRANCH}..."

rm -rf vscode
echo "DEBUG: Cleaning vscode dir"
rm -rf vscode

# Clone the repository
CLONE_URL="https://github.com/millsydotdev/GRID.git"
if [[ -n "${AUTH_TOKEN}" ]]; then
  CLONE_URL="https://x-access-token:${AUTH_TOKEN}@github.com/millsydotdev/GRID.git"
fi

if [[ -n "${GRID_COMMIT}" ]]; then
  echo "Cloning specific commit ${GRID_COMMIT}..."
  mkdir -p vscode
  cd vscode || exit 1
  git init -q
  git remote add origin "${CLONE_URL}"
  git fetch --depth 1 origin "${GRID_COMMIT}"
  git checkout "${GRID_COMMIT}"
else
  echo "Cloning branch ${GRID_BRANCH}..."
  git clone -c http.extraheader="" -c credential.helper="" --depth 1 --branch "${GRID_BRANCH}" "${CLONE_URL}" vscode
  cd vscode || { echo "'vscode' dir not found"; exit 1; }
fi

MS_TAG=$( jq -r '.version' "package.json" )
MS_COMMIT=$GRID_BRANCH # GRID - MS_COMMIT doesn't seem to do much
GRID_VERSION=$( jq -r '.gridVersion' "product.json" ) # GRID - grid version from product.json

if [[ -n "${GRID_VERSION}" ]]; then
  RELEASE_VERSION="${GRID_VERSION}"
elif [[ -n "${GRID_RELEASE}" ]]; then # GRID - GRID_RELEASE as optional to bump manually
  RELEASE_VERSION="${MS_TAG}${GRID_RELEASE}"
else
  GRID_RELEASE=$( jq -r '.gridRelease' "product.json" )
  RELEASE_VERSION="${MS_TAG}${GRID_RELEASE}"
fi
# GRID - RELEASE_VERSION is later used as version (1.0.3+RELEASE_VERSION), so it MUST be a number or it will throw a semver error


echo "RELEASE_VERSION=\"${RELEASE_VERSION}\""
echo "MS_COMMIT=\"${MS_COMMIT}\""
echo "MS_TAG=\"${MS_TAG}\""

cd ..

# for GH actions
if [[ "${GITHUB_ENV}" ]]; then
  echo "MS_TAG=${MS_TAG}" >> "${GITHUB_ENV}"
  echo "MS_COMMIT=${MS_COMMIT}" >> "${GITHUB_ENV}"
  echo "RELEASE_VERSION=${RELEASE_VERSION}" >> "${GITHUB_ENV}"
  echo "GRID_VERSION=${GRID_VERSION}" >> "${GITHUB_ENV}" # GRID added this
fi



echo "----------- get_repo exports -----------"
echo "MS_TAG ${MS_TAG}"
echo "MS_COMMIT ${MS_COMMIT}"
echo "RELEASE_VERSION ${RELEASE_VERSION}"
echo "GRID VERSION ${GRID_VERSION}"
echo "----------------------"


export MS_TAG
export MS_COMMIT
export RELEASE_VERSION
export GRID_VERSION
