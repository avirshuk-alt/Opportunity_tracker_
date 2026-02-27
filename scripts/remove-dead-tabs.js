const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const filePath = join(process.cwd(), 'app', 'fact-base', 'page.tsx');
console.log('Looking for:', filePath);

const content = readFileSync(filePath, 'utf-8');
const lines = content.split('\n');
console.log('Total lines before:', lines.length);

let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('BLOCK_REMOVAL_P2')) {
    startIdx = i;
  }
  if (startIdx !== -1 && lines[i].includes('TAB 5: STAKEHOLDERS')) {
    endIdx = i;
    break;
  }
}

if (startIdx === -1 || endIdx === -1) {
  console.log(`Could not find boundaries: start=${startIdx}, end=${endIdx}`);
  process.exit(1);
}

console.log(`Removing lines ${startIdx + 1} to ${endIdx} (keeping line ${endIdx + 1})`);
console.log(`First removed: ${lines[startIdx].trim()}`);
console.log(`Last removed: ${lines[endIdx - 1].trim()}`);
console.log(`First kept after: ${lines[endIdx].trim()}`);

const newLines = [...lines.slice(0, startIdx), '', ...lines.slice(endIdx)];
console.log('Total lines after:', newLines.length);

writeFileSync(filePath, newLines.join('\n'), 'utf-8');
console.log('Done!');
