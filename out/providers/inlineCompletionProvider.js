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
exports.InlineCompletionProvider = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Provides inline code completions (ghost text) as you type
 * Similar to GitHub Copilot's inline suggestions
 * Now with multi-file context awareness!
 */
class InlineCompletionProvider {
    constructor(ollamaService, fileRelationshipTracker) {
        this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
        this.MAX_CACHE_SIZE = 100;
        this.DEBOUNCE_DELAY = 300; // 300ms
        this.ollamaService = ollamaService;
        this.fileRelationshipTracker = fileRelationshipTracker;
        this.cache = new Map();
    }
    /**
     * Provide inline completion items for the given position in the document
     */
    async provideInlineCompletionItems(document, position, context, token) {
        // Check if inline completions are enabled
        const config = vscode.workspace.getConfiguration('agent-forge');
        const enabled = config.get('inlineCompletions.enabled', true);
        if (!enabled) {
            return undefined;
        }
        // Note: InlineCompletionTriggerKind.Explicit doesn't exist in current VS Code API
        // Trigger kind is: Automatic (0) or Invoke (1)
        // We handle both types the same way for now
        try {
            // Get context around cursor
            const prefix = this.getPrefix(document, position);
            const suffix = this.getSuffix(document, position);
            // Check cache first
            const cacheKey = this.getCacheKey(document, prefix, suffix);
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return this.createCompletionItems(cached, position);
            }
            // Check if cancellation requested
            if (token.isCancellationRequested) {
                return undefined;
            }
            // Get completion from Ollama
            const completion = await this.getCompletion(prefix, suffix, document, token);
            if (!completion || token.isCancellationRequested) {
                return undefined;
            }
            // Cache the result
            this.addToCache(cacheKey, completion);
            // Return completion items
            return this.createCompletionItems(completion, position);
        }
        catch (error) {
            console.error('[InlineCompletion] Error providing completions:', error);
            return undefined;
        }
    }
    /**
     * Get text before cursor (prefix context)
     */
    getPrefix(document, position) {
        const config = vscode.workspace.getConfiguration('agent-forge');
        const maxPrefixLines = config.get('inlineCompletions.maxPrefixLines', 50);
        // Get lines before cursor (up to maxPrefixLines)
        const startLine = Math.max(0, position.line - maxPrefixLines);
        const range = new vscode.Range(startLine, 0, position.line, position.character);
        return document.getText(range);
    }
    /**
     * Get text after cursor (suffix context)
     */
    getSuffix(document, position) {
        const config = vscode.workspace.getConfiguration('agent-forge');
        const maxSuffixLines = config.get('inlineCompletions.maxSuffixLines', 20);
        // Get lines after cursor (up to maxSuffixLines)
        const endLine = Math.min(document.lineCount - 1, position.line + maxSuffixLines);
        const range = new vscode.Range(position.line, position.character, endLine, document.lineAt(endLine).text.length);
        return document.getText(range);
    }
    /**
     * Get code completion from Ollama
     */
    async getCompletion(prefix, suffix, document, token) {
        const config = vscode.workspace.getConfiguration('agent-forge');
        const model = config.get('inlineCompletions.model') ||
            config.get('defaultModel', 'qwen2.5-coder:7b');
        // Build prompt for code completion (now async with multi-file context)
        const prompt = await this.buildCompletionPrompt(prefix, suffix, document);
        // Use complete() instead of chat() for inline completions (more suitable)
        const systemPrompt = 'You are an expert code completion assistant. Complete the code at the cursor position. Provide ONLY the code continuation, no explanations, no markdown code blocks.';
        try {
            // Call Ollama complete endpoint with lower temperature
            const response = await this.ollamaService.complete(`${systemPrompt}\n\n${prompt}`, { temperature: 0.2 });
            if (token.isCancellationRequested) {
                return undefined;
            }
            // Extract completion text
            const completion = this.extractCompletion(response);
            return completion;
        }
        catch (error) {
            console.error('[InlineCompletion] Error getting completion from Ollama:', error);
            return undefined;
        }
    }
    /**
     * Build prompt for code completion (with multi-file context)
     */
    async buildCompletionPrompt(prefix, suffix, document) {
        const language = document.languageId;
        let prompt = `Complete the following ${language} code:\n\n`;
        // Add multi-file context if available
        if (this.fileRelationshipTracker) {
            try {
                const relatedContext = await this.fileRelationshipTracker.getRelatedFilesContext(document.uri, 3);
                if (relatedContext.trim()) {
                    prompt += '// Related files for context:\n';
                    prompt += relatedContext;
                    prompt += '\n\n// Current file:\n';
                }
            }
            catch (error) {
                console.error('[InlineCompletion] Error getting related files context:', error);
            }
        }
        prompt += '```' + language + '\n';
        prompt += prefix;
        prompt += '<CURSOR>';
        if (suffix.trim()) {
            prompt += '\n' + suffix;
        }
        prompt += '\n```\n\n';
        prompt += 'Provide ONLY the code that should replace <CURSOR>. No explanations.';
        return prompt;
    }
    /**
     * Extract completion from Ollama response
     */
    extractCompletion(response) {
        // Remove markdown code blocks if present
        let completion = response.trim();
        // Remove ```language and ``` markers
        completion = completion.replace(/^```\w*\n?/, '');
        completion = completion.replace(/\n?```$/, '');
        // Remove any explanatory text (heuristic: take first code-like section)
        const lines = completion.split('\n');
        let codeLines = [];
        for (const line of lines) {
            // Skip empty explanatory lines
            if (line.trim().match(/^(Here|This|The|Complete|Note:|Important:)/i)) {
                continue;
            }
            codeLines.push(line);
        }
        completion = codeLines.join('\n').trim();
        // Limit to reasonable length (single line or small block)
        const maxLines = 5;
        const limitedLines = completion.split('\n').slice(0, maxLines);
        return limitedLines.join('\n');
    }
    /**
     * Create inline completion items from completion text
     */
    createCompletionItems(completion, position) {
        if (!completion || completion.trim().length === 0) {
            return [];
        }
        const item = new vscode.InlineCompletionItem(completion, new vscode.Range(position, position));
        // Add command to track acceptance (optional)
        item.command = {
            command: 'agent-forge.inlineCompletionAccepted',
            title: 'Track Inline Completion Acceptance'
        };
        return [item];
    }
    /**
     * Generate cache key from context
     */
    getCacheKey(document, prefix, suffix) {
        // Use last 200 chars of prefix and first 50 of suffix for cache key
        const prefixKey = prefix.slice(-200);
        const suffixKey = suffix.slice(0, 50);
        const lang = document.languageId;
        return `${lang}:${prefixKey}:${suffixKey}`;
    }
    /**
     * Get completion from cache if available and not expired
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) {
            return undefined;
        }
        // Check if expired
        const now = Date.now();
        if (now - cached.timestamp > this.CACHE_TTL) {
            this.cache.delete(key);
            return undefined;
        }
        return cached.completion;
    }
    /**
     * Add completion to cache
     */
    addToCache(key, completion) {
        // Implement LRU: if cache is full, remove oldest entry
        if (this.cache.size >= this.MAX_CACHE_SIZE) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, {
            completion,
            timestamp: Date.now()
        });
    }
    /**
     * Clear the completion cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Dispose of resources
     */
    dispose() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.clearCache();
    }
}
exports.InlineCompletionProvider = InlineCompletionProvider;
//# sourceMappingURL=inlineCompletionProvider.js.map