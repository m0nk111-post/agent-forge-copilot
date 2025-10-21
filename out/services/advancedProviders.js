"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormatterProvider = exports.CodeReviewProvider = exports.PRDescriptionProvider = exports.CommitMessageProvider = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Git Commit Message Generator
 */
class CommitMessageProvider {
    constructor(ollamaService, gitService, configManager) {
        this.ollamaService = ollamaService;
        this.gitService = gitService;
        this.configManager = configManager;
    }
    async generateCommitMessage() {
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
        }
        catch (error) {
            throw new Error(`Failed to generate commit message: ${error.message}`);
        }
    }
    cleanCommitMessage(message) {
        // Remove markdown code blocks
        message = message.replace(/```[\w]*\n?/g, '');
        message = message.replace(/\n?```$/g, '');
        // Trim whitespace
        message = message.trim();
        return message;
    }
}
exports.CommitMessageProvider = CommitMessageProvider;
/**
 * Pull Request Description Generator
 */
class PRDescriptionProvider {
    constructor(ollamaService, gitService, configManager) {
        this.ollamaService = ollamaService;
        this.gitService = gitService;
        this.configManager = configManager;
    }
    async generatePRDescription(baseBranch = 'main') {
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
        }
        catch (error) {
            throw new Error(`Failed to generate PR description: ${error.message}`);
        }
    }
    cleanPRDescription(description) {
        // Remove markdown code blocks
        description = description.replace(/```markdown\n?/g, '');
        description = description.replace(/\n?```$/g, '');
        // Trim whitespace
        description = description.trim();
        return description;
    }
}
exports.PRDescriptionProvider = PRDescriptionProvider;
/**
 * Code Review Provider
 */
class CodeReviewProvider {
    constructor(ollamaService, configManager) {
        this.ollamaService = ollamaService;
        this.configManager = configManager;
    }
    async reviewCode(document, selection) {
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
        }
        catch (error) {
            throw new Error(`Failed to review code: ${error.message}`);
        }
    }
    async reviewFile(document) {
        return this.reviewCode(document);
    }
    async reviewWorkspace() {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('No workspace folder open');
            }
            // Find all source files
            const files = await vscode.workspace.findFiles('**/*.{ts,js,py,java,go,rs}', '**/node_modules/**');
            const results = {};
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
        }
        catch (error) {
            throw new Error(`Failed to review workspace: ${error.message}`);
        }
    }
    parseReview(review) {
        const issues = [];
        const suggestions = [];
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
    detectSeverity(text) {
        const lower = text.toLowerCase();
        if (lower.includes('critical') || lower.includes('security') || lower.includes('bug')) {
            return 'error';
        }
        if (lower.includes('warning') || lower.includes('concern') || lower.includes('issue')) {
            return 'warning';
        }
        return 'info';
    }
    calculateScore(issues) {
        // Calculate code quality score (0-100)
        const errorCount = issues.filter(i => i.severity === 'error').length;
        const warningCount = issues.filter(i => i.severity === 'warning').length;
        let score = 100;
        score -= errorCount * 15;
        score -= warningCount * 5;
        return Math.max(0, Math.min(100, score));
    }
}
exports.CodeReviewProvider = CodeReviewProvider;
/**
 * Format Document Provider
 */
class FormatterProvider {
    constructor(ollamaService, configManager) {
        this.ollamaService = ollamaService;
        this.configManager = configManager;
    }
    async provideDocumentFormattingEdits(document, options, token) {
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
            const range = new vscode.Range(0, 0, document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
            return [vscode.TextEdit.replace(range, cleanedCode)];
        }
        catch (error) {
            console.error('Formatter error:', error);
            return [];
        }
    }
}
exports.FormatterProvider = FormatterProvider;
//# sourceMappingURL=advancedProviders.js.map