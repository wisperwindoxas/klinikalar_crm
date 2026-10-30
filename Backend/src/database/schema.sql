-- Clinic Queue Management System (PostgreSQL 16 Schema)
-- As per Documentation/dasturchi.md & design.md

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CLINIC SETTINGS
CREATE TABLE IF NOT EXISTS clinic_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    clinic_name VARCHAR(255) NOT NULL DEFAULT 'SADAF KLINIKA',
    default_queue_prefix VARCHAR(5) NOT NULL DEFAULT 'A',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Tashkent',
    voice_language VARCHAR(10) NOT NULL DEFAULT 'uz-UZ',
    daily_reset_time TIME NOT NULL DEFAULT '00:00:00',
    address VARCHAR(255) DEFAULT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    logo_url TEXT DEFAULT NULL,
    slogan VARCHAR(255) DEFAULT NULL,
    email VARCHAR(100) DEFAULT NULL,
    work_start_time VARCHAR(10) DEFAULT '08:00',
    work_end_time VARCHAR(10) DEFAULT '18:00',
    work_days VARCHAR(100) DEFAULT 'Dushanba - Shanba',
    website_url VARCHAR(255) DEFAULT NULL,
    default_payment_policy VARCHAR(50) DEFAULT 'PAY_BEFORE_CALL',
    auto_call_next BOOLEAN DEFAULT false,
    ticket_auto_cancel_minutes INT DEFAULT 15,
    max_daily_tickets_per_doctor INT DEFAULT 50,
    emergency_priority BOOLEAN DEFAULT true,
    currency VARCHAR(20) DEFAULT 'UZS',
    vat_percent INT DEFAULT 0,
    cashier_auto_close_shift BOOLEAN DEFAULT true,
    sound_notification BOOLEAN DEFAULT true,
    recall_limit INT DEFAULT 3,
    tv_voice_template TEXT DEFAULT 'Talon raqami {letter}{zeros}, {number} raqam egasi, sizni {cabinet} xona, {specialty} xonasiga marhamat!',
    tv_voice_name VARCHAR(50) DEFAULT 'uz-UZ-MadinaNeural',
    tv_slogan_title VARCHAR(255) DEFAULT 'Sog‘lig‘ingiz biz uchun muhim!',
    tv_slogan_subtitle VARCHAR(255) DEFAULT 'Navbat bilan qabulga marhamat!',
    tv_calling_title VARCHAR(100) DEFAULT 'Hozir chaqirilmoqda!',
    tv_standby_title VARCHAR(100) DEFAULT 'Qabul kutilmoqda',
    tv_standby_footer VARCHAR(255) DEFAULT 'Iltimos, navbat raqamingiz chaqirilishini kuting!',
    tv_bottom_banner VARCHAR(255) DEFAULT 'Sizning sog‘lig‘ingiz — bizning ustuvor vazifamiz!',
    tv_instruction_1 VARCHAR(255) DEFAULT 'Iltimos, navbatingizni kuting',
    tv_instruction_2 VARCHAR(255) DEFAULT 'Navbat raqami ovozli e''lon qilinadi',
    tv_instruction_3 VARCHAR(255) DEFAULT 'Talon raqamini va kabinet raqamini diqqat bilan tinglang',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. ROLES & PERMISSIONS
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(100) PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id VARCHAR(50) REFERENCES roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(100) REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 3. USERS
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id VARCHAR(50) REFERENCES roles(id),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. PATIENTS
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(50) PRIMARY KEY,
    patient_number VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    birth_date DATE,
    gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_patients_search ON patients(full_name, phone, patient_number);

