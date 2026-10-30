import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message: string;
}) {
  const store = new Map<string, RateLimitRecord>();

  // Cleanup expired entries periodically to prevent memory leak
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, options.windowMs).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const now = Date.now();
    const record = store.get(ip);

    if (!record || now > record.resetTime) {
      store.set(ip, {
        count: 1,
        resetTime: now + options.windowMs
      });
      return next();
    }

    if (record.count >= options.max) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      res.status(429).json({
        success: false,
        message: options.message,
        retryAfter: retryAfterSec
      });
      return;
    }

    record.count++;
    next();
  };
}

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 daqiqa
  max: 20, // Ko'pi bilan 20 ta login urinish
  message: "Juda ko'p urinish amalga oshirildi. Iltimos, 15 daqiqadan so'ng qayta urinib ko'ring."
});

export const voiceRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 daqiqa
  max: 60, // Ko'pi bilan 60 ta TTS so'rov
  message: "Ovoz generatsiyasi uchun so'rovlar chegarasi oshdi. Biroz kuting."
});

