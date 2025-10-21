# Agent Forge v1.2.0 - Quick Test Guide

## 🚀 Installation

```powershell
# Navigate to extension directory
cd "j:\VSCode Projects\agentexperiment\agent-forge-extension"

# Install v1.2.0
code --install-extension agent-forge-1.2.0.vsix

# Reload VS Code
# Ctrl+Shift+P → "Developer: Reload Window"
```

---

## ✅ Quick Feature Tests (10 minutes)

### Test 1: Inline Completions (2 min)

**Setup:**
1. Open a TypeScript or JavaScript file
2. Ensure `agent-forge.enableInlineCompletions: true` (default)

**Test:**
```typescript
// Type this slowly:
function calculateTotal

// Expected: Suggestion appears after 300ms
// Example: (a: number, b: number): number { return a + b; }

// Action: Press Tab to accept
```

**Success criteria:**
- ✅ Suggestion appears after typing
- ✅ Suggestion is relevant to function name
- ✅ Tab accepts the suggestion
- ✅ Code is syntactically correct

**Toggle test:**
```
Ctrl+Shift+P → "Agent Forge: Toggle Inline Completions"
Type again → Should NOT show suggestions
Toggle again → Should show suggestions
```

---

### Test 2: Hover Info (1 min)

**Setup:**
1. Open file with existing functions
2. Ensure `agent-forge.enableHoverInfo: true` (default)

**Test:**
```typescript
function calculateTotal(a: number, b: number) {
  return a + b;
}

// Action: Hover mouse over "calculateTotal"
```

**Expected:**
- ✅ Tooltip appears with AI explanation
- ✅ Explanation describes function purpose
- ✅ Markdown formatted (bold, lists, etc.)
- ✅ Hover on variables also works

**Second hover test:**
```typescript
// Hover again on same function
// Should be FAST (from cache)
```

---

### Test 3: Code Actions (Lightbulb) (2 min)

**Setup:**
1. Create a file with intentional error
2. Ensure `agent-forge.enableCodeActions: true` (default)

**Test:**
```typescript
// Create syntax error
const x = 

// Expected: Lightbulb 💡 appears on error line
```

**Action:**
```
1. Click lightbulb (or Ctrl+.)
2. See options:
   - "Fix with AI"
   - "Explain with AI"
3. Click "Fix with AI"
```

**Success criteria:**
- ✅ Lightbulb appears
- ✅ Both options available
- ✅ Fix provides valid code
- ✅ Explain provides useful explanation

---

### Test 4: Signature Help (1 min)

**Setup:**
1. Open TypeScript file
2. Ensure `agent-forge.enableSignatureHelp: true` (default)

**Test:**
```typescript
function add(x: number, y: number): number {
  return x + y;
}

// Type this:
add(

// Expected: Parameter hint appears
// Shows: x: number, y: number
```

**Action:**
```
Type: 5,
// Active parameter should highlight second parameter (y)
```

**Success criteria:**
- ✅ Hint appears when typing `(`
- ✅ Shows parameter names and types
- ✅ Highlights active parameter
- ✅ Works with comma navigation

---

### Test 5: Generate Commit Message (2 min)

**Setup:**
1. Make some code changes
2. Stage changes: `git add .`

**Test:**
```powershell
# Stage changes
git add .

# Generate commit
Ctrl+Shift+P → "Agent Forge: Generate Commit Message"

# Or use SCM button (git panel top bar)
```

**Expected output:**
```
feat(test): add new test functionality

- Implement calculateTotal function
- Add TypeScript types
- Update test file
```

**Success criteria:**
- ✅ Conventional commits format (type(scope): message)
- ✅ Describes staged changes accurately
- ✅ Multi-line description
- ✅ Option to copy or commit directly

---

### Test 6: Code Review (2 min)

**Setup:**
1. Select some code with potential issues

**Test:**
```typescript
// Select this code (intentionally bad):
function process(data) {
  var result = '';
  for (var i = 0; i < data.length; i++) {
    result = result + data[i];
  }
  return result;
}

// Right-click → "Agent Forge: Review Code"
```

**Expected output (in Output panel):**
```
=== CODE REVIEW ===

Quality Score: 65/100

Issues Found:
⚠️ Warning: Using 'var' instead of 'let/const'
⚠️ Warning: String concatenation in loop (performance)
ℹ️ Info: Missing type annotations
ℹ️ Info: Consider using Array.join()

Suggestions:
• Use const for immutable variables
• Use let for mutable variables
• Use Array.join() for better performance
• Add TypeScript type annotations
• Consider edge cases (empty array)
```

**Success criteria:**
- ✅ Quality score (0-100)
- ✅ Issues categorized (error/warning/info)
- ✅ Actionable suggestions
- ✅ Output in "Agent Forge" channel

---

### Test 7: Workspace Review (Optional, 2 min)

**Test:**
```
Ctrl+Shift+P → "Agent Forge: Review Workspace"
Confirm → Yes
```

**Expected:**
- ✅ Reviews up to 10 files
- ✅ Shows progress
- ✅ Summary with overall issues
- ✅ Individual file scores

**Note:** This takes 30-60 seconds depending on file count and model speed.

---

### Test 8: AI Formatter (Optional, 1 min)

