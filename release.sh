#!/usr/bin/env bash
# shellcheck disable=SC1091

set -ex

if [[ -z "${GH_TOKEN}" ]] && [[ -z "${GITHUB_TOKEN}" ]] && [[ -z "${GH_ENTERPRISE_TOKEN}" ]] && [[ -z "${GITHUB_ENTERPRISE_TOKEN}" ]]; then
  echo "Will not release because no GITHUB_TOKEN defined"
  exit
fi

REPOSITORY_OWNER="${ASSETS_REPOSITORY/\/*/}"
REPOSITORY_NAME="${ASSETS_REPOSITORY/*\//}"

npm install -g github-release-cli

if [[ $( gh release view "${RELEASE_VERSION}" --repo "${ASSETS_REPOSITORY}" 2>&1 ) =~ "release not found" ]]; then
  echo "Creating release '${RELEASE_VERSION}'"

  if [[ "${VSCODE_QUALITY}" == "insider" ]]; then
    NOTES="update vscode to [${MS_COMMIT}](https://github.com/microsoft/vscode/tree/${MS_COMMIT})"

    gh release create "${RELEASE_VERSION}" --repo "${ASSETS_REPOSITORY}" --title "${GRID_VERSION}" --notes "${NOTES}"
  else
    gh release create "${RELEASE_VERSION}" --repo "${ASSETS_REPOSITORY}" --title "${GRID_VERSION}" --generate-notes

    . ./utils.sh

    RELEASE_NOTES=$( gh release view "${RELEASE_VERSION}" --repo "${ASSETS_REPOSITORY}" --json "body" --jq ".body" )

    replace "s|MS_TAG_SHORT|$( echo "${MS_TAG//./_}" | cut -d'_' -f 1,2 )|" release_notes.txt
    replace "s|MS_TAG|${MS_TAG}|" release_notes.txt
    replace "s|RELEASE_VERSION|${RELEASE_VERSION}|g" release_notes.txt
    replace "s|GRID_VERSION|${GRID_VERSION}|g" release_notes.txt
    replace "s|RELEASE_NOTES|${RELEASE_NOTES//$'\n'/\\n}|" release_notes.txt

    gh release edit "${RELEASE_VERSION}" --repo "${ASSETS_REPOSITORY}" --notes-file release_notes.txt
  fi
fi

cd assets

set +e

for FILE in *; do
  if [[ -f "${FILE}" ]] && [[ "${FILE}" != *.sha1 ]] && [[ "${FILE}" != *.sha256 ]]; then
    echo "::group::Uploading '${FILE}' at $( date "+%T" )"
    gh release upload --repo "${ASSETS_REPOSITORY}" "${RELEASE_VERSION}" "${FILE}" "${FILE}.sha1" "${FILE}.sha256"

    EXIT_STATUS=$?
    echo "exit: ${EXIT_STATUS}"

    if (( "${EXIT_STATUS}" )); then
      for (( i=0; i<10; i++ )); do
        github-release delete --owner "${REPOSITORY_OWNER}" --repo "${REPOSITORY_NAME}" --tag "${RELEASE_VERSION}" "${FILE}" "${FILE}.sha1" "${FILE}.sha256"

        sleep $(( 15 * (i + 1)))

        echo "RE-Uploading '${FILE}' at $( date "+%T" )"
        gh release upload --repo "${ASSETS_REPOSITORY}" "${RELEASE_VERSION}" "${FILE}" "${FILE}.sha1" "${FILE}.sha256"

        EXIT_STATUS=$?
        echo "exit: ${EXIT_STATUS}"

        if ! (( "${EXIT_STATUS}" )); then
          break
        fi
      done
      echo "exit: ${EXIT_STATUS}"

      if (( "${EXIT_STATUS}" )); then
        echo "'${FILE}' hasn't been uploaded!"

        github-release delete --owner "${REPOSITORY_OWNER}" --repo "${REPOSITORY_NAME}" --tag "${RELEASE_VERSION}" "${FILE}" "${FILE}.sha1" "${FILE}.sha256"

        exit 1
      fi
    fi

    # Post-Upload: Notify Website
    # Env vars GRID_API_SECRET must be set in the runner
    if [[ -f "../scripts/publish-release.js" ]]; then
       echo "::group::Publishing to Website API"
       # Determine platform/arch from filename for simplicity, or pass defaults
       # We can try to guess or use env vars if available. 
       # For now, let's assume we are standard windows x64 or similar, OR rely on filename parsing in the JS? 
       # The JS expects: VERSION FILE_PATH CHANNEL PLATFORM ARCH
       
       # Extract platform/arch from filename or env?
       # The builder seems to run per-platform. 
       # Env vars: PLATFORM (set in build.sh? no, build.sh sets it but release.sh runs separate?)
       # release.sh seems to run in the 'assets' dir where all assets are gathered?
       # "cd assets" on line 40.
       
       # We might need to guess from filename.
       # e.g. "GRID-x64-1.0.0.msi"
       
       NODE_PLATFORM="windows"
       NODE_ARCH="x64"
       
       if [[ "${FILE}" == *"win32"* ]] || [[ "${FILE}" == *".exe"* ]] || [[ "${FILE}" == *".msi"* ]]; then
         NODE_PLATFORM="windows"
       elif [[ "${FILE}" == *"darwin"* ]] || [[ "${FILE}" == *".dmg"* ]] || [[ "${FILE}" == *".zip"* ]]; then
         NODE_PLATFORM="darwin"
       elif [[ "${FILE}" == *"linux"* ]] || [[ "${FILE}" == *".deb"* ]] || [[ "${FILE}" == *".rpm"* ]] || [[ "${FILE}" == *".AppImage"* ]]; then
         NODE_PLATFORM="linux"
       fi
       
       if [[ "${FILE}" == *"arm64"* ]]; then
         NODE_ARCH="arm64"
       else
         NODE_ARCH="x64"
       fi
       
       # Run the script
       # ../scripts/publish-release.js is relative to 'assets' folder?
       # On line 40 we did `cd assets`. So `../scripts` is correct if `scripts` is in root.
       
       CHANNEL="stable"
       if [[ "${VSCODE_QUALITY}" == "insider" ]]; then
         CHANNEL="insiders"
       fi
       
       # Pass ASSETS_REPOSITORY (owner/repo) so the script can construct the github download URL
       node ../scripts/publish-release.js "${RELEASE_VERSION}" "${FILE}" "${CHANNEL}" "${NODE_PLATFORM}" "${NODE_ARCH}" "${ASSETS_REPOSITORY}" || echo "Website publish failed but ignoring to not break release"
       
       echo "::endgroup::"
    fi

    echo "::endgroup::"
  fi
done

cd ..
