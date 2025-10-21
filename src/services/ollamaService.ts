import axios from 'axios';
import * as vscode from 'vscode';
import { ConfigLoader } from './configLoader';

export interface OllamaModel {
    name: string;
    size: number;
    modified: string;
}

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export class OllamaService implements vscode.Disposable {
    private baseUrl!: string;
    private model!: string;
    private temperature!: number;
    private conversationHistory: ChatMessage[] = [];
    private configLoader?: ConfigLoader;
    private isReady: boolean = false;
    private configLoadPromise?: Promise<void>;
    private disposables: vscode.Disposable[] = [];

    constructor(extensionPath?: string) {
        // Set defaults first
        this.baseUrl = 'http://localhost:11434';
        this.model = 'qwen2.5-coder-14b-instruct-q4_k_m';
        this.temperature = 0.7;
        
        // Initialize ConfigLoader if extension path provided
        if (extensionPath) {
            this.configLoader = ConfigLoader.getInstance(extensionPath);
            // Load config asynchronously and then reload OllamaService config
            this.configLoadPromise = this.configLoader.loadConfig().then(() => {
                console.log('⏳ Config loaded, now loading Ollama config...');
                this.loadConfig();
                this.isReady = true;
                console.log('✅ OllamaService is ready');
            }).catch(err => {
                console.error('❌ Failed to load ConfigLoader config:', err);
                this.loadConfig();
                this.isReady = true;
            });
        } else {
            // No extension path, load config immediately with VS Code settings
            this.loadConfig();
            this.isReady = true;
        }
        
        // Watch for configuration changes - STORE DISPOSABLE
        this.disposables.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('agent-forge')) {
                    try {
                        this.loadConfig();
                    } catch (error) {
                        console.error('Failed to reload config:', error);
                    }
                }
            })
        );
    }

    dispose() {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }

    private loadConfig() {
        // First, try VS Code settings
        const config = vscode.workspace.getConfiguration('agent-forge');
        const settingsUrl = config.get<string>('ollamaUrl');
        
        // Then try to get URL from ConfigLoader
        if (this.configLoader) {
            try {
                const configUrl = this.configLoader.getOllamaUrl();
                if (configUrl && configUrl !== 'http://localhost:11434') {
                    this.baseUrl = configUrl;
                    console.log(`🔧 Using Ollama URL from config file: ${this.baseUrl}`);
                } else if (settingsUrl) {
                    this.baseUrl = settingsUrl;
                    console.log(`🔧 Using Ollama URL from VS Code settings: ${this.baseUrl}`);
                } else {
                    this.baseUrl = 'http://localhost:11434';
                    console.log(`🔧 Using default Ollama URL: ${this.baseUrl}`);
                }
            } catch (error) {
                console.warn('⚠️  ConfigLoader error, using VS Code settings or default');
                this.baseUrl = settingsUrl || 'http://localhost:11434';
                console.log(`🔧 Using Ollama URL: ${this.baseUrl}`);
            }
        } else {
            // No ConfigLoader, use VS Code settings
            this.baseUrl = settingsUrl || 'http://localhost:11434';
            console.log(`🔧 Using Ollama URL (no ConfigLoader): ${this.baseUrl}`);
        }
        
        this.model = config.get('defaultModel') || 'qwen2.5-coder-14b-instruct-q4_k_m';
        this.temperature = config.get('temperature') || 0.7;
        console.log(`🔧 Final config: ${this.model} @ ${this.baseUrl}`);
    }

    async chat(userMessage: string, systemPrompt?: string): Promise<string> {
        try {
            // Wait for config to be ready
            if (this.configLoadPromise) {
                await this.configLoadPromise;
            }
            
            // Check connection first
            if (!(await this.checkConnection())) {
                throw new Error(`Cannot connect to Ollama at ${this.baseUrl}. Please check the URL in settings.`);
            }

            const messages: ChatMessage[] = [];

            if (systemPrompt) {
                messages.push({ role: 'system', content: systemPrompt });
            }

            // Add conversation history
            messages.push(...this.conversationHistory);

            // Add current message
            messages.push({ role: 'user', content: userMessage });

            const response = await axios.post(`${this.baseUrl}/api/chat`, {
                model: this.model,
                messages: messages,
                stream: false,
                options: {
                    temperature: this.temperature
                }
            });

            const assistantMessage = response.data.message.content;

            // Update conversation history
            this.conversationHistory.push(
                { role: 'user', content: userMessage },
                { role: 'assistant', content: assistantMessage }
            );

            // Keep history manageable (last 10 exchanges)
            if (this.conversationHistory.length > 20) {
                this.conversationHistory = this.conversationHistory.slice(-20);
            }

            return assistantMessage;
        } catch (error: any) {
            console.error('Ollama chat error:', error);
            throw new Error(`Failed to communicate with Ollama: ${error.message}`);
        }
    }

    async complete(prompt: string, options?: { temperature?: number; stop?: string[] }): Promise<string> {
        try {
            // Check connection first
            if (!(await this.checkConnection())) {
                throw new Error(`Cannot connect to Ollama at ${this.baseUrl}`);
            }

            const response = await axios.post(`${this.baseUrl}/api/generate`, {
                model: this.model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: options?.temperature ?? this.temperature,
                    stop: options?.stop
                }
            });

            return response.data.response;
        } catch (error: any) {
            console.error('Ollama completion error:', error);
            throw new Error(`Failed to get completion: ${error.message}`);
        }
    }

    async chatWithTools(userMessage: string, tools: any[], workspacePath?: string, referencedFiles?: Array<{path: string, content: string}>): Promise<{ message: string; toolCalls?: any[] }> {
        // Wait for config to be ready
        if (this.configLoadPromise) {
            await this.configLoadPromise;
        }

        if (!this.isReady) {
            throw new Error('Ollama service not ready yet');
        }

        // Build referenced files context
        let filesContext = '';
        if (referencedFiles && referencedFiles.length > 0) {
            filesContext = '\n\n📎 REFERENCED FILES IN THIS CONVERSATION:\n' + 
                referencedFiles.map(f => `- ${f.path}\nContent:\n\`\`\`\n${f.content.substring(0, 500)}${f.content.length > 500 ? '...' : ''}\n\`\`\``).join('\n\n');
        }

        // Build tool descriptions for prompt
        const toolDescriptions = tools.map(t => {
            const params = t.parameters?.properties || {};
            const paramList = Object.entries(params)
                .map(([name, info]: [string, any]) => `${name}: ${info.description || 'string'}`)
                .join(', ');
            return `- ${t.name}(${paramList}): ${t.description}`;
        }).join('\n');

        const workspaceInfo = workspacePath 
            ? `\nCurrent workspace: ${workspacePath}\nWhen creating files, use this workspace path as base (e.g., "${workspacePath}\\test.html")`
            : '';

        const systemPrompt = `You are a helpful AI assistant with access to tools. When you need to use a tool, respond ONLY with a JSON object in this exact format:
{"tool": "tool_name", "arguments": {"param1": "value1", "param2": "value2"}}

Available tools:
${toolDescriptions}
${workspaceInfo}
${filesContext}

CRITICAL RULES:
1. ONLY use a tool when the user explicitly asks you to DO something (create, read, modify, run, etc.)
2. If the user just asks a question or wants to chat, respond normally WITHOUT using any tools
3. If you use a tool, respond ONLY with the JSON, nothing else
4. After using a tool, you will receive the result and can then respond normally to the user
5. Use ABSOLUTE paths with the workspace path provided above
6. DO NOT use tools multiple times in one response - use ONE tool or NO tool

TOOL USAGE EXAMPLES:
- "maak een bestand" / "create a file" → Use write_file tool
- "lees test.txt" / "read the file" / "open test.txt" → Use read_file tool (NOT write_file!)
- "wat zijn de bestanden" / "list files" → Use list_files tool
- "zoek naar..." / "search for..." → Use search_files tool
- "run command..." / "execute..." → Use run_command tool
- "hoe gaat het?" / "bedankt!" → Just respond, NO tool

IMPORTANT DISTINCTIONS:
- "open", "lees", "read", "show me", "what's in" → Use read_file (viewing existing files)
- "create", "maak", "write", "save" → Use write_file (creating/modifying files)

User request: ${userMessage}`;

        try {
            const response = await this.chat(systemPrompt);
            console.log('🔍 Raw response:', response.substring(0, 200));
            
            // Try multiple strategies to extract JSON
            let jsonStr = null;
            
            // Strategy 1: Look for JSON code block
            const codeBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            if (codeBlockMatch) {
                jsonStr = codeBlockMatch[1].trim();
            }
            
            // Strategy 2: Look for plain JSON object
            if (!jsonStr) {
                const jsonMatch = response.match(/\{[\s\S]*?"tool"[\s\S]*?\}/);
                if (jsonMatch) {
                    jsonStr = jsonMatch[0];
                }
            }
            
            // Try to parse the extracted JSON
            if (jsonStr) {
                try {
                    // Clean up common issues
                    jsonStr = jsonStr
                        .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
                        .replace(/'/g, '"')              // Replace single quotes
                        .replace(/\}\}+$/, '}}')         // Fix multiple closing braces (e.g., }}} -> }})
                        .trim();
                    
                    console.log('🔧 Attempting to parse:', jsonStr);
                    const toolCall = JSON.parse(jsonStr);
                    
                    if (toolCall.tool && toolCall.arguments) {
                        console.log('✅ Tool call detected:', toolCall.tool, JSON.stringify(toolCall.arguments));
                        return { message: '', toolCalls: [toolCall] };
                    }
                } catch (parseError: any) {
                    console.error('❌ Failed to parse tool call JSON:', parseError.message);
                    console.error('Raw JSON string:', jsonStr);
                    // Fall through to return regular response
                }
            }

            // No tool call found, return regular response
            console.log('💬 No tool call detected, returning regular response');
            return { message: response };
        } catch (error: any) {
            console.error('Tool chat error:', error);
            throw error;
        }
    }

    clearHistory() {
        this.conversationHistory = [];
    }

    async listModels(): Promise<string[]> {
        try {
            const response = await axios.get(`${this.baseUrl}/api/tags`);
            return response.data.models.map((m: OllamaModel) => m.name);
        } catch (error) {
            console.error('Failed to list models:', error);
            return ['qwen2.5-coder-14b-instruct-q4_k_m']; // Fallback
        }
    }

    async checkConnection(): Promise<boolean> {
        try {
            await axios.get(`${this.baseUrl}/api/tags`, { timeout: 5000 });
            return true;
        } catch {
            return false;
        }
    }

    getCurrentModel(): string {
        return this.model;
    }

    async analyzeImage(imageDataUrl: string, prompt: string = "Describe this image in detail."): Promise<string> {
        try {
            // Wait for config to be ready
            if (this.configLoadPromise) {
                await this.configLoadPromise;
            }

            const visionModel = this.configLoader?.getVisionModel() || 'llava:latest';
            console.log(`🖼️  Analyzing image with vision model: ${visionModel}`);

            // Extract base64 data from data URL
            const base64Data = imageDataUrl.split(',')[1];

            const response = await axios.post(`${this.baseUrl}/api/generate`, {
                model: visionModel,
                prompt: prompt,
                images: [base64Data],
                stream: false
            }, {
                timeout: 60000 // Vision models need more time
            });

            const description = response.data.response;
            console.log(`✅ Image analysis complete: ${description.substring(0, 100)}...`);
            return description;
        } catch (error: any) {
            console.error('❌ Image analysis error:', error);
            throw new Error(`Failed to analyze image: ${error.message}`);
        }
    }
}

