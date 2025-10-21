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
exports.FileService = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class FileService {
    async readFile(filePath) {
        if (!filePath || typeof filePath !== 'string') {
            throw new Error('The "path" argument must be of type string or an instance of Buffer or URL. Received undefined');
        }
        const config = vscode.workspace.getConfiguration('agent-forge');
        if (!config.get('enableFileOps')) {
            throw new Error('File operations are disabled in settings');
        }
        try {
            return await fs.readFile(filePath, 'utf-8');
        }
        catch (error) {
            throw new Error(`Failed to read file: ${error.message}`);
        }
    }
    async writeFile(filePath, content) {
        if (!filePath || typeof filePath !== 'string') {
            throw new Error('The "path" argument must be of type string or an instance of Buffer or URL. Received undefined');
        }
        if (content === undefined || content === null) {
            throw new Error('Content argument is required');
        }
        const config = vscode.workspace.getConfiguration('agent-forge');
        if (!config.get('enableFileOps')) {
            throw new Error('File operations are disabled in settings');
        }
        try {
            await fs.writeFile(filePath, content, 'utf-8');
        }
        catch (error) {
            throw new Error(`Failed to write file: ${error.message}`);
        }
    }
    async listFiles(dirPath, pattern) {
        try {
            const files = await fs.readdir(dirPath);
            if (pattern) {
                const regex = new RegExp(pattern);
                return files.filter(f => regex.test(f));
            }
            return files;
        }
        catch (error) {
            throw new Error(`Failed to list files: ${error.message}`);
        }
    }
    async searchInFiles(searchPath, searchTerm) {
        const results = [];
        // Use VS Code's native search
        const files = await vscode.workspace.findFiles(new vscode.RelativePattern(searchPath, '**/*'), '**/node_modules/**');
        for (const file of files) {
            try {
                const content = await fs.readFile(file.fsPath, 'utf-8');
                const lines = content.split('\n');
                const matches = lines
                    .map((line, i) => ({ line, index: i }))
                    .filter(({ line }) => line.includes(searchTerm))
                    .map(({ line, index }) => `${index + 1}: ${line.trim()}`);
                if (matches.length > 0) {
                    results.push({ file: file.fsPath, matches });
                }
            }
            catch {
                // Skip files that can't be read
            }
        }
        return results;
    }
    async getWorkspaceFiles() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return [];
        }
        const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');
        return files.map(f => f.fsPath);
    }
    async getCurrentFileContent() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return null;
        }
        return editor.document.getText();
    }
    async replaceInFile(filePath, searchText, replaceText) {
        const content = await this.readFile(filePath);
        const newContent = content.replace(new RegExp(searchText, 'g'), replaceText);
        await this.writeFile(filePath, newContent);
    }
    getRelativePath(absolutePath) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return absolutePath;
        }
        return path.relative(workspaceFolder.uri.fsPath, absolutePath);
    }
}
exports.FileService = FileService;
//# sourceMappingURL=fileService.js.map