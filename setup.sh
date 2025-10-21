#!/bin/bash

# Local Copilot Extension - Quick Setup Script

set -e

echo "🤖 Local Copilot Extension - Quick Setup"
echo "========================================"
echo ""

cd /home/flip/local-copilot-extension

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js >= 18.0.0"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check Ollama
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  Warning: Ollama not running on localhost:11434"
    echo "   Start Ollama: sudo systemctl start ollama"
else
    echo "✅ Ollama is running"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Compile TypeScript
echo ""
echo "🔨 Compiling TypeScript..."
npm run compile

# Install vsce if not present
if ! command -v vsce &> /dev/null; then
    echo ""
    echo "📦 Installing vsce globally..."
    sudo npm install -g @vscode/vsce
fi

# Package extension
echo ""
echo "📦 Packaging extension..."
vsce package

# Find the .vsix file
VSIX_FILE=$(ls -t local-copilot-*.vsix | head -n1)

if [ -z "$VSIX_FILE" ]; then
    echo "❌ Failed to create .vsix file"
    exit 1
fi

echo ""
echo "✅ Extension packaged: $VSIX_FILE"
echo ""
echo "📝 Next steps:"
echo "   1. Install extension:"
echo "      code --install-extension $VSIX_FILE"
echo ""
echo "   2. Or install via VS Code UI:"
echo "      - Open VS Code"
echo "      - Go to Extensions (Ctrl+Shift+X)"
echo "      - Click '...' menu → 'Install from VSIX...'"
echo "      - Select: /home/flip/local-copilot-extension/$VSIX_FILE"
echo ""
echo "   3. Configure settings:"
echo "      - Open Settings (Ctrl+,)"
echo "      - Search for 'Local Copilot'"
echo "      - Set your Ollama model"
echo ""
echo "   4. Start using:"
echo "      - Press Ctrl+Shift+L to open chat"
echo "      - Or click robot icon in Activity Bar"
echo ""
echo "🎉 Setup complete!"
