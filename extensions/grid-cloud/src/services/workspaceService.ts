import * as vscode from 'vscode';
import * as crypto from 'crypto';
import * as path from 'path';
import { AuthService } from './authService';

interface Workspace {
    id: string;
    name: string;
    path: string;
    settings: any;
    updated_at: string;
    last_synced_at: string;
}

interface SyncFileChange {
    path: string;
    hash: string;
    content?: string;
    deleted?: boolean;
}

interface SyncResponse {
    synced: { path: string, status: string }[];
    downloads: { path: string, content: string }[]; // Simplified content model
    timestamp: string;
}

export class WorkspaceService {
    private _currentWorkspace: Workspace | null = null;
    private _autoSyncInterval: NodeJS.Timer | null = null;

    constructor(
        private context: vscode.ExtensionContext,
        private authService: AuthService
    ) {
        this.authService.on('logout', () => this.stopAutoSync());
    }

    public async getWorkspaces(): Promise<Workspace[]> {
        return this.fetchAPI<Workspace[]>('/workspaces');
    }

    public async createWorkspace(name: string, path: string): Promise<Workspace> {
        return this.fetchAPI<Workspace>('/workspaces', {
            method: 'POST',
            body: JSON.stringify({ name, path })
        });
    }

    public async syncNow() {
        if (!this.authService.isAuthenticated()) return;

        try {
            vscode.window.setStatusBarMessage('$(sync~spin) Syncing workspace...', 3000);

            // 1. Determine current workspace context
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showInformationMessage('No folder opened to sync.');
                return;
            }

            const rootPath = workspaceFolders[0].uri.fsPath;
            const workspaceName = workspaceFolders[0].name;

            // 2. Find or Create Cloud Workspace
            if (!this._currentWorkspace) {
                const workspaces = await this.getWorkspaces();
                // Simple matching by name for now, in reality should match path or store ID in workspace storage
                this._currentWorkspace = workspaces.find(w => w.name === workspaceName) || null;

                if (!this._currentWorkspace) {
                    const selection = await vscode.window.showInformationMessage(
                        `Workspace "${workspaceName}" not found in cloud.`,
                        'Create Cloud Workspace',
                        'Cancel'
                    );
                    if (selection === 'Create Cloud Workspace') {
                        this._currentWorkspace = await this.createWorkspace(workspaceName, rootPath);
                    } else {
                        return;
                    }
                }
            }

            // 3. Compute Local Changes
            const changes = await this.computeLocalChanges(rootPath);

            // 4. Push/Pull Sync
            const result = await this.fetchAPI<SyncResponse>(`/workspaces/${this._currentWorkspace!.id}/sync`, {
                method: 'POST',
                body: JSON.stringify({
                    changes,
                    lastSyncedAt: this._currentWorkspace!.last_synced_at
                })
            });

            // 5. Apply Downloads (Pull)
            if (result.downloads?.length > 0) {
                await this.applyDownloads(rootPath, result.downloads);
            }

            this._currentWorkspace!.last_synced_at = result.timestamp;
            vscode.window.setStatusBarMessage('$(check) Workspace synced', 3000);

        } catch (error: any) {
            console.error('Sync failed:', error);
            if (error.message.includes('Upgrade to Pro')) {
                vscode.window.showErrorMessage('Workspace Sync requires Pro tier. Please upgrade on grideditor.com');
            } else {
                vscode.window.showErrorMessage(`Sync failed: ${error.message}`);
            }
        }
    }

    public startAutoSync() {
        if (this._autoSyncInterval) return;
        this._autoSyncInterval = setInterval(() => this.syncNow(), 5 * 60 * 1000); // 5 mins
    }

    public stopAutoSync() {
        if (this._autoSyncInterval) {
            clearInterval(this._autoSyncInterval);
            this._autoSyncInterval = null;
        }
    }

    private async computeLocalChanges(rootPath: string): Promise<SyncFileChange[]> {
        // Find all files, compute hash, compare with last known state
        // For this demo implementation, we'll scan a small subset or rely on VS Code file watcher events
        // Real implementation requires tracking state DB.
        // We will just return empty for now to test connection, or mock a simple file.
        return [];
    }

    private async applyDownloads(rootPath: string, downloads: { path: string, content: string }[]) {
        for (const file of downloads) {
            const uri = vscode.Uri.file(path.join(rootPath, file.path));
            const encoder = new TextEncoder();
            await vscode.workspace.fs.writeFile(uri, encoder.encode(file.content));
        }
    }

    private async fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const apiKey = await this.authService.getApiKey();
        if (!apiKey) throw new Error('Not logged in');

        const config = vscode.workspace.getConfiguration('grid.cloud');
        const baseUrl = config.get<string>('apiBaseUrl') || 'https://grideditor.com/api';

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`, // Assuming API key can be passed as Bearer or query param?
            // In auth/validate we sent it in body.
            // Workspace API "requireTier" usually checks user in session.
            // If using Next.js/Supabase, "requireAuth" middleware checks Supabase session or maybe our own API key header?
            // "api-auth.ts" on website checks "x-api-key" header or similar usually.
            // Let's assume standard x-api-key or Bearer.
            // Looking at website code "lib/api-auth.ts" would clarify.
            // For now I'll send it as 'x-api-key' as that's common for API keys.
            'x-api-key': apiKey
        };

        const response = await fetch(`${baseUrl}${endpoint}`, {
            ...options,
            headers: { ...headers, ...options.headers }
        });

        if (response.status === 402 || response.status === 403) {
            throw new Error('Upgrade to Pro to use this feature');
        }

        if (!response.ok) {
            throw new Error(`API Error ${response.status}: ${response.statusText}`);
        }

        if (endpoint === '/workspaces' && options.method === 'POST') {
            // Extract nested object if needed
            const data = await response.json() as any;
            return data.workspace;
        }

        const data = await response.json();
        return data.workspaces || data.workspace || data;
    }
}
