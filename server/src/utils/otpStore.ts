/**
 * In-memory OTP store with TTL and attempt tracking.
 * Sufficient for hackathon demo. Use Redis in production.
 */

interface OTPRecord {
  otp: string;
  name: string;
  expiresAt: Date;
  attempts: number;
}

const store = new Map<string, OTPRecord>();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function storeOTP(email: string, otp: string, name: string): void {
  store.set(email.toLowerCase(), {
    otp,
    name,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    attempts: 0,
  });
}

export function verifyOTP(email: string, otp: string): { valid: boolean; error?: string } {
  const record = store.get(email.toLowerCase());
  if (!record) {
    return { valid: false, error: 'No OTP found for this email. Please request a new one.' };
  }
  if (record.expiresAt < new Date()) {
    store.delete(email.toLowerCase());
    return { valid: false, error: 'OTP has expired. Please request a new one.' };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    store.delete(email.toLowerCase());
    return { valid: false, error: 'Too many failed attempts. Please request a new OTP.' };
  }
  record.attempts++;
  if (record.otp !== otp) {
    const remaining = MAX_ATTEMPTS - record.attempts;
    return {
      valid: false,
      error: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
    };
  }
  // Consume the OTP on success
  store.delete(email.toLowerCase());
  return { valid: true };
}

// Cleanup expired OTPs every 15 minutes to prevent memory leak
setInterval(() => {
  const now = new Date();
  for (const [key, val] of store.entries()) {
    if (val.expiresAt < now) store.delete(key);
  }
}, 15 * 60 * 1000);
