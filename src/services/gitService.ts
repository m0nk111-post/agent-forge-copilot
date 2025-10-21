import * as vscode from 'vscode';
import { execSync } from 'child_process';

export class GitService {
    private workspaceRoot: string | undefined;

    constructor() {
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    }

    private exec(command: string): string {
        if (!this.workspaceRoot) {
            throw new Error('No workspace folder open');
        }

        try {
            return execSync(command, {
                cwd: this.workspaceRoot,
                encoding: 'utf-8'
            });
        } catch (error: any) {
            throw new Error(`Git command failed: ${error.message}`);
        }
    }

    async getStatus(): Promise<string> {
        return this.exec('git status --short');
    }

    async getDiff(staged: boolean = false): Promise<string> {
        const command = staged ? 'git diff --staged' : 'git diff';
        return this.exec(command);
    }

    async getDiffBetweenBranches(baseBranch: string, compareBranch: string): Promise<string> {
        return this.exec(`git diff ${baseBranch}...${compareBranch}`);
    }

    async getCommitsSince(baseBranch: string): Promise<string[]> {
        const output = this.exec(`git log ${baseBranch}..HEAD --oneline`);
        return output.trim().split('\n').filter(line => line.trim());
    }

    async commit(message: string): Promise<string> {
        const config = vscode.workspace.getConfiguration('agent-forge');
        if (!config.get('autoCommit')) {
            throw new Error('Auto-commit is disabled in settings');
        }

        this.exec('git add .');
        return this.exec(`git commit -m "${message}"`);
    }

    async createBranch(branchName: string): Promise<string> {
        return this.exec(`git checkout -b ${branchName}`);
    }

    async getCurrentBranch(): Promise<string> {
        return this.exec('git branch --show-current').trim();
    }

    async getLog(limit: number = 10): Promise<string> {
        return this.exec(`git log --oneline -${limit}`);
    }

    async isGitRepo(): Promise<boolean> {
        try {
            this.exec('git rev-parse --git-dir');
            return true;
        } catch {
            return false;
        }
    }
}


