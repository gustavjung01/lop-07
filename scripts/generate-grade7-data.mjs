import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const outDir = resolve(repoRoot, 'src/data/grade7/raw');
const tarBinary = 'C:/Windows/System32/tar.exe';

const copies = [
  {
    zip: resolve(repoRoot, 'data/grade7_batch12_repo_ready.zip'),
    member: 'data/grade-07/02-normalized/grade7_all_lessons_normalized.json',
    out: 'grade7_all_lessons_normalized.json',
  },
  {
    zip: resolve(repoRoot, 'data/grade7_batch12_repo_ready.zip'),
    member: 'data/grade-07/02-normalized/grade7_all_questions_normalized.json',
    out: 'grade7_all_questions_normalized.json',
  },
];

function readZipMember(zipPath, memberPath) {
  return execFileSync(tarBinary, ['-xOf', zipPath, memberPath], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
}

mkdirSync(outDir, { recursive: true });

for (const entry of copies) {
  const content = readZipMember(entry.zip, entry.member);
  writeFileSync(resolve(outDir, entry.out), content, 'utf8');
  console.log(`Wrote ${entry.out}`);
}
