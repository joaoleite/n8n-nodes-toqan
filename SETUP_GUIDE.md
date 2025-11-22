# 🚀 Setup Guide - Toqan Community Node

## 📁 Location
```
/Users/joaoleite/Documents/work/code/n8n-import/toqan-community-node/
```

## ✅ What's Created

### Package Structure
```
toqan-community-node/
├── credentials/
│   └── ToqanApi.credentials.ts     # API key credential
├── nodes/
│   └── Toqan/
│       ├── Toqan.node.ts           # Main node (5 operations)
│       └── toqan.svg                # Icon
├── tests/
│   └── run_tests.mjs                # TDD test suite
├── package.json                     # @joaoleite/n8n-nodes-toqan
├── tsconfig.json                    # TypeScript config
├── gulpfile.js                      # Build icons
├── .gitignore                       # Protects .env
├── .env.example                     # Template
└── README.md                        # Documentation
```

### 5 Operations Implemented
1. ✅ Create Conversation
2. ✅ Continue Conversation  
3. ✅ Get Answer
4. ✅ Upload File
5. ✅ Find Conversation

---

## 🔑 Step 1: Add Your API Key

```bash
cd /Users/joaoleite/Documents/work/code/n8n-import/toqan-community-node

# Create .env file (protected by .gitignore)
echo "TOQAN_API_KEY=your_actual_api_key_here" > .env
```

**IMPORTANT:** Replace `your_actual_api_key_here` with your real Toqan API key.

---

## 🧪 Step 2: Run TDD Tests

```bash
# Run all 6 tests
node tests/run_tests.mjs
```

**Tests:**
1. Create Conversation
2. Get Answer (with polling)
3. Upload File  
4. Continue Conversation with File
5. Find Conversation
6. Create Conversation with File

All tests use REAL API calls to verify functionality.

---

## 🔨 Step 3: Build the Package

```bash
# Install dependencies (requires Node.js/npm)
npm install

# Build TypeScript → JavaScript
npm run build
```

This creates `dist/` folder with compiled code.

---

## 🔗 Step 4: Test Locally in n8n

```bash
# Link locally
npm link

# In n8n directory
cd ~/.n8n
npm link @joaoleite/n8n-nodes-toqan

# Restart n8n
n8n start
```

Then check: n8n → New Workflow → Search "Toqan AI"

---

## 📤 Step 5: Publish to npm

```bash
# Login to npm
npm login

# Publish (scoped package is free!)
npm publish --access public
```

**After publishing**, anyone can install:
```
n8n → Settings → Community Nodes → "@joaoleite/n8n-nodes-toqan"
```

---

## 🛡️ Security

✅ `.gitignore` protects:
- `.env` (your API key)
- `node_modules/`
- `dist/` (build output)
- Test data

❌ **NEVER** commit `.env` to Git!

---

## 🎯 Quick Start

```bash
cd /Users/joaoleite/Documents/work/code/n8n-import/toqan-community-node

# 1. Add API key
echo "TOQAN_API_KEY=sk_your_key" > .env

# 2. Test
node tests/run_tests.mjs

# 3. Build
npm install
npm run build

# 4. Publish
npm publish --access public
```

---

## 📊 Expected Test Output

```
🚀 Starting Toqan Community Node TDD Tests

📦 Testing against: https://api.coco.prod.toqan.ai/api
🔑 API Key: sk_abc1234...

════════════════════════════════════════════════════════════

🧪 Create Conversation... ✅ PASS
   📝 Conversation ID: conv_xyz...
   📝 Request ID: req_abc...

🧪 Get Answer (wait for processing)... ✅ PASS
   💬 Answer preview: Hello! I'm here to help...

🧪 Upload File... ✅ PASS
   📎 File ID: file_123...

🧪 Continue Conversation with File... ✅ PASS
   📝 New Request ID: req_def...
   💬 AI confirmed file access: Yes, I can see your file...

🧪 Find Conversation... ✅ PASS
   📜 Found 3 messages in conversation

🧪 Create Conversation with File... ✅ PASS
   📝 New Conversation with file: conv_new...

════════════════════════════════════════════════════════════

📊 TEST RESULTS:

   Total:  6
   ✅ Passed: 6
   ❌ Failed: 0
   Success Rate: 100.0%

════════════════════════════════════════════════════════════
```

---

## ❓ Troubleshooting

### "TOQAN_API_KEY not found"
→ Create `.env` file with your API key

### "npm: command not found"
→ Install Node.js: `brew install node`

### Tests fail with 401
→ Check API key is correct in `.env`

### Tests timeout
→ Toqan API may be slow, increase timeout in tests

---

## 🎉 Success!

Once tests pass 100%, your Community Node is ready to publish! 🚀

**Package name:** `@joaoleite/n8n-nodes-toqan`
**Install command:** `npm install @joaoleite/n8n-nodes-toqan`
