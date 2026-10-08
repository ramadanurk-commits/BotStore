// Local database setup for this source export. No remote operations.
import { spawnSync } from "node:child_process";
import { constants, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
process.chdir(root);
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 13)) {
  throw new Error("BotStore requires Node.js 22.13 or newer.");
}
const wrangler = join(root, "node_modules/wrangler/bin/wrangler.js");
if (!existsSync(wrangler)) {
  throw new Error("Install dependencies first: npx --yes pnpm@11.25.0 install --frozen-lockfile");
}

try {
  copyFileSync(".dev.vars.example", ".dev.vars", constants.COPYFILE_EXCL);
  console.log("Created local .dev.vars (development identity, payments disabled).");
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  console.log("Keeping your existing .dev.vars.");
}

function localD1(args) {
  const result = spawnSync(process.execPath, [
    "--import", join(root, "scripts/sites-env.mjs"), wrangler,
    "d1", ...args, "--local", "--config", join(root, "wrangler.local.json"),
    "--persist-to", join(root, ".wrangler/state"),
  ], {
    cwd: root, env: { ...process.env, CI: "true" },
    stdio: ["ignore", "inherit", "inherit"],
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error("Local database setup failed. See the error above.");
}

localD1(["migrations", "apply", "DB"]);

// Read the same built-in catalog as the app. TypeScript is a pinned project dependency.
// catalog.ts is self-contained: this does not compile or execute the server API.
const ts = await import("typescript");
const { outputText } = ts.transpileModule(readFileSync("lib/catalog.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { catalog } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const sqlValue = (value) => `'${String(value).replaceAll("'", "''")}'`;
const now = Date.now();
// These values match build/sites-vite-plugin.ts's localhost-only identity.
const ownerId = "local_seedy";
const lines = [
  `INSERT OR IGNORE INTO users (id,email,name,created_at) VALUES (${sqlValue(ownerId)},'seedy@sites.test','Local developer',${now});`,
  ...catalog.map((product) => {
    const values = [product.id, ownerId, product.category, product.price,
      JSON.stringify(product.content), "published", product.file_key, product.filename, now, now];
    return "INSERT OR IGNORE INTO products (id,owner_id,category,price,content,status,file_key,filename,created_at,updated_at) VALUES (" +
      values.map((value) => typeof value === "number" ? String(value) : sqlValue(value)).join(",") + ");";
  }),
];
const seedFile = join(root, ".sites-runtime/local-catalog.sql");
mkdirSync(dirname(seedFile), { recursive: true });
writeFileSync(seedFile, lines.join("\n") + "\n");
localD1(["execute", "DB", "--file", seedFile]);
console.log("\nLocal setup complete. Existing products and local orders were preserved.");
console.log("Run: npx --yes pnpm@11.25.0 dev");
console.log("Open http://127.0.0.1:5173 . Click Sign in for the local administrator.");
