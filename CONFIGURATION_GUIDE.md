# Configuration Guide

## Overview

Agent Forge v1.0 introduces a powerful configuration system that allows you to:

- **Choose your AI model** - Select from multiple Ollama models
- **Load custom guidelines** - Use project-specific instructions from a file
- **Enable/disable tools** - Control which agent tools are available
- **Active file association** - Automatic context from your current file
- **Hot reload** - Update configuration without restarting VS Code

## Quick Access

### Status Bar

Look for the status bar item in the bottom right:

```
$(robot) mistral-nemo | 7 tools
```

Click it to open the configuration menu.

### Keyboard Shortcuts

- `Ctrl+Shift+,` - Open configuration UI
- `Ctrl+Shift+R` - Reload configuration

### Command Palette

- `Agent Forge: Configuration`
- `Agent Forge: Reload Configuration`
- `Agent Forge: Select Model`

## Configuration Options

### 1. Model Selection

Choose which Ollama model to use:

**Available Models:**
- `mistral-nemo:12b-instruct-2407-q6_K` (recommended)
- `mistral:7b-instruct-v0.3-q4_k_m`
- `mistral:14b-instruct-v0.2-q4_k_m`
- `qwen2.5-coder:7b`
- `qwen2.5-coder-14b-instruct-q4_k_m`
- `hf.co/unsloth/Qwen3-Coder-30B-A3B-Instruct-GGUF:Q4_K_M`

**How to Change:**
1. Click status bar item → "Model"
2. Select your preferred model
3. ✅ Confirmation shown

**Via Settings:**
```json
{
  "agent-forge.defaultModel": "mistral-nemo:12b-instruct-2407-q6_K"
}
```

### 2. Guidelines File

Load project-specific instructions from a file.

**Supported Formats:**
- Markdown (`.md`)
- Text (`.txt`)

**How to Set:**
1. Click status bar item → "Guidelines"
2. Choose from workspace files or browse
3. File content automatically loaded

**Via Settings:**
```json
{
  "agent-forge.guidelinesFile": "docs/AI_GUIDELINES.md"
}
```

**Example Guidelines File:**

```markdown
# Project Guidelines

## Code Style
- Use TypeScript strict mode
- Prefer async/await over promises
- Always add JSDoc comments

## Testing
- Write unit tests for all functions
- Use Jest for testing
- Aim for 80% coverage

## Architecture
- Follow repository pattern
- Use dependency injection
- Keep functions under 50 lines
```

**When Guidelines Are Used:**
- Agent mode task execution
- Inline chat (Ctrl+I)
- Quick actions (fix, explain, optimize, document)
- All code generation

### 3. Custom Instructions

Quick instructions without a file.

**How to Set:**
1. Click status bar item → "Custom Instructions"
2. Enter your instructions
3. ✅ Saved to workspace settings

**Example:**
```
Always use TypeScript strict mode.
Add error handling to all async functions.
```

**Via Settings:**
```json
{
  "agent-forge.customInstructions": "Always use TypeScript strict mode"
}
```

### 4. Tools Configuration

Enable or disable specific agent tools.

**Available Tools:**
- `readFile` - Read file contents
- `writeFile` - Create or overwrite files
- `editFile` - Edit existing files
- `listFiles` - List directory contents
- `searchFiles` - Search text in files
- `runCommand` - Execute terminal commands (⚠️ use with caution)
- `getWorkspaceInfo` - Get workspace information
- `taskComplete` - Mark task as complete

**How to Configure:**
1. Click status bar item → "Tools"
2. Check/uncheck tools
3. ✅ Changes applied immediately

**Via Settings:**
```json
{
  "agent-forge.enabledTools": [
    "readFile",
    "writeFile",
    "editFile",
    "listFiles",
    "searchFiles",
    "getWorkspaceInfo",
    "taskComplete"
  ]
}
```

**Security Note:**
- `runCommand` allows terminal access
- Only enable if you trust the AI model
- Auto-approve mode requires extra caution

### 5. Auto-Approve

Control whether agent executes tools automatically.

**Options:**
- ✅ **ON** (default) - Agent executes all tools without asking
- ❌ **OFF** - Agent asks for confirmation before each tool

**How to Toggle:**
1. Click status bar item → "Auto-approve"
2. Toggle ON/OFF

