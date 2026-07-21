import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class GermanCompanyDataApi implements ICredentialType {
	name = 'germanCompanyDataApi';

	displayName = 'German Company Data (Apify) API';

	icon: Icon = {
		light: 'file:germanCompanyData.svg',
		dark: 'file:germanCompanyData.dark.svg',
	};

	documentationUrl = 'https://docs.apify.com/platform/integrations/api';

	properties: INodeProperties[] = [
		{
			displayName: 'Apify API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'Your personal Apify API token. Find it in the Apify Console under Settings → API & Integrations. A free Apify account is enough to get started.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.apify.com',
			url: '/v2/users/me',
		},
	};
}
