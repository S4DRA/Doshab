import { access } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const requiredTables = [
  "users",
  "groups",
  "group_members",
  "channels",
  "messages",
  "group_invites",
];

function usage() {
  console.log(`Usage: node scripts/restore-smoke-test.mjs --backup-dir <dir> --target-url <isolated-db-url>

This script restores only critical-data.dump into an isolated disposable database,
then checks that VAL critical tables exist and are queryable. Never point
--target-url at production.`);
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: {
        ...process.env,
        PGPASSWORD: undefined,
      },
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
      process.stdout.write(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      process.stderr.write(chunk);
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }

      reject(new Error(`${command} exited with code ${code}.${stderr ? ` ${stderr}` : ""}`));
    });
  });
}

function argValue(name) {
  const index = process.argv.indexOf(name);

  return index === -1 ? "" : process.argv[index + 1] ?? "";
}

async function main() {
  if (process.argv.includes("--help")) {
    usage();
    return;
  }

  if (process.argv.includes("--check-tools")) {
    await run("pg_restore", ["--version"]);
    await run("psql", ["--version"]);
    return;
  }

  const backupDir = argValue("--backup-dir");
  const targetUrl = argValue("--target-url") || process.env.RESTORE_TEST_DATABASE_URL || "";

  if (!backupDir || !targetUrl) {
    throw new Error("--backup-dir and --target-url are required.");
  }

  const dumpPath = path.resolve(backupDir, "critical-data.dump");
  await access(dumpPath);

  await run("pg_restore", [
    "--dbname",
    targetUrl,
    "--data-only",
    "--no-owner",
    "--no-acl",
    "--disable-triggers",
    dumpPath,
  ]);

  for (const table of requiredTables) {
    const output = await run("psql", [
      "--dbname",
      targetUrl,
      "--tuples-only",
      "--no-align",
      "--command",
      `select count(*) from public.${table};`,
    ]);
    const count = Number(output.trim());

    if (!Number.isFinite(count)) {
      throw new Error(`Could not verify restored table: ${table}`);
    }
  }

  console.log("Restore smoke test passed for VAL critical tables.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
