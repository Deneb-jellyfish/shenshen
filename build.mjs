import { copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const distRoot = path.join(root, "dist");

await rm(distRoot, { recursive: true, force: true });
await mkdir(path.join(distRoot, ".openai"), { recursive: true });

const files = [
  "index.html",
  "styles.css",
  "app.js",
  "package.json",
  ".nojekyll"
];

for (const file of files) {
  await copyFile(path.join(root, file), path.join(distRoot, file));
}

await copyFile(
  path.join(root, ".openai", "hosting.json"),
  path.join(distRoot, ".openai", "hosting.json")
);
