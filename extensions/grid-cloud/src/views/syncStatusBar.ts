import * as vscode from 'vscode';
import { WorkspaceService } from '../services/workspaceService';

export class SyncStatusBar {
    private _statusBarItem: vscode.StatusBarItem;

    constructor(
        context: vscode.ExtensionContext,
        private workspaceService: WorkspaceService
    ) {
        this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this._statusBarItem.command = 'grid.cloud.sync';
        context.subscriptions.push(this._statusBarItem);

        // Listen to workspace events if we emitted them,
        // effectively we can poll or hook into methods if we change design.
        // For now, let's just show it if authenticated.

        this.update();

        // Simple polling to show "Sync" status if we had a state in workspaceService
        // But workspaceService.syncNow() handles status bar messages.
        // This item is more of a permanent indicator.
    }

    private update() {
        this._statusBarItem.text = '$(cloud) Sync';
        this._statusBarItem.tooltip = 'GRID Workspace Sync';
        this._statusBarItem.show();
    }
}
