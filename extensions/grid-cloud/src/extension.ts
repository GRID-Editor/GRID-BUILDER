import * as vscode from 'vscode';
import { AuthService } from './services/authService';
import { ProviderService } from './services/providerService';
import { WorkspaceService } from './services/workspaceService';
import { ConfigService } from './services/configService';
import { AccountPanel } from './views/accountPanel';
import { SyncStatusBar } from './views/syncStatusBar';

export async function activate(context: vscode.ExtensionContext) {
    console.log('GRID Cloud extension activate');

    // Initialize Services
    const authService = new AuthService(context);
    const providerService = new ProviderService(context, authService);
    const workspaceService = new WorkspaceService(context, authService);
    const configService = new ConfigService(context, authService);

    // Initialize UI
    const syncStatusBar = new SyncStatusBar(context, workspaceService);

    // Register Views
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'grid.account',
            new AccountPanel(context.extensionUri, authService)
        )
    );

    // Register Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('grid.cloud.login', async () => {
            await authService.login();
        }),
        vscode.commands.registerCommand('grid.cloud.logout', async () => {
            await authService.logout();
        }),
        vscode.commands.registerCommand('grid.cloud.sync', async () => {
            await workspaceService.syncNow();
        })
    );

    // Start background sync if authenticated
    if (authService.isAuthenticated()) {
        workspaceService.startAutoSync();
        providerService.refreshProviders();
        configService.syncConfig();
    }

    console.log('GRID Cloud extension activated');
}

export function deactivate() { }
