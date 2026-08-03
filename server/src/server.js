import { app } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';

async function start() {
  try {
    await connectDb();
    app.listen(env.port, () => {
      console.log(`[server] listening on http://localhost:${env.port}`);
    });
  } catch (err) {
    console.error('[server] failed to start:', err.message);
    process.exit(1);
  }
}

start();
