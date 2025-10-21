import * as vscode from 'vscode';
import { OllamaService } from './ollamaService';
import { GitService } from './gitService';
import { ConfigurationManager } from './configurationManager';

/**
 * Git Commit Message Generator
 */
export class CommitMessageProvider {
    private ollamaService: OllamaService;
    private gitService: GitService;
    private configManager: ConfigurationManager;

    constructor(
        ollamaService: OllamaService,
        gitService: GitService,
        configManager: ConfigurationManager
    ) {
        this.ollamaService = ollamaService;
        this.gitService = gitService;
        this.configManager = configManager;
    }

    async generateCommitMessage(): Promise<string> {
        try {
            // Get staged changes
            const diff = await this.gitService.getDiff(true);
            
            if (!diff) {
                throw new Error('No staged changes found');
            }

            // Build prompt
            const guidelines = this.configManager.getGuidelines();
            let prompt = 'Generate a concise git commit message for these changes. ';
            prompt += 'Follow conventional commits format (feat/fix/docs/style/refactor/test/chore). ';
            prompt += 'First line: type(scope): brief description (max 72 chars). ';
            prompt += 'Then blank line, then bullet points with details.\n\n';
            
            if (guidelines) {
                prompt += `Guidelines:\n${guidelines}\n\n`;
            }

            prompt += `Changes:\n${diff}\n\nCommit message:`;

            // Get AI suggestion
            const message = await this.ollamaService.chat(prompt);

            return this.cleanCommitMessage(message);

        } catch (error: any) {
            throw new Error(`Failed to generate commit message: ${error.message}`);
        }
    }

    private cleanCommitMessage(message: string): string {
        // Remove markdown code blocks
        message = message.replace(/```[\w]*\n?/g, '');
        message = message.replace(/\n?```$/g, '');
        
        // Trim whitespace
        message = message.trim();
        
        return message;
    }
}

/**
 * Pull Request Description Generator
 */
export class PRDescriptionProvider {
    private ollamaService: OllamaService;
    private gitService: GitService;
    private configManager: ConfigurationManager;

    constructor(
        ollamaService: OllamaService,
        gitService: GitService,
        configManager: ConfigurationManager
    ) {
        this.ollamaService = ollamaService;
        this.gitService = gitService;
        this.configManager = configManager;
    }

    async generatePRDescription(baseBranch: string = 'main'): Promise<string> {
        try {
            // Get diff between current branch and base
            const currentBranch = await this.gitService.getCurrentBranch();
            const diff = await this.gitService.getDiffBetweenBranches(baseBranch, currentBranch);
            
            if (!diff) {
                throw new Error(`No differences found between ${baseBranch} and ${currentBranch}`);
            }

            // Get commit messages
            const commits = await this.gitService.getCommitsSince(baseBranch);

            // Build prompt
            const guidelines = this.configManager.getGuidelines();
            let prompt = 'Generate a comprehensive pull request description for these changes.\n\n';
            prompt += 'Format:\n';
            prompt += '## Summary\n[Brief overview]\n\n';
            prompt += '## Changes\n- [List of changes]\n\n';
            prompt += '## Testing\n[How to test]\n\n';
            prompt += '## Additional Notes\n[Any other info]\n\n';
            
            if (guidelines) {
                prompt += `Project Guidelines:\n${guidelines}\n\n`;
            }

            prompt += `Recent Commits:\n${commits.join('\n')}\n\n`;
            prompt += `Changes:\n${diff}\n\nPull Request Description:`;

            // Get AI suggestion
            const description = await this.ollamaService.chat(prompt);

            return this.cleanPRDescription(description);

        } catch (error: any) {
            throw new Error(`Failed to generate PR description: ${error.message}`);
        }
    }

    private cleanPRDescription(description: string): string {
        // Remove markdown code blocks
        description = description.replace(/```markdown\n?/g, '');
        description = description.replace(/\n?```$/g, '');
        
        // Trim whitespace
        description = description.trim();
        
        return description;
    }
}

/**
 * Code Review Provider
 */
export class CodeReviewProvider {
    private ollamaService: OllamaService;
    private configManager: ConfigurationManager;

    constructor(ollamaService: OllamaService, configManager: ConfigurationManager) {
        this.ollamaService = ollamaService;
        this.configManager = configManager;
    }

    async reviewCode(document: vscode.TextDocument, selection?: vscode.Selection): Promise<ReviewResult> {
        try {
            const code = selection 
                ? document.getText(selection)
                : document.getText();

            const languageId = document.languageId;

            // Build prompt
            const guidelines = this.configManager.getGuidelines();
            let prompt = `Review this ${languageId} code and provide feedback.\n\n`;
            prompt += 'Focus on:\n';
            prompt += '1. Bugs and potential issues\n';
            prompt += '2. Code quality and best practices\n';
            prompt += '3. Performance improvements\n';
            prompt += '4. Security concerns\n';
            prompt += '5. Readability and maintainability\n\n';
            
            if (guidelines) {
                prompt += `Project Guidelines:\n${guidelines}\n\n`;
            }

            prompt += `Code:\n\`\`\`${languageId}\n${code}\n\`\`\`\n\nReview:`;

            // Get AI review
            const review = await this.ollamaService.chat(prompt);

            return this.parseReview(review);

        } catch (error: any) {
            throw new Error(`Failed to review code: ${error.message}`);
        }
    }

