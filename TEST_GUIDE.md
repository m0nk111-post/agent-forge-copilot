# 🧪 Agent Forge Extension - Test Guide

## ✅ Extension is Klaar om Te Testen!

Compilatie succesvol:
```
✅ out/extension.js
✅ out/services/
✅ out/views/
```

---

## 🚀 Methode 1: Development Mode (Aanbevolen)

Dit is de **snelste** manier om te testen tijdens development.

### Stap 1: Open Extension in VS Code

```bash
code /home/flip/agent-forge-extension
```

### Stap 2: Start Debug Mode

**Optie A: Via Keyboard**
- Druk `F5`

**Optie B: Via Menu**
- Run → Start Debugging
- Of: Debug icon in sidebar → "Run Extension"

**Optie C: Via Command Palette**
- `Ctrl+Shift+P` → "Debug: Start Debugging"

### Stap 3: Extension Development Host Opens

Een **nieuw VS Code venster** opent met de titel:
```
[Extension Development Host]
```

Dit is je test environment!

### Stap 4: Test de Extension

**In het nieuwe venster:**

#### A. Open Chat
- Druk `Ctrl+Shift+L`
- Of: Klik op robot icon 🤖 in Activity Bar (links)
- Of: `Ctrl+Shift+P` → "Agent Forge: Open Chat"

#### B. Test Chat Functionaliteit
```
Type in chat:
"Hello! Can you help me?"

AI should respond!
```

#### C. Test File Operations
```
Type in chat:
"List all files in this workspace"

AI should list files!
```

#### D. Test Context Menu
1. Open een .py of .js bestand
2. Selecteer wat code
3. Rechtsklik
4. Kies "Agent Forge" → "Explain Code" (of `Ctrl+Shift+E`)

#### E. Test Commands
- `Ctrl+Shift+P` → Type "Agent Forge"
- Je ziet alle commands:
  - Open Chat
  - Explain Code
  - Refactor Code
  - Generate Tests
  - Fix Bug
  - Run Terminal Command
  - Select Model

### Stap 5: Check Logs

**In het ORIGINELE VS Code venster (niet Extension Host):**

1. **Debug Console** (`Ctrl+Shift+Y`)
   - Zie console.log output van extension
   - Zie errors en warnings

2. **Problems Panel** (`Ctrl+Shift+M`)
   - TypeScript compile errors (should be 0!)

**In het Extension Development Host venster:**

1. **Output Panel** (`Ctrl+Shift+U`)
   - Select "Agent Forge" from dropdown
   - Zie extension output

2. **Developer Tools** (`Help → Toggle Developer Tools`)
   - Console tab voor webview errors

### Stap 6: Watch Mode (Optioneel maar Handig)

In een **nieuwe terminal**:
```bash
cd /home/flip/agent-forge-extension
npm run watch
```

Dit recompileert automatisch bij elke file change!
Na een change: Reload extension window (`Ctrl+R` in Extension Host)

---

## 📦 Methode 2: Installed Mode (Production Test)

Test de extension als echte gebruiker.

### Stap 1: Package Extension

```bash
cd /home/flip/agent-forge-extension
./setup.sh
```

Of handmatig:
```bash
npm run compile
npx vsce package
```

Dit maakt: `agent-forge-1.0.0.vsix`

### Stap 2: Installeer Extension

```bash
code --install-extension agent-forge-1.0.0.vsix
```

Of via VS Code UI:
1. Open Extensions (`Ctrl+Shift+X`)
2. Klik op `...` menu (top right)
3. "Install from VSIX..."
4. Selecteer `agent-forge-1.0.0.vsix`

### Stap 3: Reload VS Code

- `Ctrl+Shift+P` → "Developer: Reload Window"

### Stap 4: Configureer Settings

`Ctrl+,` → Search "Agent Forge":

```json
{
  "agent-forge.ollamaUrl": "http://localhost:11434",
  "agent-forge.defaultModel": "qwen2.5-coder-14b-instruct-q4_k_m",
  "agent-forge.enableFileOps": true,
  "agent-forge.enableTerminal": true
}
```

### Stap 5: Test!

Same als Development Mode, maar nu in je normale VS Code!

---

## 🧪 Test Scenarios

### Test 1: Basic Chat

```
1. Open chat (Ctrl+Shift+L)
2. Type: "Hello!"
3. ✅ Check: AI responds

Expected: Greeting message
```

### Test 2: File Reading

```
1. Create test file: /tmp/test.txt with "Hello World"
2. In chat: "Read the file /tmp/test.txt"
3. ✅ Check: AI reads and shows content

Expected: "The file contains: Hello World"
```

### Test 3: Code Explanation

```
1. Open a .py file
2. Select some code
3. Press Ctrl+Shift+E (or right-click → Explain Code)
4. ✅ Check: Output panel shows explanation

Expected: Detailed code explanation
```

### Test 4: Refactoring

```
1. Open a .py file
2. Select messy code
3. Right-click → "Agent Forge: Refactor Code"
4. ✅ Check: Code is replaced with refactored version

Expected: Cleaner code in editor
```

### Test 5: Terminal Command

