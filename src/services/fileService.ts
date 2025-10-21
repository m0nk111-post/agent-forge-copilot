import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';

export class FileService {
    async readFile(filePath: string): Promise<string> {
        if (!filePath || typeof filePath !== 'string') {
            throw new Error('The "path" argument must be of type string or an instance of Buffer or URL. Received undefined');
        }

        const config = vscode.workspace.getConfiguration('agent-forge');
        if (!config.get('enableFileOps')) {
            throw new Error('File operations are disabled in settings');
        }

        try {
            return await fs.readFile(filePath, 'utf-8');
        } catch (error: any) {
            throw new Error(`Failed to read file: ${error.message}`);
        }
    }

    async writeFile(filePath: string, content: string): Promise<void> {
        if (!filePath || typeof filePath !== 'string') {
            throw new Error('The "path" argument must be of type string or an instance of Buffer or URL. Received undefined');
        }
        if (content === undefined || content === null) {
            throw new Error('Content argument is required');
        }

        const config = vscode.workspace.getConfiguration('agent-forge');
        if (!config.get('enableFileOps')) {
            throw new Error('File operations are disabled in settings');
        }

        try {
            await fs.writeFile(filePath, content, 'utf-8');
        } catch (error: any) {
            throw new Error(`Failed to write file: ${error.message}`);
        }
    }

    async listFiles(dirPath: string, pattern?: string): Promise<string[]> {
        try {
            const files = await fs.readdir(dirPath);
            if (pattern) {
                const regex = new RegExp(pattern);
                return files.filter(f => regex.test(f));
            }
            return files;
        } catch (error: any) {
            throw new Error(`Failed to list files: ${error.message}`);
        }
    }

    async searchInFiles(searchPath: string, searchTerm: string): Promise<{file: string, matches: string[]}[]> {
        const results: {file: string, matches: string[]}[] = [];
        
        // Use VS Code's native search
        const files = await vscode.workspace.findFiles(
            new vscode.RelativePattern(searchPath, '**/*'),
            '**/node_modules/**'
        );

        for (const file of files) {
            try {
                const content = await fs.readFile(file.fsPath, 'utf-8');
                const lines = content.split('\n');
                const matches = lines
                    .map((line, i) => ({ line, index: i }))
                    .filter(({line}) => line.includes(searchTerm))
                    .map(({line, index}) => `${index + 1}: ${line.trim()}`);

                if (matches.length > 0) {
                    results.push({ file: file.fsPath, matches });
                }
            } catch {
                // Skip files that can't be read
            }
        }

        return results;
    }

    async getWorkspaceFiles(): Promise<string[]> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return [];
        }

        const files = await vscode.workspace.findFiles(
            '**/*',
            '**/node_modules/**'
        );

        return files.map(f => f.fsPath);
    }

    async getCurrentFileContent(): Promise<string | null> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return null;
        }

        return editor.document.getText();
    }

    async replaceInFile(filePath: string, searchText: string, replaceText: string): Promise<void> {
        const content = await this.readFile(filePath);
        const newContent = content.replace(new RegExp(searchText, 'g'), replaceText);
        await this.writeFile(filePath, newContent);
    }

    getRelativePath(absolutePath: string): string {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return absolutePath;
        }

        return path.relative(workspaceFolder.uri.fsPath, absolutePath);
    }
}


