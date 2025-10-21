# 🤖 Agent Forge - VS Code Extension

**GitHub Copilot-like functionality with your own local Ollama models + Full Autonomous Agent Mode!**

---

## 🎯 **!!!MISSION STATEMENT!!!**

### **!!!IK WIL GEWOON ALLE FUNCTIONALITEIT EN UITERLIJK VAN COPILOT, MAAR DAN GOED WERKEND MET LOCALE MODELS!!!**

**Dit is het DOEL van deze extensie:**
- ✅ **VOLLEDIGE Copilot UI/UX** - Niet half werk, maar 100% gelijkwaardig
- ✅ **ALLE Features** - Chat, inline suggestions, code completion, everything
- ✅ **100% LOCAL** - Met eigen Ollama modellen, geen cloud dependency
- ✅ **BETER dan Copilot** - Want jij hebt controle over je data en models

**Current Status:** 🚀 **v1.9.0 - 75% Copilot Parity Complete!**
- ✅ Slash Commands (/explain, /fix, /tests, etc.)
- ✅ Smart Action Buttons (Copy, Insert, New File)
- ✅ @ Mentions (@workspace, @file, @selection, etc.)
- ✅ # Context References (#file, #selection, #problems, etc.)
- ✅ **INLINE COMPLETIONS** - Ghost text as you type! 🎉
- ✅ **MULTI-FILE CONTEXT** - Understands imports & project structure! 🔗
- ✅ **CODE ACTIONS** - Lightbulb AI fixes & refactoring! 💡
- 🔴 Next: Symbol search, semantic understanding

**Target:** 🎯 100% feature parity met GitHub Copilot + local model voordelen

---

## ✨ Features

### 🎯 **NEW: INLINE CODE COMPLETIONS!** 🚀

**THE killer feature is here!** Ghost text suggestions as you type - just like GitHub Copilot!

- 👻 **Ghost Text** - AI suggestions appear in gray as you code
- ⌨️ **Tab to Accept** - Press Tab to insert suggestion
- ⎋ **Escape to Dismiss** - Reject with Escape
- 🎯 **Context-Aware** - Uses code before AND after cursor
- ⚡ **Fast & Cached** - 300ms debounce + LRU caching
- 🌈 **Multi-Language** - TypeScript, Python, Java, C++, Go, Rust, PHP, and 15+ more
- 🧠 **Smart** - Lower temperature for deterministic suggestions
- 🎛️ **Configurable** - Adjust context lines, model, enable/disable

**How to use:**
1. Start typing code
2. Wait ~300ms
3. Ghost text suggestion appears
4. Press **Tab** to accept or keep typing to ignore

**Settings:**
```json
{
  "agent-forge.inlineCompletions.enabled": true,
  "agent-forge.inlineCompletions.model": "qwen2.5-coder:7b", // Fast!
  "agent-forge.inlineCompletions.maxPrefixLines": 50,
  "agent-forge.inlineCompletions.maxSuffixLines": 20
}
```

### 🤖 **Full Autonomous Agent Mode**
- ✅ **True Auto-Execute** - No "Apply" buttons, just pure automation
- ✅ **Multi-Step Tasks** - Agent chains operations until task complete
- ✅ **8 Powerful Tools** - File ops, terminal, search, and more
- ✅ **Smart Iteration** - Agent learns and adapts (up to 50 iterations)
- ✅ **Complete Logging** - See exactly what the agent is doing
- ✅ **Better than Continue** - Actually works with local models!

**Quick Start:** Press `Ctrl+Shift+A` and type "Create a REST API" - watch the magic! ✨

### 🎯 Complete Workspace Integration
- ✅ **Chat Interface** - Sidebar panel zoals GitHub Copilot Chat
- ✅ **Slash Commands** - /explain, /fix, /tests, /docs, /refactor, /review
- ✅ **@ Mentions** - @workspace, @file, @selection, @terminal, @git, @errors
- ✅ **# Context References** - #file, #selection, #editor, #problems, #codebase
- ✅ **Smart Action Buttons** - Copy, Insert, New File op alle code blocks
- ✅ **File Operations** - Lees, schrijf, en edit files autonoom
- ✅ **Terminal Commands** - Voer commands uit vanuit de chat
- ✅ **Git Integration** - Status, diff, commits, branches
- ✅ **Context Menu** - Rechtsklik opties in editor
- ✅ **Keyboard Shortcuts** - Snelle toegang tot functies

