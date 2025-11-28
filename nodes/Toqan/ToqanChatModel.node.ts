import {
    IExecuteFunctions,
    INodeType,
    INodeTypeDescription,
    ISupplyDataFunctions,
    SupplyData,
} from 'n8n-workflow';

import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage, BaseMessage, AIMessageChunk } from '@langchain/core/messages';
import { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager';
import { ChatResult, ChatGeneration } from '@langchain/core/outputs';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { Runnable } from '@langchain/core/runnables';
import { BaseLanguageModelInput } from '@langchain/core/language_models/base';

/**
 * Custom Langchain Chat Model for Toqan AI
 */
class ToqanLangchainChatModel extends BaseChatModel {
    apiKey: string;
    baseUrl: string;
    pollingInterval: number;
    timeout: number;
    conversationId?: string;
    boundTools: StructuredToolInterface[] = [];

    constructor(apiKey: string, baseUrl: string, options?: {
        pollingInterval?: number;
        timeout?: number;
        conversationId?: string;
        boundTools?: StructuredToolInterface[];
    }) {
        super({});
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.pollingInterval = options?.pollingInterval || 2;
        this.timeout = options?.timeout || 120;
        this.conversationId = options?.conversationId;
        this.boundTools = options?.boundTools || [];
    }

    _llmType(): string {
        return 'toqan';
    }

    async _generate(
        messages: BaseMessage[],
        options: this['ParsedCallOptions'],
        runManager?: CallbackManagerForLLMRun,
    ): Promise<ChatResult> {
        // Get the last message as user input
        const lastMessage = messages[messages.length - 1];
        const userMessage = lastMessage.content.toString();

        try {
            // Call Toqan API (with tools if bound)
            const { conversationId, requestId } = await this.createOrContinueConversation(
                userMessage,
                this.boundTools
            );

            // Poll for answer
            const response = await this.pollForAnswer(conversationId, requestId, runManager);

            // Check if response contains tool calls
            const toolCalls = this.parseToolCalls(response.raw || response.answer);

            // Return in Langchain format
            if (toolCalls.length > 0) {
                // Response contains tool calls
                return {
                    generations: [{
                        text: response.answer || '',
                        message: new AIMessage({
                            content: response.answer || '',
                            additional_kwargs: {
                                tool_calls: toolCalls,
                            },
                        }),
                    }],
                };
            }

            // Normal text response
            return {
                generations: [{
                    text: response.answer,
                    message: new AIMessage(response.answer),
                }],
            };
        } catch (error) {
            throw new Error(`Toqan API Error: ${(error as Error).message}`);
        }
    }

    /**
     * Convert Langchain tools to OpenAI-compatible format
     */
    private convertToolsToOpenAIFormat(tools: StructuredToolInterface[]): any[] {
        return tools.map(tool => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.schema || {
                    type: 'object',
                    properties: {},
                    required: [],
                },
            },
        }));
    }

    /**
     * Parse tool calls from Toqan response
     */
    private parseToolCalls(responseText: string): any[] {
        const toolCalls: any[] = [];

        // Try to detect tool call patterns in response
        // Toqan might return tool calls in different formats
        try {
            // Pattern 1: JSON with tool_calls array
            const jsonMatch = responseText.match(/\{[\s\S]*"tool_calls"[\s\S]*\}/); if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                if (data.tool_calls && Array.isArray(data.tool_calls)) {
                    return data.tool_calls.map((tc: any, index: number) => ({
                        id: tc.id || `call_${Date.now()}_${index}`,
                        type: 'function',
                        function: {
                            name: tc.function?.name || tc.name,
                            arguments: JSON.stringify(tc.function?.arguments || tc.arguments || {}),
                        },
                    }));
                }
            }

            // Pattern 2: Function call markers
            const funcCallMatch = responseText.match(/<function_call>([\s\S]*?)<\/function_call>/);
            if (funcCallMatch) {
                try {
                    const funcData = JSON.parse(funcCallMatch[1]);
                    return [{
                        id: `call_${Date.now()}`,
                        type: 'function',
                        function: {
                            name: funcData.name,
                            arguments: JSON.stringify(funcData.arguments || {}),
                        },
                    }];
                } catch { }
            }
        } catch (e) { }

        return toolCalls;
    }

    /**
     * Create new conversation or continue existing one
     */
    private async createOrContinueConversation(
        message: string,
        tools?: StructuredToolInterface[]
    ): Promise<{ conversationId: string; requestId: string }> {
        const endpoint = this.conversationId ? '/continue_conversation' : '/create_conversation';
        const body: any = {
            user_message: message,
        };

        if (this.conversationId) {
            body.conversation_id = this.conversationId;
        }

        // Include tools if available (OpenAI format)
        if (tools && tools.length > 0) {
            body.tools = this.convertToolsToOpenAIFormat(tools);
            body.tool_choice = 'auto'; // Let the model decide when to use tools
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'x-api-key': this.apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json() as { conversation_id: string; request_id: string };

        // Store conversation ID for future use
        if (!this.conversationId && data.conversation_id) {
            this.conversationId = data.conversation_id;
        }

        return {
            conversationId: data.conversation_id,
            requestId: data.request_id,
        };
    }

    /**
     * Poll for answer from Toqan API
     */
    private async pollForAnswer(
        conversationId: string,
        requestId: string,
        runManager?: CallbackManagerForLLMRun,
    ): Promise<{ answer: string; raw?: string }> {
        const startTime = Date.now();
        const timeoutMs = this.timeout * 1000;

        while (true) {
            // Check timeout
            if (Date.now() - startTime > timeoutMs) {
                throw new Error(`Timeout after ${this.timeout}s waiting for Toqan response`);
            }

            // Wait before polling
            await new Promise(resolve => setTimeout(resolve, this.pollingInterval * 1000));

            // Get answer
            const response = await fetch(
                `${this.baseUrl}/get_answer?conversation_id=${conversationId}&request_id=${requestId}`,
                {
                    method: 'GET',
                    headers: {
                        'x-api-key': this.apiKey,
                    },
                },
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json() as { status: string; answer?: string };

            // Check status
            if (data.status === 'finished') {
                // Process thinking if present
                let answer = data.answer || '';
                const rawResponse = JSON.stringify(data);

                // Remove <think> tags if present
                const thinkRegex = /<think>.*?<\/think>\s*/s;
                answer = answer.replace(thinkRegex, '').trim();

                // Return both cleaned answer and raw response for tool parsing
                return {
                    answer: answer,
                    raw: rawResponse,
                };
            } else if (data.status === 'error') {
                throw new Error(`Toqan returned error: ${JSON.stringify(data)}`);
            }

            // Status is 'in_progress', continue polling
            if (runManager) {
                await runManager.handleLLMNewToken('.');
            }
        }
    }

    /**
     * Bind tools to the model
     * This allows the AI Agent to use tools like Calculator, HTTP Request, etc.
     */
    bindTools(
        tools: StructuredToolInterface[],
        kwargs?: Partial<this['ParsedCallOptions']>,
    ): Runnable<BaseLanguageModelInput, AIMessageChunk, this['ParsedCallOptions']> {
        // Create a new instance with tools bound
        const boundModel = new ToqanLangchainChatModel(
            this.apiKey,
            this.baseUrl,
            {
                pollingInterval: this.pollingInterval,
                timeout: this.timeout,
                conversationId: this.conversationId,
                boundTools: tools,
            },
        );

        return boundModel as any;
    }

    /**
     * Stub for structured output (required by some Langchain integrations)
     */
    withStructuredOutput<T>(
        schema: any,
        config?: any,
    ): Runnable<BaseLanguageModelInput, T> {
        // Return this model as-is (structured output not supported yet)
        return this as any;
    }
}

/**
 * n8n Chat Model Node for Toqan AI
 */
export class ToqanChatModel implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Toqan Chat Model',
        name: 'toqanChatModel',
        icon: 'file:toqan.svg',
        group: ['transform'],
        version: 1,
        description: 'Toqan AI Chat Model for use with AI Agents',
        defaults: {
            name: 'Toqan Chat Model',
        },
        codex: {
            categories: ['AI'],
            subcategories: {
                AI: ['Language Models'],
            },
            resources: {
                primaryDocumentation: [
                    {
                        url: 'https://toqan.ai',
                    },
                ],
            },
        },
        inputs: [],
        // CRITICAL: This makes it appear in AI Agent's chat model dropdown
        outputNames: ['ai_languageModel'],
        outputs: ['ai_languageModel'],
        credentials: [
            {
                name: 'toqanApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Polling Interval (seconds)',
                name: 'pollingInterval',
                type: 'number',
                default: 2,
                description: 'Time to wait between each check for response',
            },
            {
                displayName: 'Timeout (seconds)',
                name: 'timeout',
                type: 'number',
                default: 120,
                description: 'Maximum time to wait for a response',
            },
            {
                displayName: 'Options',
                name: 'options',
                type: 'collection',
                placeholder: 'Add Option',
                default: {},
                options: [
                    {
                        displayName: 'Conversation ID',
                        name: 'conversationId',
                        type: 'string',
                        default: '',
                        description: 'Optional: Continue an existing conversation',
                    },
                ],
            },
        ],
    };

    async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
        const credentials = await this.getCredentials('toqanApi');

        const pollingInterval = this.getNodeParameter('pollingInterval', itemIndex) as number;
        const timeout = this.getNodeParameter('timeout', itemIndex) as number;
        const options = this.getNodeParameter('options', itemIndex, {}) as {
            conversationId?: string;
        };

        const model = new ToqanLangchainChatModel(
            credentials.apiKey as string,
            (credentials.baseUrl as string) || 'https://api.coco.prod.toqan.ai/api',
            {
                pollingInterval,
                timeout,
                conversationId: options.conversationId,
            },
        );

        return {
            response: model,
        };
    }
}
