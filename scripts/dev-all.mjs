#!/usr/bin/env node
/**
 * Satu perintah untuk menjalankan Mexpo (Backend + Frontend).
 *
 *   npm run dev:all                  -> cek prasyarat, lalu jalankan BE + FE
 *   npm run dev:all -- --services    -> + nyalakan Postgres & MinIO via Docker bila DB belum hidup
 *   npm run dev:all -- --migrate     -> + prisma migrate deploy sebelum start
 *   npm run dev:all -- --seed        -> + jalankan seed sebelum start
 *   npm run dev:all -- --only=be     -> hanya backend   (--only=fe untuk frontend saja)
 *
 * Setiap langkah prasyarat hanya dijalankan kalau memang diperlukan.
 * Tidak ada dependency tambahan; hanya Node.js bawaan.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  ROOT,
  BE,
  FE,
  IS_WIN,
  info,
  ok,
  fail,
  run,
  readEnv,
  canConnect,
  waitFor,
  dbTarget,
  ensureDeps,
  checkAppPorts,
} from "./lib/runner-utils.mjs";

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const only = (args.find((a) => a.startsWith("--only=")) ?? "").split("=")[1];

if (flag("help") || flag("h")) {
  console.log(
    [
      "Pemakaian: npm run dev:all -- [opsi]",
      "  --services   nyalakan Postgres + MinIO (Docker) jika DB belum bisa dihubungi",
      "  --migrate    jalankan `prisma migrate deploy` sebelum start",
      "  --seed       jalankan seed backend sebelum start",
      "  --only=be    hanya backend   |   --only=fe  hanya frontend",
    ].join("\n"),
  );
  process.exit(0);
}

const runBE = only !== "fe";
const runFE = only !== "be";
const isLocal = (h) => ["localhost", "127.0.0.1", "::1", "0.0.0.0"].includes(h);

if (only && !["be", "fe"].includes(only)) fail(`Nilai --only tidak dikenal: "${only}" (pakai be atau fe).`);

// ── 1. file .env ───────────────────────────────────────────────────────
if (runBE && !existsSync(path.join(BE, ".env"))) {
  fail("dev-backend-mexpo-new/.env belum ada. Salin dari .env.example lalu isi nilainya.");
}
if (runFE && !existsSync(path.join(FE, ".env"))) {
  fail("dev-frontend-mexpo-new/.env belum ada. Salin dari .env.example lalu isi nilainya.");
}
const beEnv = runBE ? readEnv(path.join(BE, ".env")) : {};
ok(".env tersedia");

// ── 2. dependency (hanya yang belum ter-install) ───────────────────────
ensureDeps(runBE, runFE);

// ── 3. port aplikasi masih kosong? ─────────────────────────────────────
const bePort = Number(beEnv.PORT) || 3500;
const fePort = 3000;
await checkAppPorts(runBE, runFE, bePort, fePort);

// ── 4. database ────────────────────────────────────────────────────────
if (runBE) {
  const db = dbTarget(beEnv);
  info(`Cek database ${db.provider} di ${db.host}:${db.port} (${db.via})...`);
  let reachable = await canConnect(db.host, db.port);

  if (!reachable && flag("services")) {
    if (db.provider !== "postgresql") fail("--services hanya menyediakan PostgreSQL. Nyalakan MySQL sendiri.");
    if (!isLocal(db.host)) fail(`--services hanya untuk DB lokal, tetapi host-nya ${db.host}.`);
    if (spawnSync("docker", ["info"], { stdio: "ignore", shell: IS_WIN }).status !== 0) {
      fail("Docker tidak berjalan. Nyalakan Docker Desktop lalu coba lagi.");
    }
    info("Menyalakan Postgres + MinIO lewat Docker Compose...");
    // Samakan port host & kredensial compose dengan backend/.env supaya cocok.
    // Only values that exist in backend/.env are passed on; nothing is
    // hardcoded here, so a missing one falls back to compose's own defaults
    // (or to the root .env).
    const fromBackendEnv = {
      DB_USER: beEnv.DB_USER,
      DB_PASSWORD: beEnv.DB_PASSWORD,
      DB_NAME: beEnv.DB_NAME,
      MINIO_ROOT_USER: beEnv.MINIO_ACCESS_KEY,
      MINIO_ROOT_PASSWORD: beEnv.MINIO_SECRET_KEY,
    };
    const composeEnv = {
      ...process.env,
      ...Object.fromEntries(Object.entries(fromBackendEnv).filter(([, v]) => v)),
      DB_PORT_HOST: String(db.port),
    };
    run("docker", ["compose", "up", "-d", "--wait", "postgres"], { cwd: ROOT, env: composeEnv });
    run("docker", ["compose", "up", "-d", "minio", "minio-init"], { cwd: ROOT, env: composeEnv });
    reachable = await waitFor(db.host, db.port, 30);
  }

  if (!reachable) {
    fail(
      `Database di ${db.host}:${db.port} tidak bisa dihubungi.\n` +
        `  • Nyalakan database-mu, atau\n` +
        `  • jalankan ulang dengan --services (Postgres via Docker), atau\n` +
        `  • periksa DB_HOST/DB_PORT/DATABASE_URL di dev-backend-mexpo-new/.env`,
    );
  }
  ok("Database terhubung");

  // ── 5. prisma ────────────────────────────────────────────────────────
  info("prisma generate...");
  run("npx", ["prisma", "generate"], { cwd: BE });
  if (flag("migrate")) {
    info("prisma migrate deploy...");
    run("npx", ["prisma", "migrate", "deploy"], { cwd: BE });
  }
  if (flag("seed")) {
    info("Menjalankan seed...");
    run("npm", ["run", "seed"], { cwd: BE });
  }
}

// ── 6. jalankan ────────────────────────────────────────────────────────
const script = runBE && runFE ? "dev" : runBE ? "dev:backend" : "dev:frontend";
console.log("");
ok(`Menjalankan ${runBE && runFE ? "Backend + Frontend" : runBE ? "Backend" : "Frontend"}  (Ctrl+C untuk berhenti)`);
if (runBE) console.log(`   Backend : http://localhost:${bePort}   (Swagger: /docs)`);
if (runFE) console.log(`   Frontend: http://localhost:${fePort}`);
console.log("");

const child = spawn("npm", ["run", script], { cwd: ROOT, stdio: "inherit", shell: IS_WIN });
child.on("exit", (code, signal) => process.exit(signal ? 0 : (code ?? 0)));
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