### 💬 Chat Capabilities
- ✅ Multi-turn conversations met history
- ✅ Slash commands voor specialized tasks (/explain, /fix, /tests)
- ✅ @ Mentions voor context injection (@workspace, @file, @git)
- ✅ # References voor precise context (#selection, #problems, #editor)
- ✅ Smart action buttons op code blocks (Copy, Insert, New File)
- ✅ Code explanations met context awareness
- ✅ Bug analysis en automated fixes
- ✅ Refactoring suggestions
- ✅ Test generation
- ✅ File search en editing

### 🛠️ Tool Access
De AI kan autonoom:
- Files lezen en schrijven
- Terminal commands uitvoeren
- Git operations doen
- Door workspace zoeken
- Multi-file refactoring

## 📦 Installatie

### Vereisten

1. **VS Code** >= 1.85.0
2. **Node.js** >= 18.0.0
3. **Ollama** draaiend op `localhost:11434`

### Stap 1: Installeer Dependencies

```bash
cd /home/flip/agent-forge-extension
npm install
```

### Stap 2: Compile TypeScript

```bash
npm run compile
```

### Stap 3: Package Extension

```bash
npm install -g @vscode/vsce
vsce package
```

Dit maakt een `.vsix` bestand.

### Stap 4: Installeer in VS Code

```bash
# Optie A: Via command line
code --install-extension agent-forge-1.0.0.vsix

# Optie B: Via VS Code UI
# 1. Open VS Code
# 2. Ga naar Extensions (Ctrl+Shift+X)
# 3. Click op "..." menu
# 4. Selecteer "Install from VSIX..."
# 5. Kies het .vsix bestand
```

### Stap 5: Configureer

Open VS Code settings (`Ctrl+,`) en zoek naar "Agent Forge":

```json
{
  "agent-forge.ollamaUrl": "http://localhost:11434",
  "agent-forge.defaultModel": "qwen2.5-coder-14b-instruct-q4_k_m",
  "agent-forge.temperature": 0.7,
  "agent-forge.enableFileOps": true,
  "agent-forge.enableTerminal": true,
  "agent-forge.autoCommit": false
}
```

## 🚀 Quick Start

### Agent Mode (New!)

1. **Press `Ctrl+Shift+A`** (or `Cmd+Shift+A` on Mac)
2. **Enter your task**: "Create a REST API with Express"
3. **Watch it execute** - No confirmation needed!
4. **Check the log**: View → Output → "Agent Forge Agent"

👉 **See [QUICK_START.md](./QUICK_START.md) for 5-minute tutorial**
📖 **Read [AGENT_MODE.md](./AGENT_MODE.md) for complete documentation**

### Regular Usage

### 💬 Chat Interface (Like GitHub Copilot Chat!)

1. **Open Chat**: Klik op robot icon in Activity Bar of druk `Ctrl+Shift+L`
2. **Use Context Features**: Type `/`, `@`, of `#` voor autocomplete
3. **Send Message**: Type je vraag en druk Enter

**🔥 NEW: Chat Context Features (v1.4.0 - v1.6.0)**

#### **Slash Commands** (Type `/` to see options)
```
/explain   - Explain selected code with detailed breakdown
/fix       - Fix problems in selected code automatically
/tests     - Generate unit tests for selected code
/docs      - Generate documentation comments
/refactor  - Refactor code for better quality
/review    - Review code quality and suggest improvements
/clear     - Clear chat history
/help      - Show all available commands
```

#### **@ Mentions** (Type `@` to reference context)
```
@workspace  - Include entire workspace structure and files
@file       - Reference active file content
@selection  - Include currently selected code
@terminal   - Reference last terminal output
@git        - Include git status, staged changes, diffs
@errors     - Include current errors/warnings from VS Code
```

#### **# Context References** (Type `#` for precise context)
```
#file              - Reference specific file by name (prompts for filename)
#selection         - Current selection with line numbers
#editor            - Full active editor content + cursor position
#problems          - Problems/diagnostics in current file
#terminalSelection - Selected text from terminal
#codebase          - Search entire codebase by pattern
```

