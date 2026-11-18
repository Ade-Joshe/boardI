// Standalone output omits .next/static and public/; without them the
// server sends an unstyled page that never hydrates. Copy them in.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const out = ".next/standalone";
if (!existsSync(out)) throw new Error(`${out} missing: run next build first`);

// Plain read/write: fs.cpSync's native fast path fails on some
// container mounts (virtiofs) and leaves unreadable files behind.
function copyDir(src, dest) {
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const from = join(src, entry.name);
    const to = join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else if (entry.isFile()) writeFileSync(to, readFileSync(from));
  }
}

copyDir(".next/static", join(out, ".next/static"));
copyDir("public", join(out, "public"));
