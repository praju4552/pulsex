import * as fs from 'fs';
import * as path from 'path';

const filePath = path.resolve('d:/edu(1)/src/app/components/ShopPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Background mapping
content = content.replace(/bg-\[#0B0F19\]/g, 'bg-[#EDE1C7]');

// Primary Accent (Emerald/Green -> Mauve #927B80)
content = content.replace(/text-\[#4ade80\]/g, 'text-[#927B80]');
content = content.replace(/bg-\[#4ade80\]/g, 'bg-[#927B80]');
content = content.replace(/border-\[#4ade80\](\/\d+)?/g, 'border-[#927B80]$1');
content = content.replace(/text-emerald-400/g, 'text-[#927B80]');
content = content.replace(/bg-emerald-500\/20/g, 'bg-[#927B80]/20');
content = content.replace(/text-emerald-300/g, 'text-[#927B80]');
content = content.replace(/from-emerald-400\/\d+/g, 'from-[#927B80]/10');
content = content.replace(/via-emerald-400\/\d+/g, 'via-[#927B80]/10');

// Modal / Dropdown / Card backgrounds (Dark Greens -> Sandstone/Mauve blends)
content = content.replace(/bg-\[#003D2E\](\/\d+)?/g, 'bg-[#EDE1C7]'); // Or maybe white/50
content = content.replace(/bg-\[#004A37\]/g, 'bg-[#e5d5b7]'); // Slightly darker sandstone
content = content.replace(/bg-\[#005B44\]/g, 'bg-[#EDE1C7]');
content = content.replace(/border-\[#007F5F\]/g, 'border-[#927B80]/30');

// Text Colors (White -> Darker Sandstone/Mauve for readability)
// Replace absolute text-white with a very dark slate/mauve shade for contrast
content = content.replace(/text-white\b/g, 'text-[#3a2f32]');
content = content.replace(/text-white\/80/g, 'text-[#5a4a4e]');
content = content.replace(/text-white\/70/g, 'text-[#705e63]');
content = content.replace(/text-white\/60/g, 'text-[#927B80]');
content = content.replace(/text-white\/50/g, 'text-[#927B80]');
content = content.replace(/text-white\/40/g, 'text-[#927B80]/80');
content = content.replace(/text-white\/30/g, 'text-[#927B80]/60');
content = content.replace(/text-white\/25/g, 'text-[#927B80]/50');
content = content.replace(/text-white\/20/g, 'text-[#927B80]/40');

// White overlays/backgrounds (bg-white/x on dark -> bg-mauve/x on light)
content = content.replace(/bg-white\/5\b/g, 'bg-[#927B80]/5');
content = content.replace(/bg-white\/10\b/g, 'bg-[#927B80]/10');
content = content.replace(/bg-white\/20\b/g, 'bg-[#927B80]/20');

// Borders
content = content.replace(/border-white\/10\b/g, 'border-[#927B80]/10');
content = content.replace(/border-white\/15\b/g, 'border-[#927B80]/15');
content = content.replace(/border-white\b/g, 'border-[#927B80]');

// Input Fields
content = content.replace(/bg-black\/20/g, 'bg-[#fcfbf9]/50'); // Lighter fill for inputs inside sandstone modal
content = content.replace(/bg-black\/40/g, 'bg-[#e5d5b7]'); // Hover/Active 

// Fix any green hovers to mauve
content = content.replace(/hover:bg-\[#22c55e\]/g, 'hover:bg-[#a68e94]');
content = content.replace(/hover:text-emerald-300/g, 'hover:text-[#a68e94]');

fs.writeFileSync(filePath, content);
console.log("Replaced colors successfully.");
