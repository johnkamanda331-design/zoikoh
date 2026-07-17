const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fp = path.join(dir, file);
    const stat = fs.statSync(fp);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fp));
    } else {
      results.push(fp);
    }
  });
  return results;
}

const root = path.join(__dirname, '..', 'artifacts', 'bible-explorer', 'src');
const files = walk(root).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

function parseImports(content) {
  const imports = new Set();
  const namedRe = /import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = namedRe.exec(content))) {
    const names = m[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim());
    names.forEach(n => imports.add(n));
  }
  const defaultRe = /import\s+([A-Za-z0-9_]+)\s+from\s*['"]/g;
  while ((m = defaultRe.exec(content))) {
    imports.add(m[1]);
  }
  return imports;
}

function parseLocalDefs(content) {
  const defs = new Set();
  const funcRe = /(?:export\s+)?function\s+([A-Z][A-Za-z0-9_]*)\s*\(/g;
  let m;
  while ((m = funcRe.exec(content))) defs.add(m[1]);
  const constRe = /(?:const|let|var)\s+([A-Z][A-Za-z0-9_]*)\s*=/g;
  while ((m = constRe.exec(content))) defs.add(m[1]);
  const classRe = /class\s+([A-Z][A-Za-z0-9_]*)\s+/g;
  while ((m = classRe.exec(content))) defs.add(m[1]);
  return defs;
}

function parseJSXTags(content) {
  const tags = new Set();
  const tagRe = /<([A-Z][A-Za-z0-9_]*)\b/g;
  let m;
  while ((m = tagRe.exec(content))) tags.add(m[1]);
  return tags;
}

const report = [];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const imports = parseImports(content);
  const defs = parseLocalDefs(content);
  const tags = parseJSXTags(content);
  const missing = [];
  tags.forEach(tag => {
    if (!imports.has(tag) && !defs.has(tag) && tag !== 'React' && tag !== 'svg' && tag !== 'path' && tag !== 'g' && tag !== 'rect' && tag !== 'motion') {
      missing.push(tag);
    }
  });
  if (missing.length) {
    report.push({ file: path.relative(process.cwd(), file), missing: Array.from(new Set(missing)).sort() });
  }
}

if (report.length === 0) {
  console.log('No missing imports detected by heuristic scan.');
  process.exit(0);
}

for (const r of report) {
  console.log('File:', r.file);
  console.log('Potential missing tags:', r.missing.join(', '));
  console.log('---');
}

process.exit(0);
