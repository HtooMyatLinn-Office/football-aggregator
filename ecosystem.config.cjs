/**
 * PM2 process definitions for Windows/Linux deployment.
 * Usage (from repo root, after build + prisma generate):
 *   pm2 start ecosystem.config.cjs --env production
 *   pm2 reload ecosystem.config.cjs --env production
 *   pm2 save
 */
module.exports = {
  apps: [
    {
      name: 'football-api',
      script: 'dist/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      env_production: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'football-worker',
      script: 'dist/workers/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