**Smart Action Buttons on Code Blocks:**
- **📋 Copy** - Copy code to clipboard
- **➕ Insert** - Insert code at cursor position
- **📄 New File** - Create new file with code

**Example Workflows:**
```
# Using slash commands
/explain           → Explains your selected code
/fix               → Fixes bugs in selection
/tests             → Generates unit tests

# Using @ mentions
@workspace What files handle authentication?
@git What changed in the last commit?
@errors Fix all TypeScript errors

# Using # references
Fix #selection
What's wrong with #problems
#editor what does this file do?
#codebase show me all TypeScript files

# Combining features
/explain @selection with #problems context
/tests for #file utils.ts
/fix #selection using @git changes
```

### Context Menu Commands

**Rechtsklik op geselecteerde code:**

- **Explain Code** (`Ctrl+Shift+E`) - Krijg uitgebreide uitleg
- **Refactor Code** - Verbeter code quality
- **Generate Tests** - Maak test suite
- **Fix Bug** - Analyseer en fix bugs

### Command Palette

Druk `Ctrl+Shift+P` en type:

- `Agent Forge: Open Chat`
- `Agent Forge: Select Model`
- `Agent Forge: Run Terminal Command`

## 🎨 Screenshots

```
┌─────────────────────────────────┐
│  🤖 Agent Forge             │
├─────────────────────────────────┤
│  👋 Hi! I'm Agent Forge...  │
│                                 │
│  👤 Read app/main.py and add   │
│     logging to all functions    │
│                                 │
│  🤖 I'll help you with that... │
│     [Reading file...]           │
│     [Writing changes...]        │
│     ✅ Done! Added logging...  │
├─────────────────────────────────┤
│  Ask me anything... [Send]      │
└─────────────────────────────────┘
```

## ⚙️ Configuratie

### Settings

| Setting | Default | Beschrijving |
|---------|---------|--------------|
| `ollamaUrl` | `http://localhost:11434` | Ollama API endpoint |
| `defaultModel` | `qwen2.5-coder-14b-instruct-q4_k_m` | Standaard model |
| `temperature` | `0.7` | Model temperature (0-1) |
| `enableFileOps` | `true` | Sta file operations toe |
| `enableTerminal` | `true` | Sta terminal commands toe |
| `autoCommit` | `false` | Auto-commit AI changes |

### Beschikbare Modellen

- `hf.co/unsloth/Qwen3-Coder-30B-A3B-Instruct-GGUF:Q4_K_M` (Beste kwaliteit)
- `qwen2.5-coder-14b-instruct-q4_k_m` (Gebalanceerd)
- `qwen2.5-coder:7b` (Snelst)
- `mistral-nemo:latest` (Alternatief)

## 🎯 Use Cases

### 1. Code Refactoring

```
User: Refactor app/services/voice-training/audio_receiver.py to use async/await

AI: [Reads file, analyzes, rewrites with async, shows diff, asks confirmation]

User: yes

AI: [Writes file, shows summary]
```

### 2. Bug Fixing

```
User: This function crashes when input is empty. Fix it.
[Select buggy code]

AI: [Analyzes, identifies null pointer issue, provides fixed version]
```

### 3. Test Generation

```
User: Generate pytest tests for the audio codec module

AI: [Reads module, generates comprehensive tests with edge cases, creates test file]
```

### 4. Multi-File Refactor

```
User: Refactor all services in app/services/ to use dependency injection

AI: [Scans directory, plans changes, edits multiple files, shows summary]
```

## 🆚 Vergelijking met GitHub Copilot

| Feature | Agent Forge | GitHub Copilot |
|---------|---------------|----------------|
| Chat Interface | ✅ | ✅ |
| File Operations | ✅ | ✅ |
| Terminal Commands | ✅ | ✅ |
| Git Integration | ✅ | ✅ |
| Inline Suggestions | ⏭️ (v2.0) | ✅ |
| Tab Completion | ⏭️ (v2.0) | ✅ |
| Privacy | ✅ 100% Local | ❌ Cloud |
| Cost | ✅ Free | 💰 $10-20/m |
| Offline | ✅ | ❌ |
| Model Choice | ✅ Any Ollama | ❌ Fixed |

## 🔧 Development

### Build from Source

```bash
git clone /home/flip/agent-forge-extension
cd agent-forge-extension
npm install
npm run compile
```

