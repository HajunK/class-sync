/**
 * Starts the Firebase emulators (Auth + Firestore) for local development.
 * Data is saved to ./.emulator-data when you stop the dev server (Ctrl+C)
 * and restored the next time, so your classes and notes persist.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const dir = "./.emulator-data";
const args = ["emulators:start", "--project", "demo-classsync", "--only", "auth,firestore", `--export-on-exit=${dir}`];
if (existsSync(`${dir}/firebase-export-metadata.json`)) args.push(`--import=${dir}`);

const child = spawn("firebase", args, { stdio: "inherit", shell: process.platform === "win32" });
const forward = (sig) => () => child.kill(sig);
process.on("SIGINT", forward("SIGINT"));
process.on("SIGTERM", forward("SIGTERM"));
child.on("exit", (code) => process.exit(code ?? 0));
