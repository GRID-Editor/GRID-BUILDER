import * as vscode from 'vscode';
import { AuthService } from './authService';

interface EnterpriseConfig {
    providerSettings: Record<string, any>;
    mcpConfig: {
        servers: Record<string, any>;
        inputs: any[];
    };
    updatedAt: number;
    version: number;
}

export class ConfigService {
    private _localConfig: EnterpriseConfig | null = null;

    constructor(
        private context: vscode.ExtensionContext,
        private authService: AuthService
    ) {
        this.authService.on('login', () => this.syncConfig());
    }

    public async syncConfig() {
        if (!this.authService.isAuthenticated()) return;

        try {
            console.log('Syncing enterprise configuration...');
            const remoteConfig = await this.fetchConfig();

            // Compare version
            const localVersion = this.context.globalState.get<number>('grid.config.version') || 0;

            if (remoteConfig.version > localVersion) {
                console.log(`Applying new config versions: ${localVersion} -> ${remoteConfig.version}`);
                await this.applyConfig(remoteConfig);
            } else if (localVersion > remoteConfig.version) {
                // Local is newer (unlikely unless we support local edits that bump version)
                // For now, server is source of truth.
            }

        } catch (error) {
            console.error('Config sync failed:', error);
        }
    }

    private async fetchConfig(): Promise<EnterpriseConfig> {
        const apiKey = await this.authService.getApiKey();
        if (!apiKey) throw new Error('Not logged in');

        const config = vscode.workspace.getConfiguration('grid.cloud');
        const baseUrl = config.get<string>('apiBaseUrl') || 'https://grideditor.com/api';

        const response = await fetch(`${baseUrl}/ide/config`, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            }
        });

        if (!response.ok) {
            throw new Error(`Config fetch failed: ${response.statusText}`);
        }

        return await response.json() as EnterpriseConfig;
    }

    private async applyConfig(config: EnterpriseConfig) {
        this._localConfig = config;

        // Save to global state
        await this.context.globalState.update('grid.config', config);
        await this.context.globalState.update('grid.config.version', config.version);

        // Apply Provider Settings (e.g. set secrets or config)
        // This effectively configures API keys for the AI providers
        const providerConfig = vscode.workspace.getConfiguration('grid.providers');
        if (config.providerSettings) {
            for (const [key, value] of Object.entries(config.providerSettings)) {
                // Be careful not to overwrite user local overrides if possible,
                // but Enterprise config should enforce settings.
                await providerConfig.update(key, value, vscode.ConfigurationTarget.Global);
            }
        }

        // Apply MCP Config (this might need to write to a file that the MCP extension reads)
        // Or we expose an API that the MCP extension consumes.
        // For now, let's write to a known location for MCP if needed, or just store in state.

        vscode.window.showInformationMessage('Enterprise configuration updated');
    }

    public getConfig(): EnterpriseConfig | null {
        return this._localConfig || this.context.globalState.get<EnterpriseConfig>('grid.config') || null;
    }
}
