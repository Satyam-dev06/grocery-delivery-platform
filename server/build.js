const fs = require('fs');
const path = require('path');
const base = 'C:\Users\satya\OneDrive\Desktop\Grocery Platform\grocery-delivery-platform';
function write(relPath, content) {
  fs.writeFileSync(path.join(base, relPath), content);
  console.log('Created:', relPath);
}
console.log('Build script loaded');
