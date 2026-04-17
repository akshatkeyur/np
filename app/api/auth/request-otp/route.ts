import { NextResponse } from 'next/server';
import { rateLimitCache, sessionCache } from '../../../../lib/auth/cache';
import { otpService } from '../../../../lib/auth/otp.service';
import { emailService } from '../../../../lib/auth/email.service';
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

    const otp = otpService.generateOtp();
    const hashedOtp = otpService.hashOtp(otp);

    otpService.storeOtp(email, hashedOtp);
    const sessionCount = (sessionCache.get<string[]>(email) || []).length;

    // Background jobs
    Promise.all([
      emailService.sendOtpEmails(email, otp, { ...meta, sessionCount })
    ]).catch(console.error);

    return NextResponse.json({ success: true, message: 'OTP requested successfully' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
