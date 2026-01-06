import * as vscode from 'vscode';
import { AuthService, User } from '../services/authService';

export class AccountPanel implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _authService: AuthService
    ) {
        this._authService.on('login', () => this.updateView());
        this._authService.on('logout', () => this.updateView());
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.type) {
                case 'login':
                    this._authService.login();
                    break;
                case 'logout':
                    this._authService.logout();
                    break;
            }
        });

        this.updateView();
    }

    private updateView() {
        if (!this._view) return;
        this._view.webview.html = this._getHtmlForWebview(this._view.webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const user = this._authService.getUser();

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>GRID Account</title>
            <style>
                body { font-family: var(--vscode-font-family); padding: 10px; color: var(--vscode-foreground); }
                .container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; }
                .button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 8px 16px; cursor: pointer; border-radius: 2px; width: 100%; margin-top: 10px; }
                .button:hover { background: var(--vscode-button-hoverBackground); }
                .avatar { width: 64px; height: 64px; border-radius: 50%; background: var(--vscode-sideBarSectionHeader-background); margin-bottom: 15px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
                .info { text-align: center; margin-bottom: 20px; }
                .badge { display: inline-block; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); padding: 2px 6px; border-radius: 10px; font-size: 10px; margin-top: 5px; text-transform: uppercase; }
                .login-form { width: 100%; }
            </style>
        </head>
        <body>
            <div class="container">
                ${user ? this.renderLoggedIn(user) : this.renderLoggedOut()}
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                window.login = () => vscode.postMessage({ type: 'login' });
                window.logout = () => vscode.postMessage({ type: 'logout' });
            </script>
        </body>
        </html>`;
    }

    private renderLoggedIn(user: User) {
        return `
            <div class="avatar">${user.email.charAt(0).toUpperCase()}</div>
            <div class="info">
                <div><strong>${user.email}</strong></div>
                <div class="badge">${user.tier}</div>
            </div>
            <button class="button" onclick="logout()">Sign Out</button>
        `;
    }

    private renderLoggedOut() {
        return `
            <div class="info">
                <h3>Sign in to GRID</h3>
                <p>Sync your workspaces and settings across devices.</p>
            </div>
            <button class="button" onclick="login()">Sign In with API Key</button>
        `;
    }
}
