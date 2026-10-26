import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
  var _proxyReadyPromise: Promise<void> | undefined;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getSocketFilePath(): string | null {
  const sqlHost = (process.env.SQL_HOST || '').trim();
  if (!sqlHost || !sqlHost.startsWith('/')) {
    return null;
  }
  return path.join(sqlHost, '.s.PGSQL.5432');
}

function getProxyProcesses(): Array<{ pid: number; cmd: string }> {
  try {
    const out = execSync('ps -eo pid,args', { encoding: 'utf8' });
    return out
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.includes('/app/cloud_sql_proxy') && !line.includes('ps -eo'))
      .map((line) => {
        const firstSpace = line.indexOf(' ');
        const pid = parseInt(line.slice(0, firstSpace).trim(), 10);
        const cmd = line.slice(firstSpace + 1).trim();
        return { pid, cmd };
      })
      .filter((p) => Number.isFinite(p.pid) && p.pid > 1 && p.pid !== process.pid);
  } catch {
    return [];
  }
}

function installProxyWrapperAndSpawnIfNeeded(forceRestart = false): void {
  try {
    const proxyPath = '/app/cloud_sql_proxy';
    const proxyBinPath = '/app/cloud_sql_proxy.bin';

    if (fs.existsSync(proxyPath) && !fs.existsSync(proxyBinPath)) {
      const stat = fs.statSync(proxyPath);
      if (stat.size > 10000) {
        fs.renameSync(proxyPath, proxyBinPath);
        const wrapperScript = `#!/bin/bash
ARGS=()
for arg in "$@"; do
  case "$arg" in
    --impersonate-service-account=*)
      ;;
    *)
      ARGS+=("$arg")
      ;;
  esac
done
exec /app/cloud_sql_proxy.bin "\${ARGS[@]}"
`;
        fs.writeFileSync(proxyPath, wrapperScript, { mode: 0o755 });
      }
    }

    const sqlHost = (process.env.SQL_HOST || '').trim();
    if (!sqlHost.startsWith('/app/cloudsql/')) {
      return;
    }

    const instanceName = sqlHost.replace('/app/cloudsql/', '').trim();
    const socketFile = getSocketFilePath();
    const procs = getProxyProcesses();

    const hasBrokenImpersonation = procs.some((p) => p.cmd.includes('--impersonate-service-account='));
    const isProxyRunning = procs.length > 0;
    const isSocketPresent = socketFile ? fs.existsSync(socketFile) : true;

    if (forceRestart || hasBrokenImpersonation || !isProxyRunning || !isSocketPresent) {
      if (hasBrokenImpersonation || forceRestart) {
        for (const p of procs) {
          try {
            process.kill(p.pid, 'SIGTERM');
          } catch {
            // ignore if already exited
          }
        }
      }
      fs.mkdirSync('/app/cloudsql', { recursive: true });
      const executable = fs.existsSync(proxyBinPath) ? proxyBinPath : proxyPath;
      if (instanceName && fs.existsSync(executable)) {
        const child = spawn(
          executable,
          [
            instanceName,
            '--unix-socket=/app/cloudsql',
            '--sql-data',
            '--sql-data-endpoint=sqladmin.googleapis.com',
            '--sqladmin-api-endpoint=sqladmin.googleapis.com',
          ],
          { detached: true, stdio: 'ignore' }
        );
        child.unref();
        if (child.pid) {
          fs.writeFileSync('/app/.cloud_sql_proxy.pid', String(child.pid));
        }
      }
    }
  } catch {
    // Ignore in non-container environments
  }
}

export async function ensureProxyAndSocketReady(forceRestart = false): Promise<void> {
  const socketFile = getSocketFilePath();
  if (!socketFile) return;

  if (!forceRestart && fs.existsSync(socketFile)) {
    const procs = getProxyProcesses();
    if (procs.length > 0 && !procs.some((p) => p.cmd.includes('--impersonate-service-account='))) {
      return;
    }
  }

  if (global._proxyReadyPromise) {
    return global._proxyReadyPromise;
  }

  global._proxyReadyPromise = (async () => {
    try {
      installProxyWrapperAndSpawnIfNeeded(forceRestart);
      const maxWaitMs = 8000;
      const start = Date.now();
      while (Date.now() - start < maxWaitMs) {
        if (fs.existsSync(socketFile)) {
          await sleep(150);
          return;
        }
        await sleep(120);
      }
    } finally {
      global._proxyReadyPromise = undefined;
    }
  })();

  return global._proxyReadyPromise;
}

function isTransientSocketError(err: any): boolean {
  const msg = String(err?.message || err?.cause?.message || err || '');
  const code = String(err?.code || err?.cause?.code || '');
  return (
    code === 'ENOENT' ||
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    code === '57P01' ||
    msg.includes('ENOENT') ||
    msg.includes('ECONNRESET') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('Connection terminated')
  );
}

export const createPool = () => {
  if (!global._postgresPool) {
    installProxyWrapperAndSpawnIfNeeded(false);

    const rawPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15000,
    });

    rawPool.on('error', () => {
      // Handled per-query via retry wrapper
    });

    const origQuery = rawPool.query.bind(rawPool) as (...args: any[]) => Promise<any>;
    (rawPool as any).query = async (...args: any[]) => {
      if (typeof args[args.length - 1] === 'function') {
        return origQuery(...args);
      }
      await ensureProxyAndSocketReady(false);
      let lastErr: any;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          return await origQuery(...args);
        } catch (err) {
          lastErr = err;
          if (isTransientSocketError(err) && attempt < 2) {
            await ensureProxyAndSocketReady(true);
            await sleep(300 * (attempt + 1));
            continue;
          }
          throw err;
        }
      }
      throw lastErr;
    };

    const origConnect = rawPool.connect.bind(rawPool) as (...args: any[]) => Promise<any>;
    (rawPool as any).connect = async (...args: any[]) => {
      if (typeof args[0] === 'function') {
        return origConnect(...args);
      }
      await ensureProxyAndSocketReady(false);
      let lastErr: any;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          return await origConnect(...args);
        } catch (err) {
          lastErr = err;
          if (isTransientSocketError(err) && attempt < 2) {
            await ensureProxyAndSocketReady(true);
            await sleep(300 * (attempt + 1));
            continue;
          }
          throw err;
        }
      }
      throw lastErr;
    };

    global._postgresPool = rawPool;
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
