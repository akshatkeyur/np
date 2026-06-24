import { NextResponse } from 'next/server';
import { rateLimitCache, sessionCache } from '../../../../lib/auth/cache';
import { otpService } from '../../../../lib/auth/otp.service';
import { getAuditMetadata } from '../../../../lib/auth/metadata.util';

export async function POST(req: Request) {
  try {
    const meta = getAuditMetadata(req);

    // Apply Rate Limiting
    const rateLimitKey = `rl_${meta.ip}`;
    const hits = (rateLimitCache.get<number>(rateLimitKey) || 0) + 1;
    rateLimitCache.set(rateLimitKey, hits);

    if (hits > 3) {
      return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
    }

    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, message: 'Valid email is required' }, { status: 400 });
    }

    // ── Dynamic OTP mode (default) ──────────────────────────────────
    // No OTP generation, no storage, no email — user derives OTP from
    // current date/time in DDMMHHMM format.
    if (!otpService.isEmailOtpEnabled) {
      console.log(`🔐 Dynamic OTP mode — request acknowledged for ${email}`);
      return NextResponse.json({ success: true, message: 'OTP requested successfully' }, { status: 200 });
    }

    // ── Legacy email OTP mode (EMAIL_OTP_ENABLED=true) ──────────────
    const otp = otpService.generateOtp();
    const hashedOtp = otpService.hashOtp(otp);
    otpService.storeOtp(email, hashedOtp);

    const sessionCount = (sessionCache.get<string[]>(email) || []).length;

    // Only import email service when email flow is enabled
    const { emailService } = await import('../../../../lib/auth/email.service');
    Promise.all([
      emailService.sendOtpEmails(email, otp, { ...meta, sessionCount })
    ]).catch(console.error);

    return NextResponse.json({ success: true, message: 'OTP requested successfully' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
