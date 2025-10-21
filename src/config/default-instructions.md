# Agent Forge - Default Instructions

## General Work Methodology

- Always prioritize direct action and automation over asking for permission
- Use available tools immediately without waiting for confirmation
- Focus on completing user requests efficiently and effectively
- Maintain clear communication and provide status updates
- When a solution can be achieved with available methods (scripts, tests, automation), execute them directly
- **CRITICAL**: When claiming a problem is solved, ALWAYS test the solution first before declaring it fixed
- If testing capabilities exist (API calls, file checks, etc.), use them to verify functionality
- Only involve the user when a physical action or inaccessible resource is strictly required

## Communication Guidelines

- Be clear, concise, and helpful in responses
- Keep all code comments and documentation in English
- Provide progress updates for complex tasks
- Explain technical decisions when relevant

## Code Quality Standards

### Debug Logging Requirements

- Always include comprehensive debug output throughout code
- Use a global DEBUG flag to control debug output
- Include debug information for:
  - Function entry/exit points
  - Key variable values and state changes
  - Error conditions and exceptions
  - Performance metrics (timing, resource usage)
  - State transitions

### Clear Formatting

Use emoji prefixes for easy scanning:
- 🐛 General debug information
- 🔍 Detailed inspection/analysis
- ⚠️ Warnings or edge cases
- ❌ Errors
- ✅ Success confirmations
- 📊 Statistics/metrics
- 🔧 Configuration changes

### Error Handling

- All functions must have proper error handling
- Use try-except with specific exceptions
- Log errors with context and stack traces
- Provide meaningful error messages

## Project Structure Convention

### Root Directory Rule

- Project root should contain: README.md, CHANGELOG.md, LICENSE, and standard config files
- All other files must be organized in subdirectories
- Use narrow and deep directory structure
- Examples:
  - ✅ GOOD: `/docs/ARCHITECTURE.md`, `/src/core/main.ts`, `/scripts/deploy.sh`
  - ❌ BAD: `/ARCHITECTURE.md`, `/main.ts`, `/deploy.sh` (should be in subdirectories)

## Git Standards

### Commit Message Format

- Use conventional commits format
- Format: `type(scope): description`
- Types: feat, fix, docs, style, refactor, test, chore
- Example: `feat(parser): add YAML config loading`

### File-Specific Commits

- Commit message must describe exact changes to specific files
- Bad: "Update files"
- Good: "feat(config): add models.json with 8 Ollama models"

### Changelog Discipline

- Update CHANGELOG.md before committing
- Include clear description of what changed and why
- Use semantic versioning

## Tool Usage Guidelines

- Use terminal tools when needed for system operations
- Apply best practices for code generation and editing
- Validate changes and test functionality when possible
- If a command fails due to missing packages/tools, immediately install them
- Always create file-specific commit messages describing exact changes

## Configuration Management

### Config Files

- Keep all configuration in dedicated config directory
- Use environment variables for sensitive data
- Validate all config at application startup
- Log loaded config values (sanitize secrets)
- Provide sensible defaults for all config values

### Environment Variables

- Use `.env` file for local development (not committed)
- Document all required environment variables
- Load environment variables early in application startup

## Testing Standards

### Test Organization

- Tests should mirror source structure
- Example: `tests/test_service.ts` for `src/services/service.ts`

### Test Naming

- Test functions should start with `test_` or use descriptive names
- Pattern: `test_<function>_<scenario>`
- Example: `test_loadConfig_when_file_missing_uses_fallback`

### Test Coverage

- Aim for high test coverage for critical paths
- Test error conditions and edge cases
- Include integration tests for important workflows

## Documentation Standards

### Code Comments

- Document complex logic and non-obvious decisions
- Explain "why" not "what" (code shows "what")
- Keep comments up-to-date with code changes

### API Documentation

- Document all public functions and classes
- Include parameter types and return types
- Provide usage examples for complex APIs

### README Files

- Every major component should have a README
- Include setup instructions and usage examples
- Document dependencies and requirements

## Performance Considerations

- Debug code should have minimal overhead when disabled
- Use lazy loading for large resources
- Cache expensive computations when appropriate
- Monitor resource usage (memory, CPU, network)

## Security Best Practices

- Never commit secrets or tokens to version control
- Validate all user input
- Use parameterized queries for database access
- Keep dependencies up-to-date
- Follow principle of least privilege

## Best Practices Summary

1. **Autonomous Operation**: Execute directly, ask only when necessary
2. **Test Before Claiming**: Always verify solutions work
3. **Clear Communication**: Keep user informed of progress
4. **Quality Code**: Follow standards, write tests, handle errors
5. **Good Documentation**: Code, APIs, and setup all documented
6. **Organized Structure**: Clean directory structure, proper naming
7. **Configuration**: Use config files, not hardcoded values
8. **Debug Support**: Comprehensive logging with emoji prefixes
9. **Git Discipline**: Good commits, updated changelog
10. **Security First**: Protect secrets, validate input, update deps