    async reviewFile(document: vscode.TextDocument): Promise<ReviewResult> {
        return this.reviewCode(document);
    }

    async reviewWorkspace(): Promise<WorkspaceReviewResult> {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('No workspace folder open');
            }

            // Find all source files
            const files = await vscode.workspace.findFiles(
                '**/*.{ts,js,py,java,go,rs}',
                '**/node_modules/**'
            );

            const results: { [file: string]: ReviewResult } = {};
            let totalIssues = 0;

            // Review each file (limit to prevent overwhelming)
            const filesToReview = files.slice(0, 10);

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Reviewing workspace...",
                cancellable: false
            }, async (progress) => {
                for (let i = 0; i < filesToReview.length; i++) {
                    const file = filesToReview[i];
                    progress.report({
                        message: `${i + 1}/${filesToReview.length}: ${vscode.workspace.asRelativePath(file)}`,
                        increment: (100 / filesToReview.length)
                    });

                    const document = await vscode.workspace.openTextDocument(file);
                    const review = await this.reviewFile(document);
                    
                    results[vscode.workspace.asRelativePath(file)] = review;
                    totalIssues += review.issues.length;
                }
            });

            return {
                files: results,
                totalFiles: filesToReview.length,
                totalIssues: totalIssues
            };

        } catch (error: any) {
            throw new Error(`Failed to review workspace: ${error.message}`);
        }
    }

    private parseReview(review: string): ReviewResult {
        const issues: ReviewIssue[] = [];
        const suggestions: string[] = [];

        // Parse review text for issues and suggestions
        const lines = review.split('\n');
        let currentSection = '';

        for (const line of lines) {
            const trimmed = line.trim();
            
            if (trimmed.toLowerCase().includes('bug') || 
                trimmed.toLowerCase().includes('issue') ||
                trimmed.toLowerCase().includes('problem')) {
                
                issues.push({
                    severity: this.detectSeverity(trimmed),
                    message: trimmed,
                    line: null
                });
            }

            if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
                suggestions.push(trimmed.substring(1).trim());
            }
        }

        return {
            summary: review,
            issues: issues,
            suggestions: suggestions,
            score: this.calculateScore(issues)
        };
    }

    private detectSeverity(text: string): 'error' | 'warning' | 'info' {
        const lower = text.toLowerCase();
        
        if (lower.includes('critical') || lower.includes('security') || lower.includes('bug')) {
            return 'error';
        }
        
        if (lower.includes('warning') || lower.includes('concern') || lower.includes('issue')) {
            return 'warning';
        }
        
        return 'info';
    }

    private calculateScore(issues: ReviewIssue[]): number {
        // Calculate code quality score (0-100)
        const errorCount = issues.filter(i => i.severity === 'error').length;
        const warningCount = issues.filter(i => i.severity === 'warning').length;
        
        let score = 100;
        score -= errorCount * 15;
        score -= warningCount * 5;
        
        return Math.max(0, Math.min(100, score));
    }
}

/**
 * Format Document Provider
 */
export class FormatterProvider implements vscode.DocumentFormattingEditProvider {
    private ollamaService: OllamaService;
    private configManager: ConfigurationManager;

    constructor(ollamaService: OllamaService, configManager: ConfigurationManager) {
        this.ollamaService = ollamaService;
        this.configManager = configManager;
    }

    async provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        options: vscode.FormattingOptions,
        token: vscode.CancellationToken
    ): Promise<vscode.TextEdit[]> {
        
        try {
            const code = document.getText();
            const languageId = document.languageId;

            // Build prompt
            const guidelines = this.configManager.getGuidelines();
            let prompt = `Format this ${languageId} code according to best practices.\n\n`;
            prompt += `Indentation: ${options.insertSpaces ? options.tabSize + ' spaces' : 'tabs'}\n\n`;
            
            if (guidelines) {
                prompt += `Guidelines:\n${guidelines}\n\n`;
            }

            prompt += `Code:\n\`\`\`${languageId}\n${code}\n\`\`\`\n\nFormatted code (return ONLY the code):`;

            // Get formatted code
            const formatted = await this.ollamaService.chat(prompt);

            // Clean up response
            let cleanedCode = formatted.replace(/```[\w]*\n?/g, '');
            cleanedCode = cleanedCode.replace(/\n?```$/g, '');
            cleanedCode = cleanedCode.trim();

            // Create edit that replaces entire document
            const range = new vscode.Range(
                0,
                0,
                document.lineCount - 1,
                document.lineAt(document.lineCount - 1).text.length
            );

            return [vscode.TextEdit.replace(range, cleanedCode)];

        } catch (error) {
            console.error('Formatter error:', error);
            return [];
        }
    }
}

// Type definitions
export interface ReviewIssue {
    severity: 'error' | 'warning' | 'info';
    message: string;
    line: number | null;
}

export interface ReviewResult {
    summary: string;
    issues: ReviewIssue[];
    suggestions: string[];
    score: number;
}

export interface WorkspaceReviewResult {
    files: { [file: string]: ReviewResult };
    totalFiles: number;
    totalIssues: number;
}


