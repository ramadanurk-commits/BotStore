import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
process.chdir(root);
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 13)) {
  console.error("Install Node.js 22.13 or newer, then start BotStore again.");
  process.exit(1);
}
function run(command, args, shell = false) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
if (!existsSync("node_modules/wrangler/bin/wrangler.js")) {
  console.log("Installing pinned dependencies. Internet access is needed on the first run.");
  // All arguments are fixed; no user input is passed to the Windows command shell.
  run(process.platform === "win32" ? "npx.cmd" : "npx",
    ["--yes", "pnpm@11.25.0", "install", "--frozen-lockfile"], process.platform === "win32");
}
run(process.execPath, ["scripts/local-setup.mjs"]);
console.log("\nOpen http://127.0.0.1:5173 when the server is ready. Stop with Ctrl+C.\n");
run(process.execPath, ["scripts/run-framework.mjs", "dev"]);
