import crypto from 'crypto';
import { otpCache } from './cache';

export const otpService = {
  generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  },

  hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  },

  storeOtp(email: string, hashedOtp: string): void {
    otpCache.set(email, hashedOtp);
  },

  verifyOtp(email: string, plainOtp: string): boolean {
    const cachedHash = otpCache.get<string>(email);
    if (!cachedHash || cachedHash !== this.hashOtp(plainOtp)) {
      return false;
    }
    otpCache.del(email);
    return true;
  },
};
