/**
 * PM2 Process Manager Configuration for Google Compute Engine / VPS
 * Optimized for "Orta Ölçek / Çok Şubeli" (4 vCPU / 8 GB RAM)
 */
module.exports = {
  apps: [
    {
      name: "muavin-server",
      script: "dist/server.cjs",
      instances: "max", // Runs worker process per CPU core for max throughput
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "1500M",
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        NODE_OPTIONS: "--max-old-space-size=3072",
      },
      exp_backoff_restart_delay: 100,
    },
  ],
};
