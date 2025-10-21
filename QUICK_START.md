# 🚀 Quick Start Guide - Agent Mode

## In 5 Minutes

### Step 1: Install & Setup (2 min)

1. **Open the extension folder** in VS Code
2. **Press F5** to launch Extension Development Host
3. A new VS Code window opens with the extension loaded

### Step 2: First Agent Task (3 min)

1. In the new window, press **`Ctrl+Shift+A`** (Windows/Linux) or **`Cmd+Shift+A`** (Mac)

2. Enter a simple task:
   ```
   Create a file called test.js that exports a function to add two numbers
   ```

3. **Watch the magic happen!** 🎩✨
   - The agent will automatically create the file
   - No "Apply" button to click
   - File appears in your workspace instantly

4. **Check the log**:
   - Go to `View → Output`
   - Select `Agent Forge Agent` from dropdown
   - See exactly what the agent did

## Common Tasks to Try

### 1. Create Files
```
Create a README.md with project documentation
```

### 2. Edit Existing Files
```
Add JSDoc comments to all functions in src/utils.js
```

### 3. Multiple Files
```
Create a simple Express REST API with:
- server.js (main file)
- routes/users.js (user routes)
- package.json (with express dependency)
```

### 4. Code Analysis
```
Find all TODO comments in the project and list them
```

### 5. Refactoring
```
Convert all var declarations to const/let in src/
```

## Settings

Access via **Command Palette** (`Ctrl+Shift+P`) → **"Agent Forge: Configure Agent"**

- **Auto-approve**: ON/OFF (currently: ON by default)
- **Max iterations**: 5-50 (currently: 15)
- **View Agent Log**: See what the agent is doing

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+A` | Launch Agent Mode |
| `Ctrl+Shift+L` | Open Chat View |
| `Ctrl+Shift+E` | Explain Selected Code |

## Tips

✅ **Use relative paths**: "src/test.js" instead of full paths

✅ **Be specific**: More details = better results

✅ **Check the log**: See what the agent is thinking

✅ **Start simple**: Test with small tasks first

⚠️ **Use version control**: Agent can modify files automatically

⚠️ **Trusted workspaces**: Only use in projects you trust

## Troubleshooting

**Nothing happens?**
- Check Ollama is running: http://192.168.1.26:11434
- View the agent log for errors
- Verify `enableFileOps` is enabled in settings

**Agent stops early?**
- Increase max iterations in settings
- Simplify the task
- Check if there were errors in the log

**Wrong model?**
- `Ctrl+Shift+P` → "Agent Forge: Select Model"
- Choose `mistral-nemo:12b-instruct-2407-q6_K` (recommended)

## What's Next?

📖 Read the full documentation: [AGENT_MODE.md](./AGENT_MODE.md)

🎯 Try complex multi-step tasks

⚙️ Customize agent settings for your workflow

🚀 Build something amazing with your AI assistant!

---

**Need Help?** Check the agent log first, then refer to AGENT_MODE.md for detailed documentation.
