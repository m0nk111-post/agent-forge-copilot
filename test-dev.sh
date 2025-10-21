#!/bin/bash

# Local Copilot Extension - Development Test

set -e

echo "🧪 Local Copilot Extension - Development Test"
echo "============================================="
echo ""

cd /home/flip/local-copilot-extension

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Compile TypeScript
echo "🔨 Compiling TypeScript..."
npm run compile

# Check if compilation succeeded
if [ ! -f "out/extension.js" ]; then
    echo "❌ Compilation failed"
    exit 1
fi

echo ""
echo "✅ Extension compiled successfully!"
echo ""
echo "🚀 To test the extension:"
echo ""
echo "   1. Open the extension folder in VS Code:"
echo "      code /home/flip/local-copilot-extension"
echo ""
echo "   2. Press F5 (or Run → Start Debugging)"
echo ""
echo "   3. A new VS Code window opens (Extension Development Host)"
echo ""
echo "   4. In the new window:"
echo "      - Press Ctrl+Shift+L to open Local Copilot chat"
echo "      - Or click the robot icon in Activity Bar"
echo "      - Right-click on code → Local Copilot commands"
echo ""
echo "   5. Check logs:"
echo "      - In original window: Debug Console (Ctrl+Shift+Y)"
echo "      - In test window: Output panel → Local Copilot"
echo ""
echo "💡 TIP: Keep watch mode running in original window:"
echo "   npm run watch"
echo "   This auto-recompiles on file changes!"
echo ""
