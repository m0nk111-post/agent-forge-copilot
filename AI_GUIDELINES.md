# AI Guidelines for Agent Forge Extension

## Project Overview

This is a VS Code extension that provides GitHub Copilot-like functionality using local Ollama models.

## Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer `const` over `let`, never use `var`
- Use arrow functions for callbacks
- Always specify return types for functions
- Use interfaces for complex types

### Naming Conventions

- Classes: PascalCase (e.g., `ConfigurationManager`)
- Functions/Methods: camelCase (e.g., `executeTask`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_ITERATIONS`)
- Private methods: prefix with `private` keyword
- Async functions: clear naming (e.g., `loadConfig`, not `getConfig`)

### File Organization

```
src/
├── services/        # Business logic
├── views/           # UI components
└── extension.ts     # Entry point
```

## Error Handling

- Always wrap async operations in try-catch
- Show user-friendly error messages via `vscode.window.showErrorMessage`
- Log detailed errors to output channel
- Never throw errors without catching them at command level

```typescript
try {
    await someAsyncOperation();
} catch (error: any) {
    vscode.window.showErrorMessage(`Operation failed: ${error.message}`);
    console.error('Detailed error:', error);
}
```

## VS Code API Best Practices

### Commands

- Register all commands in `extension.ts`
- Add to `package.json` contributes.commands
- Use meaningful command IDs: `agent-forge.actionName`
- Provide keyboard shortcuts for common actions

### Configuration

- Use `vscode.workspace.getConfiguration('agent-forge')`
- Provide sensible defaults
- Document all settings in package.json
- Listen for configuration changes

### UI Components

- Use Quick Pick for menus
- Use Input Box for text input
- Use Progress for long operations
- Use Status Bar for persistent info

## Ollama Integration

### Model Selection

- Support multiple models
- Default to `mistral-nemo:12b-instruct-2407-q6_K`
- Allow user to select model
- Test connection on activation

### API Calls

- Use axios for HTTP requests
- Set reasonable timeouts
- Handle connection errors gracefully
- Stream responses when possible

### Tool Calling

- Use camelCase for tool names
- Provide clear descriptions
- Include parameter schemas
- Validate tool parameters

## Agent Mode

### Tool Execution

- Check if tool is enabled before execution
- Respect auto-approve setting
- Log all tool calls
- Provide progress feedback

### Iteration Limits

- Default max iterations: 15
- Warn user when approaching limit
- Allow configuration of limit
- Stop cleanly at limit

### Context Management

- Include guidelines in system prompt
- Add current file context
- Keep conversation history
- Clear history when needed

## Testing

### Manual Testing

- Test with multiple Ollama models
- Test all keyboard shortcuts
- Test with and without selection
- Test error scenarios

### Edge Cases

- No active editor
- Empty selection
- Invalid file paths
- Ollama not running
- Network errors

## Documentation

### Code Comments

- Use JSDoc for public methods
- Explain complex algorithms
- Document parameters and return types
- Add examples for non-obvious usage

### User Documentation

- Keep docs up to date
- Include examples
- Add screenshots where helpful
- Provide troubleshooting section

## Performance

### Optimization

- Lazy load services
- Cache frequently used data
- Debounce user input
- Use background tasks for long operations

### Resource Management

- Dispose resources properly
- Cancel pending operations
- Clear listeners on deactivation
- Manage output channels

## Security

### User Input

- Validate all user input
- Sanitize file paths
- Escape HTML in webviews
- Check file permissions

### Tool Safety

- Warn about dangerous operations
- Require confirmation for file writes
- Limit runCommand tool usage
- Provide opt-out for auto-approve

## Git Integration

### Commits

- Never auto-commit without user consent
- Show diff before committing
- Use meaningful commit messages
- Support staging individual files

## Guidelines File

This file itself is an example of a guidelines file that can be loaded by the extension.

### Usage

```json
{
  "agent-forge.guidelinesFile": "AI_GUIDELINES.md"
}
```

### Benefits

- AI follows project conventions
- Consistent code style
- Fewer corrections needed
- Better integration with existing code

## Common Patterns

### Service Pattern

```typescript
export class MyService {
    constructor(private dependency: Dependency) {}

    async doSomething(): Promise<Result> {
        // Implementation
    }

    dispose() {
        // Cleanup
    }
}
```

### Command Pattern

```typescript
context.subscriptions.push(
    vscode.commands.registerCommand('agent-forge.myCommand', async () => {
        try {
            const result = await service.doSomething();
            vscode.window.showInformationMessage(`Success: ${result}`);
        } catch (error: any) {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
    })
);
```

### Configuration Pattern

```typescript
private loadConfig() {
    const config = vscode.workspace.getConfiguration('agent-forge');
    return {
        model: config.get('defaultModel') || 'default',
        autoApprove: config.get('agentAutoApprove') !== false
    };
}
```

## Anti-Patterns to Avoid

❌ **Don't:**
- Use `any` type without comment
- Catch errors without handling
- Block UI with long operations
- Mutate parameters
- Use global state

✅ **Do:**
- Use specific types
- Handle all error cases
- Use progress indicators
- Return new objects
- Use dependency injection

## Version Compatibility

- Target VS Code API 1.85.0+
- Test with Node.js 20+
- Support Windows, macOS, Linux
- Handle platform differences

## Deployment

### Before Release

1. Update version in package.json
2. Update CHANGELOG.md
3. Run `npm run compile`
4. Test with `F5`
5. Run `npm run package`
6. Test .vsix installation

### Release Process

1. Create git tag
2. Build .vsix
3. Test on clean VS Code
4. Document breaking changes
5. Update README.md

## Support

### When Adding Features

- Update documentation
- Add to QUICK_START.md if user-facing
- Update CONFIGURATION_GUIDE.md if configurable
- Add keyboard shortcuts if appropriate

### When Fixing Bugs

- Add test case
- Document root cause
- Update troubleshooting section
- Consider adding validation

## Future Considerations

### Planned Features

- Completion provider (inline suggestions)
- Hover provider (type hints)
- Language-specific guidelines
- Multiple workspace support
- Extension pack integration

### Technical Debt

- Add unit tests
- Implement logging framework
- Add telemetry (opt-in)
- Improve error recovery

## Questions to Ask

When generating code for this project:

1. Does it follow TypeScript conventions?
2. Is error handling comprehensive?
3. Are resources disposed properly?
4. Is the UI responsive?
5. Does it work offline (with local Ollama)?
6. Is it documented?
7. Can users configure it?
8. Does it respect user privacy?