### Watch Mode

```bash
npm run watch
```

### Test in Extension Host

1. Druk `F5` in VS Code
2. Extension host opent
3. Test de extension

### Package

```bash
vsce package
```

## 📚 Architecture

```
agent-forge-extension/
├── src/
│   ├── extension.ts              # Main entry point
│   ├── services/
│   │   ├── ollamaService.ts      # Ollama API wrapper
│   │   ├── fileService.ts        # File operations
│   │   ├── terminalService.ts    # Terminal commands
│   │   └── gitService.ts         # Git integration
│   └── views/
│       └── chatViewProvider.ts   # Chat webview
├── package.json                  # Extension manifest
└── tsconfig.json                # TypeScript config
```

## 🐛 Troubleshooting

### "Cannot connect to Ollama"

```bash
# Check if Ollama is running
systemctl status ollama

# Test Ollama API
curl http://localhost:11434/api/tags
```

### "Model not found"

```bash
# List available models
ollama list

# Pull the model
ollama pull qwen2.5-coder-14b-instruct-q4_k_m
```

### "Extension not activated"

1. Check VS Code developer console: `Help > Toggle Developer Tools`
2. Look for errors in Console tab
3. Check Output panel: `View > Output` → Select "Agent Forge"

### "Commands not working"

1. Reload window: `Ctrl+Shift+P` → "Developer: Reload Window"
2. Check if extension is enabled: Extensions → Agent Forge
3. Check permissions in settings

## 🔒 Security & Privacy

- ✅ **100% Local** - Alles draait op je eigen machine
- ✅ **No Telemetry** - Geen data verzonden naar cloud
- ✅ **Configurable** - Schakel file/terminal access uit als je wilt
- ✅ **Open Source** - Volledige code visibility

### Permissions

De extension vraagt toestemming voor:
- **File System** - Voor file operations
- **Terminal** - Voor command execution
- **Git** - Voor git operations

Alle permissions kunnen uitgeschakeld worden in settings.

## 🎓 Tips & Tricks

### Beste Practices

1. **Start met Context** - Geef de AI context over je project
2. **Wees Specifiek** - Duidelijke instructies = betere resultaten
3. **Itereer** - Build op eerdere responses
4. **Review Changes** - Check altijd AI-generated code

### Performance

- **Gebruik Qwen2.5-14B** voor dagelijks werk (snelst)
- **Gebruik Qwen3-30B** voor complexe refactors (beste kwaliteit)
- **Clear History** als responses traag worden

### Shortcuts

- `Ctrl+Shift+L` - Open chat
- `Ctrl+Shift+E` - Explain selected code
- `Ctrl+Shift+P` → "Agent Forge" - All commands

## 📖 Examples

### Example 1: Add Logging

```
User: Add comprehensive logging to app/backend/main.py

AI: I'll add logging. Let me read the file first.
    [Reads file]
    [Adds import logging, configures logger, adds log statements]
    ✅ Added logging to 12 functions
```

### Example 2: Create New Feature

```
User: Create a new REST endpoint /api/health that checks database 
      and returns JSON with status

AI: I'll create the health endpoint. 
    [Reads main.py to understand structure]
    [Adds new route with database check]
    [Adds proper error handling]
    ✅ Created /api/health endpoint in app/backend/main.py
```

### Example 3: Fix Failing Tests

```
User: Run pytest and fix any failing tests

AI: [Executes pytest]
    Found 3 failing tests in test_audio_codec.py
    [Reads test file and source]
    [Identifies issues]
    [Fixes source code]
    [Runs tests again]
    ✅ All tests passing now
```

## 🚀 Roadmap

### v1.0 (Current)
- ✅ Chat interface
- ✅ File operations
- ✅ Terminal commands
- ✅ Git integration
- ✅ Context menu commands

### v2.0 (Planned)
- ⏭️ Inline code suggestions
- ⏭️ Tab completion
- ⏭️ Diff viewer
- ⏭️ Multi-model support
- ⏭️ Custom prompts/templates

## 📜 License

MIT License - See LICENSE file

## 🙏 Credits

- **Ollama** - Local LLM runtime
- **Qwen** - Code models
- **VS Code** - Extension API

---

**Made with ❤️ for local AI development**

**Questions?** Open an issue or check the documentation.
