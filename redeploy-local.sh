#!/bin/bash

# Script de redeploy local do Toqan Node para n8n
# Este script recompila, reinstala e reinicia o n8n automaticamente

set -e  # Para em caso de erro

echo "🚀 Iniciando redeploy local do Toqan Node..."
echo ""

# 1. Garantir que estamos no diretório correto
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📂 Diretório: $SCRIPT_DIR"
echo ""

# 2. Limpar build anterior
echo "🧹 Limpando builds anteriores..."
rm -rf dist/
echo "✅ Build anterior removido"
echo ""

# 3. Compilar TypeScript
echo "🔨 Compilando TypeScript..."
npm run build
echo "✅ Compilação concluída"
echo ""

# 4. Verificar se ~/.n8n existe
if [ ! -d ~/.n8n ]; then
    echo "📁 Criando diretório ~/.n8n..."
    mkdir -p ~/.n8n
fi

# 5. Remover instalação antiga
echo "🔗 Removendo instalação antiga..."
cd ~/.n8n
npm uninstall @joaoleite/n8n-nodes-toqan 2>/dev/null || true
rm -rf node_modules/@joaoleite/n8n-nodes-toqan 2>/dev/null || true
echo "✅ Instalação antiga removida"
echo ""

# 6. Instalar via link local
echo "🔗 Instalando plugin localmente..."
npm install "$SCRIPT_DIR"
echo "✅ Plugin instalado!"
echo ""

# 7. Verificar instalação
echo "📋 Verificando instalação..."
if [ -d ~/.n8n/node_modules/@joaoleite/n8n-nodes-toqan ]; then
    echo "✅ Plugin instalado em ~/.n8n/node_modules/@joaoleite/n8n-nodes-toqan"
    echo "📦 Arquivos compilados:"
    ls -la ~/.n8n/node_modules/@joaoleite/n8n-nodes-toqan/dist/nodes/Toqan/
else
    echo "❌ Erro: Plugin não foi instalado corretamente"
    exit 1
fi
echo ""

echo "✨ Redeploy concluído!"
echo ""
echo "🎯 Seus nós estarão disponíveis:"
echo "   - Toqan AI (operações manuais)"
echo "   - Toqan Agent (agente inteligente)"
echo ""

# Perguntar se quer reiniciar n8n
read -p "🔄 Deseja reiniciar o n8n agora? (s/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[SsYy]$ ]]; then
    echo "🔄 Procurando processo do n8n..."
    
    # Encontrar e matar processo do n8n
    N8N_PID=$(pgrep -f "npx n8n" || pgrep -f "node.*n8n" || true)
    
    if [ -n "$N8N_PID" ]; then
        echo "⏹️  Parando n8n (PID: $N8N_PID)..."
        kill $N8N_PID
        sleep 3
        echo "✅ n8n parado"
        echo ""
    else
        echo "⚠️  Nenhum processo n8n encontrado rodando"
        echo ""
    fi
    
    echo "🚀 Iniciando n8n..."
    echo "📍 Abrindo em nova aba do terminal..."
    echo ""
    
    # Iniciar n8n em nova aba
    osascript -e 'tell application "Terminal" to do script "cd '"$SCRIPT_DIR"' && source ~/.zshrc && nvm use default && npx n8n"'
    
    sleep 3
    echo "✅ n8n iniciado!"
    echo "🌐 Acesse: http://localhost:5678"
    echo ""
    echo "💡 Aguarde alguns segundos para o n8n carregar completamente"
else
    echo ""
    echo "📝 Para reiniciar manualmente:"
    echo "   1. Pare o n8n (Ctrl+C no terminal onde está rodando)"
    echo "   2. Reinicie com: source ~/.zshrc && nvm use default && npx n8n"
    echo "   3. Acesse http://localhost:5678"
fi

echo ""
