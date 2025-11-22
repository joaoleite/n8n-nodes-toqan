# 🧪 Teste Local Completo - n8n + Community Node

## 🎯 Objetivo
Testar o Community Node **localmente** no n8n antes de publicar no npm.

---

## 📋 Passo a Passo

### 1️⃣ Instalar n8n Localmente

```bash
# Opção A: Instalação global (recomendado para testes)
npm install -g n8n

# Opção B: npx (sem instalação global)
# npx n8n
```

---

### 2️⃣ Build do Community Node

```bash
cd /Users/joaoleite/Documents/work/code/n8n-import/toqan-community-node

# Instalar dependências
npm install

# Build TypeScript → JavaScript
npm run build
```

**Resultado esperado:**
- Pasta `dist/` criada
- Arquivos `.js` compilados
- Ícone SVG copiado

---

### 3️⃣ Link Local (npm link)

```bash
# Na pasta do Community Node
npm link

# Isso cria um link simbólico global
```

**O que acontece:**
- Cria link em `/usr/local/lib/node_modules/@joaoleite/n8n-nodes-toqan`
- n8n pode "ver" o pacote como se estivesse instalado

---

### 4️⃣ Instalar no n8n Local

```bash
# Ir para a pasta de dados do n8n
cd ~/.n8n

# Link o Community Node
npm link @joaoleite/n8n-nodes-toqan
```

**Estrutura criada:**
```
~/.n8n/
└── node_modules/
    └── @joaoleite/
        └── n8n-nodes-toqan/ → (link para seu projeto)
```

---

### 5️⃣ Iniciar n8n

```bash
# Iniciar n8n (modo dev para ver logs)
N8N_LOG_LEVEL=debug n8n start

# Ou modo normal
n8n start
```

**Acesse:** http://localhost:5678

---

### 6️⃣ Verificar na UI

1. **Criar novo workflow**
2. **Clicar no "+"** para adicionar node
3. **Buscar "Toqan"**

**Deve aparecer:**
- 📌 Nome: "Toqan AI"
- 🎨 Ícone: Logo oficial do Toqan
- 📂 Categoria: Transform

---

### 7️⃣ Configurar Credenciais

1. **No node Toqan**, clique em "Credentials"
2. **Criar nova credencial:**
   - Nome: Toqan AI API
   - API Key: `sua_chave_aqui`
   - Base URL: (deixar padrão)
3. **Salvar**

---

### 8️⃣ Testar Operações

#### Teste 1: Create Conversation

**Node Toqan AI:**
- Operation: `Create Conversation`
- Message: `Hello! This is a test from n8n local.`

**Execute Node** → Deve retornar:
```json
{
  "conversation_id": "conv_...",
  "request_id": "req_..."
}
```

#### Teste 2: Get Answer

**Node Toqan AI (novo):**
- Operation: `Get Answer`
- Conversation ID: `{{$json.conversation_id}}` (do node anterior)
- Request ID: `{{$json.request_id}}`

**Execute Node** → Deve retornar:
```json
{
  "answer": "Hello! How can I assist you?",
  "status": "completed"
}
```

---

### 9️⃣ Testar Upload de Arquivo

**Workflow completo:**

```
1. HTTP Request (Read Binary File)
   ↓
2. Toqan AI (Upload File)
   - Binary Field: data
   ↓
3. Toqan AI (Create Conversation)
   - Message: "What's in this file?"
   - File IDs: {{$json.file_id}}
   ↓
4. Wait (3 seconds)
   ↓
5. Toqan AI (Get Answer)
```

---

## 🐛 Troubleshooting

### Node não aparece na busca

**Causa:** n8n não carregou o Community Node.

**Solução:**
```bash
# 1. Verificar link
ls -la ~/.n8n/node_modules/@joaoleite/

# 2. Rebuild
cd toqan-community-node
npm run build

# 3. Reiniciar n8n
# Ctrl+C no terminal do n8n
n8n start
```

### "Credential type not found"

**Causa:** Credential não foi compilada.

**Solução:**
```bash
# Verificar dist/credentials/
ls -la dist/credentials/

# Deve ter: ToqanApi.credentials.js
```

### Erro ao executar node

**Causa:** API key inválida ou problema de network.

**Solução:**
1. Verificar credencial salva no n8n
2. Testar manualmente:
   ```bash
   curl -X POST https://api.coco.prod.toqan.ai/api/create_conversation \
     -H 'x-api-key: sua_key' \
     -H 'Content-Type: application/json' \
     -d '{"user_message": "test"}'
   ```

