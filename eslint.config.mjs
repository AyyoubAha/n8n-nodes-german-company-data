import tsParser from '@typescript-eslint/parser';
import n8nNodesBase from 'eslint-plugin-n8n-nodes-base';
import jsoncParser from 'jsonc-eslint-parser';

export default [
	{
		ignores: ['dist/**', 'node_modules/**', 'scripts/**', 'eslint.config.mjs'],
	},
	{
		files: ['package.json'],
		languageOptions: { parser: jsoncParser },
		plugins: { 'n8n-nodes-base': n8nNodesBase },
		rules: {
			...n8nNodesBase.configs.community.rules,
			'n8n-nodes-base/community-package-json-name-still-default': 'off',
		},
	},
	{
		files: ['credentials/**/*.ts'],
		languageOptions: {
			parser: tsParser,
			parserOptions: { project: './tsconfig.json', sourceType: 'module' },
		},
		plugins: { 'n8n-nodes-base': n8nNodesBase },
		rules: n8nNodesBase.configs.credentials.rules,
	},
	{
		files: ['nodes/**/*.ts'],
		languageOptions: {
			parser: tsParser,
			parserOptions: { project: './tsconfig.json', sourceType: 'module' },
		},
		plugins: { 'n8n-nodes-base': n8nNodesBase },
		rules: n8nNodesBase.configs.nodes.rules,
	},
];
