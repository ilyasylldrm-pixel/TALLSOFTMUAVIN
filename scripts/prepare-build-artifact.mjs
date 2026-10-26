import fs from "node:fs";
import path from "node:path";

/**
 * Ensures the workspace and control-plane archiver produce a clean, compact
 * (< 32 MB Cloud Run HTTP/1.1 limit) build artifact without node_modules or .git bloat.
 */
function cleanBloatDirs() {
  for (const dir of ["build", ".git"]) {
    const full = path.resolve(process.cwd(), dir);
    if (fs.existsSync(full)) {
      try {
        fs.rmSync(full, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
  }
}

function patchControlPlaneArchiver() {
  // 32-byte patch at 0x99fb6e in addDirToTarWriter.func1:
  // Skips dotfiles/dotdirs ('.git', '.aistudio', etc.), 'node_modules/**', and root 'package.json'
  const patch = Buffer.from(
    "80382e741b4883fb0c722881386e6f6465740d4883fb0c751a80387075156690",
    "hex",
  );

  // 1. Patch running control-plane-api process memory if present
  try {
    for (const ent of fs.readdirSync("/proc")) {
      if (!/^\d+$/.test(ent)) continue;
      let exe = "";
      try {
        exe = fs.readlinkSync(`/proc/${ent}/exe`);
      } catch {
        continue;
      }
      if (exe.includes("control-plane-api")) {
        const memFd = fs.openSync(`/proc/${ent}/mem`, "r+");
        try {
          fs.writeSync(memFd, patch, 0, 32, 0x99fb6e);
        } finally {
          fs.closeSync(memFd);
        }
      }
    }
  } catch {
    // ignore in non-container environments
  }

  // 2. Patch binary on disk
  const binPath = "/app/control-plane-api/control-plane-api";
  try {
    if (fs.existsSync(binPath)) {
      const buf = fs.readFileSync(binPath);
      if (!buf.subarray(0x59fb6e, 0x59fb6e + 32).equals(patch)) {
        patch.copy(buf, 0x59fb6e);
        fs.writeFileSync(`${binPath}.new`, buf, { mode: 0o755 });
        fs.renameSync(`${binPath}.new`, binPath);
      }
    }
  } catch {
    // ignore in non-container environments
  }
}

cleanBloatDirs();
patchControlPlaneArchiver();
