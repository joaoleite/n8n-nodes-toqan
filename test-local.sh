#!/bin/bash

# Script para testar o nó Toqan localmente no n8n
# Uso: ./test-local.sh

set -e

echo "🚀 Testando nó Toqan localmente com n8n"
echo ""

# Capturar o diretório do script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 1. Build
echo "🔨 1/2 - Fazendo build do TypeScript..."
cd "$SCRIPT_DIR"
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build falhou!"
    exit 1
fi

echo "✅ Build concluído!"
echo ""

# 2. Verificar arquivos compilados
echo "📋 2/2 - Verificando arquivos compilados..."
if [ -d "$SCRIPT_DIR/dist/nodes/Toqan" ]; then
    echo "✅ Nós compilados encontrados!"
    echo ""
    echo "🎯 Nós disponíveis:"
    ls -1 "$SCRIPT_DIR/dist/nodes/Toqan/"*.node.js 2>/dev/null | sed 's/.*\//   - /' | sed 's/.node.js//' || echo "   (nenhum encontrado)"
else
    echo "❌ Pasta dist/nodes/Toqan não encontrada!"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 BUILD COMPLETO!"
echo ""
echo "🚀 Iniciando n8n com custom extensions..."
echo ""
echo "📂 Caminho: $SCRIPT_DIR/dist"
echo "🌐 URL: http://localhost:5678"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Para testar:"
echo "   1. Acesse http://localhost:5678"
echo "   2. Clique no '+' para adicionar nó"
echo "   3. Busque por 'Toqan'"
echo ""
echo "🔄 Para parar: Ctrl+C"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 3. Rodar n8n com N8N_CUSTOM_EXTENSIONS
export N8N_CUSTOM_EXTENSIONS="$SCRIPT_DIR/dist"
npx n8n
