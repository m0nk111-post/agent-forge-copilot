import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface ModelConfig {
    id: string;
    name: string;
    description: string;
    category: 'small' | 'medium' | 'large';
    icon: string;
    recommended?: boolean;
    default?: boolean;
}

export interface AgentMode {
    id: string;
    name: string;
    icon: string;
    instructions: string;
}

export interface ToolConfig {
    id: string;
    name: string;
    icon: string;
    description: string;
    enabled: boolean;
}

export interface AppConfig {
    ollamaUrl?: string;
    visionModel?: string;
    tools?: ToolConfig[];
    models: ModelConfig[];
    agentModes: AgentMode[];
}

export class ConfigLoader {
    private static instance: ConfigLoader;
    private config: AppConfig | null = null;
    private extensionPath: string;

    private constructor(extensionPath: string) {
        this.extensionPath = extensionPath;
    }

    static getInstance(extensionPath: string): ConfigLoader {
        if (!ConfigLoader.instance) {
            ConfigLoader.instance = new ConfigLoader(extensionPath);
        } else {
            // Update extension path if provided
            ConfigLoader.instance.extensionPath = extensionPath;
        }
        return ConfigLoader.instance;
    }

    async loadConfig(): Promise<AppConfig> {
        // Force reload to ensure we have the latest config
        const configPath = path.join(this.extensionPath, 'out', 'config', 'models.json');
        console.log(`📂 Loading config from: ${configPath}`);
        
        try {
            const exists = fs.existsSync(configPath);
            console.log(`📁 Config file exists: ${exists}`);
            
            if (!exists) {
                throw new Error(`Config file not found at ${configPath}`);
            }
            
            const configData = await fs.promises.readFile(configPath, 'utf-8');
            this.config = JSON.parse(configData);
            console.log(`✅ Config loaded successfully with ${this.config!.models.length} models and ${this.config!.agentModes.length} agent modes`);
            console.log(`📋 Models loaded: ${this.config!.models.map(m => m.name).join(', ')}`);
            return this.config!;
        } catch (error) {
            console.error('❌ Failed to load config from file:', error);
            console.log('⚠️  Using fallback config with 1 model');
            // Fallback config - MUST be saved to this.config
            this.config = this.getFallbackConfig();
            return this.config;
        }
    }

    getConfig(): AppConfig {
        if (!this.config) {
            console.warn('⚠️  Config accessed before loading, using fallback');
            this.config = this.getFallbackConfig();
        }
        return this.config;
    }

    getModels(): ModelConfig[] {
        return this.getConfig().models;
    }

    getAgentModes(): AgentMode[] {
        return this.getConfig().agentModes;
    }

    getTools(): ToolConfig[] {
        return this.getConfig().tools || [];
    }

    getEnabledTools(): ToolConfig[] {
        return this.getTools().filter(t => t.enabled);
    }

    getDefaultModel(): ModelConfig {
        const models = this.getModels();
        return models.find(m => m.default) || models[0];
    }

    getModelById(id: string): ModelConfig | undefined {
        return this.getModels().find(m => m.id === id);
    }

    getAgentModeById(id: string): AgentMode | undefined {
        return this.getAgentModes().find(m => m.id === id);
    }

    async getInstructions(agentMode: AgentMode): Promise<string> {
        // If instructions reference a file, load it
        if (agentMode.instructions.endsWith('.md')) {
            try {
                const instructionsPath = path.join(this.extensionPath, 'out', 'config', agentMode.instructions);
                const content = await fs.promises.readFile(instructionsPath, 'utf-8');
                console.log(`📖 Loaded instructions from ${agentMode.instructions}`);
                return content;
            } catch (error) {
                console.error(`❌ Failed to load instructions file: ${agentMode.instructions}`, error);
                return agentMode.instructions; // Fallback to the string itself
            }
        }
        return agentMode.instructions;
    }

    getOllamaUrl(): string {
        const url = this.getConfig().ollamaUrl;
        if (url) {
            return url;
        }
        // Fallback to VS Code settings
        const vsconfig = vscode.workspace.getConfiguration('agent-forge');
        return vsconfig.get('ollamaUrl') || 'http://localhost:11434';
    }

    getVisionModel(): string {
        return this.getConfig().visionModel || 'llava:latest';
    }

    private getFallbackConfig(): AppConfig {
        return {
            ollamaUrl: 'http://localhost:11434',
            tools: [
                {
                    id: 'file-operations',
                    name: 'File Operations',
                    icon: '📁',
                    description: 'Read, write, and manage files',
                    enabled: true
                }
            ],
            models: [
                {
                    id: 'mistral-nemo:12b-instruct-2407-q6_K',
                    name: 'Mistral Nemo 12B Q6',
                    description: 'Recommended balanced model',
                    category: 'medium',
                    icon: '⚡',
                    default: true
                }
            ],
            agentModes: [
                {
                    id: 'default',
                    name: 'Default Agent',
                    icon: '💼',
                    instructions: ''
                }
            ]
        };
    }
}
