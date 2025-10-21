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
exports.GitService = void 0;
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
class GitService {
    constructor() {
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    }
    exec(command) {
        if (!this.workspaceRoot) {
            throw new Error('No workspace folder open');
        }
        try {
            return (0, child_process_1.execSync)(command, {
                cwd: this.workspaceRoot,
                encoding: 'utf-8'
            });
        }
        catch (error) {
            throw new Error(`Git command failed: ${error.message}`);
        }
    }
    async getStatus() {
        return this.exec('git status --short');
    }
    async getDiff(staged = false) {
        const command = staged ? 'git diff --staged' : 'git diff';
        return this.exec(command);
    }
    async getDiffBetweenBranches(baseBranch, compareBranch) {
        return this.exec(`git diff ${baseBranch}...${compareBranch}`);
    }
    async getCommitsSince(baseBranch) {
        const output = this.exec(`git log ${baseBranch}..HEAD --oneline`);
        return output.trim().split('\n').filter(line => line.trim());
    }
    async commit(message) {
        const config = vscode.workspace.getConfiguration('agent-forge');
        if (!config.get('autoCommit')) {
            throw new Error('Auto-commit is disabled in settings');
        }
        this.exec('git add .');
        return this.exec(`git commit -m "${message}"`);
    }
    async createBranch(branchName) {
        return this.exec(`git checkout -b ${branchName}`);
    }
    async getCurrentBranch() {
        return this.exec('git branch --show-current').trim();
    }
    async getLog(limit = 10) {
        return this.exec(`git log --oneline -${limit}`);
    }
    async isGitRepo() {
        try {
            this.exec('git rev-parse --git-dir');
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.GitService = GitService;
//# sourceMappingURL=gitService.js.map