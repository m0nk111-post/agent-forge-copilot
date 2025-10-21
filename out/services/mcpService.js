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
exports.MCPService = void 0;
const vscode = __importStar(require("vscode"));
class MCPService {
    constructor() {
        this.tools = [];
        this.languageModelTools = [];
        console.log('🔌 Initializing MCP Service...');
    }
    async initializeServers() {
        console.log('🚀 Loading MCP tools from VS Code...');
        try {
            // Get all available language model tools (MCP servers loaded by VS Code)
            this.languageModelTools = vscode.lm.tools;
            console.log(`✅ Found ${this.languageModelTools.length} MCP tools from VS Code`);
            // Convert to our tool format
            this.tools = Array.from(this.languageModelTools).map(tool => ({
                name: tool.name,
                description: tool.description || 'No description',
                inputSchema: tool.inputSchema || {}
            }));
            // Log available tools
            if (this.tools.length > 0) {
                console.log('📋 Available MCP tools:');
                this.tools.forEach(tool => {
                    console.log(`   • ${tool.name}: ${tool.description}`);
                });
            }
            else {
                console.log('⚠️  No MCP tools found. Install MCP extensions in VS Code.');
            }
        }
        catch (error) {
            console.error('❌ Failed to load MCP tools:', error.message);
            console.log('💡 Tip: Install MCP extensions from VS Code marketplace');
        }
    }
    async callTool(toolName, args) {
        console.log(`🔧 Calling MCP tool: ${toolName} with args:`, args);
        try {
            // Find the tool
            const tool = Array.from(this.languageModelTools).find(t => t.name === toolName);
            if (!tool) {
                throw new Error(`Tool ${toolName} not found`);
            }
            // MCP tools in VS Code need to be invoked through language model chat
            // For now, return tool info - full invocation requires chat integration
            console.log(`✅ Tool ${toolName} found and ready`);
            return `Tool ${toolName} is available. Schema: ${JSON.stringify(tool.inputSchema)}`;
        }
        catch (error) {
            console.error(`❌ Tool ${toolName} failed:`, error.message);
            throw new Error(`MCP tool ${toolName} failed: ${error.message}`);
        }
    }
    getAvailableTools() {
        return this.tools;
    }
    getToolNames() {
        return this.tools.map(t => t.name);
    }
    getToolByName(name) {
        return this.tools.find(t => t.name === name);
    }
    getToolsForPrompt() {
        if (this.tools.length === 0) {
            return 'No MCP tools available.';
        }
        return this.tools.map(tool => {
            return `- ${tool.name}: ${tool.description}`;
        }).join('\n');
    }
}
exports.MCPService = MCPService;
//# sourceMappingURL=mcpService.js.map