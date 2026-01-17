export VSCODE_CLI_APP_NAME="grid"
export VSCODE_CLI_BINARY_NAME="grid-server"
export VSCODE_CLI_DOWNLOAD_URL="https://grideditor.com/download"
export VSCODE_CLI_QUALITY="stable"
export VSCODE_CLI_UPDATE_URL="https://grideditor.com/api/update"

cargo build --release --target aarch64-apple-darwin --bin=code

cp target/aarch64-apple-darwin/release/code "../../VSCode-darwin-arm64/GRID.app/Contents/Resources/app/bin/grid-tunnel"

"../../VSCode-darwin-arm64/GRID.app/Contents/Resources/app/bin/grid-tunnel" serve-web



# cargo build --release --target aarch64-apple-darwin --bin=code

# cp target/aarch64-apple-darwin/release/code "../../VSCode-darwin-arm64/GRID-Insiders.app/Contents/Resources/app/bin/grid-tunnel-insiders"

# "../../VSCode-darwin-arm64/GRID-Insiders.app/Contents/Resources/app/bin/grid-insiders" serve-web