-- 5. SPECIALTIES
CREATE TABLE IF NOT EXISTS specialties (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    prefix VARCHAR(5) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. CABINETS
CREATE TABLE IF NOT EXISTS cabinets (
    id VARCHAR(50) PRIMARY KEY,
    number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100) DEFAULT 'Ambulatoriya',
    floor INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. DOCTORS (20+ doctors capability)
CREATE TABLE IF NOT EXISTS doctors (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    specialty_id VARCHAR(50) REFERENCES specialties(id),
    cabinet_id VARCHAR(50) REFERENCES cabinets(id),
    display_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    room_number VARCHAR(20) NOT NULL,
    avg_consultation_minutes INT DEFAULT 15,
    is_active BOOLEAN DEFAULT TRUE,
    current_ticket_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. SERVICES & PAYMENT POLICIES
CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialty_id VARCHAR(50) REFERENCES specialties(id),
    price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    duration_minutes INT DEFAULT 15,
    payment_policy VARCHAR(50) NOT NULL DEFAULT 'PAY_BEFORE_TICKET'
        CHECK (payment_policy IN ('PAY_BEFORE_TICKET', 'TICKET_BEFORE_PAYMENT', 'PARTIAL_PAYMENT_ALLOWED', 'FREE_OR_EXEMPT')),
    minimum_payment_amount NUMERIC(15, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. CASH SHIFTS (Kassa smenalari)
CREATE TABLE IF NOT EXISTS cash_shifts (
    id VARCHAR(50) PRIMARY KEY,
    cashier_id VARCHAR(50) REFERENCES users(id),
    cashier_name VARCHAR(255) NOT NULL,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE,
    opening_balance NUMERIC(15, 2) DEFAULT 0.00,
    closing_balance NUMERIC(15, 2),
    total_received NUMERIC(15, 2) DEFAULT 0.00,
    total_refunded NUMERIC(15, 2) DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    notes TEXT
);

-- 10. APPOINTMENTS (Qabul yozuvlari)
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id VARCHAR(50) REFERENCES doctors(id) ON DELETE RESTRICT,
    service_id VARCHAR(50) REFERENCES services(id),
    cabinet_id VARCHAR(50) REFERENCES cabinets(id),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED'
        CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID'
        CHECK (payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'EXEMPT')),
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_by VARCHAR(50) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. QUEUE TICKETS (Navbat talonlari)
CREATE TABLE IF NOT EXISTS queue_tickets (
    id VARCHAR(50) PRIMARY KEY,
    appointment_id VARCHAR(50) REFERENCES appointments(id) ON DELETE SET NULL,
    doctor_id VARCHAR(50) REFERENCES doctors(id) ON DELETE RESTRICT,
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE RESTRICT,
    service_id VARCHAR(50) REFERENCES services(id),
    cabinet_id VARCHAR(50) REFERENCES cabinets(id),
    doctor_name VARCHAR(255) NOT NULL,
    specialty_name VARCHAR(100) NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(50),
    cabinet_number VARCHAR(20) NOT NULL,
    queue_date DATE NOT NULL,
    queue_prefix VARCHAR(5) NOT NULL,
    queue_number INT NOT NULL,
    full_number VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'WAITING'
        CHECK (status IN ('WAITING', 'CALLED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED', 'ON_HOLD')),
    priority INT DEFAULT 0,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID',
    estimated_wait_minutes INT DEFAULT 10,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    called_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(50) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_ticket_date_prefix_number UNIQUE (queue_date, queue_prefix, queue_number)
);
CREATE INDEX IF NOT EXISTS idx_queue_active ON queue_tickets(doctor_id, status, queue_date);

-- 12. QUEUE CALL EVENTS (Chaqiruvlar tarixi va auditi)
CREATE TABLE IF NOT EXISTS queue_call_events (
    id VARCHAR(50) PRIMARY KEY,
    ticket_id VARCHAR(50) REFERENCES queue_tickets(id) ON DELETE CASCADE,
    doctor_id VARCHAR(50) REFERENCES doctors(id),
    event_type VARCHAR(30) NOT NULL
        CHECK (event_type IN ('CALL_NEXT', 'RECALL', 'PREVIOUS', 'SKIP', 'START', 'COMPLETE', 'HOLD', 'CANCEL')),
    event_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    performed_by VARCHAR(50) REFERENCES users(id),
    display_group_id VARCHAR(50),
    metadata JSONB
);

-- 13. PAYMENTS & TRANSACTIONS
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(50) PRIMARY KEY,
    appointment_id VARCHAR(50) REFERENCES appointments(id),
    patient_id VARCHAR(50) REFERENCES patients(id),
    cashier_id VARCHAR(50) REFERENCES users(id),
    cash_shift_id VARCHAR(50) REFERENCES cash_shifts(id),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'UZS',
    method VARCHAR(30) NOT NULL CHECK (method IN ('CASH', 'CARD', 'TRANSFER', 'OTHER')),
    status VARCHAR(30) NOT NULL DEFAULT 'PAID' CHECK (status IN ('PAID', 'PARTIAL', 'REFUNDED')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_transactions (
    id VARCHAR(50) PRIMARY KEY,
    payment_id VARCHAR(50) REFERENCES payments(id) ON DELETE CASCADE,
    transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN ('PAYMENT', 'REFUND', 'ADJUSTMENT')),
    amount NUMERIC(15, 2) NOT NULL,
    reference_id VARCHAR(100),
    created_by VARCHAR(50) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. DISPLAY GROUPS & DEVICES
CREATE TABLE IF NOT EXISTS display_groups (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100) DEFAULT 'Umumiy zal',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS display_devices (
    id VARCHAR(50) PRIMARY KEY,
    group_id VARCHAR(50) REFERENCES display_groups(id) ON DELETE SET NULL,
    device_name VARCHAR(100) NOT NULL,
    token_hash VARCHAR(255),
    ip_address VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    actor_id VARCHAR(50),
    actor_name VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50),
    metadata JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
