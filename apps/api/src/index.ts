import { buildServer } from './server.js';
import { env } from './config/env.js';
import { runMigrations } from './db/migrate.js';

async function main() {
  runMigrations();
  const server = buildServer();
  await server.listen({ port: env.PORT, host: '0.0.0.0' });
  console.log(`API server listening on port ${env.PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
