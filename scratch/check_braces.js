const fs = require('fs');
const code = fs.readFileSync('js/toeic/exam-practice.js', 'utf8');
let open = 0;
const lines = code.split('\n');
lines.forEach((line, idx) => {
  for (let c of line) {
    if (c === '{') open++;
    if (c === '}') open--;
  }
  if (open < 0) {
    console.log(`Unmatched closing brace at line ${idx + 1}: ${line}`);
  }
});
console.log(`Final open count: ${open}`);
