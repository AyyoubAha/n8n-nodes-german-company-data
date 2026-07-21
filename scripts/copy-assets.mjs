import { cpSync, mkdirSync } from 'node:fs';

mkdirSync('dist/nodes/GermanCompanyData', { recursive: true });
mkdirSync('dist/credentials', { recursive: true });

for (const file of ['germanCompanyData.svg', 'germanCompanyData.dark.svg']) {
	cpSync(`nodes/GermanCompanyData/${file}`, `dist/nodes/GermanCompanyData/${file}`);
	cpSync(`credentials/${file}`, `dist/credentials/${file}`);
}
cpSync(
	'nodes/GermanCompanyData/GermanCompanyData.node.json',
	'dist/nodes/GermanCompanyData/GermanCompanyData.node.json',
);
console.log('Assets copied to dist/.');
