import {
    IAuthenticateGeneric,
    ICredentialTestRequest,
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class ToqanApi implements ICredentialType {
    name = 'toqanApi';
    displayName = 'Toqan AI API';
    documentationUrl = 'https://toqan-api.readme.io/reference';
    properties: INodeProperties[] = [
        {
            displayName: 'API Key',
            name: 'apiKey',
            type: 'string',
            typeOptions: { password: true },
            default: '',
            required: true,
            description: 'Your Toqan AI API key (starts with sk_)',
        },
        {
            displayName: 'Base URL',
            name: 'baseUrl',
            type: 'string',
            default: 'https://api.coco.prod.toqan.ai/api',
            description: 'Toqan API base URL',
        },
    ];

    authenticate: IAuthenticateGeneric = {
        type: 'generic',
        properties: {
            headers: {
                'x-api-key': '={{$credentials.apiKey}}',
            },
        },
    };

    test: ICredentialTestRequest = {
        request: {
            baseURL: '={{$credentials.baseUrl}}',
            url: '/create_conversation',
            method: 'POST',
            body: {
                user_message: 'Test connection',
            },
        },
    };
}
