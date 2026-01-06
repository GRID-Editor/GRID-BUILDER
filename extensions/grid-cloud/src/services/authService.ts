import * as vscode from 'vscode';
import { EventEmitter } from 'events';

const API_BASE_URL = 'https://grideditor.com/api';

export interface User {
    id: string;
    email: string;
    tier: 'free' | 'pro' | 'enterprise' | 'founder';
    teamId?: string;
    isTeamAdmin?: boolean;
    stripeCustomerId?: string;
}

export class AuthService extends EventEmitter {
    private secretStorage: vscode.SecretStorage;
    private _isAuthenticated: boolean = false;
    private _user: User | null = null;
    private _statusItem: vscode.StatusBarItem;

    constructor(context: vscode.ExtensionContext) {
        super();
        this.secretStorage = context.secrets;
        this._statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this.initialize();
    }

    private async initialize() {
        const apiKey = await this.secretStorage.get('grid_api_key');
        if (apiKey) {
            await this.validateApiKey(apiKey);
        }
    }

    public async login() {
        const apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your GRID API Key (starts with grid_)',
            password: true,
            ignoreFocusOut: true
        });

        if (apiKey) {
            if (!apiKey.startsWith('grid_')) {
                vscode.window.showErrorMessage('Invalid API Key format. Must start with grid_');
                return;
            }
            await this.validateApiKey(apiKey);
        }
    }

    public async logout() {
        await this.secretStorage.delete('grid_api_key');
        this._isAuthenticated = false;
        this._user = null;
        this._statusItem.hide();
        this.emit('logout');
        vscode.window.showInformationMessage('Logged out of GRID Cloud');
    }

    public isAuthenticated(): boolean {
        return this._isAuthenticated;
    }

    public getUser(): User | null {
        return this._user;
    }

    public getApiKey(): Thenable<string | undefined> {
        return this.secretStorage.get('grid_api_key');
    }

    private async validateApiKey(apiKey: string) {
        try {
            const config = vscode.workspace.getConfiguration('grid.cloud');
            const baseUrl = config.get<string>('apiBaseUrl') || API_BASE_URL;

            // Using global fetch (available in Node 18+ and VS Code 1.75+)
            // If environment is older, might need node-fetch, but expecting modern environment
            const response = await fetch(`${baseUrl}/ide/auth/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ apiKey })
            });

            if (!response.ok) {
                const error = await response.json() as any;
                throw new Error(error.message || 'Validation failed');
            }

            const user = await response.json() as User;
            this._user = user;
            this._isAuthenticated = true;
            await this.secretStorage.store('grid_api_key', apiKey);

            this.updateStatusItem();
            this.emit('login', user);
            vscode.window.showInformationMessage(`Logged in as ${user.email} (${user.tier})`);

        } catch (error) {
            console.error('Login failed:', error);
            vscode.window.showErrorMessage(`Login failed: ${error instanceof Error ? error.message : String(error)}`);
            this._isAuthenticated = false;
            this._user = null;
        }
    }

    private updateStatusItem() {
        if (this._isAuthenticated && this._user) {
            this._statusItem.text = `$(cloud) GRID: ${this._user.tier.toUpperCase()}`;
            this._statusItem.tooltip = `Logged in as ${this._user.email}`;
            this._statusItem.command = 'grid.cloud.sync';
            this._statusItem.show();
        } else {
            this._statusItem.hide();
        }
    }
}
