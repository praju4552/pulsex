const fs = require('fs');
const path = require('path');

const filePath = path.resolve('d:/edu(1)/src/app/components/ShopPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const matches = content.match(/bg-[a-zA-Z0-9-\[\]#\/]+/g) || [];
const textMatches = content.match(/text-[a-zA-Z0-9-\[\]#\/]+/g) || [];
const borderMatches = content.match(/border-[a-zA-Z0-9-\[\]#\/]+/g) || [];

console.log("Backgrounds:", [...new Set(matches)].filter(m => m.includes('green') || m.includes('#')));
console.log("Texts:", [...new Set(textMatches)].filter(m => m.includes('green') || m.includes('#')));
console.log("Borders:", [...new Set(borderMatches)].filter(m => m.includes('green') || m.includes('#')));

// Let's just forcefully replace green tailwind classes to something sandstone/mauve.
content = content.replace(/bg-green-500/g, 'bg-[#927B80]');
content = content.replace(/text-green-400/g, 'text-[#705e63]');
content = content.replace(/text-green-300/g, 'text-[#705e63]');
content = content.replace(/border-green-500/g, 'border-[#927B80]');
content = content.replace(/shadow-green-900/g, 'shadow-[#705e63]');

// There's a #4ADE80 and #22c55e in ProductCard components that usually is an external component or in the file itself. 
// Wait, ProductCard is in the SAME FILE. So the previous replacements applied.
// Let's do another pass just in case.
content = content.replace(/#4ade80/ig, '#927B80');
content = content.replace(/#22c55e/ig, '#e5d5b7'); // Hover color 
content = content.replace(/#003D2E/ig, '#EDE1C7');
content = content.replace(/#004A37/ig, '#e5d5b7');
content = content.replace(/#005B44/ig, '#EDE1C7');
content = content.replace(/#007F5F/ig, '#927B80');

fs.writeFileSync(filePath, content);
console.log("Done replacing more greens.");
