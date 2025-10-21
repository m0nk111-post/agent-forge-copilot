import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Represents a file and its relationships to other files
 */
export interface FileRelationship {
    uri: vscode.Uri;
    imports: Set<string>; // Paths of files this file imports
    exportedSymbols: Set<string>; // Symbols exported by this file
    lastModified: number;
}

/**
 * Tracks relationships between files in the workspace.
 * Analyzes imports, exports, and dependencies to provide multi-file context.
 */
export class FileRelationshipTracker {
    private relationships: Map<string, FileRelationship> = new Map();
    private watchers: vscode.FileSystemWatcher[] = [];
    private indexingPromise: Promise<void> | null = null;

    constructor() {
        this.setupFileWatchers();
    }

    /**
     * Setup file system watchers for TypeScript, JavaScript, Python files
     */
    private setupFileWatchers(): void {
        const patterns = [
            '**/*.{ts,tsx,js,jsx}', // TypeScript/JavaScript
            '**/*.py',               // Python
            '**/*.java',             // Java
            '**/*.cs',               // C#
            '**/*.go',               // Go
        ];

        for (const pattern of patterns) {
            const watcher = vscode.workspace.createFileSystemWatcher(pattern);

            watcher.onDidCreate(uri => this.onFileChanged(uri));
            watcher.onDidChange(uri => this.onFileChanged(uri));
            watcher.onDidDelete(uri => this.onFileDeleted(uri));

            this.watchers.push(watcher);
        }
    }

    /**
     * Handle file changes - re-analyze the file
     */
    private async onFileChanged(uri: vscode.Uri): Promise<void> {
        await this.analyzeFile(uri);
    }

    /**
     * Handle file deletions - remove from cache
     */
    private onFileDeleted(uri: vscode.Uri): void {
        this.relationships.delete(uri.fsPath);
    }

    /**
     * Index all files in the workspace
     */
    async indexWorkspace(): Promise<void> {
        if (this.indexingPromise) {
            return this.indexingPromise;
        }

        this.indexingPromise = (async () => {
            const patterns = [
                '**/*.{ts,tsx,js,jsx}',
                '**/*.py',
                '**/*.java',
                '**/*.cs',
                '**/*.go',
            ];

            for (const pattern of patterns) {
                const files = await vscode.workspace.findFiles(
                    pattern,
                    '**/node_modules/**', // Exclude node_modules
                    1000 // Limit to 1000 files per pattern
                );

                for (const file of files) {
                    await this.analyzeFile(file);
                }
            }
        })();

        await this.indexingPromise;
        this.indexingPromise = null;
    }

    /**
     * Analyze a file and extract its imports/exports
     */
    private async analyzeFile(uri: vscode.Uri): Promise<void> {
        try {
            const document = await vscode.workspace.openTextDocument(uri);
            const content = document.getText();
            const languageId = document.languageId;

            const relationship: FileRelationship = {
                uri,
                imports: new Set(),
                exportedSymbols: new Set(),
                lastModified: Date.now()
            };

            // Extract imports based on language
            if (languageId === 'typescript' || languageId === 'javascript' || 
                languageId === 'typescriptreact' || languageId === 'javascriptreact') {
                this.extractTypeScriptImports(content, uri, relationship);
                this.extractTypeScriptExports(content, relationship);
            } else if (languageId === 'python') {
                this.extractPythonImports(content, uri, relationship);
                this.extractPythonExports(content, relationship);
            }

            this.relationships.set(uri.fsPath, relationship);
        } catch (error) {
            console.error(`Error analyzing file ${uri.fsPath}:`, error);
        }
    }