**Setup:**
1. Enable formatter: `"agent-forge.enableFormatter": true`
2. Reload window

**Test:**
```typescript
// Create messy code
function test(  x:number,y:   number   ){return x+y;}

// Right-click → "Agent Forge: Format with AI"
```

**Expected:**
```typescript
function test(x: number, y: number) {
  return x + y;
}
```

**Success criteria:**
- ✅ Code is properly formatted
- ✅ Respects indentation settings
- ✅ Follows guidelines (if configured)

**Note:** Experimental feature, may need tuning.

---

## 🎯 Configuration Test

### Test Configuration UI

```
1. Ctrl+Shift+, (or Ctrl+Shift+P → "Show Configuration")

2. See configuration menu:
   ✅ Model selection
   ✅ Guidelines file
   ✅ Custom instructions
   ✅ Enabled tools
   ✅ Active file context toggle
   ✅ Feature toggles
   ✅ Reload config
   ✅ Close

3. Test model selection:
   - Click "Select Model"
   - Choose different model
   - See status bar update

4. Test hot reload:
   - Ctrl+Shift+R
   - See "Configuration reloaded" message
```

---

## 🐛 Troubleshooting

### Completions Not Appearing

**Check:**
1. Feature enabled: `"agent-forge.enableInlineCompletions": true`
2. Ollama server running: Check status bar
3. Model selected: Status bar shows model name
4. Wait 300ms after typing (debounce delay)

**Fix:**
```
Ctrl+Shift+P → "Agent Forge: Toggle Inline Completions"
Toggle off, then on again
```

### Hover Not Working

**Check:**
1. Feature enabled: `"agent-forge.enableHoverInfo": true`
2. Hovering over valid code element (function, variable, etc.)
3. Not hovering over comments or strings

**Fix:**
```
Ctrl+Shift+P → "Agent Forge: Clear Cache"
Reload window: Ctrl+Shift+P → "Developer: Reload Window"
```

### Lightbulb Not Appearing

**Check:**
1. Feature enabled: `"agent-forge.enableCodeActions": true`
2. Actual error/warning exists (check Problems panel)
3. Cursor on line with diagnostic

**Fix:**
```
Place cursor on error line
Press Ctrl+.
Should show quick actions
```

### Slow Performance

**Optimize:**
1. Use smaller model for completions: `mistral:7b`
2. Use larger model for reviews: `mistral-nemo:12b`
3. Clear cache regularly: `Ctrl+Shift+P → "Clear Cache"`
4. Check Ollama server load

**Settings:**
```json
{
  "agent-forge.model": "mistral:7b",  // Faster for completions
  "agent-forge.enableInlineCompletions": true,
  "agent-forge.enableHoverInfo": false,  // Disable if too slow
  "agent-forge.enableSignatureHelp": false  // Disable if too slow
}
```

### Commit Generation Fails

**Check:**
1. Changes staged: `git status`
2. Git repository: Must be in git repo
3. Ollama server: Check connection

**Fix:**
```bash
# Stage changes
git add .

# Verify
git status

# Try again
Ctrl+Shift+P → "Generate Commit Message"
```

---

## 📊 Performance Expectations

### Response Times (with mistral-nemo:12b)

- **Inline completions:** ~500-1000ms
- **Hover info:** ~300-600ms
- **Code actions (fix):** ~2-3 seconds
- **Signature help:** ~200-400ms
- **Commit message:** ~2-4 seconds
- **PR description:** ~5-10 seconds
- **Code review (file):** ~3-5 seconds
- **Workspace review:** ~30-60 seconds

### Cache Performance

- **First hover:** ~500ms
- **Cached hover:** <50ms (instant)
- **Cache size:** 100 completions, 50 hovers
- **Cache eviction:** Automatic (LRU)

---

## ✅ Success Checklist

After testing, verify:

- [ ] Inline completions work and are relevant
- [ ] Hover info provides useful explanations
- [ ] Lightbulb appears on errors
- [ ] Code actions (fix/explain) work
- [ ] Signature help shows parameters
- [ ] Commit message generation works
- [ ] Code review provides scores and suggestions
- [ ] Configuration UI accessible
- [ ] Status bar shows model and tool count
- [ ] Hot reload works
- [ ] All features respect enabled/disabled state

---

## 🎉 All Tests Passed?

**Congratulations!** You now have a fully functional GitHub Copilot replacement with:

✅ All Copilot features  
✅ Extra features Copilot doesn't have  
✅ 100% local and private  
✅ Completely free  

**Next steps:**
1. Customize guidelines: Create `AI_GUIDELINES.md`
2. Configure tools: Enable/disable as needed
3. Set preferred model: Choose based on speed/quality
4. Try agent mode: `Ctrl+Shift+A`
5. Explore quick actions: `Ctrl+I`, `Ctrl+Shift+F`, etc.

**Enjoy your complete AI coding assistant!** 🚀

---

## 📚 More Information

- **Complete feature list:** See `ALL_COPILOT_FEATURES.md`
- **Configuration guide:** See `CONFIGURATION_GUIDE.md`
- **Release notes:** See `VERSION_1.2.0_RELEASE.md`
- **Changelog:** See `CHANGELOG.md`

**Report issues:** GitHub repository (see package.json)

**Happy coding!** 🎊
