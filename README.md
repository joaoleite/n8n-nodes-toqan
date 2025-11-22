# @joaoleite/n8n-nodes-toqan

**n8n Community Node for Toqan AI** - AI-powered conversation platform integration with automatic response polling.

[![npm version](https://img.shields.io/npm/v/@joaoleite/n8n-nodes-toqan.svg)](https://www.npmjs.com/package/@joaoleite/n8n-nodes-toqan)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🤖 **AI Conversations** - Create and manage AI-powered conversations
- ⚡ **Auto-Polling** - Automatic response waiting with configurable timeout
- 🎯 **Multiple Outputs** - Route workflow based on success, error, or timeout
- 📁 **File Upload** - Attach files to conversations
- 🔍 **Conversation History** - Retrieve full conversation details

## 🚀 Installation

### From n8n UI (Recommended)

1. Go to **Settings → Community Nodes**
2. Click **Install**
3. Enter: `@joaoleite/n8n-nodes-toqan`
4. Click **Install**

### Manual Installation

```bash
cd ~/.n8n
npm install @joaoleite/n8n-nodes-toqan
```

Restart n8n after installation.

## 📋 Operations

### 1. Create Conversation

Start a new AI conversation with optional auto-polling.

**Parameters:**
- `message` (required) - Your message to the AI
- `fileIds` (optional) - Comma-separated file IDs to attach
- `waitForResponse` (checkbox) - Enable automatic polling
  - `pollingInterval` - Check interval in seconds (default: 2s)
  - `timeout` - Maximum wait time in seconds (default: 60s)

**Outputs (when auto-polling enabled):**
- `finished` - AI response received successfully
- `error` - API error occurred
- `timeout` - Response not received in time

**Returns:** `conversation_id`, `request_id`, and full conversation data when auto-polling is enabled

---

### 2. Continue Conversation

Add a message to an existing conversation.

**Parameters:**
- `conversationId` (required) - ID of the conversation
- `message` (required) - Your message
- `fileIds` (optional) - Files to attach
- `waitForResponse` (checkbox) - Enable automatic polling
  - `pollingInterval` - Check interval in seconds
  - `timeout` - Maximum wait time in seconds

**Outputs (when auto-polling enabled):**
- `finished` - AI response received
- `error` - API error
- `timeout` - Response timeout

---

### 3. Get Answer

Manually retrieve AI response (use when auto-polling is disabled).

**Parameters:**
- `conversationId` (required)
- `requestId` (required)

**Returns:** `answer`, `status`, `timestamp`

---

### 4. Upload File

Upload a file for use in conversations.

**Parameters:**
- `binaryFieldName` (default: "data") - Name of the binary field

**Returns:** `file_id`

---

### 5. Find Conversation

Retrieve conversation history and details.

**Parameters:**
- `conversationId` (required)

**Returns:** Full conversation object with all messages

## 🎯 Auto-Polling Feature

The auto-polling feature eliminates the need for manual Wait + Get Answer nodes. When enabled via the **"Aguardar até Resposta"** checkbox:

1. Node sends the message to Toqan AI
2. Automatically polls the `/get_answer` endpoint
3. Routes the result to the appropriate output:
   - ✅ **finished** - Response received
   - ❌ **error** - API error
   - ⏱️ **timeout** - No response within timeout period

### Example: Simple Workflow with Auto-Polling

```
Manual Trigger
  ↓
Toqan AI (Create Conversation)
  ├─ finished → Process Success
  ├─ error → Handle Error
  └─ timeout → Retry Logic
```

### Example: Traditional Workflow (without auto-polling)

```
Manual Trigger
  ↓
Toqan AI (Create Conversation)
  ↓
Wait (2 seconds)
  ↓
Toqan AI (Get Answer)
  ↓
Process Response
```

## 📁 File Handling

Upload files before using them in conversations:

```
Read Binary File
  ↓
Toqan AI (Upload File)
  ↓
Toqan AI (Create Conversation)
  message: "Analyze this file"
  fileIds: {{$json.file_id}}
```

## 🔐 Credentials

Get your API key from [Toqan AI Console](https://toqan.ai).

In n8n:
1. Click on **"Credential to connect with"**
2. Select **"Create New"**
3. Fill in:
   - **API Key** - Your Toqan AI API key
   - **Base URL** - (optional, default: `https://api.coco.prod.toqan.ai/api`)

## 🧪 Example Workflows

### Quick Test

```
Manual Trigger
  ↓
Toqan AI (Create Conversation)
  ✓ waitForResponse: true
  message: "Hello! Explain quantum computing in 2 sentences."
  ↓ (finished)
Code Node
  // Access the AI response
  return [{
    json: {
      answer: $input.first().json.answer
    }
  }];
```

### Error Handling

```
Toqan AI (Create Conversation)
  ├─ finished → Send Email (Success)
  ├─ error → Send Email (Error Alert)
  └─ timeout → HTTP Request (Webhook notification)
```

## 📚 Documentation

- [Toqan AI API Docs](https://toqan-api.readme.io/reference)
- [n8n Community](https://community.n8n.io/)
- [GitHub Repository](https://github.com/joaoleite/n8n-nodes-toqan)

## 🐛 Issues & Support

Found a bug or have a feature request? [Open an issue](https://github.com/joaoleite/n8n-nodes-toqan/issues)

## 📝 License

MIT © João Leite

## 🙏 Acknowledgments

Built with ❤️ for the n8n community.
