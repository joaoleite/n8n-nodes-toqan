# ⚡ Quick Start - Toqan AI n8n Node

## 🎯 Prerequisites

### Node.js Version

n8n requires **Node.js 18.x or 20.x**. If you're using a newer version:

```bash
# Install nvm (if you don't have it)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node.js 20
nvm install 20
nvm use 20

# Verify
node --version  # Should be v20.x.x
```

---

## 📦 Installation

### Option 1: From n8n UI (Easiest)

1. Open n8n
2. Go to **Settings → Community Nodes**
3. Click **Install**
4. Enter: `@joaoleite/n8n-nodes-toqan`
5. Click **Install**
6. Restart n8n

### Option 2: Manual Installation

```bash
cd ~/.n8n
npm install @joaoleite/n8n-nodes-toqan

# Restart n8n
```

---

## 🔐 Setup Credentials

1. In n8n, add a **Toqan AI** node to your workflow
2. Click **"Credential to connect with"**
3. Select **"Create New"**
4. Fill in:
   - **API Key:** Your Toqan AI API key (get from [toqan.ai](https://toqan.ai))
   - **Base URL:** Leave default or use custom endpoint
5. Click **Save**

---

## 🧪 Test Workflow (Auto-Polling)

### Simple Example with Auto-Polling

This is the **recommended** way - no need for Wait nodes!

```
1. Manual Trigger
   ↓
2. Toqan AI (Create Conversation)
   ✓ waitForResponse: true
   message: "What is the capital of France?"
   pollingInterval: 2
   timeout: 60
   ↓ (finished output)
3. Code Node
   // Access the answer
   return [{
     json: {
       answer: $input.first().json.answer
     }
   }];
```

**What happens:**
1. Message sent to Toqan AI
2. Node automatically polls every 2 seconds
3. When response is ready, it flows through the **finished** output
4. If there's an error, it goes to **error** output
5. If timeout (60s), goes to **timeout** output

---

## 🎯 Multiple Outputs Example

Handle success, errors, and timeouts differently:

```
Manual Trigger
  ↓
Toqan AI (Create Conversation)
  ✓ waitForResponse: true
  message: "Explain AI in simple terms"
  ├─ finished → Send to Slack (Success message)
  ├─ error → Send Email (Alert team)
  └─ timeout → HTTP Request (Retry webhook)
```

---

## 📁 File Upload Example

```
1. Read Binary File
   ↓
2. Toqan AI (Upload File)
   binaryFieldName: "data"
   ↓
3. Toqan AI (Create Conversation)
   ✓ waitForResponse: true
   message: "Summarize this document"
   fileIds: {{$json.file_id}}
   ↓ (finished)
4. Process Response
```

---

## 🔄 Traditional Workflow (Manual Polling)

If you prefer manual control:

```
1. Toqan AI (Create Conversation)
   ☐ waitForResponse: false
   message: "Hello!"
   ↓
2. Wait (2 seconds)
   ↓
3. Toqan AI (Get Answer)
   conversationId: {{$json.conversation_id}}
   requestId: {{$json.request_id}}
```

---

## 🛠️ Development Mode

If you're developing the node locally:

```bash
cd toqan-community-node

# Build the node
npm run build

# Link locally
npm link

# In n8n directory
cd ~/.n8n
npm link @joaoleite/n8n-nodes-toqan

# Restart n8n
n8n start
```

**After making changes:**
```bash
cd toqan-community-node
npm run build
# Restart n8n (Ctrl+C, then n8n start)
```

---

## ✅ Expected Output

When auto-polling is enabled and successful:

```json
{
  "status": "finished",
  "answer": "The capital of France is Paris.",
  "timestamp": "2025-11-21T20:30:34.567Z",
  "conversation_id": "conv_abc123",
  "request_id": "req_xyz789"
}
```

---

## 🚀 Next Steps

- **See all operations:** Check [README.md](README.md)
- **API Reference:** [Toqan API Docs](https://toqan-api.readme.io/reference)
- **Report issues:** [GitHub Issues](https://github.com/joaoleite/n8n-nodes-toqan/issues)

---

## 💡 Pro Tips

1. **Use auto-polling** for simpler workflows (one node instead of three!)
2. **Set appropriate timeouts** based on your expected response time
3. **Handle all outputs** (finished/error/timeout) for robust workflows
4. **Upload files first** before referencing them in conversations

**Happy automating! 🎉**