**Via Settings:**
```json
{
  "agent-forge.agentAutoApprove": true
}
```

**Best Practices:**
- Use ON for trusted tasks
- Use OFF for sensitive operations
- Check enabled tools when using ON

### 6. Max Iterations

Set maximum number of agent iterations.

**Range:** 5 - 50
**Default:** 15

**How to Set:**
1. Click status bar item → "Max Iterations"
2. Enter number (5-50)

**Via Settings:**
```json
{
  "agent-forge.agentMaxIterations": 15
}
```

**Guidelines:**
- 5-10: Quick tasks
- 15-20: Medium complexity
- 20-30: Complex projects
- 30-50: Large refactoring

### 7. Temperature

Control AI creativity vs determinism.

**Range:** 0.0 - 1.0
**Default:** 0.7

**How to Set:**
1. Click status bar item → "Temperature"
2. Enter value (0.0-1.0)

**Via Settings:**
```json
{
  "agent-forge.temperature": 0.7
}
```

**Guidelines:**
- 0.0-0.3: Deterministic (debugging, refactoring)
- 0.4-0.7: Balanced (general coding)
- 0.8-1.0: Creative (brainstorming, new features)

## Active File Context

The AI automatically receives context from your active file:

**Included Information:**
- File name and language
- Total line count
- Selected code (if any)
- 5 lines before/after cursor (if no selection)

**Example Context:**
```
Current File: extension.ts
Language: typescript
Lines: 366

Cursor Context (lines 195-205):
```typescript
    context.subscriptions.push(
        vscode.commands.registerCommand('agent-forge.selectModel', async () => {
            await configManager.selectModel();
        })
    );
```

**Benefits:**
- AI understands file type
- Knows language-specific conventions
- Can reference nearby code
- Better context for suggestions

## Hot Reload

Update configuration without restarting VS Code.

**How to Reload:**
1. Click status bar item → "Reload Configuration"
2. Or press `Ctrl+Shift+R`
3. ✅ Confirmation shown

**What Gets Reloaded:**
- Model selection
- Guidelines file
- Custom instructions
- Tool configuration
- Auto-approve setting
- Max iterations
- Temperature

**When to Reload:**
- After editing guidelines file
- After changing settings.json
- After installing new Ollama model
- To verify configuration changes

## Configuration UI

The configuration UI provides a visual interface for all settings.

### Opening the UI

**Methods:**
1. Click status bar item
2. Press `Ctrl+Shift+,`
3. Command palette: "Agent Forge: Configuration"

### UI Features

**Quick Pick Menu:**
```
┌─────────────────────────────────────────────┐
│ Configure Agent Forge                      │
├─────────────────────────────────────────────┤
│ $(gear) Model                                │
│   Current: mistral-nemo:12b-instruct-2407... │
│   Change the AI model                        │
│                                              │
│ $(tools) Tools                               │
│   7 enabled                                  │
│   Enable/disable agent tools                 │
│                                              │
│ $(book) Guidelines                           │
│   docs/AI_GUIDELINES.md                      │
│   Set custom guidelines file                 │
│                                              │
│ $(note) Custom Instructions                  │
│   Set                                        │
│   Add custom instructions                    │
│                                              │
│ $(debug-restart) Auto-approve                │
│   ON                                         │
│   Toggle automatic tool execution            │
│                                              │
│ $(symbol-numeric) Max Iterations             │
│   15                                         │
│   Set maximum agent iterations               │
│                                              │
│ $(thermometer) Temperature                   │
│   0.7                                        │
│   Set model temperature                      │
│                                              │
│ $(refresh) Reload Configuration              │
│   Reload all settings                        │
│   Hot reload without restart                 │
└─────────────────────────────────────────────┘
```

## Use Cases

### Personal Projects

```json
{
  "agent-forge.defaultModel": "mistral-nemo:12b-instruct-2407-q6_K",
  "agent-forge.agentAutoApprove": true,
  "agent-forge.enabledTools": ["readFile", "writeFile", "editFile", "listFiles", "searchFiles", "runCommand", "getWorkspaceInfo", "taskComplete"]
}
```

### Team Projects

Create `AI_GUIDELINES.md`:
```markdown
# Team Guidelines

