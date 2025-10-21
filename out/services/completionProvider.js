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
exports.SignatureHelpProvider = exports.HoverProvider = exports.CodeActionProvider = exports.CompletionProvider = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Inline Completion Provider - GitHub Copilot-style autocompletion
 * Provides suggestions as you type
 */
class CompletionProvider {
    constructor(ollamaService, configManager) {
        this.lastRequestTime = 0;
        this.debounceDelay = 300; // ms
        this.cache = new Map();
        this.ollamaService = ollamaService;
        this.configManager = configManager;
    }
    async provideInlineCompletionItems(document, position, context, token) {
        // Debounce: avoid too many requests
        const now = Date.now();
        if (now - this.lastRequestTime < this.debounceDelay) {
            return null;
        }
        this.lastRequestTime = now;
        // Check if enabled
        const config = vscode.workspace.getConfiguration('agent-forge');
        if (!config.get('enableInlineCompletions', true)) {
            return null;
        }
        try {
            // Get context
            const prefix = this.getPrefix(document, position);
            const suffix = this.getSuffix(document, position);
            const languageId = document.languageId;
            // Check cache
            const cacheKey = `${languageId}:${prefix.slice(-100)}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }
            // Build prompt
            const prompt = this.buildCompletionPrompt(prefix, suffix, languageId);
            // Get completion from AI
            const completion = await this.ollamaService.complete(prompt, {
                temperature: 0.2, // Low temperature for more predictable completions
                stop: ['\n\n', '```', 'function', 'class', 'const', 'let', 'var']
            });
            if (!completion || token.isCancellationRequested) {
                return null;
            }
            // Parse completion
            const items = this.parseCompletion(completion, position);
            // Cache result
            this.cache.set(cacheKey, items);
            if (this.cache.size > 100) {
                const firstKey = this.cache.keys().next().value;
                if (firstKey) {
                    this.cache.delete(firstKey);
                }
            }
            return items;
        }
        catch (error) {
            console.error('Inline completion error:', error);
            return null;
        }
    }
    getPrefix(document, position) {
        const startLine = Math.max(0, position.line - 20);
        const range = new vscode.Range(startLine, 0, position.line, position.character);
        return document.getText(range);
    }
    getSuffix(document, position) {
        const endLine = Math.min(document.lineCount - 1, position.line + 10);
        const range = new vscode.Range(position.line, position.character, endLine, 999);
        return document.getText(range);
    }
    buildCompletionPrompt(prefix, suffix, languageId) {
        let prompt = `Complete the following ${languageId} code. Provide ONLY the completion, no explanations.\n\n`;
        // Add guidelines if available
        const guidelines = this.configManager.getGuidelines();
        if (guidelines) {
            prompt += `Guidelines:\n${guidelines}\n\n`;
        }
        prompt += `Code before cursor:\n${prefix}\n`;
        if (suffix.trim()) {
            prompt += `\nCode after cursor:\n${suffix}\n`;
        }
        prompt += `\nCompletion:`;
        return prompt;
    }
    parseCompletion(completion, position) {
        // Clean up completion
        let text = completion.trim();
        // Remove common artifacts
        text = text.replace(/^```[\w]*\n?/, '');
        text = text.replace(/\n?```$/, '');
        if (!text) {
            return [];
        }
        // Get current model name for display
        const config = vscode.workspace.getConfiguration('agent-forge');
        const modelName = config.get('model', 'ollama');
        // Create inline completion item with model indicator
        const item = new vscode.InlineCompletionItem(text);
        item.range = new vscode.Range(position, position);
        // Add command to show model info (appears as "Agent Forge (model-name)" in UI)
        item.command = {
            command: 'agent-forge.showModelInfo',
            title: `Agent Forge (${modelName.split(':')[0]})`,
            tooltip: `Using model: ${modelName}`
        };
        return [item];
    }
    clearCache() {
        this.cache.clear();
    }
}
exports.CompletionProvider = CompletionProvider;
/**
 * Code Action Provider - Lightbulb suggestions (ENHANCED v1.8.0)
 * Provides AI-powered quick fixes and refactoring suggestions
 */
