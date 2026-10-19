import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import fs from 'fs';
import { execSync, spawn } from 'child_process';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

function ensureHealthyCloudSqlProxy() {
  try {
    const proxyPath = '/app/cloud_sql_proxy';
    const proxyBinPath = '/app/cloud_sql_proxy.bin';
    if (fs.existsSync(proxyPath) && !fs.existsSync(proxyBinPath)) {
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

    // Check if an existing proxy process is running with --impersonate-service-account
    const psOut = execSync('ps -ef | grep cloud_sql_proxy | grep -v grep || true', { encoding: 'utf8' });
    if (psOut.includes('--impersonate-service-account=')) {
      const sqlHost = process.env.SQL_HOST || '';
      const instanceName = sqlHost.replace('/app/cloudsql/', '').trim();
      execSync('pkill -f cloud_sql_proxy || true');
      if (instanceName && fs.existsSync(proxyBinPath)) {
        const child = spawn(
          proxyBinPath,
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
    // Non-fatal in non-container environments
  }
}

export const createPool = () => {
  if (!global._postgresPool) {
    ensureHealthyCloudSqlProxy();
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15000,
    });

    global._postgresPool.on('error', () => {
      // Handled per-query
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
