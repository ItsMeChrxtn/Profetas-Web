import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: required('MONGODB_URI'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieName: process.env.COOKIE_NAME || 'profetas_token',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  brevoApiKey: process.env.BREVO_API_KEY || null,
  brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || null,
  brevoSenderName: process.env.BREVO_SENDER_NAME || 'Profetas Farm',
  lalamoveApiKey: process.env.LALAMOVE_API_KEY || null,
  lalamoveApiSecret: process.env.LALAMOVE_API_SECRET || null,
  lalamoveEnv: process.env.LALAMOVE_ENV || 'sandbox',
  lalamoveMarket: process.env.LALAMOVE_MARKET || 'PH',
  lalamoveServiceType: process.env.LALAMOVE_SERVICE_TYPE || 'MOTORCYCLE',
  lalamoveSenderName: process.env.LALAMOVE_SENDER_NAME || 'Profetas Farm',
  lalamoveSenderPhone: process.env.LALAMOVE_SENDER_PHONE || null,
  lalamoveWebhookUrl: process.env.LALAMOVE_WEBHOOK_URL || null,
};

export const isProduction = env.nodeEnv === 'production';
