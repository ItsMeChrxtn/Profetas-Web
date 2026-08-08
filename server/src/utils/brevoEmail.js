import { env } from '../config/env.js';
import { HttpError } from './httpError.js';

/** Sends a transactional email via Brevo's REST API (no SDK needed for one call type). */
export async function sendEmail({ to, subject, htmlContent }) {
  if (!env.brevoApiKey || !env.brevoSenderEmail) {
    throw new HttpError(500, 'Email service is not configured yet. Please contact support.');
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': env.brevoApiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: env.brevoSenderName, email: env.brevoSenderEmail },
      to: [{ email: to }],
      subject,
      htmlContent,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('Brevo send failed:', res.status, body);
    throw new HttpError(502, 'Could not send the verification email. Please try again.');
  }
}
