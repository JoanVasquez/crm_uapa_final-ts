import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import logger from './logger';

export const limiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,

  // ✅ Personaliza la IP usada como clave
  keyGenerator: (req) => {
    const ip = req.ip;

    // Valida formato de IP con RegExp básica
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
