import logger from '../utils/logger';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@devdynasty.in';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Universal AI';

/**
 * Sends an OTP email via Brevo transactional email API.
 * Falls back to console log if BREVO_API_KEY is not set (development/demo mode).
 */
export async function sendOTPEmail(email: string, otp: string, name?: string): Promise<void> {
  if (!BREVO_API_KEY) {
    // Development fallback — log OTP to console/Render logs
    logger.warn(`[DEV MODE] Email OTP for ${email}: ${otp} (set BREVO_API_KEY to send real emails)`);
    return;
  }

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #0f172a; color: #e2e8f0;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #f1f5f9;">Universal AI</h1>
        <p style="margin: 6px 0 0; font-size: 12px; color: #64748b;">Smart India Hackathon 2026 · Dev Dynasty · PS12</p>
      </div>
      <div style="background: #1e293b; border-radius: 16px; padding: 28px; margin-bottom: 24px;">
        <h2 style="margin: 0 0 8px; font-size: 18px; color: #f1f5f9;">Verify your email</h2>
        <p style="margin: 0 0 24px; color: #94a3b8;">Hi ${name || 'there'}, enter this code to complete your registration:</p>
        <div style="background: #0f172a; border-radius: 12px; padding: 24px; text-align: center;">
          <span style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #818cf8; font-family: monospace;">${otp}</span>
        </div>
        <p style="margin: 20px 0 0; font-size: 13px; color: #64748b; text-align: center;">
          This code expires in <strong style="color: #94a3b8;">10 minutes</strong>. Do not share it.
        </p>
      </div>
      <p style="margin: 0; font-size: 12px; color: #475569; text-align: center;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email, name: name || email }],
      subject: `${otp} — Your Universal AI verification code`,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Brevo email send failed', { status: response.status, error: errorText });
    throw new Error('Failed to send verification email. Please try again.');
  }

  logger.info('OTP email sent via Brevo', { email });
}
