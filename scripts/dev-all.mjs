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
import { existsSync, readFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BE = path.join(ROOT, "dev-backend-mexpo-new");
const FE = path.join(ROOT, "dev-frontend-mexpo-new");
const IS_WIN = process.platform === "win32";

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

// ── helpers ────────────────────────────────────────────────────────────
const c = (code, s) => `\x1b[${code}m${s}\x1b[0m`;
const info = (m) => console.log(`${c(36, "▸")} ${m}`);
const ok = (m) => console.log(`${c(32, "✔")} ${m}`);
const warn = (m) => console.log(`${c(33, "!")} ${m}`);
function fail(m) {
  console.error(`${c(31, "✖")} ${m}`);
  process.exit(1);
}

/** Jalankan perintah sinkron dengan output langsung; gagal -> keluar. */
function run(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, { stdio: "inherit", shell: IS_WIN, ...opts });
  if (r.status !== 0) fail(`Perintah gagal: ${cmd} ${cmdArgs.join(" ")}`);
}

/** Parser .env sederhana (KEY=VALUE, komentar #, kutip opsional). */
function readEnv(file) {
  const out = {};
  if (!existsSync(file)) return out;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2];
    if (!/^["']/.test(v)) v = v.replace(/\s+#.*$/, "");
    out[m[1]] = v.replace(/^(["'])(.*)\1$/, "$2");
  }
  return out;
}

/** true bila ada yang listen/menerima koneksi di host:port. */
function canConnect(host, port, timeout = 1500) {
  return new Promise((resolve) => {
    const s = net.connect({ host, port });
    const done = (v) => {
      s.destroy();
      resolve(v);
    };
    s.setTimeout(timeout, () => done(false));
    s.once("connect", () => done(true));
    s.once("error", () => done(false));
  });
}

async function waitFor(host, port, seconds) {
  for (let i = 0; i < seconds; i++) {
    if (await canConnect(host, port)) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

/** Ambil target koneksi DB dari DATABASE_URL atau DB_HOST/DB_PORT. */
function dbTarget(env) {
  const provider = (env.DB_PROVIDER || "").toLowerCase() === "mysql" ? "mysql" : "postgresql";
  const defaultPort = provider === "mysql" ? 3306 : 5432;
  if (env.DATABASE_URL) {
    try {
      const u = new URL(env.DATABASE_URL);
      return { provider, host: u.hostname, port: Number(u.port) || defaultPort, via: "DATABASE_URL" };
    } catch {
      fail("DATABASE_URL di dev-backend-mexpo-new/.env tidak valid.");
    }
  }
  if (!env.DB_HOST) fail("DB_HOST / DATABASE_URL belum diisi di dev-backend-mexpo-new/.env.");
  return { provider, host: env.DB_HOST, port: Number(env.DB_PORT) || defaultPort, via: "DB_HOST/DB_PORT" };
}

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
const needRoot = runBE && runFE;
const installs = [
  needRoot && ["root (concurrently)", ROOT],
  runBE && ["backend", BE],
  runFE && ["frontend", FE],
].filter(Boolean);
for (const [name, dir] of installs) {
  if (existsSync(path.join(dir, "node_modules"))) continue;
  info(`Install dependency ${name}...`);
  run("npm", [existsSync(path.join(dir, "package-lock.json")) ? "ci" : "install", "--no-audit", "--no-fund"], { cwd: dir });
}
ok("Dependency lengkap");

// ── 3. port aplikasi masih kosong? ─────────────────────────────────────
const bePort = Number(beEnv.PORT) || 3500;
const fePort = 3000;
if (runBE && (await canConnect("127.0.0.1", bePort, 500))) {
  fail(`Port ${bePort} (backend) sudah dipakai proses lain. Hentikan dulu atau ubah PORT di backend .env.`);
}
if (runFE && (await canConnect("127.0.0.1", fePort, 500))) {
  fail(`Port ${fePort} (frontend) sudah dipakai proses lain. Hentikan dulu proses tersebut.`);
}

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
