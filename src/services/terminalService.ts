import * as vscode from 'vscode';

export class TerminalService {
    private terminal: vscode.Terminal | undefined;

    async runCommand(command: string): Promise<string> {
        const config = vscode.workspace.getConfiguration('agent-forge');
        if (!config.get('enableTerminal')) {
            throw new Error('Terminal operations are disabled in settings');
        }

        if (!this.terminal || this.terminal.exitStatus) {
            this.terminal = vscode.window.createTerminal('Agent Forge');
        }

        this.terminal.show();
        this.terminal.sendText(command);

        return `Executed: ${command}`;
    }

    async runCommandWithOutput(command: string): Promise<string> {
        // For commands where we need the output, we use tasks
        const execution = await vscode.tasks.executeTask(
            new vscode.Task(
                { type: 'shell' },
                vscode.TaskScope.Workspace,
                'Agent Forge Command',
                'agent-forge',
                new vscode.ShellExecution(command)
            )
        );

        return new Promise((resolve) => {
            const disposable = vscode.tasks.onDidEndTask(e => {
                if (e.execution === execution) {
                    disposable.dispose();
                    resolve(`Command completed: ${command}`);
                }
            });
        });
    }

    dispose() {
        if (this.terminal) {
            this.terminal.dispose();
        }
    }
}


