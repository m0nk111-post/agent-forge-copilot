import * as vscode from 'vscode';
import { OllamaService } from '../services/ollamaService';
import { FileRelationshipTracker } from '../services/fileRelationshipTracker';

/**
 * Provides inline code completions (ghost text) as you type
 * Similar to GitHub Copilot's inline suggestions
 * Now with multi-file context awareness!
 */
export class InlineCompletionProvider implements vscode.InlineCompletionItemProvider {
    private ollamaService: OllamaService;
    private fileRelationshipTracker: FileRelationshipTracker | undefined;
    private cache: Map<string, { completion: string, timestamp: number }>;
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    private readonly MAX_CACHE_SIZE = 100;
    private debounceTimer: NodeJS.Timeout | undefined;
    private readonly DEBOUNCE_DELAY = 300; // 300ms
    
    constructor(ollamaService: OllamaService, fileRelationshipTracker?: FileRelationshipTracker) {
        this.ollamaService = ollamaService;
        this.fileRelationshipTracker = fileRelationshipTracker;
        this.cache = new Map();
    }

    /**
     * Provide inline completion items for the given position in the document
     */
    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[] | vscode.InlineCompletionList | undefined> {
        
        // Check if inline completions are enabled
        const config = vscode.workspace.getConfiguration('agent-forge');
        const enabled = config.get<boolean>('inlineCompletions.enabled', true);
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

        } catch (error) {
            console.error('[InlineCompletion] Error providing completions:', error);
            return undefined;
        }
    }

    /**
     * Get text before cursor (prefix context)
     */
    private getPrefix(document: vscode.TextDocument, position: vscode.Position): string {
        const config = vscode.workspace.getConfiguration('agent-forge');
        const maxPrefixLines = config.get<number>('inlineCompletions.maxPrefixLines', 50);
        
        // Get lines before cursor (up to maxPrefixLines)
        const startLine = Math.max(0, position.line - maxPrefixLines);
        const range = new vscode.Range(startLine, 0, position.line, position.character);
        
        return document.getText(range);
    }

    /**
     * Get text after cursor (suffix context)
     */
    private getSuffix(document: vscode.TextDocument, position: vscode.Position): string {
        const config = vscode.workspace.getConfiguration('agent-forge');
        const maxSuffixLines = config.get<number>('inlineCompletions.maxSuffixLines', 20);
        
        // Get lines after cursor (up to maxSuffixLines)
        const endLine = Math.min(document.lineCount - 1, position.line + maxSuffixLines);
        const range = new vscode.Range(
            position.line, position.character,
            endLine, document.lineAt(endLine).text.length
        );
        
        return document.getText(range);
    }

    /**
     * Get code completion from Ollama
     */
    private async getCompletion(
        prefix: string,
        suffix: string,
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): Promise<string | undefined> {
        
        const config = vscode.workspace.getConfiguration('agent-forge');
        const model = config.get<string>('inlineCompletions.model') || 
                     config.get<string>('defaultModel', 'qwen2.5-coder:7b');
        
        // Build prompt for code completion (now async with multi-file context)
        const prompt = await this.buildCompletionPrompt(prefix, suffix, document);
        
        // Use complete() instead of chat() for inline completions (more suitable)
        const systemPrompt = 'You are an expert code completion assistant. Complete the code at the cursor position. Provide ONLY the code continuation, no explanations, no markdown code blocks.';
        
        try {
            // Call Ollama complete endpoint with lower temperature
            const response = await this.ollamaService.complete(
                `${systemPrompt}\n\n${prompt}`,
                { temperature: 0.2 }
            );

            if (token.isCancellationRequested) {
                return undefined;
            }

            // Extract completion text
            const completion = this.extractCompletion(response);
            return completion;

        } catch (error) {
            console.error('[InlineCompletion] Error getting completion from Ollama:', error);
            return undefined;
        }
    }

    /**
     * Build prompt for code completion (with multi-file context)
     */
    private async buildCompletionPrompt(prefix: string, suffix: string, document: vscode.TextDocument): Promise<string> {
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
            } catch (error) {
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
    private extractCompletion(response: string): string {
        // Remove markdown code blocks if present
        let completion = response.trim();
        
        // Remove ```language and ``` markers
        completion = completion.replace(/^```\w*\n?/, '');
        completion = completion.replace(/\n?```$/, '');
        
        // Remove any explanatory text (heuristic: take first code-like section)
        const lines = completion.split('\n');
        let codeLines: string[] = [];
        
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
    private createCompletionItems(
        completion: string,
        position: vscode.Position
    ): vscode.InlineCompletionItem[] {
        
        if (!completion || completion.trim().length === 0) {
            return [];
        }

        const item = new vscode.InlineCompletionItem(
            completion,
            new vscode.Range(position, position)
        );

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
    private getCacheKey(document: vscode.TextDocument, prefix: string, suffix: string): string {
        // Use last 200 chars of prefix and first 50 of suffix for cache key
        const prefixKey = prefix.slice(-200);
        const suffixKey = suffix.slice(0, 50);
        const lang = document.languageId;
        
        return `${lang}:${prefixKey}:${suffixKey}`;
    }

    /**
     * Get completion from cache if available and not expired
     */
    private getFromCache(key: string): string | undefined {
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
    private addToCache(key: string, completion: string): void {
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
    public clearCache(): void {
        this.cache.clear();
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.clearCache();
    }
}
