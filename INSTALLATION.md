# 📦 Installation Guide

## Optie 1: Development Mode (Snelst voor Testen)

### Stap 1: Open de Extension Folder
```powershell
cd "j:\VSCode Projects\agentexperiment\agent-forge-extension"
code .
```

### Stap 2: Druk F5
- VS Code opent een nieuw venster (Extension Development Host)
- De extensie is automatisch geladen
- Klaar om te testen!

### Stap 3: Test Agent Mode
In het nieuwe VS Code venster:
1. Open een project folder
2. Druk `Ctrl+Shift+A`
3. Type: "Create a hello.js file"
4. Kijk het automatisch uitgevoerd worden! 🎉

**Dit is de makkelijkste manier voor development!**

---

## Optie 2: Permanente Installatie (Voor Daily Use)

### Stap 1: Package de Extension
```powershell
cd "j:\VSCode Projects\agentexperiment\agent-forge-extension"
npm install -g @vscode/vsce
vsce package --baseContentUrl "file:///" --baseImagesUrl "file:///"
```

Dit maakt: `agent-forge-1.0.0.vsix`

### Stap 2: Installeer de VSIX

**Via Command Line:**
```powershell
code --install-extension "j:\VSCode Projects\agentexperiment\agent-forge-extension\agent-forge-1.0.0.vsix"
```

**Via VS Code UI:**
1. Open VS Code
2. Ga naar Extensions (`Ctrl+Shift+X`)
3. Klik op `...` menu (rechtsboven)
4. Selecteer "Install from VSIX..."
5. Kies `agent-forge-1.0.0.vsix`

### Stap 3: Herstart VS Code
- Sluit alle VS Code vensters
- Open VS Code opnieuw
- De extensie is nu geladen!

### Stap 4: Configureer (Optioneel)
```powershell
# Open settings
Ctrl+,

# Zoek naar "agent-forge"
```

Belangrijke settings:
```json
{
  "agent-forge.ollamaUrl": "http://192.168.1.26:11434",
  "agent-forge.defaultModel": "mistral-nemo:12b-instruct-2407-q6_K",
  "agent-forge.agentAutoApprove": true,
  "agent-forge.agentMaxIterations": 15
}
```

### Stap 5: Test Agent Mode
1. Open een project
2. Druk `Ctrl+Shift+A`
3. Type een taak
4. Kijk de agent werken!

---

## ✅ Verificatie

Check of de extensie geladen is:

1. **Via Extensions List:**
   - `Ctrl+Shift+X`
   - Zoek naar "Agent Forge"
   - Moet "Installed" status hebben

2. **Via Command Palette:**
   - `Ctrl+Shift+P`
   - Type "Agent Forge"
   - Je moet commando's zien zoals "Agent Mode"

3. **Via Status Bar:**
   - Kijk rechtsonder in status bar
   - Je moet "🤖 Agent Forge" zien

4. **Via Keyboard Shortcut:**
   - Druk `Ctrl+Shift+A`
   - Input box moet verschijnen met "What would you like the agent to do?"

---

## 🔧 Troubleshooting

### "Extension not found" na installatie
**Fix:** Herstart VS Code volledig (sluit alle vensters)

### "Cannot connect to Ollama"
**Fix:** 
1. Check Ollama is running:
   ```powershell
   curl http://192.168.1.26:11434/api/tags
   ```
2. Update URL in settings als nodig

### "Commands not showing"
**Fix:**
1. `Ctrl+Shift+P` → "Developer: Reload Window"
2. Check extensie is enabled in Extensions panel

### "Agent does nothing"
**Fix:**
1. Check agent log: View → Output → "Agent Forge Agent"
2. Verify `enableFileOps` is `true` in settings
3. Try with Mistral Nemo 12B model

---

## 🚀 Quick Start After Installation

### Test met Simple Task:
```
Ctrl+Shift+A → "Create a test.js file"
```

### Check the Log:
```
View → Output → "Agent Forge Agent"
```

### Configure:
```
Ctrl+Shift+P → "Agent Forge: Configure Agent"
```

---

## 📚 Next Steps

1. ✅ **Read Quick Start**: [QUICK_START.md](./QUICK_START.md)
2. ✅ **Read Full Guide**: [AGENT_MODE.md](./AGENT_MODE.md)
3. ✅ **Try Examples**: See QUICK_START.md for example tasks
4. ✅ **Configure Settings**: Adjust to your needs

---

## 🎯 Summary

**For Development/Testing:**
→ Druk `F5` in extension folder

**For Daily Use:**
1. `vsce package`
2. `code --install-extension agent-forge-1.0.0.vsix`
3. Herstart VS Code
4. Druk `Ctrl+Shift+A`

**Done!** 🎉

---

**Need help?** Check [AGENT_MODE.md](./AGENT_MODE.md) for detailed documentation.