```
1. Open chat
2. Type: "Run the command 'ls -la'"
3. ✅ Check: Terminal opens and runs command

Expected: Terminal executes ls -la
```

### Test 6: Git Operations

```
1. Open a git repo
2. In chat: "Show me the git status"
3. ✅ Check: AI shows git status

Expected: Git status output
```

### Test 7: Model Selection

```
1. Ctrl+Shift+P → "Agent Forge: Select Model"
2. Choose different model
3. ✅ Check: Model changes

Expected: Confirmation message
```

### Test 8: Conversation History

```
1. Chat: "My name is John"
2. Chat: "What's my name?"
3. ✅ Check: AI remembers "John"

Expected: "Your name is John"
```

---

## 🐛 Troubleshooting

### Problem: Extension Not Loading

**Check:**
```bash
# In original VS Code, check Debug Console (Ctrl+Shift+Y)
# Look for activation errors
```

**Fix:**
- Reload window (`Ctrl+R` in Extension Host)
- Check `out/` folder exists: `ls -la /home/flip/agent-forge-extension/out/`

### Problem: "Cannot connect to Ollama"

**Check:**
```bash
# Test Ollama
curl http://localhost:11434/api/tags

# Check status
systemctl status ollama
```

**Fix:**
```bash
sudo systemctl start ollama
```

### Problem: Commands Not Appearing

**Check:**
- `Ctrl+Shift+P` → Type "Developer: Show Running Extensions"
- Look for "agent-forge" in list

**Fix:**
- Reload window
- Check extension is activated (should auto-activate on startup)

### Problem: Chat Not Opening

**Check:**
- Click robot icon in Activity Bar
- Check if icon appears (left sidebar)

**Fix:**
- `Ctrl+Shift+P` → "Agent Forge: Open Chat"
- Check Debug Console for errors

### Problem: TypeScript Errors

**Check:**
```bash
cd /home/flip/agent-forge-extension
npm run compile
```

**Fix:**
```bash
# Clean and rebuild
rm -rf out/
npm run compile
```

### Problem: Webview Not Loading

**Check:**
- Open Dev Tools in Extension Host: `Help → Toggle Developer Tools`
- Check Console tab for errors

**Fix:**
- Check `chatViewProvider.ts` for HTML syntax errors

---

## 📊 Checklist

### Pre-Test
- [ ] Ollama is running (`curl http://localhost:11434/api/tags`)
- [ ] Extension compiled (`ls out/extension.js`)
- [ ] VS Code version >= 1.85.0 (`code --version`)

### Basic Functionality
- [ ] Extension activates
- [ ] Chat opens (Ctrl+Shift+L)
- [ ] AI responds to messages
- [ ] Conversation history works
- [ ] Robot icon appears in Activity Bar

### File Operations
- [ ] Read file works
- [ ] Write file works
- [ ] Search files works
- [ ] List files works

### Editor Integration
- [ ] Context menu commands appear
- [ ] Explain code works (Ctrl+Shift+E)
- [ ] Refactor code works
- [ ] Generate tests works
- [ ] Fix bug works

### Terminal Integration
- [ ] Run command works
- [ ] Terminal opens
- [ ] Command executes

### Git Integration
- [ ] Git status works
- [ ] Git diff works
- [ ] Git operations return results

### Configuration
- [ ] Settings appear in VS Code settings
- [ ] Model selection works
- [ ] Settings changes take effect

---

## 🎯 Quick Start Test

**1-Minute Smoke Test:**

```bash
# 1. Compile
cd /home/flip/agent-forge-extension
npm run compile

# 2. Open in VS Code
code /home/flip/agent-forge-extension

# 3. Press F5

# 4. In new window: Ctrl+Shift+L

# 5. Type: "Hello!"

# ✅ If AI responds → SUCCESS!
```

---

## 📝 Test Results Template

```markdown
# Test Results - Agent Forge Extension

Date: October 19, 2025
Tester: [Your Name]

## Environment
- OS: Linux
- VS Code: [version]
- Ollama: Running on localhost:11434
- Model: qwen2.5-coder-14b-instruct-q4_k_m

## Test Results

### Basic Functionality
- [ ] ✅/❌ Extension activates
- [ ] ✅/❌ Chat opens
- [ ] ✅/❌ AI responds
- [ ] ✅/❌ Commands work

### File Operations
- [ ] ✅/❌ Read file
- [ ] ✅/❌ Write file
- [ ] ✅/❌ Search files

### Editor Integration
- [ ] ✅/❌ Context menu
- [ ] ✅/❌ Explain code
- [ ] ✅/❌ Refactor

### Terminal & Git
- [ ] ✅/❌ Run command
- [ ] ✅/❌ Git status

## Issues Found
1. [Issue description]
2. [Issue description]

## Overall: ✅ PASS / ❌ FAIL
```

---

## 🚀 Ready to Test!

**Snelste weg:**

```bash
# 1. Open extension
code /home/flip/agent-forge-extension

# 2. Press F5

# 3. Test!
```

**Questions?** Check the README.md or ask me!

---

**Good luck testing! 🧪🤖**
