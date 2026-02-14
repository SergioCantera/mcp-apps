import { execSync } from "child_process";
import { entries } from "./vite.config.js";

console.log(`Building ${entries.length} single-file HTML entries...\n`);

for (let i = 0; i < entries.length; i++) {
  const entry = entries[i];
  const isFirst = i === 0;

  console.log(`[${i + 1}/${entries.length}] Building ${entry}...`);

  execSync(`BUILD_ENTRY=${entry} npx vite build${isFirst ? "" : " --emptyOutDir false"}`, {
    stdio: "inherit",
    env: { ...process.env, BUILD_ENTRY: entry },
  });

  console.log(`✓ ${entry} done\n`);
}

console.log("All builds complete!");
