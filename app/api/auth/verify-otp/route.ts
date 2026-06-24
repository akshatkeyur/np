import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sessionCache } from '../../../../lib/auth/cache';
import { otpService } from '../../../../lib/auth/otp.service';
import { getAuditMetadata } from '../../../../lib/auth/metadata.util';

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) {
      return NextResponse.json({ success: false, message: 'Email and OTP are required' }, { status: 400 });
    }

    const meta = getAuditMetadata(req);
    let sessionCount = (sessionCache.get<string[]>(email) || []).length;

    // ── Unified verify — delegates based on EMAIL_OTP_ENABLED flag ──
    const isValid = otpService.verifyOtp(email, otp);

    if (!isValid) {
      // Send audit email only if email flow is enabled
      if (otpService.isEmailOtpEnabled) {
        const { emailService } = await import('../../../../lib/auth/email.service');
        emailService.sendAuditEmail({ event: 'LOGIN_FAILED', email, sessionCount, ...meta }).catch(console.error);
      }
      return NextResponse.json({ success: false, message: 'Invalid or expired OTP' }, { status: 401 });
    }

    // ── Success ─────────────────────────────────────────────────────
    const sessionId = crypto.randomUUID();
    const existingSessions = sessionCache.get<string[]>(email) || [];
    existingSessions.push(sessionId);
    sessionCache.set(email, existingSessions);
    sessionCount = existingSessions.length;

    const secret = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign({ email, sessionId }, secret, { expiresIn: '2h' });

    // Send audit email only if email flow is enabled
    if (otpService.isEmailOtpEnabled) {
      const { emailService } = await import('../../../../lib/auth/email.service');
      emailService.sendAuditEmail({ event: 'LOGIN_SUCCESS', email, sessionCount, ...meta }).catch(console.error);
    }

    return NextResponse.json({ success: true, token }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
