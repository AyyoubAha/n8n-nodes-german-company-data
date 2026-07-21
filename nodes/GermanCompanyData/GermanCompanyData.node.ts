import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { jsonParse, NodeApiError, NodeOperationError, sleep } from 'n8n-workflow';

const APIFY_BASE_URL = 'https://api.apify.com';

const ACTOR_IDS: Record<string, string> = {
	companyIntel: 'ayyouba~dach-company-intel',
	insolvencyCheck: 'ayyouba~german-insolvency-api',
	impressumScrape: 'ayyouba~german-impressum-scraper',
};

const TERMINAL_STATUSES = ['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'];

// accepts an array (from an expression) or a comma-/newline-separated string
function toStringList(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.map((entry) => String(entry).trim()).filter((entry) => entry.length > 0);
	}
	return String(value ?? '')
		.split(/[\n,]+/)
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);
}

async function apifyRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	path: string,
	body?: IDataObject,
	qs?: IDataObject,
): Promise<IDataObject> {
	const options: IHttpRequestOptions = {
		method,
		url: `${APIFY_BASE_URL}${path}`,
		json: true,
	};
	if (body !== undefined) options.body = body;
	if (qs !== undefined) options.qs = qs;

	try {
		return (await this.helpers.httpRequestWithAuthentication.call(
			this,
			'germanCompanyDataApi',
			options,
		)) as IDataObject;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

export class GermanCompanyData implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'German Company Data',
		name: 'germanCompanyData',
		icon: 'file:germanCompanyData.svg',
		group: ['transform'],
		version: 1,
		subtitle:
			'={{ $parameter["operation"] === "companyIntel" ? "Company Intelligence (KYB)" : $parameter["operation"] === "insolvencyCheck" ? "Insolvency Check" : "Impressum Scraper" }}',
		description:
			'Verified German company data: KYB profiles (Handelsregister, VIES VAT, Bundesanzeiger), insolvency register checks and Impressum contact extraction',
		defaults: {
			name: 'German Company Data',
		},
		usableAsTool: true,
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'germanCompanyDataApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				default: 'companyIntel',
				options: [
					{
						name: 'Company Intelligence (KYB)',
						value: 'companyIntel',
						action: 'Get a full company profile (KYB)',
						description:
							'Turn a domain, company name or VAT ID into a verified company profile: Handelsregister, Impressum, VIES VAT, insolvency and Bundesanzeiger financials',
					},
					{
						name: 'Impressum Scraper',
						value: 'impressumScrape',
						action: 'Scrape company data from an impressum',
						description:
							'Extract legal name, address, managing directors, register number, VAT ID and contact email/phone from a German website’s Impressum',
					},
					{
						name: 'Insolvency Check',
						value: 'insolvencyCheck',
						action: 'Check the insolvency register',
						description:
							'Check company names against the official German insolvency register (Insolvenzbekanntmachungen) for active proceedings',
					},
				],
			},
			{
				displayName: 'Companies',
				name: 'queries',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'zalando.de, DE811907980, Siemens AG',
				description:
					'Companies to resolve — each entry may be a website/domain, a company name or a VAT ID (USt-IdNr.); the type is auto-detected. Separate multiple entries with commas or new lines, or use an expression that returns an array.',
				displayOptions: {
					show: {
						operation: ['companyIntel'],
					},
				},
			},
			{
				displayName: 'Company Names',
				name: 'companies',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'Galeria Karstadt Kaufhof GmbH, Kettler GmbH',
				description:
					'Company names to check against the insolvency register — the full legal name works best. Separate multiple entries with commas or new lines, or use an expression that returns an array.',
				displayOptions: {
					show: {
						operation: ['insolvencyCheck'],
					},
				},
			},
			{
				displayName: 'Domains',
				name: 'domains',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'zalando.de, hellofresh.de',
				description:
					'German company websites to extract Impressum and contact data from. Separate multiple entries with commas or new lines, or use an expression that returns an array.',
				displayOptions: {
					show: {
						operation: ['impressumScrape'],
					},
				},
			},
			{
				displayName: 'Country',
				name: 'country',
				type: 'options',
				default: 'auto',
				description: 'Jurisdiction for register and insolvency lookups',
				options: [
					{ name: 'Auto-Detect', value: 'auto' },
					{ name: 'Germany (DE)', value: 'DE' },
					{ name: 'Austria (AT)', value: 'AT' },
				],
				displayOptions: {
					show: {
						operation: ['companyIntel'],
					},
				},
			},
			{
				displayName: 'Data Sources',
				name: 'sources',
				type: 'multiOptions',
				default: ['impressum', 'vies', 'handelsregister', 'insolvency', 'bundesanzeiger', 'enrichment'],
				description: 'Which authoritative sources to query and merge',
				options: [
					{ name: 'Bundesanzeiger Financial Signals', value: 'bundesanzeiger' },
					{ name: 'Handelsregister / Unternehmensregister', value: 'handelsregister' },
					{ name: 'Impressum (Legal Notice)', value: 'impressum' },
					{ name: 'Insolvency Register', value: 'insolvency' },
					{ name: 'VIES VAT Validation (EU)', value: 'vies' },
					{ name: 'Website & Tech Enrichment', value: 'enrichment' },
				],
				displayOptions: {
					show: {
						operation: ['companyIntel'],
					},
				},
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add option',
				default: {},
				options: [
					{
						displayName: 'Actor Build',
						name: 'build',
						type: 'string',
						default: '',
						description:
							'Tag or number of the actor build to run (e.g. "latest" or "beta"). Leave empty for the default build.',
					},
					{
						displayName: 'Custom Input JSON',
						name: 'customInput',
						type: 'json',
						default: '{}',
						description:
							'Advanced: extra fields merged into the actor input (e.g. a proxyConfiguration override). Takes precedence over the fields above.',
					},
					{
						displayName: 'Include Raw Evidence',
						name: 'includeRawEvidence',
						type: 'boolean',
						default: true,
						description:
							'Whether to attach source URLs and raw snippets used to derive each field, for auditability',
						displayOptions: {
							show: {
								'/operation': ['companyIntel'],
							},
						},
					},
					{
						displayName: 'Max Companies',
						name: 'maxCompanies',
						type: 'number',
						default: 100,
						description: 'Safety cap on how many companies to process in a single run',
						displayOptions: {
							show: {
								'/operation': ['companyIntel'],
							},
						},
					},
					{
						displayName: 'Max Domains',
						name: 'maxDomains',
						type: 'number',
						default: 1000,
						description: 'Safety cap on how many domains to process in a single run',
						displayOptions: {
							show: {
								'/operation': ['impressumScrape'],
							},
						},
					},
					{
						displayName: 'Memory (MB)',
						name: 'memoryMbytes',
						type: 'number',
						default: 0,
						description:
							'Memory for the actor run in megabytes (a power of 2, e.g. 1024). Set to 0 to use the actor default.',
					},
					{
						displayName: 'Redact Personal Data (GDPR)',
						name: 'redactPersonalData',
						type: 'boolean',
						default: false,
						description:
							'Whether to hash names of natural persons (e.g. managing directors) in the output. Company data of legal entities is retained.',
						displayOptions: {
							show: {
								'/operation': ['companyIntel', 'impressumScrape'],
							},
						},
					},
					{
						displayName: 'Timeout (Seconds)',
						name: 'timeout',
						type: 'number',
						default: 300,
						description:
							'How long to wait for the actor run to finish. Also applied as the run timeout on Apify. Set to 0 to wait up to one hour with the actor’s default timeout.',
					},
					{
						displayName: 'Wait for Finish',
						name: 'waitForFinish',
						type: 'boolean',
						default: true,
						description:
							'Whether to wait until the actor run finishes and return its dataset items. When disabled, the node starts the run and immediately returns the run object instead.',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const options = this.getNodeParameter('options', i, {}) as IDataObject;
				const actorId = ACTOR_IDS[operation];

				const input: IDataObject = {};
				if (operation === 'companyIntel') {
					input.queries = toStringList(this.getNodeParameter('queries', i));
					input.country = this.getNodeParameter('country', i, 'auto') as string;
					const sources = this.getNodeParameter('sources', i, []) as string[];
					if (sources.length > 0) input.sources = sources;
					if (options.maxCompanies) input.maxCompanies = options.maxCompanies;
					if (options.redactPersonalData !== undefined)
						input.redactPersonalData = options.redactPersonalData;
					if (options.includeRawEvidence !== undefined)
						input.includeRawEvidence = options.includeRawEvidence;
				} else if (operation === 'insolvencyCheck') {
					input.companies = toStringList(this.getNodeParameter('companies', i));
				} else {
					input.domains = toStringList(this.getNodeParameter('domains', i));
					if (options.maxDomains) input.maxDomains = options.maxDomains;
					if (options.redactPersonalData !== undefined)
						input.redactPersonalData = options.redactPersonalData;
				}

				const listField = operation === 'companyIntel' ? 'queries' : operation === 'insolvencyCheck' ? 'companies' : 'domains';
				if ((input[listField] as string[]).length === 0) {
					throw new NodeOperationError(this.getNode(), `No entries provided in "${listField}"`, {
						itemIndex: i,
					});
				}

				if (options.customInput) {
					const custom =
						typeof options.customInput === 'string'
							? jsonParse<IDataObject>(options.customInput, {
									errorMessage: 'Custom Input JSON is not valid JSON',
								})
							: (options.customInput as IDataObject);
					Object.assign(input, custom);
				}

				const timeout = options.timeout === undefined ? 300 : Number(options.timeout);
				const qs: IDataObject = {};
				if (timeout > 0) qs.timeout = timeout;
				if (options.memoryMbytes) qs.memory = options.memoryMbytes;
				if (options.build) qs.build = options.build;

				const startResponse = await apifyRequest.call(this, 'POST', `/v2/acts/${actorId}/runs`, input, qs);
				let run = startResponse.data as IDataObject;
				const runId = run.id as string;
				const consoleUrl = `https://console.apify.com/actors/runs/${runId}`;

				if (options.waitForFinish === false) {
					returnData.push({ json: { ...run, consoleUrl }, pairedItem: { item: i } });
					continue;
				}

				// long-poll until the run reaches a terminal status
				const deadline = Date.now() + (timeout > 0 ? timeout + 60 : 3600) * 1000;
				while (!TERMINAL_STATUSES.includes(run.status as string)) {
					if (Date.now() > deadline) {
						throw new NodeOperationError(
							this.getNode(),
							`Actor run did not finish within the configured wait time. It keeps running on Apify: ${consoleUrl}`,
							{ itemIndex: i },
						);
					}
					const waitSeconds = Math.max(
						1,
						Math.min(60, Math.ceil((deadline - Date.now()) / 1000)),
					);
					const pollResponse = await apifyRequest.call(this, 'GET', `/v2/actor-runs/${runId}`, undefined, {
						waitForFinish: waitSeconds,
					});
					run = pollResponse.data as IDataObject;
					if (!TERMINAL_STATUSES.includes(run.status as string)) await sleep(1000);
				}

				if (run.status !== 'SUCCEEDED') {
					const statusMessage = (run.statusMessage as string) ?? 'no status message';
					throw new NodeOperationError(
						this.getNode(),
						`Actor run finished with status ${run.status}: ${statusMessage}. Details: ${consoleUrl}`,
						{ itemIndex: i },
					);
				}

				const datasetId = run.defaultDatasetId as string;
				const pageSize = 1000;
				let offset = 0;
				for (;;) {
					const page = (await apifyRequest.call(this, 'GET', `/v2/datasets/${datasetId}/items`, undefined, {
						clean: true,
						format: 'json',
						offset,
						limit: pageSize,
					})) as unknown as IDataObject[];
					for (const datasetItem of page) {
						returnData.push({ json: datasetItem, pairedItem: { item: i } });
					}
					if (page.length < pageSize) break;
					offset += pageSize;
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
