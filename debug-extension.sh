#!/bin/bash
cd "$(dirname "$0")"
echo "🔨 Compiling extension..."
npm run compile
if [ $? -eq 0 ]; then
    echo "✅ Compilation successful"
    echo "📋 Files in out/:"
    ls -lh out/
    echo ""
    echo "🚀 Now press F5 in VS Code with 'Extension' configuration selected"
    echo "   Or use: Ctrl+Shift+P → 'Debug: Start Debugging'"
else
    echo "❌ Compilation failed"
    exit 1
fi
