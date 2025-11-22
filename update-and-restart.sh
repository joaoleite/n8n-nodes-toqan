#!/bin/bash

echo "🔨 Building Toqan Node..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "🔗 Updating npm link..."
npm link

echo "🗑️  Clearing n8n cache..."
rm -rf ~/.n8n/cache

echo ""
echo "✅ Done! Now:"
echo "   1. Stop n8n (Ctrl+C)"
echo "   2. Run: n8n start"
echo "   3. Hard refresh browser: Cmd + Shift + R"
echo ""
