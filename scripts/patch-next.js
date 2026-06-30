const fs = require('fs');
const path = require('path');

const target = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'server', 'lib', 'router-utils', 'setup-dev-bundler.js');
if (!fs.existsSync(target)) {
  console.error('target file not found:', target);
  process.exit(1);
}
let s = fs.readFileSync(target, 'utf8');

const pattern = /for \(const p of conflictingAppPagePaths\)\{[\s\S]*?errorMessage \+= `  \"\$\{pagesPath\}\" - \"\$\{appPath\}\"\\n`;[\s\S]*?\}\n/;
if (!pattern.test(s)) {
  console.error('pattern not found in target file');
  process.exit(1);
}
const replacement = `for (const p of conflictingAppPagePaths){\n` +
  "                        // Guard against unexpected missing entries in the maps.\n" +
  "                        const appFile = appPageFilePaths.get(p);\n" +
  "                        const pagesFile = pagesPageFilePaths.get(p);\n" +
  "                        const appPath = appFile ? _path.default.relative(dir, appFile) : '<unknown>';\n" +
  "                        const pagesPath = pagesFile ? _path.default.relative(dir, pagesFile) : '<unknown>';\n" +
  "                        errorMessage += `  \"${pagesPath}\" - \"${appPath}\"\\n`;\n" +
  "                    }\n";

s = s.replace(pattern, replacement);
fs.writeFileSync(target, s, 'utf8');
console.log('patched', target);

