#!/usr/bin/env node

/**
 * TDD Test Suite for Toqan AI Community Node
 * Tests all 5 operations with real API calls
 */

import * as dotenv from 'dotenv';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const API_KEY = process.env.TOQAN_API_KEY;
const BASE_URL = 'https://api.coco.prod.toqan.ai/api';

if (!API_KEY) {
    console.error('❌ TOQAN_API_KEY not found in .env file');
    console.error('💡 Copy .env.example to .env and add your API key');
    process.exit(1);
}

// Test results
const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
};

// Helper: Make HTTP request
function makeRequest(method, endpoint, data = null, isFormData = false) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, BASE_URL);

        const options = {
            method,
            headers: {
                'x-api-key': API_KEY,
                'Accept': '*/*'
            }
        };

        let body = null;
        if (data && !isFormData) {
            body = JSON.stringify(data);
            options.headers['Content-Type'] = 'application/json';
        }

        const req = https.request(url, options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(responseData);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, data: responseData });
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(body);
        } else if (isFormData) {
            // Simple file upload (not full multipart, but works for testing)
            const boundary = '----TestBoundary123';
            options.headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;

            const fileContent = data;
            const multipart = [
                `--${boundary}`,
                'Content-Disposition: form-data; name="file"; filename="test.txt"',
                'Content-Type: text/plain',
                '',
                fileContent,
                `--${boundary}--`
            ].join('\r\n');

            req.write(multipart);
        }

        req.end();
    });
}

// Helper: Wait/sleep
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Test function wrapper
async function test(name, fn) {
    results.total++;
    process.stdout.write(`\n🧪 ${name}... `);
    try {
        await fn();
        results.passed++;
        results.tests.push({ name, status: 'PASS' });
        console.log('✅ PASS');
        return true;
    } catch (error) {
        results.failed++;
        results.tests.push({ name, status: 'FAIL', error: error.message });
        console.log(`❌ FAIL\n   Error: ${error.message}`);
        return false;
    }
}

// Assertion helpers
function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
}

// Test data storage
const testData = {
    conversationId: null,
    requestId: null,
    fileId: null
};

// ===== TDD TESTS =====

console.log('🚀 Starting Toqan Community Node TDD Tests\n');
console.log('📦 Testing against:', BASE_URL);
console.log('🔑 API Key:', API_KEY.substring(0, 10) + '...\n');
console.log('═'.repeat(60));

// Test 1: Create Conversation
await test('Create Conversation', async () => {
    const response = await makeRequest('POST', '/create_conversation', {
        user_message: 'Hello, this is a test message from TDD suite'
    });

    assert(response.status === 200, `Expected 200, got ${response.status}`);
    assert(response.data.conversation_id, 'Missing conversation_id in response');
    assert(response.data.request_id, 'Missing request_id in response');

    testData.conversationId = response.data.conversation_id;
    testData.requestId = response.data.request_id;

    console.log(`   📝 Conversation ID: ${testData.conversationId}`);
    console.log(`   📝 Request ID: ${testData.requestId}`);
});

// Test 2: Get Answer (initial - may not be ready immediately)
await test('Get Answer (wait for processing)', async () => {
    assert(testData.conversationId, 'No conversation ID from previous test');
    assert(testData.requestId, 'No request ID from previous test');

    // Poll for answer (max 30 seconds)
    let answer = null;
    for (let i = 0; i < 15; i++) {
        await sleep(2000); // Wait 2 seconds

        const response = await makeRequest('GET', `/get_answer?conversation_id=${testData.conversationId}&request_id=${testData.requestId}`);

        if (response.data.answer) {
            answer = response.data.answer;
            break;
        }
    }

    assert(answer, 'No answer received after 30 seconds');
    console.log(`   💬 Answer preview: ${answer.substring(0, 50)}...`);
});

// Test 3: Upload File
await test('Upload File', async () => {
    const testFileContent = `Test file created at ${new Date().toISOString()}
This is a test file for the Toqan Community Node TDD suite.
It contains sample text to verify file upload functionality.
`;

    const response = await makeRequest('PUT', '/upload_file', testFileContent, true);

    assert(response.status === 200, `Expected 200, got ${response.status}`);
    assert(response.data.file_id, 'Missing file_id in response');

    testData.fileId = response.data.file_id;
    console.log(`   📎 File ID: ${testData.fileId}`);
});

// Test 4: Continue Conversation (with file)
await test('Continue Conversation with File', async () => {
    assert(testData.conversationId, 'No conversation ID from previous test');
    assert(testData.fileId, 'No file ID from previous test');

    const response = await makeRequest('POST', '/continue_conversation', {
        conversation_id: testData.conversationId,
        user_message: 'Can you see the file I just uploaded? What does it contain?',
        private_user_files: [{ id: testData.fileId }]
    });

    assert(response.status === 200, `Expected 200, got ${response.status}`);
    assert(response.data.request_id, 'Missing request_id in response');

    const newRequestId = response.data.request_id;
    console.log(`   📝 New Request ID: ${newRequestId}`);

    // Wait and get answer
    await sleep(3000);
    const answerResponse = await makeRequest('GET', `/get_answer?conversation_id=${testData.conversationId}&request_id=${newRequestId}`);

    if (answerResponse.data.answer) {
        console.log(`   💬 AI confirmed file access: ${answerResponse.data.answer.substring(0, 80)}...`);
    }
});

// Test 5: Find Conversation
await test('Find Conversation', async () => {
    assert(testData.conversationId, 'No conversation ID from previous test');

    const response = await makeRequest('POST', '/find_conversation', {
        conversation_id: testData.conversationId
    });

    assert(response.status === 200, `Expected 200, got ${response.status}`);
    assert(response.data.conversation, 'Missing conversation in response');

    const conv = response.data.conversation;
    assert(conv.id === testData.conversationId, 'Conversation ID mismatch');
    assert(conv.messages && conv.messages.length > 0, 'No messages in conversation');

    console.log(`   📜 Found ${conv.messages.length} messages in conversation`);
});

// Test 6: Create Conversation with File Attachment
await test('Create Conversation with File', async () => {
    assert(testData.fileId, 'No file ID from previous test');

    const response = await makeRequest('POST', '/create_conversation', {
        user_message: 'Analyze this file and tell me what you find',
        private_user_files: [{ id: testData.fileId }]
    });

    assert(response.status === 200, `Expected 200, got ${response.status}`);
    assert(response.data.conversation_id, 'Missing conversation_id');

    console.log(`   📝 New Conversation with file: ${response.data.conversation_id}`);
});

// ===== TEST SUMMARY =====

console.log('\n' + '═'.repeat(60));
console.log('\n📊 TEST RESULTS:\n');
console.log(`   Total:  ${results.total}`);
console.log(`   ✅ Passed: ${results.passed}`);
console.log(`   ❌ Failed: ${results.failed}`);
console.log(`   Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%\n`);

if (results.failed > 0) {
    console.log('Failed Tests:');
    results.tests
        .filter(t => t.status === 'FAIL')
        .forEach(t => console.log(`   - ${t.name}: ${t.error}`));
    console.log('');
}

console.log('═'.repeat(60));

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);
