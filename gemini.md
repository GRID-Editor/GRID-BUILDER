# GRID Builder - Project "Gemini" Deep Analysis
>
> **Role**: Manufacturing / CI/CD
> **Source of Truth**: `.github/workflows/*.yml`

## 1. Build Environment Stats

* **Operating System**: Windows 2019 (for Windows builds), Ubuntu 22.04 (for Linux/Check).
* **Node.js**: Version **20.18.2**.
* **Python**: Version **3.11**.
* **Architecture Targets**: `x64`, `arm64`.

## 2. Build Pipeline (`stable-windows.yml`)

The build process flows as follows:

1. **Check Job**:
    * Determines if a build is needed (`check_cron_or_pr.sh`).
    * Checks for upstream VS Code commits (`MS_COMMIT`) and Tags (`MS_TAG`).
    * Outputs `RELEASE_VERSION`.

2. **Compile Job**:
    * **Clone**: Uses `get_repo.sh` to pull the `GRID` source code.
    * **Patch**: Runs `prepare_vscode.sh` to apply GRID-specific branding and telemetry removal.
    * **Build**: Runs `build.sh` -> `npm run buildreact` -> `gulp compile-build` -> `gulp minify-vscode`.
    * **Artifact**: Creates `vscode.tar.gz`.

3. **Build (Package) Job**:
    * **Package**: Runs `build/windows/package.sh` to create the installer (exe/msi).
    * **Assets**: Runs `prepare_assets.sh`.
    * **Checksums**: Runs `prepare_checksums.sh`.
    * **Release**: Runs `release.sh` to push binaries to the remote **GRID-NETWORK/binaries** GitHub repository.

## 3. Key Scripts

* **`prepare_vscode.sh`**: The most critical script. It transforms the Microsoft VS Code source into GRID.
  * *Action*: Applies branding patches.
  * *Action*: Disables Telemetry.
  * *Action*: Injects `product.json` values.
* **`build.sh`**: The orchestrator.
  * *Critical Step*: `npm run buildreact` (This builds the Custom GRID UI in `src/vs/workbench/contrib/grid/browser/react`).
  * *Critical Step*: `npm run gulp minify-vscode`.

## 4. Updates & Versioning

* **Versions Repo**: `GRID-NETWORK/versions` (Remote GitHub Repo) stores the latest version metadata.
* **Auto-Update**: The IDE checks this remote repo to know when to update.
* **Inputs**: Workflow accepts `force_version` and `generate_assets` flags.

## 5. Gemini Analysis

* **Important Distinction**: Mentions of `GRID-NETWORK` here refer exclusively to the **Remote GitHub Organization**. The local `GRID-NETWORK` folder is legacy and ignored.
* This builder is set up to pull *directly* from the `GRID` repo.
* Any change in `GRID/product.json` will be reflected in the next build.
* **Note**: The `buildreact` step is unique to GRID and essential for the AI features to appear.
