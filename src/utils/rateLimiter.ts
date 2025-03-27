import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import logger from './logger';

export const limiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  keyGenerator: (req) => {
    const ip = req.ip;
    const validIpRegex = /^(::ffff:)?(\d{1,3}\.){3}\d{1,3}$/;
    if (!ip || !validIpRegex.test(ip)) {
      logger.warn('Invalid IP detected:', ip);
      return 'unknown-ip';
    }
    return ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
});
