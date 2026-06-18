import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const criticalTables = [
  "public.users",
  "public.groups",
  "public.group_members",
  "public.channels",
  "public.messages",
  "public.group_invites",
];

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.resolve(process.env.BACKUP_DIR ?? "backups", timestamp);
const databaseUrl =
  process.env.BACKUP_DATABASE_URL ?? process.env.DATABASE_URL ?? process.env.DIRECT_URL;

function usage() {
  console.log(`Usage: node scripts/backup-database.mjs [--reason daily|pre-migration|manual]

Environment:
  BACKUP_DATABASE_URL  Preferred server-only backup connection string.
  BACKUP_DIR           Output directory. Defaults to ./backups/<timestamp>.

Outputs:
  full.dump            Full custom-format database dump.
  critical-data.dump   Data-only dump for VAL critical tables.
  manifest.json        Backup metadata without secrets.`);
}

function redactedDatabaseInfo(value) {
  try {
    const url = new URL(value);
    return {
      database: url.pathname.replace(/^\//, "") || "postgres",
      host: url.hostname,
      port: url.port || null,
      protocol: url.protocol.replace(":", ""),
      username: url.username ? "[redacted]" : null,
    };
  } catch {
    return {
      database: null,
      host: "[unparseable]",
      port: null,
      protocol: null,
      username: null,
    };
  }
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: {
        ...process.env,
        PGPASSWORD: undefined,
      },
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    });

    let stderr = "";

    child.stdout.on("data", (chunk) => process.stdout.write(chunk));
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      process.stderr.write(chunk);
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with code ${code}.${stderr ? ` ${stderr}` : ""}`));
    });
  });
}

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);

  if (index === -1) {
    return fallback;
  }

  return process.argv[index + 1] ?? fallback;
}

async function main() {
  if (process.argv.includes("--help")) {
    usage();
    return;
  }

  if (process.argv.includes("--check-tools")) {
    await run("pg_dump", ["--version"]);
    return;
  }

  if (!databaseUrl) {
    throw new Error("BACKUP_DATABASE_URL, DATABASE_URL, or DIRECT_URL is required.");
  }

  await mkdir(backupDir, { recursive: true });

  const fullDump = path.join(backupDir, "full.dump");
  const criticalDump = path.join(backupDir, "critical-data.dump");
  const manifest = path.join(backupDir, "manifest.json");
  const reason = argValue("--reason", "manual");

  await run("pg_dump", [
    "--dbname",
    databaseUrl,
    "--format",
    "custom",
    "--blobs",
    "--no-owner",
    "--no-acl",
    "--file",
    fullDump,
  ]);

  await run("pg_dump", [
    "--dbname",
    databaseUrl,
    "--format",
    "custom",
    "--data-only",
    "--no-owner",
    "--no-acl",
    ...criticalTables.flatMap((table) => ["--table", table]),
    "--file",
    criticalDump,
  ]);

  const metadata = {
    createdAt: new Date().toISOString(),
    criticalTables,
    database: redactedDatabaseInfo(databaseUrl),
    files: {
      criticalDataDump: path.basename(criticalDump),
      fullDump: path.basename(fullDump),
    },
    reason,
    restoreTest: {
      command:
        "node scripts/restore-smoke-test.mjs --backup-dir <backup-dir> --target-url <isolated-restore-database-url>",
      requiredFrequency: "monthly",
    },
  };

  await writeFile(manifest, `${JSON.stringify(metadata, null, 2)}\n`);

  if (!existsSync(fullDump) || !existsSync(criticalDump)) {
    throw new Error("Backup files were not created.");
  }

  console.log(`Backup complete: ${backupDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
