import * as vscode from 'vscode';
import { OllamaService } from '../services/ollamaService';
import { ConfigurationManager } from '../services/configurationManager';

export class InlineChatProvider {
    private ollamaService: OllamaService;
    private configManager: ConfigurationManager;
    private decoration: vscode.TextEditorDecorationType;

    constructor(ollamaService: OllamaService, configManager: ConfigurationManager) {
        this.ollamaService = ollamaService;
        this.configManager = configManager;
        
        // Decoration for inline suggestions
        this.decoration = vscode.window.createTextEditorDecorationType({
            after: {
                color: new vscode.ThemeColor('editorGhostText.foreground'),
                fontStyle: 'italic'
            }
        });
    }

    /**
     * Show inline chat input box
     */
    async showInlineChat() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        
        // Show input box for user instruction
        const instruction = await vscode.window.showInputBox({
            prompt: 'What would you like to do with this code?',
            placeHolder: 'e.g., Add error handling, Convert to async/await, Add comments',
            value: selectedText ? '' : 'Generate code for: '
        });

        if (!instruction) return;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Generating code...",
            cancellable: false
        }, async () => {
            try {
                const prompt = this.buildPrompt(instruction, selectedText, editor);
                const response = await this.ollamaService.chat(prompt);
                
                // Extract code from response
                const code = this.extractCode(response);
                
                // Apply changes
                await this.applyCode(editor, selection, code, selectedText);
                
            } catch (error: any) {
                vscode.window.showErrorMessage(`Inline chat error: ${error.message}`);
            }
        });
    }

    /**
     * Quick fix - fix selected code
     */
    async quickFix() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        
        if (!selectedText) {
            vscode.window.showInformationMessage('Please select code to fix');
            return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Fixing code...",
            cancellable: false
        }, async () => {
            const prompt = `Fix any bugs or issues in this code. Return ONLY the fixed code without explanations:\n\n\`\`\`${editor.document.languageId}\n${selectedText}\n\`\`\``;
            const response = await this.ollamaService.chat(prompt);
            const code = this.extractCode(response);
            
            await editor.edit(editBuilder => {
                editBuilder.replace(selection, code);
            });
            
            vscode.window.showInformationMessage('✅ Code fixed!');
        });
    }

    /**
     * Quick explain - explain selected code
     */
    async quickExplain() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        
        if (!selectedText) {
            vscode.window.showInformationMessage('Please select code to explain');
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'codeExplanation',
            'Code Explanation',
            vscode.ViewColumn.Beside,
            { enableScripts: true }
        );

        panel.webview.html = this.getLoadingHtml();

        const prompt = `Explain this code in detail:\n\n\`\`\`${editor.document.languageId}\n${selectedText}\n\`\`\``;
        const explanation = await this.ollamaService.chat(prompt);
        
        panel.webview.html = this.getExplanationHtml(explanation, selectedText);
    }

    /**
     * Quick optimize - optimize selected code
     */
    async quickOptimize() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        
        if (!selectedText) {
            vscode.window.showInformationMessage('Please select code to optimize');
            return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Optimizing code...",
            cancellable: false
        }, async () => {
            const prompt = `Optimize this code for better performance and readability. Return ONLY the optimized code:\n\n\`\`\`${editor.document.languageId}\n${selectedText}\n\`\`\``;
            const response = await this.ollamaService.chat(prompt);
            const code = this.extractCode(response);
            
            // Show diff before applying
            const accepted = await this.showDiff(editor.document.uri, selectedText, code);
            if (accepted) {
                await editor.edit(editBuilder => {
                    editBuilder.replace(selection, code);
                });
                vscode.window.showInformationMessage('✅ Code optimized!');
            }
        });
    }

    /**
     * Quick document - add documentation to code
     */
    async quickDocument() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        
        if (!selectedText) {
            vscode.window.showInformationMessage('Please select code to document');
            return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Adding documentation...",
            cancellable: false
        }, async () => {
            const docStyle = this.getDocStyle(editor.document.languageId);
            const prompt = `Add ${docStyle} documentation comments to this code. Return the code WITH documentation:\n\n\`\`\`${editor.document.languageId}\n${selectedText}\n\`\`\``;
            const response = await this.ollamaService.chat(prompt);
            const code = this.extractCode(response);
            
            await editor.edit(editBuilder => {
                editBuilder.replace(selection, code);
            });
            
            vscode.window.showInformationMessage('✅ Documentation added!');
        });
    }

    /**
     * Generate tests for selected code
     */
    async generateTests() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        
        if (!selectedText) {
            vscode.window.showInformationMessage('Please select code to test');
            return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Generating tests...",
            cancellable: false
        }, async () => {
            const testFramework = this.getTestFramework(editor.document.languageId);
            const prompt = `Generate comprehensive unit tests using ${testFramework} for this code:\n\n\`\`\`${editor.document.languageId}\n${selectedText}\n\`\`\``;
            const tests = await this.ollamaService.chat(prompt);
            
            // Create new test file
            const testFileName = this.getTestFileName(editor.document.fileName);
            const testUri = vscode.Uri.file(testFileName);
            
            const testContent = this.extractCode(tests);
            await vscode.workspace.fs.writeFile(testUri, Buffer.from(testContent, 'utf8'));
            
            const doc = await vscode.workspace.openTextDocument(testUri);
            await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
            
            vscode.window.showInformationMessage('✅ Tests generated!');
        });
    }

    // Helper methods

    private buildPrompt(instruction: string, selectedText: string, editor: vscode.TextEditor): string {
        let prompt = '';

        // Add guidelines if available
        const guidelines = this.configManager.getGuidelines();
        if (guidelines) {
            prompt += `=== PROJECT GUIDELINES ===\n\n${guidelines}\n\n`;
        }

        // Add file context
        const fileContext = this.configManager.getCurrentFileContext();
        if (fileContext) {
            prompt += `=== CURRENT FILE ===\n\n${fileContext}\n\n`;
        }

        // Add user instruction
        prompt += `=== INSTRUCTION ===\n\n${instruction}\n\n`;

        if (selectedText) {
            prompt += `Current code:\n\`\`\`${editor.document.languageId}\n${selectedText}\n\`\`\`\n\nReturn ONLY the modified code without explanations.`;
        } else {
            prompt += `Return ONLY the code without explanations.`;
        }

        return prompt;
    }

    private extractCode(response: string): string {
        // Extract code from markdown code blocks
        const codeBlockMatch = response.match(/```[\w]*\n([\s\S]*?)\n```/);
        if (codeBlockMatch) {
            return codeBlockMatch[1].trim();
        }
        return response.trim();
    }

    private async applyCode(editor: vscode.TextEditor, selection: vscode.Selection, code: string, originalText: string) {
        if (originalText) {
            // Replace selected text
            await editor.edit(editBuilder => {
                editBuilder.replace(selection, code);
            });
        } else {
            // Insert at cursor
            await editor.edit(editBuilder => {
                editBuilder.insert(selection.active, code);
            });
        }
    }

    private async showDiff(uri: vscode.Uri, original: string, modified: string): Promise<boolean> {
        const originalUri = uri.with({ scheme: 'untitled', path: uri.path + '.original' });
        const modifiedUri = uri.with({ scheme: 'untitled', path: uri.path + '.modified' });

        await vscode.workspace.fs.writeFile(originalUri, Buffer.from(original, 'utf8'));
        await vscode.workspace.fs.writeFile(modifiedUri, Buffer.from(modified, 'utf8'));

        await vscode.commands.executeCommand('vscode.diff', originalUri, modifiedUri, 'Original ↔ Optimized');

        const choice = await vscode.window.showInformationMessage(
            'Accept optimized code?',
            'Accept', 'Reject'
        );

        return choice === 'Accept';
    }

    private getDocStyle(languageId: string): string {
        const docStyles: Record<string, string> = {
            'typescript': 'TSDoc',
            'javascript': 'JSDoc',
            'python': 'docstring',
            'java': 'JavaDoc',
            'csharp': 'XML',
            'go': 'GoDoc',
            'rust': 'rustdoc'
        };
        return docStyles[languageId] || 'inline';
    }

    private getTestFramework(languageId: string): string {
        const frameworks: Record<string, string> = {
            'typescript': 'Jest',
            'javascript': 'Jest',
            'python': 'pytest',
            'java': 'JUnit',
            'csharp': 'xUnit',
            'go': 'testing',
            'rust': 'cargo test'
        };
        return frameworks[languageId] || 'standard testing framework';
    }

    private getTestFileName(fileName: string): string {
        const parts = fileName.split('.');
        const ext = parts.pop();
        const name = parts.join('.');
        return `${name}.test.${ext}`;
    }

    private getLoadingHtml(): string {
        return `<!DOCTYPE html>
<html>
<head>
    <style>
        body { 
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
        }
        .loading {
            text-align: center;
            margin-top: 50px;
        }
    </style>
</head>
<body>
    <div class="loading">
        <h2>⏳ Analyzing code...</h2>
    </div>
</body>
</html>`;
    }

    private getExplanationHtml(explanation: string, code: string): string {
        return `<!DOCTYPE html>
<html>
<head>
    <style>
        body { 
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        h2 {
            color: var(--vscode-textLink-foreground);
        }
        pre {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        code {
            font-family: var(--vscode-editor-font-family);
        }
        .explanation {
            line-height: 1.6;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <h2>📖 Code Explanation</h2>
    <h3>Original Code:</h3>
    <pre><code>${this.escapeHtml(code)}</code></pre>
    <div class="explanation">
        <h3>Explanation:</h3>
        ${this.markdownToHtml(explanation)}
    </div>
</body>
</html>`;
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    private markdownToHtml(text: string): string {
        return text
            .replace(/```[\w]*\n([\s\S]*?)\n```/g, '<pre><code>$1</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    dispose() {
        this.decoration.dispose();
    }
}


