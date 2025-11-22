import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    IDataObject,
    NodeOperationError,
    INodeParameters,
} from 'n8n-workflow';

// Function to configure outputs dynamically
const configuredOutputs = (parameters: INodeParameters) => {
    const operation = parameters.operation as string;
    const waitForResponse = parameters.waitForResponse as boolean;

    // Check if we should have multiple outputs (polling mode)
    const shouldPoll = waitForResponse && (operation === 'createConversation' || operation === 'continueConversation');

    if (shouldPoll) {
        return [
            { type: 'main', displayName: 'finished' },
            { type: 'main', displayName: 'error' },
            { type: 'main', displayName: 'timeout' },
        ];
    }

    return [{ type: 'main', displayName: '' }];
};

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

export class Toqan implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Toqan AI',
        name: 'toqan',
        icon: 'file:toqan.svg',
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["operation"]}}',
        description: 'Interact with Toqan AI conversations',
        defaults: {
            name: 'Toqan AI',
        },
        inputs: ['main'],
        outputs: `={{(${configuredOutputs})($parameter)}}` as any,
        credentials: [
            {
                name: 'toqanApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                options: [
                    {
                        name: 'Create Conversation',
                        value: 'createConversation',
                        description: 'Create a new conversation',
                        action: 'Create a conversation',
                    },
                    {
                        name: 'Continue Conversation',
                        value: 'continueConversation',
                        description: 'Continue an existing conversation',
                        action: 'Continue a conversation',
                    },
                    {
                        name: 'Get Answer',
                        value: 'getAnswer',
                        description: 'Get the answer from a conversation request',
                        action: 'Get an answer',
                    },
                    {
                        name: 'Upload File',
                        value: 'uploadFile',
                        description: 'Upload a file to use in conversations',
                        action: 'Upload a file',
                    },
                    {
                        name: 'Find Conversation',
                        value: 'findConversation',
                        description: 'Find a conversation by ID',
                        action: 'Find a conversation',
                    },
                ],
                default: 'createConversation',
            },

            // Wait for response checkbox
            {
                displayName: 'Aguardar até Resposta',
                name: 'waitForResponse',
                type: 'boolean',
                displayOptions: {
                    show: {
                        operation: ['createConversation', 'continueConversation'],
                    },
                },
                default: false,
                description: 'Whether to wait for the response automatically (polling)',
            },

            // Polling configuration fields
            {
                displayName: 'Polling Interval (seconds)',
                name: 'pollingInterval',
                type: 'number',
                displayOptions: {
                    show: {
                        operation: ['createConversation', 'continueConversation'],
                        waitForResponse: [true],
                    },
                },
                default: 2,
                description: 'Time to wait between each check (in seconds)',
            },
            {
                displayName: 'Timeout (seconds)',
                name: 'timeout',
                type: 'number',
                displayOptions: {
                    show: {
                        operation: ['createConversation', 'continueConversation'],
                        waitForResponse: [true],
                    },
                },
                default: 60,
                description: 'Maximum time to wait for a response (in seconds)',
            },

            // Create Conversation fields
            {
                displayName: 'Message',
                name: 'message',
                type: 'string',
                typeOptions: {
                    rows: 4,
                },
                displayOptions: {
                    show: {
                        operation: ['createConversation'],
                    },
                },
                default: '',
                required: true,
                description: 'The initial message to start the conversation',
            },
            {
                displayName: 'File IDs',
                name: 'fileIds',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['createConversation'],
                    },
                },
                default: '',
                description: 'Comma-separated list of file IDs to attach (optional)',
            },

            // Continue Conversation fields
            {
                displayName: 'Conversation ID',
                name: 'conversationId',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['continueConversation', 'getAnswer', 'findConversation'],
                    },
                },
                default: '',
                required: true,
                description: 'The conversation ID',
            },
            {
                displayName: 'Message',
                name: 'message',
                type: 'string',
                typeOptions: {
                    rows: 4,
                },
                displayOptions: {
                    show: {
                        operation: ['continueConversation'],
                    },
                },
                default: '',
                required: true,
                description: 'The message to send',
            },
            {
                displayName: 'File IDs',
                name: 'fileIds',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['continueConversation'],
                    },
                },
                default: '',
                description: 'Comma-separated list of file IDs to attach (optional)',
            },

            // Get Answer fields
            {
                displayName: 'Request ID',
                name: 'requestId',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['getAnswer'],
                    },
                },
                default: '',
                required: true,
                description: 'The request ID from create/continue conversation',
            },

            // Upload File fields
            {
                displayName: 'Input Binary Field',
                name: 'binaryPropertyName',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['uploadFile'],
                    },
                },
                default: 'data',
                required: true,
                description: 'The name of the binary field containing the file',
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const operation = this.getNodeParameter('operation', 0);

        const credentials = await this.getCredentials('toqanApi');
        const baseUrl = (credentials.baseUrl as string) || 'https://api.coco.prod.toqan.ai/api';

        // Check if we should wait for response
        const waitForResponse = this.getNodeParameter('waitForResponse', 0, false) as boolean;
        const shouldPoll = waitForResponse && (operation === 'createConversation' || operation === 'continueConversation');

        // For polling operations, we need separate output arrays
        if (shouldPoll) {
            const finishedData: INodeExecutionData[] = [];
            const errorData: INodeExecutionData[] = [];
            const timeoutData: INodeExecutionData[] = [];

            for (let i = 0; i < items.length; i++) {
                try {
                    const pollingInterval = this.getNodeParameter('pollingInterval', i) as number;
                    const timeout = this.getNodeParameter('timeout', i) as number;
                    const message = this.getNodeParameter('message', i) as string;
                    const fileIdsStr = this.getNodeParameter('fileIds', i, '') as string;

                    let conversationId: string;
                    let requestId: string;

                    // Step 1: Create or continue conversation
                    if (operation === 'createConversation') {
                        const body: IDataObject = {
                            user_message: message,
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
                        conversationId = this.getNodeParameter('conversationId', i) as string;

                        const body: IDataObject = {
                            conversation_id: conversationId,
                            user_message: message,
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

                    // Step 2: Poll for answer
                    const startTime = Date.now();
                    const startTimestamp = new Date(startTime).toISOString();
                    const timeoutMs = timeout * 1000;
                    let lastResponse: IDataObject = {};

                    while (true) {
                        // Check if timeout exceeded
                        if (Date.now() - startTime > timeoutMs) {
                            const endTime = Date.now();
                            const endTimestamp = new Date(endTime).toISOString();

                            timeoutData.push({
                                json: {
                                    error: 'Timeout exceeded waiting for response',
                                    conversation_id: conversationId,
                                    request_id: requestId,
                                    last_status: lastResponse.status || 'unknown',
                                    elapsed_ms: endTime - startTime,
                                    started_at: startTimestamp,
                                    finished_at: endTimestamp,
                                },
                                pairedItem: { item: i },
                            });
                            break;
                        }

                        // Wait before polling
                        await new Promise(resolve => setTimeout(resolve, pollingInterval * 1000));

                        // Get answer
                        try {
                            lastResponse = await this.helpers.httpRequestWithAuthentication.call(
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

                            const status = lastResponse.status as string;

                            if (status === 'finished') {
                                const endTime = Date.now();
                                const endTimestamp = new Date(endTime).toISOString();

                                // Process thinking tags and add metadata
                                const processedResponse = processThinking(lastResponse);

                                finishedData.push({
                                    json: {
                                        ...processedResponse,
                                        conversation_id: conversationId,
                                        request_id: requestId,
                                        elapsed_ms: endTime - startTime,
                                        started_at: startTimestamp,
                                        finished_at: endTimestamp,
                                    },
                                    pairedItem: { item: i },
                                });
                                break;
                            } else if (status === 'error') {
                                const endTime = Date.now();
                                const endTimestamp = new Date(endTime).toISOString();

                                errorData.push({
                                    json: {
                                        ...lastResponse,
                                        conversation_id: conversationId,
                                        request_id: requestId,
                                        elapsed_ms: endTime - startTime,
                                        started_at: startTimestamp,
                                        finished_at: endTimestamp,
                                    },
                                    pairedItem: { item: i },
                                });
                                break;
                            }
                            // If status is 'in_progress', continue polling
                        } catch (pollError) {
                            errorData.push({
                                json: {
                                    error: (pollError as Error).message,
                                    conversation_id: conversationId,
                                    request_id: requestId,
                                },
                                pairedItem: { item: i },
                            });
                            break;
                        }
                    }
                } catch (error) {
                    errorData.push({
                        json: {
                            error: (error as Error).message,
                        },
                        pairedItem: { item: i },
                    });
                }
            }

            return [finishedData, errorData, timeoutData];
        }

        // For non-polling operations, use single output
        const returnData: INodeExecutionData[] = [];

        for (let i = 0; i < items.length; i++) {
            try {
                let responseData: IDataObject = {};

                if (operation === 'createConversation') {
                    const message = this.getNodeParameter('message', i) as string;
                    const fileIdsStr = this.getNodeParameter('fileIds', i, '') as string;

                    const body: IDataObject = {
                        user_message: message,
                    };

                    if (fileIdsStr) {
                        const fileIds = fileIdsStr.split(',').map((id) => id.trim());
                        body.private_user_files = fileIds.map((id) => ({ id }));
                    }

                    responseData = await this.helpers.httpRequestWithAuthentication.call(
                        this,
                        'toqanApi',
                        {
                            method: 'POST',
                            url: `${baseUrl}/create_conversation`,
                            body,
                            json: true,
                        },
                    );
                } else if (operation === 'continueConversation') {
                    const conversationId = this.getNodeParameter('conversationId', i) as string;
                    const message = this.getNodeParameter('message', i) as string;
                    const fileIdsStr = this.getNodeParameter('fileIds', i, '') as string;

                    const body: IDataObject = {
                        conversation_id: conversationId,
                        user_message: message,
                    };

                    if (fileIdsStr) {
                        const fileIds = fileIdsStr.split(',').map((id) => id.trim());
                        body.private_user_files = fileIds.map((id) => ({ id }));
                    }

                    responseData = await this.helpers.httpRequestWithAuthentication.call(
                        this,
                        'toqanApi',
                        {
                            method: 'POST',
                            url: `${baseUrl}/continue_conversation`,
                            body,
                            json: true,
                        },
                    );
                } else if (operation === 'getAnswer') {
                    const conversationId = this.getNodeParameter('conversationId', i) as string;
                    const requestId = this.getNodeParameter('requestId', i) as string;

                    responseData = await this.helpers.httpRequestWithAuthentication.call(
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
                    );
                } else if (operation === 'uploadFile') {
                    const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
                    const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);

                    const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

                    // Use httpRequest with body instead of formData
                    const FormData = require('form-data');
                    const form = new FormData();
                    form.append('file', binaryDataBuffer, {
                        filename: binaryData.fileName || 'file',
                        contentType: binaryData.mimeType,
                    });

                    responseData = await this.helpers.httpRequestWithAuthentication.call(
                        this,
                        'toqanApi',
                        {
                            method: 'PUT',
                            url: `${baseUrl}/upload_file`,
                            body: form,
                            headers: {
                                ...form.getHeaders(),
                            },
                            json: true,
                        },
                    );
                } else if (operation === 'findConversation') {
                    const conversationId = this.getNodeParameter('conversationId', i) as string;

                    responseData = await this.helpers.httpRequestWithAuthentication.call(
                        this,
                        'toqanApi',
                        {
                            method: 'POST',
                            url: `${baseUrl}/find_conversation`,
                            body: {
                                conversation_id: conversationId,
                            },
                            json: true,
                        },
                    );
                }

                returnData.push({
                    json: responseData,
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
