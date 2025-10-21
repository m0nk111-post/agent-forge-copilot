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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const ollamaService_1 = require("./services/ollamaService");
const fileService_1 = require("./services/fileService");
const terminalService_1 = require("./services/terminalService");
const gitService_1 = require("./services/gitService");
const agentService_1 = require("./services/agentService");
const inlineChatProvider_1 = require("./services/inlineChatProvider");
const configurationManager_1 = require("./services/configurationManager");
const completionProvider_1 = require("./services/completionProvider");
const advancedProviders_1 = require("./services/advancedProviders");
const chatViewProvider_1 = require("./views/chatViewProvider");
const mcpService_1 = require("./services/mcpService");
const inlineCompletionProvider_1 = require("./providers/inlineCompletionProvider");
const fileRelationshipTracker_1 = require("./services/fileRelationshipTracker");
function activate(context) {
    console.log('🤖 Agent Forge extension activating...');
    try {
        // Initialize configuration manager first (pass extension path)
        console.log('Initializing configuration manager...');
        const configManager = new configurationManager_1.ConfigurationManager(context.extensionPath);
        context.subscriptions.push(configManager);
        console.log('✅ Configuration manager initialized');
        // Initialize file relationship tracker (multi-file context)
        console.log('Initializing file relationship tracker...');
        const fileRelationshipTracker = new fileRelationshipTracker_1.FileRelationshipTracker();
        context.subscriptions.push(fileRelationshipTracker);
        console.log('✅ File relationship tracker initialized');
        // Start background indexing of workspace
        fileRelationshipTracker.indexWorkspace().then(() => {
            const stats = fileRelationshipTracker.getStats();
            console.log(`✅ Workspace indexed: ${stats.totalFiles} files, ${stats.totalImports} imports, ${stats.totalExports} exports`);
            vscode.window.setStatusBarMessage(`📁 Indexed ${stats.totalFiles} files for multi-file context`, 5000);
        }).catch(err => {
            console.error('Error indexing workspace:', err);
        });
        // Initialize services
        console.log('Initializing services...');
        const ollamaService = new ollamaService_1.OllamaService(context.extensionPath);
        const fileService = new fileService_1.FileService();
        const terminalService = new terminalService_1.TerminalService();
        const gitService = new gitService_1.GitService();
        const mcpService = new mcpService_1.MCPService();
        const agentService = new agentService_1.AgentService(ollamaService, fileService, terminalService, configManager);
        const inlineChatProvider = new inlineChatProvider_1.InlineChatProvider(ollamaService, configManager);
        console.log('✅ All services initialized');
        // Initialize advanced providers (pass fileRelationshipTracker to InlineCompletionProvider)
        console.log('Initializing advanced providers...');
        const completionProvider = new completionProvider_1.CompletionProvider(ollamaService, configManager);
        const inlineCompletionProvider = new inlineCompletionProvider_1.InlineCompletionProvider(ollamaService, fileRelationshipTracker); // NEW: Ghost text completions with multi-file context
        const codeActionProvider = new completionProvider_1.CodeActionProvider(ollamaService, configManager);
        const hoverProvider = new completionProvider_1.HoverProvider(ollamaService, configManager);
        const signatureHelpProvider = new completionProvider_1.SignatureHelpProvider(ollamaService, configManager);
        const commitMessageProvider = new advancedProviders_1.CommitMessageProvider(ollamaService, gitService, configManager);
        const prDescriptionProvider = new advancedProviders_1.PRDescriptionProvider(ollamaService, gitService, configManager);
        const codeReviewProvider = new advancedProviders_1.CodeReviewProvider(ollamaService, configManager);
        const formatterProvider = new advancedProviders_1.FormatterProvider(ollamaService, configManager);
        console.log('✅ All advanced providers initialized');
        // Check Ollama connection after config is loaded (delayed start)
        // Wait 2 seconds to ensure config loading is complete
        setTimeout(() => {
            ollamaService.checkConnection().then(connected => {
                if (connected) {
                    vscode.window.showInformationMessage('🤖 Agent Forge is ready!');
                    console.log('✅ Ollama connection successful');
                }
                else {
                    vscode.window.showWarningMessage('⚠️ Agent Forge loaded, but cannot connect to Ollama. Please check settings.', 'Open Settings').then(choice => {
                        if (choice === 'Open Settings') {
                            vscode.commands.executeCommand('workbench.action.openSettings', 'agent-forge.ollamaUrl');
                        }
                    });
                    console.warn('❌ Ollama connection failed');
                }
            }).catch(err => {
                console.error('Error checking Ollama connection:', err);
            });
        }, 2000);
        // Register chat view provider
        const chatProvider = new chatViewProvider_1.ChatViewProvider(context.extensionUri, ollamaService, fileService, terminalService, gitService, mcpService);
        context.subscriptions.push(vscode.window.registerWebviewViewProvider('agent-forge.chatView', chatProvider));
        // ========== REGISTER LANGUAGE PROVIDERS ==========
        console.log('Registering language providers...');
        // NEW: Ghost text inline completions (like GitHub Copilot!)
        const languageSelector = [
            { language: 'typescript', scheme: 'file' },
            { language: 'javascript', scheme: 'file' },
            { language: 'python', scheme: 'file' },
            { language: 'java', scheme: 'file' },
            { language: 'csharp', scheme: 'file' },
            { language: 'cpp', scheme: 'file' },
            { language: 'c', scheme: 'file' },
            { language: 'go', scheme: 'file' },
            { language: 'rust', scheme: 'file' },
            { language: 'php', scheme: 'file' },
            { language: 'ruby', scheme: 'file' },
            { language: 'swift', scheme: 'file' },
            { language: 'kotlin', scheme: 'file' },
            { language: 'scala', scheme: 'file' },
            { language: 'dart', scheme: 'file' },
            { language: 'html', scheme: 'file' },
            { language: 'css', scheme: 'file' },
            { language: 'json', scheme: 'file' },
            { language: 'yaml', scheme: 'file' },
            { language: 'markdown', scheme: 'file' },
            { language: 'plaintext', scheme: 'file' }
        ];
        context.subscriptions.push(vscode.languages.registerInlineCompletionItemProvider(languageSelector, inlineCompletionProvider));
        console.log('✅ Inline completion provider registered for multiple languages');
        // Code actions (lightbulb suggestions)
        context.subscriptions.push(vscode.languages.registerCodeActionsProvider({ pattern: '**' }, codeActionProvider, {
            providedCodeActionKinds: [
                vscode.CodeActionKind.QuickFix,
                vscode.CodeActionKind.Refactor
            ]
        }));
        // Hover provider (tooltips)
        context.subscriptions.push(vscode.languages.registerHoverProvider({ pattern: '**' }, hoverProvider));
        // Signature help (function parameter hints)
        context.subscriptions.push(vscode.languages.registerSignatureHelpProvider({ pattern: '**' }, signatureHelpProvider, '(', ','));
        // Document formatter
        context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider({ pattern: '**' }, formatterProvider));
        console.log('✅ All language providers registered');
        // Register commands
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.openChat', () => {
            vscode.commands.executeCommand('agent-forge.chatView.focus');
        }));
        // Track inline completion acceptance (for analytics/telemetry)
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.inlineCompletionAccepted', () => {
            console.log('✅ Inline completion accepted');
            // Could track metrics here
        }));
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.explainCode', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor)
                return;
            const selection = editor.document.getText(editor.selection);
            if (!selection) {
                vscode.window.showInformationMessage('Please select some code first');
                return;
            }
            const explanation = await ollamaService.chat(`Explain this code in detail:\n\n\`\`\`${editor.document.languageId}\n${selection}\n\`\`\``);
            // Show in output channel
            const channel = vscode.window.createOutputChannel('Agent Forge');
            channel.clear();
            channel.appendLine('=== Code Explanation ===\n');
            channel.appendLine(explanation);
            channel.show();
        }));
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.refactorCode', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor)
                return;
            const selection = editor.document.getText(editor.selection);
            if (!selection) {
                vscode.window.showInformationMessage('Please select some code first');
                return;
            }
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Refactoring code...",
                cancellable: false
            }, async () => {
                const refactored = await ollamaService.chat(`Refactor this code for better readability, performance, and maintainability. Return ONLY the refactored code without explanations:\n\n\`\`\`${editor.document.languageId}\n${selection}\n\`\`\``);
                // Extract code from markdown if present
                const codeMatch = refactored.match(/```[\w]*\n([\s\S]*?)\n```/);
                const code = codeMatch ? codeMatch[1] : refactored;
                // Replace selection
                await editor.edit(editBuilder => {
                    editBuilder.replace(editor.selection, code.trim());
                });
                vscode.window.showInformationMessage('✅ Code refactored!');
            });
        }));
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.generateTests', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor)
                return;
            const selection = editor.document.getText(editor.selection);
            if (!selection) {
                vscode.window.showInformationMessage('Please select some code first');
                return;
            }
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Generating tests...",
                cancellable: false
            }, async () => {
                const tests = await ollamaService.chat(`Generate comprehensive unit tests for this code. Use the appropriate testing framework for ${editor.document.languageId}. Include edge cases:\n\n\`\`\`${editor.document.languageId}\n${selection}\n\`\`\``);
                // Create new test file
                const testFileName = editor.document.fileName.replace(/(\.\w+)$/, '.test$1');
                const testUri = vscode.Uri.file(testFileName);
                await fileService.writeFile(testUri.fsPath, tests);
                const doc = await vscode.workspace.openTextDocument(testUri);
                await vscode.window.showTextDocument(doc);
                vscode.window.showInformationMessage('✅ Tests generated!');
            });
        }));
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.fixBug', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor)
                return;
            const selection = editor.document.getText(editor.selection);
            if (!selection) {
                vscode.window.showInformationMessage('Please select some code first');
                return;
            }
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Analyzing and fixing bug...",
                cancellable: false
            }, async () => {
                const fixed = await ollamaService.chat(`Analyze this code for bugs and fix them. Explain what was wrong and how you fixed it. Then provide the fixed code:\n\n\`\`\`${editor.document.languageId}\n${selection}\n\`\`\``);
                // Show in output channel
                const channel = vscode.window.createOutputChannel('Agent Forge - Bug Fix');
                channel.clear();
                channel.appendLine('=== Bug Analysis & Fix ===\n');
                channel.appendLine(fixed);
                channel.show();
            });
        }));
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.selectModel', async () => {
            await configManager.selectModel();
        }));
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.showConfig', async () => {
            await configManager.showConfigurationUI();
        }));
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.reloadConfig', async () => {
            await configManager.reload();
        }));
        // Show model info command (used by inline completions)
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.showModelInfo', () => {
            const config = vscode.workspace.getConfiguration('agent-forge');
            const modelName = config.get('model', 'No model selected');
            const ollamaUrl = config.get('ollamaUrl', 'http://localhost:11434');
            vscode.window.showInformationMessage(`🤖 Agent Forge\n\nActive Model: ${modelName}\nOllama Server: ${ollamaUrl}`, 'Change Model', 'Open Settings').then(choice => {
                if (choice === 'Change Model') {
                    vscode.commands.executeCommand('agent-forge.showConfig');
                }
                else if (choice === 'Open Settings') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'agent-forge');
                }
            });
        }));
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.runTerminalCommand', async () => {
            const command = await vscode.window.showInputBox({
                prompt: 'Enter command to execute',
                placeHolder: 'e.g., npm install, pytest, git status'
            });
            if (command) {
                await terminalService.runCommand(command);
            }
        }));
        // ========== AGENT MODE COMMANDS ==========
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.agentMode', async () => {
            const task = await vscode.window.showInputBox({
                prompt: 'What would you like the agent to do?',
                placeHolder: 'e.g., Create a REST API in Express, Add unit tests for all functions'
            });
            if (!task)
                return;
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Agent working...",
                cancellable: false
            }, async (progress) => {
                try {
                    agentService.showLog(); // Show log panel
                    const summary = await agentService.executeTask(task, (msg) => {
                        progress.report({ message: msg });
                    });
                    vscode.window.showInformationMessage(`✅ Agent completed: ${summary}`);
                }
                catch (error) {
                    vscode.window.showErrorMessage(`Agent error: ${error.message}`);
                }
            });
        }));
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.configureAgent', async () => {
            const config = agentService.getConfig();
            const options = [
                `Auto-approve: ${config.autoApprove ? 'ON' : 'OFF'}`,
                `Max iterations: ${config.maxIterations}`,
                `Temperature: ${config.temperature}`,
                'View Agent Log'
            ];
            const choice = await vscode.window.showQuickPick(options, {
                placeHolder: 'Agent Configuration'
            });
            if (!choice)
                return;
            if (choice.startsWith('Auto-approve')) {
                const newValue = !config.autoApprove;
                agentService.setConfig({ autoApprove: newValue });
                vscode.window.showInformationMessage(`Agent auto-approve ${newValue ? 'ENABLED' : 'DISABLED'}`);
            }
            else if (choice.startsWith('Max iterations')) {
                const input = await vscode.window.showInputBox({
                    prompt: 'Enter max iterations (5-50)',
                    value: config.maxIterations.toString()
                });
                if (input) {
                    const value = parseInt(input);
                    if (value >= 5 && value <= 50) {
                        agentService.setConfig({ maxIterations: value });
                        vscode.window.showInformationMessage(`Max iterations set to ${value}`);
                    }
                }
            }
            else if (choice.startsWith('Temperature')) {
                const input = await vscode.window.showInputBox({
                    prompt: 'Enter temperature (0.0-1.0)',
                    value: config.temperature.toString()
                });
                if (input) {
                    const value = parseFloat(input);
                    if (value >= 0 && value <= 1) {
                        agentService.setConfig({ temperature: value });
                        vscode.window.showInformationMessage(`Temperature set to ${value}`);
                    }
                }
            }
            else if (choice === 'View Agent Log') {
                agentService.showLog();
            }
        }));
        // Cleanup
        context.subscriptions.push(agentService);
        // ========== INLINE CHAT & QUICK ACTIONS ==========
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.inlineChat', async () => {
            await inlineChatProvider.showInlineChat();
        }));
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.quickFix', async () => {
            await inlineChatProvider.quickFix();
        }));
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.quickExplain', async () => {
            await inlineChatProvider.quickExplain();
        }));
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.quickOptimize', async () => {
            await inlineChatProvider.quickOptimize();
        }));
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.quickDocument', async () => {
            await inlineChatProvider.quickDocument();
        }));
        context.subscriptions.push(inlineChatProvider);
        // ========== ADVANCED FEATURES ==========
        // Generate commit message
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.generateCommit', async () => {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Generating commit message...",
                cancellable: false
            }, async () => {
                try {
                    const message = await commitMessageProvider.generateCommitMessage();
                    // Show message and ask to commit
                    const choice = await vscode.window.showInformationMessage('Commit Message Generated', { modal: true, detail: message }, 'Copy', 'Commit');
                    if (choice === 'Copy') {
                        await vscode.env.clipboard.writeText(message);
                        vscode.window.showInformationMessage('Commit message copied!');
                    }
                    else if (choice === 'Commit') {
                        await gitService.commit(message);
                        vscode.window.showInformationMessage('Changes committed!');
                    }
                }
                catch (error) {
                    vscode.window.showErrorMessage(`Failed to generate commit: ${error.message}`);
                }
            });
        }));
        // Generate PR description
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.generatePR', async () => {
            const baseBranch = await vscode.window.showInputBox({
                prompt: 'Enter base branch name',
                value: 'main',
                placeHolder: 'main'
            });
            if (!baseBranch)
                return;
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Generating PR description...",
                cancellable: false
            }, async () => {
                try {
                    const description = await prDescriptionProvider.generatePRDescription(baseBranch);
                    // Show description
                    const choice = await vscode.window.showInformationMessage('PR Description Generated', { modal: true, detail: description }, 'Copy', 'Save to File');
                    if (choice === 'Copy') {
                        await vscode.env.clipboard.writeText(description);
                        vscode.window.showInformationMessage('PR description copied!');
                    }
                    else if (choice === 'Save to File') {
                        const doc = await vscode.workspace.openTextDocument({
                            content: description,
                            language: 'markdown'
                        });
                        await vscode.window.showTextDocument(doc);
                    }
                }
                catch (error) {
                    vscode.window.showErrorMessage(`Failed to generate PR: ${error.message}`);
                }
            });
        }));
        // Review code
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.reviewCode', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor');
                return;
            }
            const selection = editor.selection;
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Reviewing code...",
                cancellable: false
            }, async () => {
                try {
                    const review = await codeReviewProvider.reviewCode(editor.document, !selection.isEmpty ? selection : undefined);
                    // Show review in webview or output
                    const channel = vscode.window.createOutputChannel('Code Review');
                    channel.clear();
                    channel.appendLine('=== CODE REVIEW ===\n');
                    channel.appendLine(`Quality Score: ${review.score}/100\n`);
                    channel.appendLine('Issues Found:');
                    review.issues.forEach(issue => {
                        const emoji = issue.severity === 'error' ? '❌' :
                            issue.severity === 'warning' ? '⚠️' : 'ℹ️';
                        channel.appendLine(`${emoji} ${issue.message}`);
                    });
                    channel.appendLine('\nSuggestions:');
                    review.suggestions.forEach(s => {
                        channel.appendLine(`• ${s}`);
                    });
                    channel.appendLine('\nFull Review:');
                    channel.appendLine(review.summary);
                    channel.show();
                }
                catch (error) {
                    vscode.window.showErrorMessage(`Failed to review code: ${error.message}`);
                }
            });
        }));
        // Review workspace
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.reviewWorkspace', async () => {
            const choice = await vscode.window.showWarningMessage('This will review multiple files in your workspace. Continue?', 'Yes', 'No');
            if (choice !== 'Yes')
                return;
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Reviewing workspace...",
                cancellable: false
            }, async () => {
                try {
                    const results = await codeReviewProvider.reviewWorkspace();
                    // Show summary
                    const channel = vscode.window.createOutputChannel('Workspace Review');
                    channel.clear();
                    channel.appendLine('=== WORKSPACE REVIEW ===\n');
                    channel.appendLine(`Files Reviewed: ${results.totalFiles}`);
                    channel.appendLine(`Total Issues: ${results.totalIssues}\n`);
                    for (const [file, review] of Object.entries(results.files)) {
                        channel.appendLine(`\n📄 ${file}`);
                        channel.appendLine(`   Score: ${review.score}/100`);
                        channel.appendLine(`   Issues: ${review.issues.length}`);
                        if (review.issues.length > 0) {
                            review.issues.slice(0, 3).forEach(issue => {
                                const emoji = issue.severity === 'error' ? '❌' :
                                    issue.severity === 'warning' ? '⚠️' : 'ℹ️';
                                channel.appendLine(`   ${emoji} ${issue.message}`);
                            });
                        }
                    }
                    channel.show();
                    vscode.window.showInformationMessage(`Workspace review complete: ${results.totalFiles} files, ${results.totalIssues} issues`);
                }
                catch (error) {
                    vscode.window.showErrorMessage(`Failed to review workspace: ${error.message}`);
                }
            });
        }));
        // Format with AI
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.formatDocument', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor');
                return;
            }
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Formatting document...",
                cancellable: false
            }, async () => {
                try {
                    await vscode.commands.executeCommand('editor.action.formatDocument');
                    vscode.window.showInformationMessage('Document formatted!');
                }
                catch (error) {
                    vscode.window.showErrorMessage(`Failed to format: ${error.message}`);
                }
            });
        }));
        // Fix diagnostic (from code action) - ENHANCED v1.8.0
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.fixDiagnostic', async (document, diagnostic) => {
            const editor = await vscode.window.showTextDocument(document);
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "🔧 AI is fixing the issue...",
                cancellable: false
            }, async () => {
                try {
                    const range = diagnostic.range;
                    const problemCode = document.getText(range);
                    // Get more context (surrounding lines)
                    const contextStart = Math.max(0, range.start.line - 5);
                    const contextEnd = Math.min(document.lineCount - 1, range.end.line + 5);
                    const contextRange = new vscode.Range(contextStart, 0, contextEnd, 999);
                    const fullContext = document.getText(contextRange);
                    // Build smart prompt
                    const prompt = `You are an expert ${document.languageId} developer. Fix this code issue.

ERROR: ${diagnostic.message}
SEVERITY: ${diagnostic.severity === vscode.DiagnosticSeverity.Error ? 'Error' : 'Warning'}
SOURCE: ${diagnostic.source || 'Linter'}

PROBLEMATIC CODE (lines ${range.start.line + 1}-${range.end.line + 1}):
\`\`\`${document.languageId}
${problemCode}
\`\`\`

SURROUNDING CONTEXT:
\`\`\`${document.languageId}
${fullContext}
\`\`\`

Provide ONLY the fixed code for lines ${range.start.line + 1}-${range.end.line + 1}. No explanations, no markdown, just the corrected code.`;
                    const fixed = await ollamaService.chat(prompt);
                    // Clean response aggressively
                    let cleanFixed = fixed.trim();
                    cleanFixed = cleanFixed.replace(/^```[\w]*\n?/gm, '');
                    cleanFixed = cleanFixed.replace(/\n?```$/gm, '');
                    cleanFixed = cleanFixed.replace(/^Here.*?:\s*/i, '');
                    cleanFixed = cleanFixed.replace(/^Fixed.*?:\s*/i, '');
                    cleanFixed = cleanFixed.trim();
                    // Apply fix with undo support
                    const success = await editor.edit(editBuilder => {
                        editBuilder.replace(range, cleanFixed);
                    });
                    if (success) {
                        vscode.window.showInformationMessage('✅ Issue fixed! Press Ctrl+Z to undo.');
                    }
                    else {
                        vscode.window.showErrorMessage('Failed to apply fix.');
                    }
                }
                catch (error) {
                    vscode.window.showErrorMessage(`❌ Failed to fix: ${error.message}`);
                }
            });
        }));
        // Explain diagnostic - ENHANCED v1.8.0
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.explainDiagnostic', async (document, diagnostic) => {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "💡 AI is explaining the issue...",
                cancellable: false
            }, async () => {
                try {
                    const range = diagnostic.range;
                    const problemCode = document.getText(range);
                    // Get context
                    const contextStart = Math.max(0, range.start.line - 3);
                    const contextEnd = Math.min(document.lineCount - 1, range.end.line + 3);
                    const contextRange = new vscode.Range(contextStart, 0, contextEnd, 999);
                    const context = document.getText(contextRange);
                    const prompt = `You are an expert ${document.languageId} developer and teacher. Explain this code issue in a clear, educational way.

ERROR: ${diagnostic.message}
SEVERITY: ${diagnostic.severity === vscode.DiagnosticSeverity.Error ? 'Error' : 'Warning'}
SOURCE: ${diagnostic.source || 'Linter'}

PROBLEMATIC CODE:
\`\`\`${document.languageId}
${problemCode}
\`\`\`

CONTEXT:
\`\`\`${document.languageId}
${context}
\`\`\`

Provide:
1. **What's wrong**: Clear explanation of the error
2. **Why it's wrong**: Technical reason
3. **How to fix**: Specific solution
4. **Best practice**: General advice to avoid this in future

Keep it concise (3-5 sentences).`;
                    const explanation = await ollamaService.chat(prompt);
                    // Show in webview panel for better formatting
                    const panel = vscode.window.createWebviewPanel('diagnosticExplanation', `💡 ${diagnostic.message.substring(0, 50)}...`, vscode.ViewColumn.Beside, { enableScripts: false });
                    panel.webview.html = `<!DOCTYPE html>
<html>
<head>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            line-height: 1.6;
            color: var(--vscode-editor-foreground);
            background: var(--vscode-editor-background);
        }
        h2 { 
            color: var(--vscode-textLink-foreground);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 10px;
        }
        code {
            background: var(--vscode-textCodeBlock-background);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        .error-msg {
            background: var(--vscode-inputValidation-errorBackground);
            border-left: 3px solid var(--vscode-inputValidation-errorBorder);
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
        }
        .explanation {
            white-space: pre-wrap;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <h2>🔍 Code Issue Explanation</h2>
    <div class="error-msg">
        <strong>Error:</strong> ${diagnostic.message}<br>
        <strong>Severity:</strong> ${diagnostic.severity === vscode.DiagnosticSeverity.Error ? '🔴 Error' : '🟡 Warning'}<br>
        <strong>Line:</strong> ${range.start.line + 1}
    </div>
    <div class="explanation">${explanation.replace(/\n/g, '<br>')}</div>
</body>
</html>`;
                }
                catch (error) {
                    vscode.window.showErrorMessage(`❌ Failed to explain: ${error.message}`);
                }
            });
        }));
        // NEW v1.8.0: Extract Function
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.extractFunction', async (document, range) => {
            const editor = await vscode.window.showTextDocument(document);
            const selectedCode = document.getText(range);
            // Ask for function name
            const functionName = await vscode.window.showInputBox({
                prompt: 'Enter function name',
                placeHolder: 'myFunction',
                value: 'extractedFunction'
            });
            if (!functionName)
                return;
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "📦 Extracting to function...",
                cancellable: false
            }, async () => {
                const prompt = `Extract this ${document.languageId} code into a function named "${functionName}".

CODE TO EXTRACT:
\`\`\`${document.languageId}
${selectedCode}
\`\`\`

Provide:
1. The new function definition
2. The function call that replaces the original code

Return ONLY the function definition and the call, separated by a blank line. No explanations.`;
                const result = await ollamaService.chat(prompt);
                // Parse response (function definition + call)
                let clean = result.trim();
                clean = clean.replace(/^```[\w]*\n?/gm, '');
                clean = clean.replace(/\n?```$/gm, '');
                // Show extracted function for user to place
                vscode.window.showInformationMessage('Function extracted! Check output channel.', 'Show').then(choice => {
                    if (choice === 'Show') {
                        const channel = vscode.window.createOutputChannel('Agent Forge - Extracted Function');
                        channel.clear();
                        channel.appendLine('=== Extracted Function ===\n');
                        channel.appendLine(clean);
                        channel.appendLine('\n=== Place the function definition above, and replace selected code with the call ===');
                        channel.show();
                    }
                });
            });
        }));
        // NEW v1.8.0: Add Documentation
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.addDocumentation', async (document, range) => {
            const editor = await vscode.window.showTextDocument(document);
            const code = document.getText(range);
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "📝 Adding documentation...",
                cancellable: false
            }, async () => {
                const prompt = `Add ${document.languageId} documentation comments to this code. Use the standard doc format for ${document.languageId} (JSDoc for JS/TS, docstrings for Python, etc.).

CODE:
\`\`\`${document.languageId}
${code}
\`\`\`

Return the code WITH documentation comments added. Keep the code exactly the same, only add comments.`;
                const documented = await ollamaService.chat(prompt);
                let clean = documented.trim();
                clean = clean.replace(/^```[\w]*\n?/gm, '');
                clean = clean.replace(/\n?```$/gm, '');
                await editor.edit(editBuilder => {
                    editBuilder.replace(range, clean);
                });
                vscode.window.showInformationMessage('✅ Documentation added!');
            });
        }));
        // NEW v1.8.0: Optimize Code
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.optimizeCode', async (document, range) => {
            const editor = await vscode.window.showTextDocument(document);
            const code = document.getText(range);
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "⚡ Optimizing performance...",
                cancellable: false
            }, async () => {
                const prompt = `Optimize this ${document.languageId} code for better performance. Focus on:
- Time complexity
- Space complexity
- Algorithmic improvements
- Idiomatic patterns

CODE:
\`\`\`${document.languageId}
${code}
\`\`\`

Return ONLY the optimized code. No explanations.`;
                const optimized = await ollamaService.chat(prompt);
                let clean = optimized.trim();
                clean = clean.replace(/^```[\w]*\n?/gm, '');
                clean = clean.replace(/\n?```$/gm, '');
                await editor.edit(editBuilder => {
                    editBuilder.replace(range, clean);
                });
                vscode.window.showInformationMessage('✅ Code optimized! Review changes carefully.');
            });
        }));
        // Toggle inline completions
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.toggleCompletions', async () => {
            const config = vscode.workspace.getConfiguration('agent-forge');
            const current = config.get('enableInlineCompletions', true);
            await config.update('enableInlineCompletions', !current, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(`Inline completions ${!current ? 'enabled' : 'disabled'}`);
        }));
        // Clear completion cache
        context.subscriptions.push(vscode.commands.registerCommand('agent-forge.clearCache', () => {
            completionProvider.clearCache();
            hoverProvider.clearCache();
            vscode.window.showInformationMessage('Cache cleared!');
        }));
        // Status bar item
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        statusBarItem.text = "$(robot) Agent Forge";
        statusBarItem.command = 'agent-forge.openChat';
        statusBarItem.tooltip = 'Click to open Agent Forge chat';
        statusBarItem.show();
        context.subscriptions.push(statusBarItem);
        console.log('✅ Status bar item created');
        console.log('✅ Extension activation complete!');
    }
    catch (error) {
        console.error('❌ Extension activation failed:', error);
        const message = `Agent Forge failed to activate: ${error.message}`;
        vscode.window.showErrorMessage(message, 'Show Details').then(choice => {
            if (choice === 'Show Details') {
                const channel = vscode.window.createOutputChannel('Agent Forge Error');
                channel.clear();
                channel.appendLine('=== Extension Activation Error ===\n');
                channel.appendLine(error.stack || error.toString());
                channel.show();
            }
        });
        throw error;
    }
}
function deactivate() {
    console.log('Agent Forge extension deactivated');
}
//# sourceMappingURL=extension.js.map