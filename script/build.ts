import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";

// Only packages that are actually installed AND are pure JS (no native .node bindings).
// Packages intentionally left EXTERNAL (not bundled):
//   bcrypt       — native C++ bindings, must stay external
//   bufferutil   — native C++ bindings (optional ws dep)
//   pg           — has optional pg-native; keeping external avoids edge cases
//   drizzle-kit  — dev-only tooling, never imported at runtime
const bundleList = new Set([
  "connect-pg-simple",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-session",
  "memorystore",
  "multer",
  "passport",
  "passport-local",
  "ws",
  "zod",
  "zod-validation-error",
]);

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("▶  Building client (Vite)...");
  await viteBuild();
  console.log("✔  Client built → dist/public\n");

  console.log("▶  Building server (esbuild)...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
    ...Object.keys(pkg.optionalDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !bundleList.has(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  console.log("✔  Server built → dist/index.cjs\n");
  console.log("Build complete. Run with:");
  console.log("  NODE_ENV=production node dist/index.cjs");
}

buildAll().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
