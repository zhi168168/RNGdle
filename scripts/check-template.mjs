import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");
const placeholders = [
  "Exampledle",
  "example.com",
  "hello@example.com",
  "report@example.com"
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(path));
    } else {
      files.push(path);
    }
  }
  return files;
}

const files = await walk(dist).catch(() => []);
const hits = [];

for (const file of files) {
  if (!/\.(html|xml|txt|json|js|css|webmanifest)$/.test(file)) continue;
  const text = await readFile(file, "utf8");
  for (const placeholder of placeholders) {
    if (text.includes(placeholder)) {
      hits.push(`${file} contains ${placeholder}`);
    }
  }
}

if (hits.length) {
  console.log("Template placeholders still appear in dist:");
  for (const hit of hits) console.log(`- ${hit}`);
  process.exitCode = 1;
} else {
  console.log("No default template placeholders found in dist.");
}