class CodeActionProvider {
    constructor(ollamaService, configManager) {
        this.ollamaService = ollamaService;
        this.configManager = configManager;
    }
    async provideCodeActions(document, range, context, token) {
        const actions = [];
        // DIAGNOSTIC ACTIONS (errors/warnings)
        if (context.diagnostics.length > 0) {
            for (const diagnostic of context.diagnostics) {
                // Quick fix action (preferred)
                const fixAction = new vscode.CodeAction(`✨ AI Fix: ${this.truncate(diagnostic.message, 50)}`, vscode.CodeActionKind.QuickFix);
                fixAction.command = {
                    title: 'Fix with AI',
                    command: 'agent-forge.fixDiagnostic',
                    arguments: [document, diagnostic]
                };
                fixAction.isPreferred = true; // Shows first in lightbulb
                fixAction.diagnostics = [diagnostic];
                actions.push(fixAction);
                // Explain action
                const explainAction = new vscode.CodeAction(`💡 Explain: ${this.truncate(diagnostic.message, 50)}`, vscode.CodeActionKind.QuickFix);
                explainAction.command = {
                    title: 'Explain with AI',
                    command: 'agent-forge.explainDiagnostic',
                    arguments: [document, diagnostic]
                };
                explainAction.diagnostics = [diagnostic];
                actions.push(explainAction);
            }
        }
        // REFACTORING ACTIONS (for selected code)
        if (!range.isEmpty) {
            const selectedText = document.getText(range);
            const lineCount = range.end.line - range.start.line + 1;
            // General refactor
            const refactorAction = new vscode.CodeAction('🔄 Refactor Selection', vscode.CodeActionKind.Refactor);
            refactorAction.command = {
                title: 'Refactor with AI',
                command: 'agent-forge.refactorCode'
            };
            actions.push(refactorAction);
            // Extract function (if multiple lines)
            if (lineCount > 1) {
                const extractFunctionAction = new vscode.CodeAction('📦 Extract to Function', vscode.CodeActionKind.RefactorExtract);
                extractFunctionAction.command = {
                    title: 'Extract to Function',
                    command: 'agent-forge.extractFunction',
                    arguments: [document, range]
                };
                actions.push(extractFunctionAction);
            }
            // Add documentation
            const addDocsAction = new vscode.CodeAction('📝 Add Documentation', vscode.CodeActionKind.RefactorRewrite);
            addDocsAction.command = {
                title: 'Add AI Documentation',
                command: 'agent-forge.addDocumentation',
                arguments: [document, range]
            };
            actions.push(addDocsAction);
            // Optimize code
            const optimizeAction = new vscode.CodeAction('⚡ Optimize Performance', vscode.CodeActionKind.RefactorRewrite);
            optimizeAction.command = {
                title: 'Optimize with AI',
                command: 'agent-forge.optimizeCode',
                arguments: [document, range]
            };
            actions.push(optimizeAction);
        }
        return actions;
    }
    truncate(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
}
exports.CodeActionProvider = CodeActionProvider;
/**
 * Hover Provider - Show AI-generated documentation on hover
 */
class HoverProvider {
    constructor(ollamaService, configManager) {
        this.cache = new Map();
        this.ollamaService = ollamaService;
        this.configManager = configManager;
    }
    async provideHover(document, position, token) {
        // Check if enabled
        const config = vscode.workspace.getConfiguration('agent-forge');
        if (!config.get('enableHoverInfo', true)) {
            return null;
        }
        try {
            // Get word/symbol at position
            const wordRange = document.getWordRangeAtPosition(position);
            if (!wordRange) {
                return null;
            }
            const word = document.getText(wordRange);
            const line = document.lineAt(position.line).text;
            // Check cache
            const cacheKey = `${document.uri.toString()}:${word}:${line}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }
            // Get context around the word
            const startLine = Math.max(0, position.line - 5);
            const endLine = Math.min(document.lineCount - 1, position.line + 5);
            const contextRange = new vscode.Range(startLine, 0, endLine, 999);
            const context = document.getText(contextRange);
            // Build prompt
            const prompt = `Explain what "${word}" does in this ${document.languageId} code. Be concise (1-2 sentences).\n\nCode:\n${context}`;
            // Get explanation
            const explanation = await this.ollamaService.chat(prompt);
            if (!explanation || token.isCancellationRequested) {
                return null;
            }
            // Create hover
            const markdown = new vscode.MarkdownString();
            markdown.appendMarkdown(`**AI Explanation:**\n\n${explanation}`);
            markdown.isTrusted = true;
            const hover = new vscode.Hover(markdown, wordRange);
            // Cache result
            this.cache.set(cacheKey, hover);
            if (this.cache.size > 50) {
                const firstKey = this.cache.keys().next().value;
                if (firstKey) {
                    this.cache.delete(firstKey);
                }
            }
            return hover;
        }
        catch (error) {
            console.error('Hover provider error:', error);
            return null;
        }
    }
    clearCache() {
        this.cache.clear();
    }
}
exports.HoverProvider = HoverProvider;
/**
 * Signature Help Provider - Function parameter hints
 */
class SignatureHelpProvider {
    constructor(ollamaService, configManager) {
        this.ollamaService = ollamaService;
        this.configManager = configManager;
    }
    async provideSignatureHelp(document, position, token, context) {
        // Check if enabled
        const config = vscode.workspace.getConfiguration('agent-forge');
        if (!config.get('enableSignatureHelp', true)) {
            return null;
        }
        try {
            // Get function name before cursor
            const line = document.lineAt(position.line).text.substring(0, position.character);
            const functionMatch = line.match(/(\w+)\s*\(/);
            if (!functionMatch) {
                return null;
            }
            const functionName = functionMatch[1];
            // Search for function definition in workspace
            const definition = await this.findFunctionDefinition(document, functionName);
            if (!definition) {
                return null;
            }
            // Create signature help
            const signatureHelp = new vscode.SignatureHelp();
            signatureHelp.signatures = [definition];
            signatureHelp.activeSignature = 0;
            signatureHelp.activeParameter = this.getActiveParameter(line);
            return signatureHelp;
        }
        catch (error) {
            console.error('Signature help error:', error);
            return null;
        }
    }
    async findFunctionDefinition(document, functionName) {
        // Search current document
        const text = document.getText();
        const patterns = [
            new RegExp(`function\\s+${functionName}\\s*\\(([^)]*)\\)`, 'i'),
            new RegExp(`const\\s+${functionName}\\s*=\\s*\\(([^)]*)\\)\\s*=>`, 'i'),
            new RegExp(`${functionName}\\s*:\\s*\\(([^)]*)\\)\\s*=>`, 'i'),
            new RegExp(`def\\s+${functionName}\\s*\\(([^)]*)\\)`, 'i'), // Python
        ];
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                const params = match[1].split(',').map(p => p.trim());
                const signature = new vscode.SignatureInformation(`${functionName}(${match[1]})`, new vscode.MarkdownString(`Function: **${functionName}**`));
                signature.parameters = params.map(param => new vscode.ParameterInformation(param));
                return signature;
            }
        }
        return null;
    }
    getActiveParameter(line) {
        // Count commas before cursor to determine active parameter
        const commaCount = (line.match(/,/g) || []).length;
        return commaCount;
    }
}
exports.SignatureHelpProvider = SignatureHelpProvider;
//# sourceMappingURL=completionProvider.js.map