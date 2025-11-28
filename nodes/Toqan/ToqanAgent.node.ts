import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    IDataObject,
    NodeOperationError,
} from 'n8n-workflow';

// Helper function to process <think> tags in AI responses
function processThinking(response: IDataObject): IDataObject {
    const answer = response.answer as string;

    if (!answer) {
        return response;
    }

    // Match <think>...</think> tags
    const thinkingRegex = /<think>(.*?)<\/think>\s*/s;
    const match = answer.match(thinkingRegex);

    if (match) {
        // Extract thinking content
        const thinking = match[1].trim();
        // Remove thinking from answer
        const cleanAnswer = answer.replace(thinkingRegex, '').trim();

        return {
            ...response,
            answer_original: answer,
            answer: cleanAnswer,
            thinking: thinking,
            has_thinking: true,
        };
    }

    // No thinking found
    return {
        ...response,
        answer_original: answer,
        answer: answer,
        thinking: null,
        has_thinking: false,
    };
}

export class ToqanAgent implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Toqan Agent',
        name: 'toqanAgent',
        icon: 'file:toqan.svg',
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["prompt"]}}',
        description: 'AI Agent powered by Toqan with auto-polling and session management',
        defaults: {
            name: 'Toqan Agent',
        },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [
            {
                name: 'toqanApi',
                required: true,
            },
        ],
        properties: [
            // Session Strategy
            {
                displayName: 'Session Strategy',
                name: 'sessionStrategy',
                type: 'options',
                options: [
                    {
                        name: 'New Conversation',
                        value: 'new',
                        description: 'Start a new conversation every time',
                    },
                    {
                        name: 'Continue Conversation',
                        value: 'continue',
                        description: 'Continue an existing conversation using an ID',
                    },
                ],
                default: 'new',
                description: 'How to handle the conversation session',
            },
            {
                displayName: 'Conversation ID',
                name: 'conversationId',
                type: 'string',
                displayOptions: {
                    show: {
                        sessionStrategy: ['continue'],
                    },
                },
                default: '',
                required: true,
                description: 'The ID of the conversation to continue',
            },

            // Prompt
            {
                displayName: 'Prompt',
                name: 'prompt',
                type: 'string',
                typeOptions: {
                    rows: 4,
                },
                default: '',
                required: true,
                description: 'The message to send to the AI',
            },

            // Files
            {
                displayName: 'File IDs',
                name: 'fileIds',
                type: 'string',
                default: '',
                description: 'Comma-separated list of file IDs to attach (optional)',
            },

            // Polling Settings (Advanced)
            {
                displayName: 'Options',
                name: 'options',
                type: 'collection',
                placeholder: 'Add Option',
                default: {},
                options: [
                    {
                        displayName: 'Polling Interval (seconds)',
                        name: 'pollingInterval',
                        type: 'number',
                        default: 2,
                        description: 'Time to wait between each check',
                    },
                    {
                        displayName: 'Timeout (seconds)',
                        name: 'timeout',
                        type: 'number',
                        default: 120,
                        description: 'Maximum time to wait for a response',
                    },
                ],
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        const credentials = await this.getCredentials('toqanApi');
        const baseUrl = (credentials.baseUrl as string) || 'https://api.coco.prod.toqan.ai/api';

        for (let i = 0; i < items.length; i++) {
            try {
                const sessionStrategy = this.getNodeParameter('sessionStrategy', i) as string;
                const prompt = this.getNodeParameter('prompt', i) as string;
                const fileIdsStr = this.getNodeParameter('fileIds', i, '') as string;
                const options = this.getNodeParameter('options', i, {}) as IDataObject;

                const pollingInterval = (options.pollingInterval as number) || 2;
                const timeout = (options.timeout as number) || 120;

                let conversationId: string;
                let requestId: string;

                // Step 1: Initiate Request
                if (sessionStrategy === 'new') {
                    const body: IDataObject = {
                        user_message: prompt,
                    };

                    if (fileIdsStr) {
                        const fileIds = fileIdsStr.split(',').map((id) => id.trim());
                        body.private_user_files = fileIds.map((id) => ({ id }));
                    }

                    const createResponse = await this.helpers.httpRequestWithAuthentication.call(
                        this,
                        'toqanApi',
                        {
                            method: 'POST',
                            url: `${baseUrl}/create_conversation`,
                            body,
                            json: true,
                        },
                    ) as IDataObject;

                    conversationId = createResponse.conversation_id as string;
                    requestId = createResponse.request_id as string;
                } else {
                    // Continue
                    conversationId = this.getNodeParameter('conversationId', i) as string;

                    const body: IDataObject = {
                        conversation_id: conversationId,
                        user_message: prompt,
                    };

                    if (fileIdsStr) {
                        const fileIds = fileIdsStr.split(',').map((id) => id.trim());
                        body.private_user_files = fileIds.map((id) => ({ id }));
                    }

                    const continueResponse = await this.helpers.httpRequestWithAuthentication.call(
                        this,
                        'toqanApi',
                        {
                            method: 'POST',
                            url: `${baseUrl}/continue_conversation`,
                            body,
                            json: true,
                        },
                    ) as IDataObject;

                    requestId = continueResponse.request_id as string;
                }

                // Step 2: Poll for Answer
                const startTime = Date.now();
                const startTimestamp = new Date(startTime).toISOString();
                const timeoutMs = timeout * 1000;
                let finalResponse: IDataObject = {};
                let isFinished = false;

                while (!isFinished) {
                    if (Date.now() - startTime > timeoutMs) {
                        throw new NodeOperationError(this.getNode(), 'Timeout exceeded waiting for AI response', {
                            itemIndex: i,
                        });
                    }

                    await new Promise((resolve) => setTimeout(resolve, pollingInterval * 1000));

                    try {
                        const pollResponse = await this.helpers.httpRequestWithAuthentication.call(
                            this,
                            'toqanApi',
                            {
                                method: 'GET',
                                url: `${baseUrl}/get_answer`,
                                qs: {
                                    conversation_id: conversationId,
                                    request_id: requestId,
                                },
                                json: true,
                            },
                        ) as IDataObject;

                        const status = pollResponse.status as string;

                        if (status === 'finished') {
                            finalResponse = pollResponse;
                            isFinished = true;
                        } else if (status === 'error') {
                            throw new Error(`Toqan API Error: ${JSON.stringify(pollResponse)}`);
                        }
                    } catch (error) {
                        // If it's a transient network error, we might want to retry, but for now we throw
                        throw error;
                    }
                }

                // Step 3: Process Response
                const endTime = Date.now();
                const endTimestamp = new Date(endTime).toISOString();
                const processedResponse = processThinking(finalResponse);

                returnData.push({
                    json: {
                        output: processedResponse.answer, // Main output for the agent
                        conversation_id: conversationId,
                        request_id: requestId,
                        thinking: processedResponse.thinking,
                        has_thinking: processedResponse.has_thinking,
                        answer_original: processedResponse.answer_original,
                        elapsed_ms: endTime - startTime,
                        started_at: startTimestamp,
                        finished_at: endTimestamp,
                    },
                    pairedItem: { item: i },
                });

            } catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: (error as Error).message,
                        },
                        pairedItem: { item: i },
                    });
                    continue;
                }
                throw new NodeOperationError(this.getNode(), error as Error, {
                    itemIndex: i,
                });
            }
        }

        return [returnData];
    }
}
