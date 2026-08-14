import { env } from '../src/config/env.js';
import { registerLalamoveWebhook } from '../src/utils/lalamoveClient.js';

const url = process.argv[2] || env.lalamoveWebhookUrl;

if (!url) {
  console.error('Usage: npm run register-webhook -- https://your-server.onrender.com/api/webhooks/lalamove');
  console.error('(or set LALAMOVE_WEBHOOK_URL in .env)');
  process.exit(1);
}

if (!url.startsWith('https://')) {
  console.error('Lalamove requires a public HTTPS URL. Got:', url);
  process.exit(1);
}

try {
  await registerLalamoveWebhook(url);
  console.log(`Registered Lalamove ${env.lalamoveEnv} webhook -> ${url}`);
} catch (err) {
  console.error('Failed to register webhook:', err.message);
  process.exit(1);
}
