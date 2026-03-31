import { mkdirSync } from 'node:fs';
import { buildServer } from './server.js';
import { env } from './config/env.js';

export { buildServer };

export async function startServer() {
  mkdirSync(env.NOTES_DIR, { recursive: true });
  const server = buildServer();
  await server.listen({ port: env.PORT, host: '0.0.0.0' });
  console.log(`API server listening on port ${env.PORT}`);
  return server;
}

async function main() {
  try {
    await startServer();
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === 'EADDRINUSE') {
      console.error({ code: e.code, port: env.PORT, err: e }, '[startup-error] port in use');
      console.error(`❌ Port ${env.PORT} is already in use.\n   Try: PORT=<other> npm start`);
      process.exit(1);
    }
    console.error(err);
    process.exit(1);
  }
}

if (process.env.ELECTRON !== 'true') {
  main();
}
