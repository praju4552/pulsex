const fs = require('fs');
const path = require('path');

const filePath = path.resolve('d:/edu(1)/src/app/components/ShopPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/#007F5F/ig, '#927B80');
content = content.replace(/#006B50/ig, '#927B80');
content = content.replace(/bg-green-500/ig, 'bg-[#927B80]');
content = content.replace(/text-green-500/ig, 'text-[#927B80]');
content = content.replace(/border-green-500/ig, 'border-[#927B80]');
content = content.replace(/text-green-400/ig, 'text-[#705e63]'); // Darker mauve
content = content.replace(/bg-blue-500/ig, 'bg-[#EDE1C7]');
content = content.replace(/text-blue-400/ig, 'text-[#927B80]');
content = content.replace(/border-blue-500/ig, 'border-[#927B80]');
content = content.replace(/bg-red-500/ig, 'bg-[#927B80]');
content = content.replace(/text-red-400/ig, 'text-[#705e63]');
content = content.replace(/border-red-500/ig, 'border-[#927B80]');

fs.writeFileSync(filePath, content);
console.log("Final edge cases replaced.");
