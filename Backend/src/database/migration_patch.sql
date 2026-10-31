-- Database Migration & Patch for Full Feature Support
-- Run on klinika_db

-- 1. ALTER EXISTING TABLES TO ADD MISSING COLUMNS
ALTER TABLE services ADD COLUMN IF NOT EXISTS clinic_id VARCHAR(50) DEFAULT 'tenant_sadaf_01';
ALTER TABLE cash_shifts ADD COLUMN IF NOT EXISTS clinic_id VARCHAR(50) DEFAULT 'tenant_sadaf_01';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS clinic_id VARCHAR(50) DEFAULT 'tenant_sadaf_01';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS clinic_id VARCHAR(50) DEFAULT 'tenant_sadaf_01';
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS clinic_id VARCHAR(50) DEFAULT 'tenant_sadaf_01';

ALTER TABLE queue_tickets ADD COLUMN IF NOT EXISTS clinic_id VARCHAR(50) DEFAULT 'tenant_sadaf_01';
ALTER TABLE queue_tickets ADD COLUMN IF NOT EXISTS doctor_conclusion TEXT DEFAULT NULL;
ALTER TABLE queue_tickets ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;

-- 2. PLANS TABLE
CREATE TABLE IF NOT EXISTS plans (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    price NUMERIC(15,2) DEFAULT 0.00,
    monthly_price NUMERIC(15,2) DEFAULT 0.00,
    yearly_price NUMERIC(15,2) DEFAULT 0.00,
    billing_cycle VARCHAR(50) DEFAULT 'monthly',
    features JSONB DEFAULT '[]'::jsonb,
    limits JSONB DEFAULT '{}'::jsonb,
    trial_days INT DEFAULT 14,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO plans (id, code, name, price, monthly_price, yearly_price, features, is_active)
VALUES 
('plan_starter', 'STARTER', 'Starter', 350000, 350000, 3500000, '["1 ta filial", "5 ta shifokor", "SMS xabarnoma"]', true),
('plan_pro', 'PRO', 'Professional', 1200000, 1200000, 12000000, '["3 ta filial", "20 ta shifokor", "TV Display", "SMS & Telegram"]', true),
('plan_enterprise', 'ENTERPRISE', 'Enterprise VIP', 5000000, 5000000, 50000000, '["Cheksiz filial", "Cheksiz shifokor", "To''liq analitika", "24/7 Support"]', true)
ON CONFLICT (code) DO UPDATE SET 
    price = EXCLUDED.price,
    monthly_price = EXCLUDED.monthly_price,
    yearly_price = EXCLUDED.yearly_price;

-- 3. CLINIC SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS clinic_subscriptions (
    id VARCHAR(50) PRIMARY KEY,
    clinic_id VARCHAR(50) NOT NULL,
    clinic_name VARCHAR(255) NOT NULL,
    plan_code VARCHAR(50) NOT NULL REFERENCES plans(code),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
    auto_renew BOOLEAN DEFAULT true,
    price_paid NUMERIC(15,2) DEFAULT 0.00,
    sms_balance INT DEFAULT 500,
    sms_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO clinic_subscriptions (id, clinic_id, clinic_name, plan_code, status, start_date, end_date, auto_renew, price_paid, sms_balance, sms_enabled)
VALUES
('sub_sadaf', 'tenant_sadaf_01', 'SADAF KLINIKA', 'ENTERPRISE', 'ACTIVE', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', true, 5000000, 1000, true)
ON CONFLICT (id) DO NOTHING;

-- 4. SMS SETTINGS, TEMPLATES & LOGS
CREATE TABLE IF NOT EXISTS sms_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    provider VARCHAR(50) DEFAULT 'ESKIZ',
    api_url VARCHAR(255) DEFAULT 'https://notify.eskiz.uz/api',
    email VARCHAR(100) DEFAULT 'yuldoshovich@mail.ru',
    api_token TEXT DEFAULT 'LybZx7ZSH6Uavso90lwRKZagdc5DDvBVKlfFNmi4',
    sender_name VARCHAR(50) DEFAULT '4546',
    balance INT DEFAULT 1000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO sms_settings (id, provider, api_url, email, api_token, sender_name, balance, is_active)
VALUES ('default', 'ESKIZ', 'https://notify.eskiz.uz/api', 'yuldoshovich@mail.ru', 'LybZx7ZSH6Uavso90lwRKZagdc5DDvBVKlfFNmi4', '4546', 1000, true)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS sms_templates (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    template_text TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO sms_templates (event_type, title, template_text, is_enabled)
VALUES
('TICKET_CREATED', 'Talon berilganda', 'Hurmatli {bemor_ism}, sizning navbat raqamingiz: {talon}. Xona: {xona}, Shifokor: {shifokor}. Sadaf Klinika.', true),
('TICKET_CALLED', 'Navbat chaqirilganda', 'Hurmatli {bemor_ism}, navbatingiz keldi! Iltimos, {xona}-xonaga, {shifokor} qabuliga marhamat qiling.', true)
ON CONFLICT (event_type) DO NOTHING;

CREATE TABLE IF NOT EXISTS sms_logs (
    id VARCHAR(50) PRIMARY KEY,
    phone VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    clinic_name VARCHAR(255) DEFAULT 'Sadaf Klinika',
    status VARCHAR(50) DEFAULT 'DELIVERED',
    provider_response TEXT DEFAULT 'OK',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. BRANCHES TABLE
CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    clinic_name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    doctor_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO branches (id, name, code, clinic_name, address, phone, doctor_count, is_active)
VALUES
('br_main', 'Sadaf Bosh Filial', 'MAIN', 'Sadaf Klinika', 'Toshkent sh., Chilonzor tumani', '+998 71 200 00 00', 10, true)
ON CONFLICT (id) DO NOTHING;

-- 6. SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS support_tickets (
    id VARCHAR(50) PRIMARY KEY,
    clinic_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'MEDIUM',
    status VARCHAR(50) DEFAULT 'OPEN',
    reply TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. PROMO CODES
CREATE TABLE IF NOT EXISTS promo_codes (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percent NUMERIC(5,2) NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    max_usage INT DEFAULT 100,
    used_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. API KEYS
CREATE TABLE IF NOT EXISTS api_keys (
    id VARCHAR(50) PRIMARY KEY,
    clinic_name VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(50) NOT NULL,
    secret_hash VARCHAR(255) NOT NULL,
    permissions VARCHAR(255) DEFAULT 'READ,WRITE',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO system_settings (key, value, description)
VALUES
('platform_name', 'klinika-admin Platform', 'Platforma umumiy nomi'),
('maintenance_mode', 'false', 'Texnik ishlar rejimi'),
('default_trial_days', '14', 'Standart sinov muddati')
ON CONFLICT (key) DO NOTHING;

-- 10. RE-GRANT ALL PERMISSIONS TO klinika_admin
GRANT ALL ON SCHEMA public TO klinika_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO klinika_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO klinika_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO klinika_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO klinika_admin;