### Mudanças no código não aparecem

**Causa:** Cache do n8n + precisa rebuild e re-link.

**Solução COMPLETA:**
```bash
# Parar n8n (Ctrl+C)

cd toqan-community-node
npm run build        # 1. Rebuild
npm link            # 2. Atualizar link
rm -rf ~/.n8n/cache # 3. LIMPAR CACHE (CRÍTICO!)

# Restart n8n
n8n start
```

**Hard refresh no browser:** `Cmd + Shift + R`

---

## 📸 Como Deve Ficar

### Na lista de nodes:
```
🔍 Busca: "toqan"

Resultados:
┌─────────────────────────────┐
│ 🎯 Toqan AI                 │
│ Transform                   │
│ Interact with Toqan AI...   │
└─────────────────────────────┘
```

### No canvas:
```
┌───────────────────────────────┐
│  🎯  Toqan AI                 │
├───────────────────────────────┤
│                               │
│  Operation: Create Conversation │
│                               │
│  Message:                     │
│  ┌─────────────────────────┐ │
│  │ Hello from n8n!         │ │
│  └─────────────────────────┘ │
│                               │
│  File IDs:                    │
│  ┌─────────────────────────┐ │
│  │                         │ │
│  └─────────────────────────┘ │
│                               │
└───────────────────────────────┘
```

---

## ✅ Checklist Antes de Publicar

Teste cada item no n8n local:

- [ ] Node aparece na busca
- [ ] Ícone correto (logo Toqan)
- [ ] Credencial funciona
- [ ] **Create Conversation** retorna conversation_id
- [ ] **Get Answer** retorna resposta
- [ ] **Upload File** retorna file_id
- [ ] **Continue Conversation** com arquivo funciona
- [ ] **Find Conversation** retorna histórico
- [ ] UI está clara e intuitiva
- [ ] Não há erros no console do n8n

---

## 🔄 Workflow de Iteração (SEMPRE FAÇA ISSO!)

### ⚠️ CRÍTICO: Mudanças não aparecem?

**O n8n cacheia os nodes!** Sempre faça isso após mudanças:

```bash
# 1. Parar n8n
# Ctrl+C no terminal do n8n

# 2. Ir para o projeto
cd toqan-community-node

# 3. Rebuild
npm run build

# 4. Atualizar link global (IMPORTANTE!)
npm link

# 5. Limpar cache do n8n (CRÍTICO!)
rm -rf ~/.n8n/cache

# 6. Reiniciar n8n
n8n start
```

### 📝 Script Helper

Crie um arquivo `update-and-restart.sh`:

```bash
#!/bin/bash
echo "🔨 Building..."
npm run build

echo "🔗 Updating link..."
npm link

echo "🗑️  Clearing n8n cache..."
rm -rf ~/.n8n/cache

echo "✅ Done! Restart n8n now (Ctrl+C and run 'n8n start')"
```

**Uso:**
```bash
chmod +x update-and-restart.sh
./update-and-restart.sh
# Depois: Ctrl+C no n8n e n8n start
```

---

## 🚀 Quando Estiver Satisfeito

```bash
# 1. Deslinkar (opcional)
cd ~/.n8n
npm unlink @joaoleite/n8n-nodes-toqan

# 2. Publicar
cd toqan-community-node
npm publish --access public

# 3. Instalar de verdade no n8n
cd ~/.n8n
npm install @joaoleite/n8n-nodes-toqan
```

Ou use a UI:
```
Settings → Community Nodes → "@joaoleite/n8n-nodes-toqan"
```

---

## 💡 Dica: Modo Watch (Desenvolvimento)

Para rebuild automático ao editar:

```bash
# Terminal 1: Build automático
cd toqan-community-node
npm run dev  # tsc --watch

# Terminal 2: n8n rodando
n8n start
```

Reinicie o n8n quando fizer mudanças.

---

## 📊 Comandos Resumidos

```bash
# Setup inicial (uma vez)
cd toqan-community-node
npm install
npm run build
npm link
cd ~/.n8n
npm link @joaoleite/n8n-nodes-toqan

# Iniciar n8n
n8n start

# Após mudanças
cd toqan-community-node
npm run build
# Reiniciar n8n (Ctrl+C + n8n start)
```

---

**Pronto!** Agora você pode testar TODO o Community Node localmente antes de publicar! 🎉
