# 🤖 Agent Mode - Full Autonomous AI Assistant

## Overview

Agent Mode transforms Agent Forge into a fully autonomous coding assistant that can:

- ✅ **Create and edit files** automatically
- ✅ **Execute terminal commands** without confirmation  
- ✅ **Search and analyze** your codebase
- ✅ **Chain multiple operations** to complete complex tasks
- ✅ **Work iteratively** until the task is complete

**No "Apply" buttons. No manual confirmation. Just pure automation.** 🚀

## Key Features

### 🎯 Fully Autonomous
Unlike Continue or other extensions that require you to approve each action, Agent Mode executes everything automatically when `autoApprove` is enabled.

### 🔧 Native VS Code Integration
- Direct file system access via VS Code API
- Native terminal integration (no hacks!)
- Proper error handling and logging
- Real-time progress notifications

### 🧠 Smart Tool Usage
The agent knows when to use the right tool:
- Reads files before editing them
- Lists directories before searching
- Verifies changes after writing
- Chains operations intelligently

### 📊 Complete Transparency
- Full execution log in dedicated Output Channel
- Progress notifications during execution
- Clear success/error messages
- Iteration counter to track progress

## Getting Started

### 1. Prerequisites

Make sure you have:
- Ollama running on `http://192.168.1.26:11434` (or update settings)
- A compatible model installed (recommended: `mistral-nemo:12b-instruct-2407-q6_K`)
- VS Code 1.85.0 or later

### 2. Enable Agent Mode

Agent mode is enabled by default with these settings:

```json
{
  "agent-forge.agentAutoApprove": true,
  "agent-forge.agentMaxIterations": 15,
  "agent-forge.enableFileOps": true,
  "agent-forge.enableTerminal": true
}
```

### 3. Launch Agent

**Option 1: Command Palette**
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Agent Forge: Agent Mode"
3. Enter your task

**Option 2: Keyboard Shortcut**
- Press `Ctrl+Shift+A` (or `Cmd+Shift+A` on Mac)
- Enter your task

**Option 3: From Chat View**
- Click the robot icon (🤖) in the Agent Forge chat view

## Example Tasks

### Simple Tasks

```
Create a hello.js file that prints "Hello World"
```

The agent will:
1. Use `writeFile` to create `hello.js`
2. Write the code
3. Call `taskComplete` when done

### Medium Complexity

```
Add TypeScript types to all functions in src/utils.ts
```

The agent will:
1. Use `readFile` to read `src/utils.ts`
2. Analyze the functions
3. Use `editFile` to add types
4. Verify the changes

### Complex Tasks

```
Create a REST API with Express:
- POST /api/users (create user)
- GET /api/users/:id (get user)
- Include input validation
- Add unit tests
```

The agent will:
1. Check workspace structure with `getWorkspaceInfo`
2. Create necessary files (routes, controllers, tests)
3. Install dependencies if needed (`npm install express`)
4. Chain multiple `writeFile` operations
5. Verify everything works

## Available Tools

The agent has access to these tools:

| Tool | Description | Auto-approved? |
|------|-------------|----------------|
| `readFile` | Read file contents | ✅ Yes |
| `writeFile` | Create or overwrite file | ✅ Yes |
| `editFile` | Replace text in file | ✅ Yes |
| `listFiles` | List directory contents | ✅ Yes |
| `searchFiles` | Search for text in files | ✅ Yes |
| `runCommand` | Execute terminal command | ⚠️ With `autoApprove` |
| `getWorkspaceInfo` | Get workspace metadata | ✅ Yes |
| `taskComplete` | Signal task completion | ✅ Yes |

## Configuration

### Agent Settings

Access via: `Ctrl+Shift+P` → "Agent Forge: Configure Agent"

**Auto-approve** (default: ON)
- When enabled: Agent executes all tools automatically
- When disabled: You must approve each action

**Max iterations** (default: 15)
- Maximum number of agent reasoning loops
- Range: 5-50
- Increase for complex tasks, decrease for simple ones

**Temperature** (default: 0.1)
- Controls model creativity
- 0.0 = deterministic, 1.0 = creative
- Keep low (0.1-0.3) for reliable tool usage

### VS Code Settings

```json
{
  // Agent behavior
  "agent-forge.agentAutoApprove": true,
  "agent-forge.agentMaxIterations": 15,
  
  // Permissions
  "agent-forge.enableFileOps": true,
  "agent-forge.enableTerminal": true,
  
  // Ollama configuration
  "agent-forge.ollamaUrl": "http://192.168.1.26:11434",
  "agent-forge.defaultModel": "mistral-nemo:12b-instruct-2407-q6_K",
  "agent-forge.temperature": 0.1
}
```

## Recommended Models

### For Agent Mode

