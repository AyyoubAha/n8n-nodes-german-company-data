import tsParser from '@typescript-eslint/parser';
import n8nNodesBase from 'eslint-plugin-n8n-nodes-base';

// Rule overrides mirror n8n's community package scan gate
// (@n8n/scan-community-package), so `npm run lint` matches what the
// verification pipeline enforces.
export default [
	{
		ignores: ['dist/**', 'node_modules/**', 'scripts/**', 'eslint.config.mjs'],
	},
	{
		rules: { 'no-console': 'error' },
	},
	{
		files: ['package.json'],
		languageOptions: { parser: tsParser },
		plugins: { 'n8n-nodes-base': n8nNodesBase },
		rules: n8nNodesBase.configs.community.rules,
	},
	{
		files: ['credentials/**/*.ts'],
		languageOptions: {
			parser: tsParser,
			parserOptions: { project: './tsconfig.json', sourceType: 'module' },
		},
		plugins: { 'n8n-nodes-base': n8nNodesBase },
		rules: {
			...n8nNodesBase.configs.credentials.rules,
			'n8n-nodes-base/cred-class-field-documentation-url-miscased': 'off',
			'n8n-nodes-base/cred-class-field-type-options-password-missing': 'off',
		},
	},
	{
		files: ['nodes/**/*.ts'],
		languageOptions: {
			parser: tsParser,
			parserOptions: { project: './tsconfig.json', sourceType: 'module' },
		},
		plugins: { 'n8n-nodes-base': n8nNodesBase },
		rules: {
			...n8nNodesBase.configs.nodes.rules,
			'n8n-nodes-base/node-class-description-inputs-wrong-regular-node': 'off',
			'n8n-nodes-base/node-class-description-outputs-wrong': 'off',
			'n8n-nodes-base/node-param-type-options-max-value-present': 'off',
		},
	},
];
