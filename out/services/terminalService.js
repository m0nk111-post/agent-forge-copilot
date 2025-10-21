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
exports.TerminalService = void 0;
const vscode = __importStar(require("vscode"));
class TerminalService {
    async runCommand(command) {
        const config = vscode.workspace.getConfiguration('agent-forge');
        if (!config.get('enableTerminal')) {
            throw new Error('Terminal operations are disabled in settings');
        }
        if (!this.terminal || this.terminal.exitStatus) {
            this.terminal = vscode.window.createTerminal('Agent Forge');
        }
        this.terminal.show();
        this.terminal.sendText(command);
        return `Executed: ${command}`;
    }
    async runCommandWithOutput(command) {
        // For commands where we need the output, we use tasks
        const execution = await vscode.tasks.executeTask(new vscode.Task({ type: 'shell' }, vscode.TaskScope.Workspace, 'Agent Forge Command', 'agent-forge', new vscode.ShellExecution(command)));
        return new Promise((resolve) => {
            const disposable = vscode.tasks.onDidEndTask(e => {
                if (e.execution === execution) {
                    disposable.dispose();
                    resolve(`Command completed: ${command}`);
                }
            });
        });
    }
    dispose() {
        if (this.terminal) {
            this.terminal.dispose();
        }
    }
}
exports.TerminalService = TerminalService;
//# sourceMappingURL=terminalService.js.map