- Use TypeScript strict mode
- Follow company coding standards
- Add comprehensive error handling
- Write unit tests for all functions
```

```json
{
  "agent-forge.guidelinesFile": "AI_GUIDELINES.md",
  "agent-forge.enabledTools": ["readFile", "writeFile", "editFile", "listFiles", "searchFiles", "getWorkspaceInfo", "taskComplete"]
}
```

### Open Source

```json
{
  "agent-forge.guidelinesFile": "CONTRIBUTING.md",
  "agent-forge.agentAutoApprove": false,
  "agent-forge.enabledTools": ["readFile", "listFiles", "searchFiles", "getWorkspaceInfo"]
}
```

### Learning/Exploration

```json
{
  "agent-forge.defaultModel": "qwen2.5-coder:7b",
  "agent-forge.temperature": 0.9,
  "agent-forge.agentMaxIterations": 30
}
```

## Troubleshooting

### Guidelines Not Loading

**Issue:** Guidelines file not found

**Solutions:**
1. Check file path (relative to workspace root)
2. Verify file exists
3. Try absolute path
4. Reload configuration (`Ctrl+Shift+R`)

### Tools Not Working

**Issue:** Tool calls failing

**Solutions:**
1. Check which tools are enabled
2. Verify auto-approve setting
3. Check Ollama model supports tool calling
4. Try reload configuration

### Model Not Found

**Issue:** Selected model unavailable

**Solutions:**
1. Verify model installed: `ollama list`
2. Pull model: `ollama pull mistral-nemo:12b-instruct-2407-q6_K`
3. Check Ollama URL in settings
4. Test connection with status bar

### Configuration Not Applying

**Issue:** Changes not taking effect

**Solutions:**
1. Press `Ctrl+Shift+R` to reload
2. Check settings.json saved
3. Verify workspace vs user settings
4. Restart VS Code if needed

## Advanced Configuration

### Per-Language Guidelines

Create language-specific guidelines:

```json
{
  "agent-forge.guidelinesFile": "guidelines/${languageId}.md"
}
```

**Supported via extensions in future versions*

### Multiple Profiles

Use VS Code profiles for different configurations:

1. Create profile: "AI Heavy" (all tools enabled)
2. Create profile: "AI Light" (read-only tools)
3. Switch profiles as needed

### Environment-Specific

```json
{
  "agent-forge.defaultModel": "mistral-nemo:12b-instruct-2407-q6_K",
  "agent-forge.ollamaUrl": "http://192.168.1.26:11434"
}
```

## Best Practices

### 1. Guidelines Organization

```
project/
├── docs/
│   ├── AI_GUIDELINES.md      # General guidelines
│   ├── AI_TYPESCRIPT.md      # TypeScript-specific
│   └── AI_TESTING.md         # Testing guidelines
└── .vscode/
    └── settings.json         # Reference main guidelines
```

### 2. Tool Safety

**Safe Tools (always enable):**
- readFile
- listFiles
- searchFiles
- getWorkspaceInfo
- taskComplete

**Caution Tools (enable as needed):**
- writeFile (creates files)
- editFile (modifies files)
- runCommand (terminal access)

### 3. Model Selection

**For Speed:**
- `mistral:7b-instruct-v0.3-q4_k_m`
- `qwen2.5-coder:7b`

**For Quality:**
- `mistral-nemo:12b-instruct-2407-q6_K` ⭐ Recommended
- `qwen2.5-coder-14b-instruct-q4_k_m`

**For Power:**
- `hf.co/unsloth/Qwen3-Coder-30B-A3B-Instruct-GGUF:Q4_K_M`

### 4. Temperature Tuning

**Task-Based:**
```
Bug fixes:      0.1-0.3
Refactoring:    0.3-0.5
New features:   0.5-0.7
Exploration:    0.7-1.0
```

### 5. Iteration Limits

**Task-Based:**
```
Simple edits:    5-10
File creation:   10-15
Refactoring:     15-25
Complex tasks:   25-50
```

## Next Steps

1. ✅ Set up your model
2. ✅ Create guidelines file
3. ✅ Configure tools
4. ✅ Test with `Ctrl+I`
5. ✅ Try agent mode with `Ctrl+Shift+A`

**Need Help?**
- Check `QUICK_START.md` for tutorials
- See `AGENT_MODE.md` for agent details
- Read `QUICK_ACTIONS.md` for UI features