| Model | Size | VRAM | Speed | Reliability |
|-------|------|------|-------|-------------|
| **Mistral Nemo 12B** ⭐ | 12B | ~7GB | Fast | ⭐⭐⭐⭐⭐ |
| Mistral 7B v0.3 | 7B | ~4GB | Fastest | ⭐⭐⭐⭐ |
| Mistral 14B v0.2 | 14B | ~8GB | Medium | ⭐⭐⭐⭐⭐ |
| Qwen3 Coder 30B | 30B | ~18GB | Slow | ⭐⭐⭐⭐ |

**Recommended:** Mistral Nemo 12B has the best balance of speed and reliability.

Install with:
```bash
ollama pull mistral-nemo:12b-instruct-2407-q6_K
```

## Safety Considerations

### ⚠️ Auto-approve is Powerful

With `autoApprove: true`, the agent can:
- Create, modify, or delete any file
- Execute any terminal command
- Install packages
- Modify configuration

**Only use in trusted workspaces!**

### 🛡️ Safety Features

1. **File operations require permission** via `enableFileOps` setting
2. **Terminal requires permission** via `enableTerminal` setting
3. **All actions logged** in "Agent Forge Agent" output channel
4. **Iteration limit** prevents infinite loops
5. **Error handling** stops agent if tools fail

### 🚦 Best Practices

- ✅ Review agent log after completion
- ✅ Use version control (git) to track changes
- ✅ Start with small tasks to test behavior
- ✅ Set appropriate `maxIterations` for task complexity
- ❌ Don't run in production codebases without review
- ❌ Don't execute agent tasks that modify critical config

## Debugging

### View Agent Log

**Option 1:** 
- `Ctrl+Shift+P` → "Agent Forge: Configure Agent" → "View Agent Log"

**Option 2:**
- View → Output → Select "Agent Forge Agent"

The log shows:
- Each iteration with timestamp
- Tool calls and arguments
- Tool results
- Errors and retries
- Task completion summary

### Common Issues

**Agent doesn't execute tools**
- Check that `enableFileOps` and `enableTerminal` are enabled
- Verify Ollama connection: `Ctrl+Shift+P` → "Agent Forge: Select Model"
- Try Mistral Nemo instead of other models

**Agent stops before completing**
- Increase `maxIterations` if task is complex
- Check agent log for error messages
- Simplify the task description

**Tool calls fail**
- Check file paths (use relative paths)
- Verify workspace folder is open
- Check permissions on files/directories

## Comparison with Continue

| Feature | Agent Forge Agent | Continue |
|---------|---------------------|----------|
| Auto-execute tools | ✅ True auto-approve | ⚠️ Still shows "Apply" |
| Terminal support | ✅ Native integration | ❌ Filepath errors |
| File operations | ✅ Direct FS access | ⚠️ Via diff view |
| Configuration | ✅ Simple settings | ⚠️ Complex YAML |
| Ollama support | ✅ Optimized | ⚠️ Limited |
| Error handling | ✅ Automatic retry | ❌ Stops on error |
| Progress tracking | ✅ Real-time | ⚠️ Limited |
| Logging | ✅ Dedicated channel | ⚠️ Generic output |

## Advanced Usage

### Custom System Prompts

The agent uses a default system prompt that can be customized by modifying `agentService.ts`:

```typescript
private buildSystemPrompt(): string {
    return `Your custom prompt here...`;
}
```

### Adding New Tools

Add tools by modifying the `defineTools()` method:

```typescript
{
    name: 'myCustomTool',
    description: 'What the tool does',
    parameters: {
        type: 'object',
        properties: {
            param1: { type: 'string', description: '...' }
        },
        required: ['param1']
    }
}
```

Then implement in `executeTool()`:

```typescript
case 'myCustomTool':
    result = await this.myCustomToolImpl(args.param1);
    break;
```

### Programmatic Usage

Use the agent service in your own code:

```typescript
import { AgentService } from './services/agentService';

const agent = new AgentService(ollama, fileService, terminalService);
agent.setConfig({ autoApprove: true, maxIterations: 20 });

const summary = await agent.executeTask('Create a React component', (progress) => {
    console.log(progress);
});
```

## Roadmap

Future enhancements:
- [ ] Git integration (commit, push, branches)
- [ ] Multi-file diff preview before execution
- [ ] Task templates for common operations
- [ ] Agent learning from previous tasks
- [ ] Integration with external APIs
- [ ] Web browsing capability
- [ ] Code review and analysis tools

## Support

For issues or questions:
1. Check the agent log for errors
2. Review this documentation
3. Open an issue on GitHub
4. Check VS Code developer console (`Help → Toggle Developer Tools`)

## License

MIT License - See LICENSE file for details

---

**Built with ❤️ to be better than Continue** 🚀
