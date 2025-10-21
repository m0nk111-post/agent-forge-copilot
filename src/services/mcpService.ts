import * as vscode from 'vscode';

export interface MCPTool {
    name: string;
    description: string;
    inputSchema: any;
}

export class MCPService {
    private tools: MCPTool[] = [];
    private languageModelTools: readonly vscode.LanguageModelChatTool[] = [];

    constructor() {
        console.log('🔌 Initializing MCP Service...');
    }

    async initializeServers(): Promise<void> {
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
            } else {
                console.log('⚠️  No MCP tools found. Install MCP extensions in VS Code.');
            }

        } catch (error: any) {
            console.error('❌ Failed to load MCP tools:', error.message);
            console.log('💡 Tip: Install MCP extensions from VS Code marketplace');
        }
    }

    async callTool(toolName: string, args: any): Promise<string> {
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

        } catch (error: any) {
            console.error(`❌ Tool ${toolName} failed:`, error.message);
            throw new Error(`MCP tool ${toolName} failed: ${error.message}`);
        }
    }

    getAvailableTools(): MCPTool[] {
        return this.tools;
    }

    getToolNames(): string[] {
        return this.tools.map(t => t.name);
    }

    getToolByName(name: string): MCPTool | undefined {
        return this.tools.find(t => t.name === name);
    }

    getToolsForPrompt(): string {
        if (this.tools.length === 0) {
            return 'No MCP tools available.';
        }

        return this.tools.map(tool => {
            return `- ${tool.name}: ${tool.description}`;
        }).join('\n');
    }
}
