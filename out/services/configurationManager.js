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
exports.ConfigurationManager = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const configLoader_1 = require("./configLoader");
class ConfigurationManager {
    constructor(extensionPath) {
        this.guidelinesContent = '';
        this.disposables = [];
        this.configLoader = configLoader_1.ConfigLoader.getInstance(extensionPath);
        this.configLoader.loadConfig().catch(err => {
            console.error('Failed to load config:', err);
        });
        this.config = this.loadDefaultConfig();
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.command = 'agent-forge.showConfig';
        this.updateStatusBar();
        this.statusBarItem.show();
        this.disposables.push(this.statusBarItem);
        // Watch for configuration changes - STORE DISPOSABLE
        this.disposables.push(vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('agent-forge')) {
                this.reload();
            }
        }));
        // Load guidelines file if specified
        this.loadGuidelinesFile();
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
    loadDefaultConfig() {
        const vsconfig = vscode.workspace.getConfiguration('agent-forge');
        return {
            model: vsconfig.get('defaultModel') || 'mistral-nemo:12b-instruct-2407-q6_K',
            temperature: vsconfig.get('temperature') || 0.7,
            maxIterations: vsconfig.get('agentMaxIterations') || 15,
            autoApprove: vsconfig.get('agentAutoApprove') !== false,
            enabledTools: vsconfig.get('enabledTools') || [
                'readFile',
                'writeFile',
                'editFile',
                'listFiles',
                'searchFiles',
                'getWorkspaceInfo',
                'taskComplete'
            ],
            guidelinesFile: vsconfig.get('guidelinesFile'),
            customInstructions: vsconfig.get('customInstructions')
        };
    }
    async reload() {
        this.config = this.loadDefaultConfig();
        await this.loadGuidelinesFile();
        this.updateStatusBar();
        vscode.window.showInformationMessage('🔄 Configuration reloaded!');
    }
    async loadGuidelinesFile() {
        if (!this.config.guidelinesFile) {
            this.guidelinesContent = '';
            return;
        }
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                return;
            }
            const filePath = path.isAbsolute(this.config.guidelinesFile)
                ? this.config.guidelinesFile
                : path.join(workspaceFolder.uri.fsPath, this.config.guidelinesFile);
            this.guidelinesContent = await fs.readFile(filePath, 'utf-8');
            vscode.window.showInformationMessage(`📖 Guidelines loaded from: ${path.basename(filePath)}`);
        }
        catch (error) {
            vscode.window.showWarningMessage(`Failed to load guidelines file: ${error.message}`);
            this.guidelinesContent = '';
        }
    }
    getConfig() {
        return { ...this.config };
    }
    getGuidelines() {
        if (this.guidelinesContent) {
            return this.guidelinesContent;
        }
        if (this.config.customInstructions) {
            return this.config.customInstructions;
        }
        return '';
    }
    isToolEnabled(toolName) {
        return this.config.enabledTools.includes(toolName);
    }
    async setModel(model) {
        const vsconfig = vscode.workspace.getConfiguration('agent-forge');
        await vsconfig.update('defaultModel', model, vscode.ConfigurationTarget.Global);
        this.config.model = model;
        this.updateStatusBar();
    }
    async toggleTool(toolName) {
        const enabled = this.config.enabledTools;
        const index = enabled.indexOf(toolName);
        if (index > -1) {
            enabled.splice(index, 1);
        }
        else {
            enabled.push(toolName);
        }
        const vsconfig = vscode.workspace.getConfiguration('agent-forge');
        await vsconfig.update('enabledTools', enabled, vscode.ConfigurationTarget.Global);
        this.config.enabledTools = enabled;
    }
    async setGuidelinesFile(filePath) {
        const vsconfig = vscode.workspace.getConfiguration('agent-forge');
        await vsconfig.update('guidelinesFile', filePath, vscode.ConfigurationTarget.Workspace);
        this.config.guidelinesFile = filePath;
        await this.loadGuidelinesFile();
    }
    getCurrentFileContext() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return '';
        }
        const document = editor.document;
        const fileName = path.basename(document.fileName);
        const languageId = document.languageId;
        const lineCount = document.lineCount;
        const selection = editor.selection;
        const hasSelection = !selection.isEmpty;
        let context = `Current File: ${fileName}\n`;
        context += `Language: ${languageId}\n`;
        context += `Lines: ${lineCount}\n`;
        if (hasSelection) {
            const selectedText = document.getText(selection);
            context += `\nSelected Code:\n\`\`\`${languageId}\n${selectedText}\n\`\`\`\n`;
        }
        else {
            // Include some context around cursor
            const line = selection.active.line;
            const startLine = Math.max(0, line - 5);
            const endLine = Math.min(lineCount - 1, line + 5);
            const contextRange = new vscode.Range(startLine, 0, endLine, 999);
            const contextText = document.getText(contextRange);
            context += `\nCursor Context (lines ${startLine + 1}-${endLine + 1}):\n\`\`\`${languageId}\n${contextText}\n\`\`\`\n`;
        }
        return context;
    }
    getFullContext() {
        let context = '';
        // Add guidelines
        const guidelines = this.getGuidelines();
        if (guidelines) {
            context += '=== PROJECT GUIDELINES ===\n\n';
            context += guidelines;
            context += '\n\n';
        }
        // Add current file context
        const fileContext = this.getCurrentFileContext();
        if (fileContext) {
            context += '=== CURRENT FILE CONTEXT ===\n\n';
            context += fileContext;
            context += '\n\n';
        }
        return context;
    }
    updateStatusBar() {
        const modelName = this.config.model.split(':')[0];
        const toolCount = this.config.enabledTools.length;
        this.statusBarItem.text = `$(robot) ${modelName} | ${toolCount} tools`;
        this.statusBarItem.tooltip = `Model: ${this.config.model}\nTools: ${toolCount}\nClick to configure`;
    }
    async showConfigurationUI() {
        const items = [
            {
                label: '$(gear) Model',
                description: `Current: ${this.config.model}`,
                detail: 'Change the AI model'
            },
            {
                label: '$(tools) Tools',
                description: `${this.config.enabledTools.length} enabled`,
                detail: 'Enable/disable agent tools'
            },
            {
                label: '$(book) Guidelines',
                description: this.config.guidelinesFile || 'Not set',
                detail: 'Set custom guidelines file'
            },
            {
                label: '$(note) Custom Instructions',
                description: this.config.customInstructions ? 'Set' : 'Not set',
                detail: 'Add custom instructions'
            },
            {
                label: '$(debug-restart) Auto-approve',
                description: this.config.autoApprove ? 'ON' : 'OFF',
                detail: 'Toggle automatic tool execution'
            },
            {
                label: '$(symbol-numeric) Max Iterations',
                description: this.config.maxIterations.toString(),
                detail: 'Set maximum agent iterations'
            },
            {
                label: '$(thermometer) Temperature',
                description: this.config.temperature.toString(),
                detail: 'Set model temperature'
            },
            {
                label: '$(refresh) Reload Configuration',
                description: 'Reload all settings',
                detail: 'Hot reload without restart'
            }
        ];
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Configure Agent Forge'
        });
        if (!selected)
            return;
        switch (selected.label) {
            case '$(gear) Model':
                await this.selectModel();
                break;
            case '$(tools) Tools':
                await this.configureTools();
                break;
            case '$(book) Guidelines':
                await this.selectGuidelinesFile();
                break;
            case '$(note) Custom Instructions':
                await this.setCustomInstructions();
                break;
            case '$(debug-restart) Auto-approve':
                await this.toggleAutoApprove();
                break;
            case '$(symbol-numeric) Max Iterations':
                await this.setMaxIterations();
                break;
            case '$(thermometer) Temperature':
                await this.setTemperature();
                break;
            case '$(refresh) Reload Configuration':
                await this.reload();
                break;
        }
    }
    async selectModel() {
        // Get models from config
        const configModels = this.configLoader.getModels();
        // Build quick pick items with icons and descriptions
        const modelItems = configModels.map(m => {
            let detail = m.description;
            if (m.recommended) {
                detail += ' (Recommended)';
            }
            return {
                label: `${m.icon} ${m.name}`,
                description: m.category,
                detail: detail,
                modelId: m.id
            };
        });
        // Add custom model option
        modelItems.push({
            label: '🔧 Custom model name...',
            description: '',
            detail: 'Enter a custom Ollama model',
            modelId: 'custom'
        });
        const selected = await vscode.window.showQuickPick(modelItems, {
            placeHolder: 'Select AI model',
            matchOnDescription: true,
            matchOnDetail: true
        });
        if (selected) {
            if (selected.modelId === 'custom') {
                const customModel = await vscode.window.showInputBox({
                    prompt: 'Enter custom model name (e.g., llama3.2:1b or your-model:tag)',
                    placeHolder: 'model-name:tag'
                });
                if (customModel) {
                    await this.setModel(customModel);
                    vscode.window.showInformationMessage(`Model set to: ${customModel}`);
                }
            }
            else {
                await this.setModel(selected.modelId);
                vscode.window.showInformationMessage(`Model set to: ${selected.modelId}`);
            }
        }
    }
    async configureTools() {
        const allTools = [
            'readFile',
            'writeFile',
            'editFile',
            'listFiles',
            'searchFiles',
            'runCommand',
            'getWorkspaceInfo',
            'taskComplete'
        ];
        const items = allTools.map(tool => ({
            label: tool,
            description: this.isToolEnabled(tool) ? '$(check) Enabled' : '$(circle-slash) Disabled',
            picked: this.isToolEnabled(tool)
        }));
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Click to toggle tools (multiple selection)',
            canPickMany: true
        });
        if (selected) {
            const enabledTools = selected.map(item => item.label);
            const vsconfig = vscode.workspace.getConfiguration('agent-forge');
            await vsconfig.update('enabledTools', enabledTools, vscode.ConfigurationTarget.Global);
            this.config.enabledTools = enabledTools;
            this.updateStatusBar();
            vscode.window.showInformationMessage(`${enabledTools.length} tools enabled`);
        }
    }
    async selectGuidelinesFile() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }
        const files = await vscode.workspace.findFiles('**/*.{md,txt}', '**/node_modules/**');
        const items = files.map(file => ({
            label: vscode.workspace.asRelativePath(file),
            description: file.fsPath
        }));
        items.unshift({
            label: '$(file) Browse...',
            description: 'Select a file manually'
        });
        items.unshift({
            label: '$(close) Clear',
            description: 'Remove guidelines file'
        });
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select guidelines file'
        });
        if (!selected)
            return;
        if (selected.label === '$(close) Clear') {
            await this.setGuidelinesFile('');
            vscode.window.showInformationMessage('Guidelines cleared');
        }
        else if (selected.label === '$(file) Browse...') {
            const file = await vscode.window.showOpenDialog({
                canSelectMany: false,
                filters: { 'Text Files': ['md', 'txt'] }
            });
            if (file?.[0]) {
                await this.setGuidelinesFile(file[0].fsPath);
            }
        }
        else {
            await this.setGuidelinesFile(selected.label);
        }
    }
    async setCustomInstructions() {
        const current = this.config.customInstructions || '';
        const input = await vscode.window.showInputBox({
            prompt: 'Enter custom instructions for the AI',
            value: current,
            placeHolder: 'e.g., Always use TypeScript strict mode'
        });
        if (input !== undefined) {
            const vsconfig = vscode.workspace.getConfiguration('agent-forge');
            await vsconfig.update('customInstructions', input, vscode.ConfigurationTarget.Workspace);
            this.config.customInstructions = input;
            vscode.window.showInformationMessage('Custom instructions updated');
        }
    }
    async toggleAutoApprove() {
        const newValue = !this.config.autoApprove;
        const vsconfig = vscode.workspace.getConfiguration('agent-forge');
        await vsconfig.update('agentAutoApprove', newValue, vscode.ConfigurationTarget.Global);
        this.config.autoApprove = newValue;
        vscode.window.showInformationMessage(`Auto-approve ${newValue ? 'enabled' : 'disabled'}`);
    }
    async setMaxIterations() {
        const input = await vscode.window.showInputBox({
            prompt: 'Enter maximum iterations (5-50)',
            value: this.config.maxIterations.toString(),
            validateInput: (value) => {
                const num = parseInt(value);
                if (isNaN(num) || num < 5 || num > 50) {
                    return 'Please enter a number between 5 and 50';
                }
                return null;
            }
        });
        if (input) {
            const value = parseInt(input);
            const vsconfig = vscode.workspace.getConfiguration('agent-forge');
            await vsconfig.update('agentMaxIterations', value, vscode.ConfigurationTarget.Global);
            this.config.maxIterations = value;
            vscode.window.showInformationMessage(`Max iterations set to ${value}`);
        }
    }
    async setTemperature() {
        const input = await vscode.window.showInputBox({
            prompt: 'Enter temperature (0.0-1.0)',
            value: this.config.temperature.toString(),
            validateInput: (value) => {
                const num = parseFloat(value);
                if (isNaN(num) || num < 0 || num > 1) {
                    return 'Please enter a number between 0.0 and 1.0';
                }
                return null;
            }
        });
        if (input) {
            const value = parseFloat(input);
            const vsconfig = vscode.workspace.getConfiguration('agent-forge');
            await vsconfig.update('temperature', value, vscode.ConfigurationTarget.Global);
            this.config.temperature = value;
            vscode.window.showInformationMessage(`Temperature set to ${value}`);
        }
    }
}
exports.ConfigurationManager = ConfigurationManager;
//# sourceMappingURL=configurationManager.js.map