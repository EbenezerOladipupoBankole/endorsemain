const fs = require('fs');
const filename = process.argv[2] || 'projects.txt';
const content = fs.readFileSync(filename, 'utf16le');
console.log(content);


