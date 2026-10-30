import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const rawJwtSecret = process.env.JWT_SECRET;

if (isProduction && (!rawJwtSecret || rawJwtSecret.includes('sadaf_super_secret'))) {
  console.warn('⚠️ [SECURITY WARNING] Insecure or default JWT_SECRET detected. Please set a strong, random JWT_SECRET in production .env!');
}

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  jwtSecret: rawJwtSecret || 'sadaf_super_secret_jwt_key_2026_saas_production_secure_token',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  databasePath: process.env.DATABASE_PATH || './sadaf_saas.json'
};
