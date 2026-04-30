/**
 * Email service — DISABLED by default.
 *
 * This module is only dynamically imported when EMAIL_OTP_ENABLED=true.
 * It is a no-op placeholder. To re-enable email delivery, install an
 * email provider package (e.g. `resend`, `nodemailer`) and wire it here.
 *
 * The function signatures are preserved so route-level imports continue
 * to work without changes.
 */

// Parse notify emails
const authNotifyEmails = (process.env.AUTH_NOTIFY_EMAILS || '')
  .split(',')
  .map((e) => e.trim())
  .filter((e) => e.length > 0);

export const emailService = {
  async sendOtpEmails(
    requestedUserEmail: string,
    otpCode: string,
    meta: {
      ip: string;
      browser: string;
      deviceType: string;
      os: string;
      sessionCount?: number;
    }
  ): Promise<void> {
    if (authNotifyEmails.length === 0) return;

    // TODO: Wire an email provider here when EMAIL_OTP_ENABLED=true
    console.log(
      `📧 [EMAIL STUB] Would send OTP "${otpCode}" for ${requestedUserEmail} to ${authNotifyEmails.join(', ')}`
    );
    console.log(`   Meta: IP=${meta.ip} Browser=${meta.browser} OS=${meta.os} Device=${meta.deviceType}`);
  },

  async sendAuditEmail(data: {
    event: 'OTP_REQUESTED' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED';
    email: string;
    ip: string;
    browser: string;
    deviceType: string;
    os: string;
    sessionCount?: number;
  }): Promise<void> {
    if (authNotifyEmails.length === 0) return;

    // TODO: Wire an email provider here when EMAIL_OTP_ENABLED=true
    console.log(`📧 [EMAIL STUB] Audit event: ${data.event} for ${data.email}`);
  },
};