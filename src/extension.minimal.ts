import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    // Log to console
    console.log('='.repeat(50));
    console.log('MINIMAL EXTENSION ACTIVATED');
    console.log('='.repeat(50));
    
    // Show message box
    vscode.window.showInformationMessage('✅ Minimal extension activated!');
    
    // Create status bar
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.text = "$(check) TEST";
    statusBar.show();
    context.subscriptions.push(statusBar);
    
    console.log('Status bar created');
}

export function deactivate() {
    console.log('Extension deactivated');
}


