# Toqan AI Node - Features

Complete feature documentation for the Toqan AI n8n Community Node.

## 🎯 Core Operations

### 1. Create Conversation

Start a new AI conversation with Toqan AI.

**Basic Usage:**
- Send a message to start a conversation
- Optionally attach files (must be uploaded first)
- Returns `conversation_id` and `request_id`

**Auto-Polling Mode:**
- Enable **"Aguardar até Resposta"** checkbox
- Node automatically waits for AI response
- Returns complete conversation data when finished
- Routes to appropriate output (finished/error/timeout)

**Best For:**
- Starting new conversations
- One-off questions
- Initial message in a conversation flow

---

### 2. Continue Conversation

Add messages to an existing conversation thread.

**Basic Usage:**
- Requires `conversation_id` from previous conversation
- Send follow-up messages
- Maintain conversation context

**Auto-Polling Mode:**
- Same auto-polling capabilities as Create Conversation
- Automatically waits for response
- Multiple outputs for different scenarios

**Best For:**
- Multi-turn conversations
- Follow-up questions
- Conversational workflows

---

### 3. Get Answer

Manually retrieve AI response (when not using auto-polling).

**Parameters:**
- `conversationId` - The conversation ID
- `requestId` - The request ID from Create/Continue

**Returns:**
- `status` - "finished", "in_progress", or "error"
- `answer` - The AI response (when finished)
- `timestamp` - Response timestamp

**Best For:**
- Manual polling control
- Custom retry logic
- Long-running conversations

---

### 4. Upload File

Upload files to use in conversations.

**Supported Files:**
- Documents (PDF, DOCX, TXT, etc.)
- Images (PNG, JPG, etc.)
- Spreadsheets (XLSX, CSV, etc.)
- Code files

**Workflow:**
1. Read file with "Read Binary File" node
2. Upload with Toqan node
3. Use returned `file_id` in Create/Continue Conversation

**Best For:**
- Document analysis
- Image processing
- Data extraction from files

---

### 5. Find Conversation

Retrieve complete conversation history and metadata.

**Returns:**
- All messages in the conversation
- Timestamps
- File attachments
- Conversation metadata

**Best For:**
- Conversation analysis
- History retrieval
- Audit trails

---

## ⚡ Auto-Polling Feature

### How It Works

When **"Aguardar até Resposta"** is enabled:

1. **Send Message:** Node sends message to Toqan AI
2. **Automatic Polling:** Node checks `/get_answer` endpoint at configurable intervals
3. **Smart Routing:** Response routed based on status:
   - ✅ `finished` → AI response received
   - ❌ `error` → API error occurred
   - ⏱️ `timeout` → No response within timeout period

### Configuration

**Polling Interval** (default: 2 seconds)
- How often to check for response
- Lower = faster response detection, more API calls
- Higher = fewer API calls, slower response detection

**Timeout** (default: 60 seconds)
- Maximum time to wait for response
- After timeout, routes to `timeout` output
- Recommended: 30-120 seconds depending on complexity

### Benefits

✅ **Simplified Workflows** - No need for Wait + Get Answer nodes  
✅ **Automatic Retry** - Built-in polling logic  
✅ **Error Handling** - Separate outputs for different scenarios  
✅ **Configurable** - Adjust interval and timeout per use case  

---

## 🎨 Multiple Outputs

When auto-polling is enabled, the node has three outputs:

### 1. Finished Output (Green)

**Triggered when:** AI response received successfully

**Data includes:**
- `status: "finished"`
- `answer` - The AI response
- `conversation_id`
- `request_id`
- `timestamp`

**Use for:**
- Processing successful responses
- Sending success notifications
- Continuing workflow

---

### 2. Error Output (Red)

**Triggered when:** API error or request failure

**Data includes:**
- `status: "error"`
- Error message
- Error details
- Original request data

**Use for:**
- Error notifications
- Retry logic
- Logging errors

---

### 3. Timeout Output (Orange)

**Triggered when:** Response not received within timeout period

**Data includes:**
- `status: "timeout"`
- `conversation_id`
- `request_id`
- Last known state

**Use for:**
- Timeout handling
- Manual retry
- Alert notifications

---

## 💡 Usage Patterns

### Pattern 1: Simple Question-Answer

```
Manual Trigger
  ↓
Toqan AI (Create Conversation)
  ✓ Auto-polling enabled
  ↓ (finished)
Send to Slack
```

### Pattern 2: Error Handling

```
Toqan AI (Create Conversation)
  ├─ finished → Process Response
  ├─ error → Send Error Email
  └─ timeout → Retry with Delay
```

### Pattern 3: File Analysis

```
Read Binary File
  ↓
Toqan AI (Upload File)
  ↓
Toqan AI (Create Conversation)
  ✓ Auto-polling
  message: "Analyze this file"
  fileIds: {{$json.file_id}}
  ↓ (finished)
Process Analysis
```

### Pattern 4: Multi-Turn Conversation

```
Toqan AI (Create)
  ↓ (finished)
Code Node (Extract info)
  ↓
Toqan AI (Continue)
  conversationId: {{$json.conversation_id}}
  ↓ (finished)
Final Processing
```

---

## 🔒 Security Best Practices

1. **API Key Storage:** Store API keys in n8n credentials, never in workflow
2. **File Handling:** Validate files before upload
3. **Error Messages:** Don't expose sensitive data in error outputs
4. **Timeouts:** Set appropriate timeouts to prevent hanging workflows

---

## 🚀 Performance Tips

1. **Polling Interval:** 
   - Use 2-5 seconds for most cases
   - Increase for very long-running tasks
   
2. **Timeout:**
   - Set based on expected response time
   - Add buffer for network delays
   
3. **File Upload:**
   - Upload files once, reuse `file_id`
   - Don't upload large files unnecessarily

4. **Conversation Reuse:**
   - Continue existing conversations when contextually appropriate
   - Creates more coherent interactions

---

## 📊 API Status Codes

| Status | Meaning | Output |
|--------|---------|--------|
| `finished` | Response ready | ✅ Finished |
| `in_progress` | Still processing | ⏳ Polling continues |
| `error` | Error occurred | ❌ Error |
| `timeout` | No response | ⏱️ Timeout |

---

## 🤝 Support

- **Documentation:** [README.md](README.md)
- **API Reference:** [Toqan API Docs](https://toqan-api.readme.io/reference)
- **Issues:** [GitHub Issues](https://github.com/joaoleite/n8n-nodes-toqan/issues)
- **Community:** [n8n Community](https://community.n8n.io/)
