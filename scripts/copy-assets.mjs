import { cpSync, mkdirSync } from 'node:fs';

mkdirSync('dist/nodes/GermanCompanyData', { recursive: true });
cpSync(
	'nodes/GermanCompanyData/germanCompanyData.svg',
	'dist/nodes/GermanCompanyData/germanCompanyData.svg',
);
cpSync(
	'nodes/GermanCompanyData/GermanCompanyData.node.json',
	'dist/nodes/GermanCompanyData/GermanCompanyData.node.json',
);
console.log('Assets copied to dist/.');
