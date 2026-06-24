import NodeCache from 'node-cache';

// Cache for OTPs, standard TTL of 60 seconds
export const otpCache = new NodeCache({ stdTTL: 60, checkperiod: 10 });

// Cache for active sessions mapping, standard TTL of 2 hours
export const sessionCache = new NodeCache({ stdTTL: 7200, checkperiod: 60 });

// Simple rate limiter cache
export const rateLimitCache = new NodeCache({ stdTTL: 60, checkperiod: 10 });
