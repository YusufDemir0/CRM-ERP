const fs = require('fs');
const path = require('path');

const apiFile = path.join(__dirname, 'src/services/api.ts');
const apiDir = path.join(__dirname, 'src/services/api');

if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true });
}

const content = fs.readFileSync(apiFile, 'utf8');

const typeImportMatch = content.match(/import\s+\{[\s\S]*?\}\s+from\s+'\.\.\/types';/);
let typeImport = typeImportMatch ? typeImportMatch[0] : '';
typeImport = typeImport.replace("'../types'", "'../../types'");

const sections = content.split(/\/\/ ────── [A-Z ]+ ──────/);
const headers = content.match(/\/\/ ────── ([A-Z ]+) ──────/g);

const coreSection = sections[0] + headers[0] + sections[1] + headers[1] + sections[2];
fs.writeFileSync(path.join(apiDir, 'core.ts'), coreSection);

const modules = [];

for (let i = 2; i < headers.length; i++) {
  const header = headers[i];
  const body = sections[i + 1];
  
  const match = header.match(/\/\/ ────── ([A-Z ]+) API ──────/);
  if (match) {
    let name = match[1].toLowerCase().replace(/ /g, '-');
    if (name === 'production-orders') name = 'production';
    
    const exportMatch = body.match(/export const (\w+) =/);
    if (exportMatch) {
      const exportName = exportMatch[1];
      modules.push({ file: `${name}.api`, exportName });
      
      const fileContent = `import api from './core';\nimport { AxiosRequestConfig } from 'axios';\n${typeImport}\n\n${body.trim()}\n`;
      fs.writeFileSync(path.join(apiDir, `${name}.api.ts`), fileContent);
    }
  }
}

let newApiTs = `export { default } from './api/core';\n`;
for (const mod of modules) {
  newApiTs += `export { ${mod.exportName} } from './api/${mod.file}';\n`;
}
newApiTs += `export { resolveFailedRequests, rejectFailedRequests } from './api/core';\n`;

fs.writeFileSync(apiFile, newApiTs);
console.log('Splitting done.');
