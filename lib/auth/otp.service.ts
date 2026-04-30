import crypto from 'crypto';
import { otpCache } from './cache';

// ── Feature flag: when true, OTP is sent via email (legacy flow) ──────
// When false (default), OTP is derived from current date/time (dynamic OTP)
const EMAIL_OTP_ENABLED = process.env.EMAIL_OTP_ENABLED === 'true';

/**
 * Dynamic OTP format: DDMMHHMM
 *
 * DD = day of month (zero-padded)
 * MM = month       (zero-padded, 01-12)
 * HH = hour        (zero-padded, 24-hour)
 * MM = minute      (zero-padded)
 *
 * Example: 2026-04-30 17:24 → "30041724"
 *
 * The OTP is valid only for the current minute on the server clock.
 * No cache, no storage, no email required — the user derives it from
 * the current date/time themselves.
 */
function generateDynamicOtp(date: Date = new Date()): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0'); // JS months are 0-indexed
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}${mm}${hh}${min}`;
}

export const otpService = {
  /**
   * Whether the legacy email-based OTP flow is active.
   */
  isEmailOtpEnabled: EMAIL_OTP_ENABLED,

  // ── Legacy (email) OTP methods ──────────────────────────────────────

  generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  },

  hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  },

  storeOtp(email: string, hashedOtp: string): void {
    otpCache.set(email, hashedOtp);
  },

  verifyStoredOtp(email: string, plainOtp: string): boolean {
    const cachedHash = otpCache.get<string>(email);
    if (!cachedHash || cachedHash !== this.hashOtp(plainOtp)) {
      return false;
    }
    otpCache.del(email);
    return true;
  },

  // ── Dynamic (time-based) OTP methods ────────────────────────────────

  /**
   * Verify a user-supplied OTP against the current DDMMHHMM value.
   * Also checks the *previous* minute to allow a small clock-drift
   * grace window (user typed at :59, server checks at :00).
   */
  verifyDynamicOtp(submittedOtp: string): boolean {
    const now = new Date();
    const currentOtp = generateDynamicOtp(now);

    // Grace window: also accept the previous minute
    const prev = new Date(now.getTime() - 60_000);
    const prevOtp = generateDynamicOtp(prev);

    const matched = submittedOtp === currentOtp || submittedOtp === prevOtp;

    if (matched) {
      console.log(`✅ Dynamic OTP matched (submitted: ${submittedOtp})`);
    } else {
      console.warn(
        `⚠️  Dynamic OTP mismatch — submitted: ${submittedOtp}, expected: ${currentOtp} (or prev: ${prevOtp})`
      );
    }

    return matched;
  },

  // ── Unified verify (routes call this) ───────────────────────────────

  /**
   * Single entry-point used by verify-otp route.
   * Delegates to email-based or dynamic verification based on feature flag.
   */
  verifyOtp(email: string, otp: string): boolean {
    if (EMAIL_OTP_ENABLED) {
      return this.verifyStoredOtp(email, otp);
    }
    return this.verifyDynamicOtp(otp);
  },
};
