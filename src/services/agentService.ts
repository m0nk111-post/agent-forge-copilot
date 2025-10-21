import * as vscode from 'vscode';
import { OllamaService } from './ollamaService';
import { FileService } from './fileService';
import { TerminalService } from './terminalService';
import { ConfigurationManager } from './configurationManager';
import * as path from 'path';

export interface Tool {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: Record<string, any>;
        required: string[];
    };
}

export interface ToolCall {
    tool: string;
    arguments: Record<string, any>;
}

export interface AgentConfig {
    maxIterations: number;
    autoApprove: boolean;
    model: string;
    temperature: number;
}

export interface AgentMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    toolCalls?: ToolCall[];
    toolResult?: any;
}

export class AgentService {
    private ollama: OllamaService;
    private fileService: FileService;
    private terminalService: TerminalService;
    private configManager: ConfigurationManager;
    private tools: Tool[];
    private config!: AgentConfig; // Initialized in loadConfig()
    private conversationHistory: AgentMessage[] = [];
    private outputChannel: vscode.OutputChannel;

    constructor(
        ollama: OllamaService,
        fileService: FileService,
        terminalService: TerminalService,
        configManager: ConfigurationManager
    ) {
        this.ollama = ollama;
        this.fileService = fileService;
        this.configManager = configManager;
        this.terminalService = terminalService;
        this.outputChannel = vscode.window.createOutputChannel('Agent Forge Agent');
        
        // Load config from VS Code settings
        this.loadConfig();
        
        // Watch for configuration changes
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('agent-forge')) {
                this.loadConfig();
            }
        });

        // Define available tools
        this.tools = this.defineTools();
    }

    private loadConfig() {
        const agentConfig = this.configManager.getConfig();
        this.config = {
            maxIterations: agentConfig.maxIterations,
            autoApprove: agentConfig.autoApprove,
            model: agentConfig.model,
            temperature: agentConfig.temperature
        };
        this.log(`⚙️ Agent config loaded: ${JSON.stringify(this.config, null, 2)}`);
    }

    private defineTools(): Tool[] {
        const allTools = [
            {
                name: 'readFile',
                description: 'Read the contents of a file',
                parameters: {
                    type: 'object',
                    properties: {
                        filePath: {
                            type: 'string',
                            description: 'The absolute or relative path to the file'
                        }
                    },
                    required: ['filePath']
                }
            },
            {
                name: 'writeFile',
                description: 'Write content to a file (creates or overwrites)',
                parameters: {
                    type: 'object',
                    properties: {
                        filePath: {
                            type: 'string',
                            description: 'The absolute or relative path to the file'
                        },
                        content: {
                            type: 'string',
                            description: 'The content to write to the file'
                        }
                    },
                    required: ['filePath', 'content']
                }
            },
            {
                name: 'listFiles',
                description: 'List files in a directory',
                parameters: {
                    type: 'object',
                    properties: {
                        dirPath: {
                            type: 'string',
                            description: 'The directory path'
                        },
                        pattern: {
                            type: 'string',
                            description: 'Optional regex pattern to filter files'
                        }
                    },
                    required: ['dirPath']
                }
            },
            {
                name: 'searchFiles',
                description: 'Search for text in files within a directory',
                parameters: {
                    type: 'object',
                    properties: {
                        searchPath: {
                            type: 'string',
                            description: 'The directory to search in'
                        },
                        searchTerm: {
                            type: 'string',
                            description: 'The text to search for'
                        }
                    },
                    required: ['searchPath', 'searchTerm']
                }
            },
            {
                name: 'runCommand',
                description: 'Execute a terminal command',
                parameters: {
                    type: 'object',
                    properties: {
                        command: {
                            type: 'string',
                            description: 'The command to execute'
                        }
                    },
                    required: ['command']
                }
            },
            {
                name: 'editFile',
                description: 'Edit a file by replacing text',
                parameters: {
                    type: 'object',
                    properties: {
                        filePath: {
                            type: 'string',
                            description: 'The file to edit'
                        },
                        searchText: {
                            type: 'string',
                            description: 'The text to find'
                        },
                        replaceText: {
                            type: 'string',
                            description: 'The text to replace it with'
                        }
                    },
                    required: ['filePath', 'searchText', 'replaceText']
                }
            },
            {
                name: 'getWorkspaceInfo',
                description: 'Get information about the current workspace',
                parameters: {
                    type: 'object',
                    properties: {},
                    required: []
                }
            },
            {
                name: 'taskComplete',
                description: 'Call this when the task is completed successfully',
                parameters: {
                    type: 'object',
                    properties: {
                        summary: {
                            type: 'string',
                            description: 'A summary of what was accomplished'
                        }
                    },
                    required: ['summary']
                }
            }
        ];

        // Filter tools based on enabled tools from config
        return allTools.filter(tool => this.configManager.isToolEnabled(tool.name));
    }

    private async executeTool(toolCall: ToolCall): Promise<any> {
        const { tool, arguments: args } = toolCall;

        this.log(`🔧 Executing tool: ${tool}`);
        this.log(`   Arguments: ${JSON.stringify(args, null, 2)}`);

        try {
            let result: any;

            switch (tool) {
                case 'readFile':
                    result = await this.fileService.readFile(this.resolvePath(args.filePath));
                    break;

                case 'writeFile':
                    await this.fileService.writeFile(this.resolvePath(args.filePath), args.content);
                    result = { success: true, message: `File written: ${args.filePath}` };
                    vscode.window.showInformationMessage(`✅ File created: ${args.filePath}`);
                    break;

                case 'listFiles':
                    const files = await this.fileService.listFiles(
                        this.resolvePath(args.dirPath),
                        args.pattern
                    );
                    result = { files, count: files.length };
                    break;

                case 'searchFiles':
                    const searchResults = await this.fileService.searchInFiles(
                        this.resolvePath(args.searchPath),
                        args.searchTerm
                    );
                    result = searchResults;
                    break;

                case 'runCommand':
                    if (!this.config.autoApprove) {
                        const confirm = await vscode.window.showWarningMessage(
                            `Execute command: ${args.command}?`,
                            'Yes', 'No'
                        );
                        if (confirm !== 'Yes') {
                            throw new Error('Command execution cancelled by user');
                        }
                    }
                    result = await this.terminalService.runCommand(args.command);
                    break;

                case 'editFile':
                    await this.fileService.replaceInFile(
                        this.resolvePath(args.filePath),
                        args.searchText,
                        args.replaceText
                    );
                    result = { success: true, message: `File edited: ${args.filePath}` };
                    vscode.window.showInformationMessage(`✅ File edited: ${args.filePath}`);
                    break;

                case 'getWorkspaceInfo':
                    result = await this.getWorkspaceInfo();
                    break;

                case 'taskComplete':
                    result = { completed: true, summary: args.summary };
                    this.log(`✅ Task completed: ${args.summary}`);
                    break;

                default:
                    throw new Error(`Unknown tool: ${tool}`);
            }

            this.log(`✅ Tool result: ${JSON.stringify(result, null, 2).substring(0, 500)}`);
            return result;

        } catch (error: any) {
            this.log(`❌ Tool error: ${error.message}`);
            throw error;
        }
    }

    private resolvePath(filePath: string): string {
        if (path.isAbsolute(filePath)) {
            return filePath;
        }

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder open');
        }

        return path.join(workspaceFolder.uri.fsPath, filePath);
    }

    private async getWorkspaceInfo(): Promise<any> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return { error: 'No workspace folder open' };
        }

        const files = await this.fileService.getWorkspaceFiles();
        const activeFile = vscode.window.activeTextEditor?.document.fileName;

        return {
            workspaceRoot: workspaceFolder.uri.fsPath,
            workspaceName: workspaceFolder.name,
            fileCount: files.length,
            activeFile: activeFile ? this.fileService.getRelativePath(activeFile) : null,
            files: files.slice(0, 50).map(f => this.fileService.getRelativePath(f))
        };
    }

    private buildSystemPrompt(): string {
        return `You are an autonomous AI coding assistant with full access to the VS Code workspace.

## Your Capabilities

You have access to these tools:
${this.tools.map(t => `- **${t.name}**: ${t.description}`).join('\n')}

## Tool Usage Format

When you need to use a tool, respond with ONLY a JSON object (no markdown, no explanation):

{
  "tool": "toolName",
  "arguments": {
    "param1": "value1"
  }
}

## Important Guidelines

1. **Always use relative paths** when possible (e.g., "src/test.ts" not absolute paths)
2. **Be proactive** - execute tools immediately to complete the task
3. **Chain tools** - read files before editing, list directories before searching
4. **Verify results** - check that files were created/modified correctly
5. **Call taskComplete** when done with a summary of what you accomplished
6. **Handle errors** - if a tool fails, try an alternative approach

## Examples

User: "Create a hello.js file"
You: {"tool": "writeFile", "arguments": {"filePath": "hello.js", "content": "console.log('Hello World!');"}}

User: "What files are in src/?"
You: {"tool": "listFiles", "arguments": {"dirPath": "src"}}

User: "Find all TODO comments"
You: {"tool": "searchFiles", "arguments": {"searchPath": ".", "searchTerm": "TODO"}}

## Current Context

When working with files, you can ask the user about the workspace or use getWorkspaceInfo to understand the project structure.

NOW: Start executing tools to complete the user's task. No explanations needed - just tool calls!`;
    }

    async executeTask(userTask: string, onProgress?: (message: string) => void): Promise<string> {
        this.log(`\n${'='.repeat(60)}`);
        this.log(`🚀 Starting new agent task`);
        this.log(`📝 Task: ${userTask}`);
        this.log(`${'='.repeat(60)}\n`);

        const systemPrompt = this.buildSystemPrompt();
        this.conversationHistory = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userTask }
        ];

        let iteration = 0;
        let taskCompleted = false;
        let finalSummary = '';

        while (iteration < this.config.maxIterations && !taskCompleted) {
            iteration++;
            this.log(`\n--- Iteration ${iteration}/${this.config.maxIterations} ---`);

            if (onProgress) {
                onProgress(`Iteration ${iteration}/${this.config.maxIterations}...`);
            }

            try {
                // Get response from Ollama
                const response = await this.ollama.chatWithTools(
                    this.conversationHistory.map(m => m.content).join('\n\n'),
                    this.tools
                );

                // Check if it's a tool call
                if (response.toolCalls && response.toolCalls.length > 0) {
                    const toolCall = response.toolCalls[0];
                    
                    // Check if task is complete
                    if (toolCall.tool === 'taskComplete') {
                        taskCompleted = true;
                        finalSummary = toolCall.arguments.summary;
                        this.log(`\n✅ TASK COMPLETED: ${finalSummary}`);
                        break;
                    }

                    // Execute the tool
                    const result = await this.executeTool(toolCall);

                    // Add to conversation history
                    this.conversationHistory.push({
                        role: 'assistant',
                        content: JSON.stringify(toolCall)
                    });
                    this.conversationHistory.push({
                        role: 'tool',
                        content: `Tool result: ${JSON.stringify(result)}`,
                        toolResult: result
                    });

                } else if (response.message) {
                    // Regular message response
                    this.log(`💬 Agent says: ${response.message}`);
                    this.conversationHistory.push({
                        role: 'assistant',
                        content: response.message
                    });

                    // If agent is just talking, prompt for action
                    this.conversationHistory.push({
                        role: 'user',
                        content: 'Please use a tool to continue the task, or call taskComplete if done.'
                    });
                } else {
                    this.log(`⚠️ No tool call or message received`);
                    break;
                }

            } catch (error: any) {
                this.log(`❌ Error in iteration ${iteration}: ${error.message}`);
                
                // Add error to context so agent can try alternative approach
                this.conversationHistory.push({
                    role: 'tool',
                    content: `Error: ${error.message}. Try a different approach.`
                });
            }
        }

        if (!taskCompleted) {
            finalSummary = `Task incomplete after ${iteration} iterations. Check the agent log for details.`;
            this.log(`\n⚠️ ${finalSummary}`);
        }

        this.log(`\n${'='.repeat(60)}`);
        this.log(`🏁 Agent task finished`);
        this.log(`${'='.repeat(60)}\n`);

        return finalSummary;
    }

    setConfig(config: Partial<AgentConfig>) {
        this.config = { ...this.config, ...config };
        this.log(`⚙️ Config updated: ${JSON.stringify(this.config, null, 2)}`);
    }

    getConfig(): AgentConfig {
        return { ...this.config };
    }

    private log(message: string) {
        this.outputChannel.appendLine(message);
        console.log(`[Agent] ${message}`);
    }

    showLog() {
        this.outputChannel.show();
    }

    dispose() {
        this.outputChannel.dispose();
    }
}


