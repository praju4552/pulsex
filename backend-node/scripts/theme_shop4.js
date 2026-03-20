const fs = require('fs');
const path = require('path');

const filePath = path.resolve('d:/edu(1)/src/app/components/ShopPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The Sandstone background (#EDE1C7) is very light, so the Mauve text (#927B80) might be too washed out for readability.
// The user asked to make the text "visible more brighter" - which on a light background means dramatically darker and thicker.

// Text replacements for stronger contrast:
content = content.replace(/text-\[#3a2f32\]/g, 'text-[#2a2224] font-bold'); // Was white -> pitch dark mauve
content = content.replace(/text-\[#5a4a4e\]/g, 'text-[#362b2e] font-bold'); // Was white/80
content = content.replace(/text-\[#705e63\]/g, 'text-[#44363a] font-semibold'); // Was white/70 or green-400
content = content.replace(/text-\[#927B80\]\/80/g, 'text-[#564449] font-semibold'); // Was white/40
content = content.replace(/text-\[#927B80\]\/60/g, 'text-[#614d52] font-medium'); // Was white/30
content = content.replace(/text-\[#927B80\]\/50/g, 'text-[#6b555b] font-medium'); // Was white/25
content = content.replace(/text-\[#927B80\]\/40/g, 'text-[#755d64] font-medium'); // Was white/20
content = content.replace(/text-\[#927B80\]/g, 'text-[#44363a] font-bold'); // The base mauve -> deeper mauve text

// Clean up redundant font weights if they accidentally stack
content = content.replace(/font-medium font-medium/g, 'font-medium');
content = content.replace(/font-semibold font-semibold/g, 'font-semibold');
content = content.replace(/font-bold font-bold/g, 'font-bold');
content = content.replace(/font-bold font-semibold/g, 'font-bold');
content = content.replace(/font-semibold font-bold/g, 'font-bold');

fs.writeFileSync(filePath, content);
console.log("Text contrast boosted.");
