const fs = require('fs');
const path = 'client/src/styles.css';
let content = fs.readFileSync(path, 'utf8');

const replacements = [
  { search: /background: #000(?!\w)/g, replace: 'background: #181818' },
  { search: /background: #0a0a0a(?!\w)/g, replace: 'background: #161616' },
  { search: /background: #0c0c0c(?!\w)/g, replace: 'background: #181818' },
  { search: /background: #111(?!\w)/g, replace: 'background: #1a1a1a' },
  { search: /background: #111111(?!\w)/g, replace: 'background: #1a1a1a' },
  { search: /background: #141414(?!\w)/g, replace: 'background: #1c1c1c' },
  { search: /#0f1624(?!\w)/g, replace: '#1a1a1a' },
  { search: /background: linear-gradient\(135deg, #7cb8ff, #4f7fff\)/g, replace: 'background: #3a3a3a' },
  { search: /#111827(?!\w)/g, replace: '#1e1e1e' },
  { search: /#1f2937(?!\w)/g, replace: '#242424' },
  { search: /#374151(?!\w)/g, replace: '#333333' },
  { search: /#1b2230(?!\w)/g, replace: '#1e1e1e' },
  { search: /#1f2a3d(?!\w)/g, replace: '#222222' },
  { search: /#27344b(?!\w)/g, replace: '#2a2a2a' },
  { search: /#141b27(?!\w)/g, replace: '#1c1c1c' },
  { search: /#192235(?!\w)/g, replace: '#1e1e1e' },
  { search: /#223048(?!\w)/g, replace: '#2a2a2a' }
];

replacements.forEach(r => {
  content = content.replace(r.search, r.replace);
});

fs.writeFileSync(path, content);
console.log('Replacements completed.');