    /**
     * Extract TypeScript/JavaScript imports
     */
    private extractTypeScriptImports(content: string, currentUri: vscode.Uri, relationship: FileRelationship): void {
        // Match: import ... from '...'
        const importRegex = /import\s+(?:{[^}]*}|[\w*]+(?:\s*,\s*{[^}]*})?)\s+from\s+['"]([^'"]+)['"]/g;
        let match;

        while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1];
            const resolvedPath = this.resolveImportPath(importPath, currentUri);
            if (resolvedPath) {
                relationship.imports.add(resolvedPath);
            }
        }

        // Match: require('...')
        const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
        while ((match = requireRegex.exec(content)) !== null) {
            const importPath = match[1];
            const resolvedPath = this.resolveImportPath(importPath, currentUri);
            if (resolvedPath) {
                relationship.imports.add(resolvedPath);
            }
        }
    }

    /**
     * Extract TypeScript/JavaScript exports
     */
    private extractTypeScriptExports(content: string, relationship: FileRelationship): void {
        // Match: export function/class/const/let/var name
        const exportRegex = /export\s+(?:async\s+)?(?:function|class|const|let|var|interface|type|enum)\s+(\w+)/g;
        let match;

        while ((match = exportRegex.exec(content)) !== null) {
            relationship.exportedSymbols.add(match[1]);
        }

        // Match: export { name1, name2 }
        const exportListRegex = /export\s+{([^}]+)}/g;
        while ((match = exportListRegex.exec(content)) !== null) {
            const exports = match[1].split(',').map(e => e.trim().split(/\s+as\s+/)[0]);
            exports.forEach(exp => relationship.exportedSymbols.add(exp));
        }

        // Match: export default
        if (/export\s+default/.test(content)) {
            relationship.exportedSymbols.add('default');
        }
    }

    /**
     * Extract Python imports
     */
    private extractPythonImports(content: string, currentUri: vscode.Uri, relationship: FileRelationship): void {
        // Match: import module
        const importRegex = /^import\s+([\w.]+)/gm;
        let match;

        while ((match = importRegex.exec(content)) !== null) {
            const moduleName = match[1];
            const resolvedPath = this.resolvePythonImport(moduleName, currentUri);
            if (resolvedPath) {
                relationship.imports.add(resolvedPath);
            }
        }

        // Match: from module import ...
        const fromImportRegex = /^from\s+([\w.]+)\s+import/gm;
        while ((match = fromImportRegex.exec(content)) !== null) {
            const moduleName = match[1];
            const resolvedPath = this.resolvePythonImport(moduleName, currentUri);
            if (resolvedPath) {
                relationship.imports.add(resolvedPath);
            }
        }
    }

    /**
     * Extract Python exports (functions and classes defined at module level)
     */
    private extractPythonExports(content: string, relationship: FileRelationship): void {
        // Match: def function_name
        const funcRegex = /^def\s+(\w+)/gm;
        let match;

        while ((match = funcRegex.exec(content)) !== null) {
            relationship.exportedSymbols.add(match[1]);
        }

        // Match: class ClassName
        const classRegex = /^class\s+(\w+)/gm;
        while ((match = classRegex.exec(content)) !== null) {
            relationship.exportedSymbols.add(match[1]);
        }
    }

    /**
     * Resolve relative import path to absolute path
     */
    private resolveImportPath(importPath: string, currentUri: vscode.Uri): string | null {
        // Skip node_modules and external packages
        if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
            return null;
        }

        const currentDir = path.dirname(currentUri.fsPath);
        let resolved = path.resolve(currentDir, importPath);

        // Try common extensions
        const extensions = ['.ts', '.tsx', '.js', '.jsx', '.d.ts'];
        for (const ext of extensions) {
            if (this.relationships.has(resolved + ext)) {
                return resolved + ext;
            }
        }

        // Try index files
        for (const ext of extensions) {
            const indexPath = path.join(resolved, 'index' + ext);
            if (this.relationships.has(indexPath)) {
                return indexPath;
            }
        }

        return resolved;
    }

    /**
     * Resolve Python import to file path
     */
    private resolvePythonImport(moduleName: string, currentUri: vscode.Uri): string | null {
        // Skip standard library modules
        if (!moduleName.startsWith('.')) {
            return null; // External module
        }

        const currentDir = path.dirname(currentUri.fsPath);
        const parts = moduleName.split('.');
        const relativePath = parts.join(path.sep) + '.py';
        const resolved = path.resolve(currentDir, relativePath);

        if (this.relationships.has(resolved)) {
            return resolved;
        }

        return null;
    }

    /**
     * Get related files for a given file (files it imports or that import it)
     */
    getRelatedFiles(uri: vscode.Uri, maxFiles: number = 5): vscode.Uri[] {
        const filePath = uri.fsPath;
        const relationship = this.relationships.get(filePath);
        
        if (!relationship) {
            return [];
        }

        const relatedPaths = new Set<string>();

        // Add direct imports
        relationship.imports.forEach(importPath => {
            relatedPaths.add(importPath);
        });

        // Add files that import this file
        for (const [otherPath, otherRel] of this.relationships.entries()) {
            if (otherRel.imports.has(filePath)) {
                relatedPaths.add(otherPath);
            }
        }

        // Convert to URIs and limit
        return Array.from(relatedPaths)
            .slice(0, maxFiles)
            .map(p => vscode.Uri.file(p));
    }

    /**
     * Get context from related files (for completions)
     */
    async getRelatedFilesContext(uri: vscode.Uri, maxFiles: number = 3): Promise<string> {
        const relatedFiles = this.getRelatedFiles(uri, maxFiles);
        
        if (relatedFiles.length === 0) {
            return '';
        }

        const contexts: string[] = [];

        for (const relatedUri of relatedFiles) {
            try {
                const doc = await vscode.workspace.openTextDocument(relatedUri);
                const content = doc.getText();
                const fileName = path.basename(relatedUri.fsPath);
                
                // Limit content to first 50 lines
                const lines = content.split('\n').slice(0, 50).join('\n');
                
                contexts.push(`\n// From related file: ${fileName}\n${lines}`);
            } catch (error) {
                console.error(`Error reading related file ${relatedUri.fsPath}:`, error);
            }
        }

        return contexts.join('\n');
    }

    /**
     * Get import suggestions for a symbol
     */
    getImportSuggestions(symbol: string): Array<{ file: string; exportedSymbol: string }> {
        const suggestions: Array<{ file: string; exportedSymbol: string }> = [];

        for (const [filePath, relationship] of this.relationships.entries()) {
            if (relationship.exportedSymbols.has(symbol)) {
                suggestions.push({
                    file: filePath,
                    exportedSymbol: symbol
                });
            }
        }

        return suggestions;
    }

    /**
     * Get statistics about indexed files
     */
    getStats(): { totalFiles: number; totalImports: number; totalExports: number } {
        let totalImports = 0;
        let totalExports = 0;

        for (const relationship of this.relationships.values()) {
            totalImports += relationship.imports.size;
            totalExports += relationship.exportedSymbols.size;
        }

        return {
            totalFiles: this.relationships.size,
            totalImports,
            totalExports
        };
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        this.watchers.forEach(watcher => watcher.dispose());
        this.relationships.clear();
    }
}
