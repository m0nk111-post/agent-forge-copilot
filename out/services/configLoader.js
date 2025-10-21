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
exports.ConfigLoader = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class ConfigLoader {
    constructor(extensionPath) {
        this.config = null;
        this.extensionPath = extensionPath;
    }
    static getInstance(extensionPath) {
        if (!ConfigLoader.instance) {
            ConfigLoader.instance = new ConfigLoader(extensionPath);
        }
        else {
            // Update extension path if provided
            ConfigLoader.instance.extensionPath = extensionPath;
        }
        return ConfigLoader.instance;
    }
    async loadConfig() {
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
            console.log(`✅ Config loaded successfully with ${this.config.models.length} models and ${this.config.agentModes.length} agent modes`);
            console.log(`📋 Models loaded: ${this.config.models.map(m => m.name).join(', ')}`);
            return this.config;
        }
        catch (error) {
            console.error('❌ Failed to load config from file:', error);
            console.log('⚠️  Using fallback config with 1 model');
            // Fallback config - MUST be saved to this.config
            this.config = this.getFallbackConfig();
            return this.config;
        }
    }
    getConfig() {
        if (!this.config) {
            console.warn('⚠️  Config accessed before loading, using fallback');
            this.config = this.getFallbackConfig();
        }
        return this.config;
    }
    getModels() {
        return this.getConfig().models;
    }
    getAgentModes() {
        return this.getConfig().agentModes;
    }
    getTools() {
        return this.getConfig().tools || [];
    }
    getEnabledTools() {
        return this.getTools().filter(t => t.enabled);
    }
    getDefaultModel() {
        const models = this.getModels();
        return models.find(m => m.default) || models[0];
    }
    getModelById(id) {
        return this.getModels().find(m => m.id === id);
    }
    getAgentModeById(id) {
        return this.getAgentModes().find(m => m.id === id);
    }
    async getInstructions(agentMode) {
        // If instructions reference a file, load it
        if (agentMode.instructions.endsWith('.md')) {
            try {
                const instructionsPath = path.join(this.extensionPath, 'out', 'config', agentMode.instructions);
                const content = await fs.promises.readFile(instructionsPath, 'utf-8');
                console.log(`📖 Loaded instructions from ${agentMode.instructions}`);
                return content;
            }
            catch (error) {
                console.error(`❌ Failed to load instructions file: ${agentMode.instructions}`, error);
                return agentMode.instructions; // Fallback to the string itself
            }
        }
        return agentMode.instructions;
    }
    getOllamaUrl() {
        const url = this.getConfig().ollamaUrl;
        if (url) {
            return url;
        }
        // Fallback to VS Code settings
        const vsconfig = vscode.workspace.getConfiguration('agent-forge');
        return vsconfig.get('ollamaUrl') || 'http://localhost:11434';
    }
    getVisionModel() {
        return this.getConfig().visionModel || 'llava:latest';
    }
    getFallbackConfig() {
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
exports.ConfigLoader = ConfigLoader;
//# sourceMappingURL=configLoader.js.map