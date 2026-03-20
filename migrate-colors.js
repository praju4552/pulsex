import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const SRC_DIR = './src';

// [searchString, replacement, useRegex]
const REPLACEMENTS = [
  // BACKGROUNDS
  ['bg-neutral-900/50', 'bg-bg-surface', false],
  ['bg-neutral-900/70', 'bg-bg-surface', false],
  ['bg-neutral-900/80', 'bg-bg-surface', false],
  ['bg-neutral-900/30', 'bg-bg-surface', false],
  ['bg-zinc-900/50', 'bg-bg-surface', false],
  ['bg-neutral-800/50', 'bg-bg-surface', false],
  ['bg-black/60', 'bg-bg-primary/80', false],
  ['bg-black/80', 'bg-bg-primary/80', false],
  ['bg-black/40', 'bg-bg-primary/60', false],

  // Surface tints
  ['bg-white/5', 'bg-surface-100', false],
  ['bg-white/10', 'bg-surface-100', false],
  ['bg-white/20', 'bg-surface-200', false],
  ['bg-white/15', 'bg-surface-200', false],
  ['bg-white/[0.02]', 'bg-surface-100', false],
  ['bg-white/[0.03]', 'bg-surface-100', false],
  ['bg-white/[0.05]', 'bg-surface-100', false],
  ['bg-white/[0.08]', 'bg-surface-200', false],
  ['hover:bg-white/5', 'hover:bg-surface-hover', false],
  ['hover:bg-white/10', 'hover:bg-surface-hover', false],

  // TEXT
  [' text-white', ' text-text-primary', false],
  ['"text-white', '"text-text-primary', false],
  ['`text-white', '`text-text-primary', false],
  ['text-white ', 'text-text-primary ', false],
  ['text-white"', 'text-text-primary"', false],
  ['text-white`', 'text-text-primary`', false],
  ['text-neutral-300', 'text-text-secondary', false],
  ['text-neutral-400', 'text-text-secondary', false],
  ['text-neutral-500', 'text-text-muted', false],
  ['text-neutral-600', 'text-text-muted', false],
  ['text-zinc-400', 'text-text-secondary', false],
  ['text-zinc-500', 'text-text-muted', false],
  ['hover:text-white', 'hover:text-text-primary', false],
  ['hover:text-neutral-300', 'hover:text-text-secondary', false],

  // BORDERS
  ['border-white/10', 'border-border-glass', false],
  ['border-white/5', 'border-border-glass', false],
  ['border-white/20', 'border-border-color', false],
  ['border-white/30', 'border-border-color', false],
  ['border-neutral-700', 'border-border-color', false],
  ['border-neutral-800', 'border-border-glass', false],
  ['border-zinc-700', 'border-border-color', false],
  ['border-zinc-800', 'border-border-glass', false],
  ['border-white/[0.1]', 'border-border-glass', false],
  ['border-white/[0.05]', 'border-border-glass', false],
];

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'backup', 'researchfinder']);
const EXTS = new Set(['.tsx', '.ts', '.jsx', '.js']);

function walk(dir) {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walk(full);
    else if (EXTS.has(extname(entry))) processFile(full);
  }
}

let totalFiles = 0;
let changedFiles = 0;
let totalReplacements = 0;

function replaceAll(str, search, replace) {
  let count = 0;
  let idx = str.indexOf(search);
  while (idx !== -1) {
    str = str.slice(0, idx) + replace + str.slice(idx + search.length);
    count++;
    idx = str.indexOf(search, idx + replace.length);
  }
  return [str, count];
}

function processFile(filePath) {
  let src;
  try { src = readFileSync(filePath, 'utf-8'); } catch { return; }
  const original = src;
  let fileReplacements = 0;

  for (const [search, replacement] of REPLACEMENTS) {
    const [newSrc, count] = replaceAll(src, search, replacement);
    src = newSrc;
    fileReplacements += count;
  }

  totalFiles++;
  if (src !== original) {
    writeFileSync(filePath, src, 'utf-8');
    changedFiles++;
    totalReplacements += fileReplacements;
    console.log('[UPDATED] ' + filePath + ' — ' + fileReplacements + ' replacement(s)');
  }
}

console.log('XPULSE Theme Migration — running...\n');
walk(SRC_DIR);
console.log('\nDone!');
console.log('Files scanned:  ' + totalFiles);
console.log('Files updated:  ' + changedFiles);
console.log('Replacements:   ' + totalReplacements);
