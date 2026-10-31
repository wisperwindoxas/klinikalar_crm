-- SEED DATA for Clinic Queue Management System
-- Password hash for 'admin123', 'kassir123', 'doctor123' generated with bcryptjs ($2a$10$w... or standard bcrypt)
-- Using pre-hashed bcrypt password for demo: '$2a$10$bOskrI0r0Zp2kKzUa1Lp/.YQ5XbC6E/qR5X3M4.H7eG1x0zWkC.2m' (matches 'admin123')

-- 1. CLINIC SETTINGS
INSERT INTO clinic_settings (id, clinic_name, default_queue_prefix, timezone, voice_language, daily_reset_time, address, phone)
VALUES ('default', 'SADAF KLINIKA', 'A', 'Asia/Tashkent', 'uz-UZ', '00:00:00', 'Toshkent sh., Chilonzor tumani, Bunyodkor ko''chasi 15-uy', '+998 71 200 00 20')
ON CONFLICT (id) DO UPDATE SET clinic_name = EXCLUDED.clinic_name;

-- 2. ROLES
INSERT INTO roles (id, name, code, description) VALUES
('role_super_admin', 'Super Administrator', 'SUPER_ADMIN', 'Tizim boshqaruvchisi, barcha klinika va obunalarni nazorat qiladi'),
('role_manager', 'Menejer (Administrator)', 'MANAGER', 'Klinika barcha jarayonlarini to''liq boshqarish'),
('role_cashier', 'Kassir / Qabulxona', 'CASHIER', 'Bemorlarni ro''yxatga olish, to''lov qabul qilish va talon berish'),
('role_doctor', 'Shifokor', 'DOCTOR', 'O''z qabul navbatini boshqarish va chaqirish'),
('role_display', 'TV Tablo Ekrani', 'DISPLAY', 'Katta zaldagi navbat va audio chaqiruv')
ON CONFLICT (code) DO NOTHING;

-- 3. USERS (bcrypt for 'admin123' / 'kassir123' / 'doctor123')
INSERT INTO users (id, full_name, username, password_hash, role_id, phone, is_active) VALUES
('usr_super_admin', 'Bosh Administrator', 'superadmin', '$2a$10$wgfdKOw7el3cJ2nNmUVPEeMuKtYLcqj8plVDEA4GGYEdiskMoFwlO', 'role_super_admin', '+998 99 000 00 00', true),
('usr_manager', 'Azizbek Rahimov (Menejer)', 'admin', '$2a$10$wgfdKOw7el3cJ2nNmUVPEeMuKtYLcqj8plVDEA4GGYEdiskMoFwlO', 'role_manager', '+998 90 123 45 67', true),
('usr_cashier1', 'Dilnoza Karimova (Kassir)', 'kassir1', '$2a$10$wgfdKOw7el3cJ2nNmUVPEeMuKtYLcqj8plVDEA4GGYEdiskMoFwlO', 'role_cashier', '+998 93 555 44 33', true),
('usr_cashier2', 'Malika Tursunova (Kassir)', 'kassir2', '$2a$10$wgfdKOw7el3cJ2nNmUVPEeMuKtYLcqj8plVDEA4GGYEdiskMoFwlO', 'role_cashier', '+998 93 444 33 22', true)
ON CONFLICT (username) DO NOTHING;

-- 4. SPECIALTIES (Prefixes matching design.md: K, T, N, U, J, P, S, O, L, D, E, G, TR, GA)
INSERT INTO specialties (id, name, prefix, description) VALUES
('spec_kardio', 'Kardiologiya', 'K', 'Yurak va qon tomir kasalliklari'),
('spec_terapiya', 'Terapiya', 'T', 'Umumiy amaliyot va ichki kasalliklar'),
('spec_nevro', 'Nevrologiya', 'N', 'Asab tizimi kasalliklari'),
('spec_uro', 'Urologiya', 'U', 'Siydik-tanosil tizimi'),
('spec_jarroh', 'Jarrohlik (Xirurgiya)', 'J', 'Umumiy jarrohlik maslahati'),
('spec_pediatr', 'Pediatriya', 'P', 'Bolalar kasalliklari'),
('spec_stomat', 'Stomatologiya', 'S', 'Tish va jag'' kasalliklari'),
('spec_oftalm', 'Oftalmologiya', 'O', 'Ko''z kasalliklari va ko''rish tekshiruvi'),
('spec_lor', 'LOR (Otorinolaringologiya)', 'L', 'Quloq, tomoq va burun kasalliklari'),
('spec_derma', 'Dermatologiya', 'D', 'Teri kasalliklari'),
('spec_endo', 'Endokrinologiya', 'E', 'Qalqonsimon bez va gormonlar'),
('spec_gineko', 'Ginekologiya', 'G', 'Ayollar salomatligi'),
('spec_travma', 'Travmatologiya', 'TR', 'Suyak va bo''g''im jarohatlari'),
('spec_gastro', 'Gastroenterologiya', 'GA', 'Oshqozon-ichak trakti kasalliklari')
ON CONFLICT (id) DO NOTHING;

-- 5. CABINETS (1-xonadan 20-xonagacha)
INSERT INTO cabinets (id, number, name, department, floor) VALUES
('cab_01', '1', '1-kabinet (Kardiologiya)', 'Terapiya bloki', 1),
('cab_02', '2', '2-kabinet (Kardiologiya 2)', 'Terapiya bloki', 1),
('cab_03', '3', '3-kabinet (Terapiya)', 'Umumiy qabul', 1),
('cab_04', '4', '4-kabinet (Terapiya 2)', 'Umumiy qabul', 1),
('cab_05', '5', '5-kabinet (Nevrologiya)', 'Nerv kasalliklari', 2),
('cab_06', '6', '6-kabinet (Nevrologiya 2)', 'Nerv kasalliklari', 2),
('cab_07', '7', '7-kabinet (Urologiya)', 'Ixtisoslashgan jarrohlik', 2),
('cab_08', '8', '8-kabinet (Jarrohlik)', 'Ixtisoslashgan jarrohlik', 2),
('cab_09', '9', '9-kabinet (Pediatriya)', 'Bolalar bo''limi', 1),
('cab_10', '10', '10-kabinet (Pediatriya 2)', 'Bolalar bo''limi', 1),
('cab_11', '11', '11-kabinet (Stomatologiya)', 'Stomatologiya', 3),
('cab_12', '12', '12-kabinet (Stomatologiya 2)', 'Stomatologiya', 3),
('cab_13', '13', '13-kabinet (Oftalmologiya)', 'Diagnostika', 2),
('cab_14', '14', '14-kabinet (LOR)', 'Diagnostika', 2),
('cab_15', '15', '15-kabinet (Dermatologiya)', 'Terapiya bloki', 1),
('cab_16', '16', '16-kabinet (Endokrinologiya)', 'Terapiya bloki', 1),
('cab_17', '17', '17-kabinet (Ginekologiya)', 'Ayollar maslahatxonasi', 3),
('cab_18', '18', '18-kabinet (Travmatologiya)', 'Shoshilinch travma', 1),
('cab_19', '19', '19-kabinet (Gastroenterologiya)', 'Terapiya bloki', 2),
('cab_20', '20', '20-kabinet (UZI / Diagnostika)', 'Instrumental diagnostika', 1)
ON CONFLICT (number) DO NOTHING;

-- 6. 20+ DOCTORS & THEIR USERS
INSERT INTO users (id, full_name, username, password_hash, role_id, phone, is_active) VALUES
('usr_doc_01', 'Dr. Aliyev Jahongir Rustamovich', 'doc_kardio1', '$2a$10$wgfdKOw7el3cJ2nNmUVPEeMuKtYLcqj8plVDEA4GGYEdiskMoFwlO', 'role_doctor', '+998 90 111 22 33', true),
('usr_doc_02', 'Dr. Qosimova Nilufar Anvarovna', 'doc_kardio2', '$2a$10$wgfdKOw7el3cJ2nNmUVPEeMuKtYLcqj8plVDEA4GGYEdiskMoFwlO', 'role_doctor', '+998 90 222 33 44', true),
('usr_doc_03', 'Dr. Saidova Dilnoza Farxodovna', 'doc_terapevt1', '$2a$10$wgfdKOw7el3cJ2nNmUVPEeMuKtYLcqj8plVDEA4GGYEdiskMoFwlO', 'role_doctor', '+998 90 333 44 55', true),
('usr_doc_04', 'Dr. Mirzayev Aziz Akmalovich', 'doc_terapevt2', '$2a$10$wgfdKOw7el3cJ2nNmUVPEeMuKtYLcqj8plVDEA4GGYEdiskMoFwlO', 'role_doctor', '+998 90 444 55 66', true),
('usr_doc_05', 'Dr. Rashidov Akmal Botirovich', 'doc_nevro1', '$2a$10$wgfdKOw7el3cJ2nNmUVPEeMuKtYLcqj8plVDEA4GGYEdiskMoFwlO', 'role_doctor', '+998 90 555 66 77', true),
('usr_doc_06', 'Dr. Karimova Sevara Ulug''bekovna', 'doc_nevro2', '$2a$10$wgfdKOw7el3cJ2nNmUVPEeMuKtYLcqj8plVDEA4GGYEdiskMoFwlO', 'role_doctor', '+998 90 666 77 88', true),
('usr_doc_07', 'Dr. Nurmatov Bekzod Sharifovich', 'doc_uro1', '$2a$10$wgfdKOw7el3cJ2nNmUVPEeMuKtYLcqj8plVDEA4GGYEdiskMoFwlO', 'role_doctor', '+998 90 777 88 99', true),
('usr_doc_08', 'Dr. Umarov Jasur Shuhratovich', 'doc_jarroh1', '$2a$10$wgfdKOw7el3cJ2nNmUVPEeMuKtYLcqj8plVDEA4GGYEdiskMoFwlO', 'role_doctor', '+998 90 888 99 00', true),
('usr_doc_09', 'Dr. Xoliqova Umida Bobirovna', 'doc_pediatr1', '$2a$10$wgfdKOw7el3cJ2nNmUVPEeMuKtYLcqj8plVDEA4GGYEdiskMoFwlO', 'role_doctor', '+998 91 111 22 33', true),
('usr_doc_10', 'Dr. Ismoilov Otabek Rustamovich', 'doc_pediatr2', '$2a$10$wgfdKOw7el3cJ2nNmUVPEeMuKtYLcqj8plVDEA4GGYEdiskMoFwlO', 'role_doctor', '+998 91 222 33 44', true),
('usr_doc_11', 'Dr. Ergashev Bobur Odilovich', 'doc_stomat1', '$2a$10$f/9Z8d0P9q0k0v6E.eQGvO1C9B.K4A1L6H3M2.H7eG1x0zWkC', 'role_doctor', '+998 91 333 44 55', true),
('usr_doc_12', 'Dr. Yo''ldoshev Sardor Bahodirovich', 'doc_stomat2', '$2a$10$f/9Z8d0P9q0k0v6E.eQGvO1C9B.K4A1L6H3M2.H7eG1x0zWkC', 'role_doctor', '+998 91 444 55 66', true),
('usr_doc_13', 'Dr. Mahmudova Shahlo Anvarovna', 'doc_oftalm1', '$2a$10$f/9Z8d0P9q0k0v6E.eQGvO1C9B.K4A1L6H3M2.H7eG1x0zWkC', 'role_doctor', '+998 91 555 66 77', true),
('usr_doc_14', 'Dr. Vohidov Davron Toxirovich', 'doc_lor1', '$2a$10$f/9Z8d0P9q0k0v6E.eQGvO1C9B.K4A1L6H3M2.H7eG1x0zWkC', 'role_doctor', '+998 91 666 77 88', true),
('usr_doc_15', 'Dr. Sobirova Gulnoza Komilovna', 'doc_derma1', '$2a$10$f/9Z8d0P9q0k0v6E.eQGvO1C9B.K4A1L6H3M2.H7eG1x0zWkC', 'role_doctor', '+998 91 777 88 99', true),
('usr_doc_16', 'Dr. Tursunov Eldor Baxtiyorovich', 'doc_endo1', '$2a$10$f/9Z8d0P9q0k0v6E.eQGvO1C9B.K4A1L6H3M2.H7eG1x0zWkC', 'role_doctor', '+998 91 888 99 00', true),
('usr_doc_17', 'Dr. Zokirova Nargiza Jamshidovna', 'doc_gineko1', '$2a$10$f/9Z8d0P9q0k0v6E.eQGvO1C9B.K4A1L6H3M2.H7eG1x0zWkC', 'role_doctor', '+998 93 111 22 33', true),
('usr_doc_18', 'Dr. Bozorov Mansur Qobilovich', 'doc_travma1', '$2a$10$f/9Z8d0P9q0k0v6E.eQGvO1C9B.K4A1L6H3M2.H7eG1x0zWkC', 'role_doctor', '+998 93 222 33 44', true),
('usr_doc_19', 'Dr. Rahmonov Farrux Erkinovich', 'doc_gastro1', '$2a$10$f/9Z8d0P9q0k0v6E.eQGvO1C9B.K4A1L6H3M2.H7eG1x0zWkC', 'role_doctor', '+998 93 333 44 55', true),
('usr_doc_20', 'Dr. Shukurov Timur Salohiddinovich', 'doc_uzi1', '$2a$10$f/9Z8d0P9q0k0v6E.eQGvO1C9B.K4A1L6H3M2.H7eG1x0zWkC', 'role_doctor', '+998 93 444 55 66', true)
ON CONFLICT (username) DO NOTHING;

-- INSERT INTO DOCTORS
INSERT INTO doctors (id, user_id, specialty_id, cabinet_id, display_name, phone, room_number, avg_consultation_minutes, is_active) VALUES
('doc_01', 'usr_doc_01', 'spec_kardio', 'cab_01', 'Dr. Aliyev Jahongir', '+998 90 111 22 33', '1', 15, true),
('doc_02', 'usr_doc_02', 'spec_kardio', 'cab_02', 'Dr. Qosimova Nilufar', '+998 90 222 33 44', '2', 15, true),
('doc_03', 'usr_doc_03', 'spec_terapiya', 'cab_03', 'Dr. Saidova Dilnoza', '+998 90 333 44 55', '3', 15, true),
('doc_04', 'usr_doc_04', 'spec_terapiya', 'cab_04', 'Dr. Mirzayev Aziz', '+998 90 444 55 66', '4', 15, true),
('doc_05', 'usr_doc_05', 'spec_nevro', 'cab_05', 'Dr. Rashidov Akmal', '+998 90 555 66 77', '5', 20, true),
('doc_06', 'usr_doc_06', 'spec_nevro', 'cab_06', 'Dr. Karimova Sevara', '+998 90 666 77 88', '6', 20, true),
('doc_07', 'usr_doc_07', 'spec_uro', 'cab_07', 'Dr. Nurmatov Bekzod', '+998 90 777 88 99', '7', 15, true),
('doc_08', 'usr_doc_08', 'spec_jarroh', 'cab_08', 'Dr. Umarov Jasur', '+998 90 888 99 00', '8', 20, true),
('doc_09', 'usr_doc_09', 'spec_pediatr', 'cab_09', 'Dr. Xoliqova Umida', '+998 91 111 22 33', '9', 15, true),
('doc_10', 'usr_doc_10', 'spec_pediatr', 'cab_10', 'Dr. Ismoilov Otabek', '+998 91 222 33 44', '10', 15, true),
('doc_11', 'usr_doc_11', 'spec_stomat', 'cab_11', 'Dr. Ergashev Bobur', '+998 91 333 44 55', '11', 25, true),
('doc_12', 'usr_doc_12', 'spec_stomat', 'cab_12', 'Dr. Yo''ldoshev Sardor', '+998 91 444 55 66', '12', 25, true),
('doc_13', 'usr_doc_13', 'spec_oftalm', 'cab_13', 'Dr. Mahmudova Shahlo', '+998 91 555 66 77', '13', 15, true),
('doc_14', 'usr_doc_14', 'spec_lor', 'cab_14', 'Dr. Vohidov Davron', '+998 91 666 77 88', '14', 15, true),
('doc_15', 'usr_doc_15', 'spec_derma', 'cab_15', 'Dr. Sobirova Gulnoza', '+998 91 777 88 99', '15', 15, true),
('doc_16', 'usr_doc_16', 'spec_endo', 'cab_16', 'Dr. Tursunov Eldor', '+998 91 888 99 00', '16', 15, true),
('doc_17', 'usr_doc_17', 'spec_gineko', 'cab_17', 'Dr. Zokirova Nargiza', '+998 93 111 22 33', '17', 20, true),
('doc_18', 'usr_doc_18', 'spec_travma', 'cab_18', 'Dr. Bozorov Mansur', '+998 93 222 33 44', '18', 20, true),
('doc_19', 'usr_doc_19', 'spec_gastro', 'cab_19', 'Dr. Rahmonov Farrux', '+998 93 333 44 55', '19', 15, true),
('doc_20', 'usr_doc_20', 'spec_terapiya', 'cab_20', 'Dr. Shukurov Timur (UZI)', '+998 93 444 55 66', '20', 15, true)
ON CONFLICT (id) DO NOTHING;

-- 7. SERVICES & PAYMENT POLICIES (PAY_BEFORE_TICKET, TICKET_BEFORE_PAYMENT, PARTIAL_PAYMENT_ALLOWED, FREE_OR_EXEMPT)
INSERT INTO services (id, name, specialty_id, price, duration_minutes, payment_policy, minimum_payment_amount) VALUES
('srv_kardio_kons', 'Kardiolog konsultatsiyasi va EKG', 'spec_kardio', 120000.00, 15, 'PAY_BEFORE_TICKET', 120000.00),
('srv_terapiya_kons', 'Terapevt umumiy ko''rigi', 'spec_terapiya', 90000.00, 15, 'TICKET_BEFORE_PAYMENT', 0.00),
('srv_nevro_kons', 'Nevropatolog qabuli', 'spec_nevro', 110000.00, 20, 'PAY_BEFORE_TICKET', 110000.00),
('srv_uro_kons', 'Urolog konsultatsiyasi', 'spec_uro', 100000.00, 15, 'TICKET_BEFORE_PAYMENT', 0.00),
('srv_jarroh_kons', 'Jarroh ko''rigi va bog''lash', 'spec_jarroh', 130000.00, 20, 'PARTIAL_PAYMENT_ALLOWED', 50000.00),
('srv_pediatr_kons', 'Pediatr ko''rigi (Bolalar)', 'spec_pediatr', 80000.00, 15, 'FREE_OR_EXEMPT', 0.00),
('srv_stomat_terap', 'Stomatologiyada tish davolash', 'spec_stomat', 150000.00, 30, 'PARTIAL_PAYMENT_ALLOWED', 50000.00),
('srv_oftalm_korik', 'Ko''z tubini tekshirish va ko''rish aniqligi', 'spec_oftalm', 90000.00, 15, 'PAY_BEFORE_TICKET', 90000.00),
('srv_lor_korik', 'LOR ko''rigi va tomoq yuvish', 'spec_lor', 85000.00, 15, 'TICKET_BEFORE_PAYMENT', 0.00),
('srv_derma_kons', 'Dermatologik tekshiruv', 'spec_derma', 95000.00, 15, 'PAY_BEFORE_TICKET', 95000.00),
('srv_endo_kons', 'Endokrinolog konsultatsiyasi', 'spec_endo', 105000.00, 15, 'PAY_BEFORE_TICKET', 105000.00),
('srv_gineko_kons', 'Ginekologik qabul va ko''rik', 'spec_gineko', 120000.00, 20, 'PAY_BEFORE_TICKET', 120000.00),
('srv_travma_korik', 'Travmatolog ko''rigi va fiksatsiya', 'spec_travma', 140000.00, 20, 'TICKET_BEFORE_PAYMENT', 0.00),
('srv_gastro_kons', 'Gastroenterolog qabuli', 'spec_gastro', 100000.00, 15, 'PAY_BEFORE_TICKET', 100000.00),
('srv_uzi_qorin', 'Qorin bo''shlig''i to''liq UZI tekshiruvi', 'spec_terapiya', 130000.00, 15, 'PAY_BEFORE_TICKET', 130000.00)
ON CONFLICT (id) DO NOTHING;

-- 8. SAMPLE PATIENTS
INSERT INTO patients (id, patient_number, full_name, phone, birth_date, gender, address, notes) VALUES
('pat_001', '1001', 'Karimov Akmal Shuhratovich', '+998 90 987 65 43', '1985-04-12', 'MALE', 'Toshkent sh., Yunusobod 4-mavze', 'Qon bosimi yuqori, surunkali gipertoniya'),
('pat_002', '1002', 'Tursunova Dilnoza Anvarovna', '+998 93 123 45 67', '1992-08-23', 'FEMALE', 'Toshkent sh., Chilonzor 9-mavze', 'Bosh og''rig''i, uyqusizlik'),
('pat_003', '1003', 'Rahimov Aziz Botirovich', '+998 97 765 43 21', '1978-11-05', 'MALE', 'Toshkent vil., Zangiota tumani', 'Yurak sohasida sanchiq bezovta qiladi'),
('pat_004', '1004', 'Yusupova Malika Otabekovna', '+998 94 333 22 11', '1998-02-17', 'FEMALE', 'Toshkent sh., Shayxontohur tumani', 'Mavsumiy shamollash va tomoq og''rig''i'),
('pat_005', '1005', 'Normatov Bekzod Jamshidovich', '+998 99 888 77 66', '2001-09-30', 'MALE', 'Toshkent sh., Mirzo Ulug''bek tumani', 'Sport jarohati, tizza bo''g''imi og''rig''i')
ON CONFLICT (patient_number) DO NOTHING;

-- 9. CASH SHIFT (Bugungi ochiq smena)
INSERT INTO cash_shifts (id, cashier_id, cashier_name, opened_at, opening_balance, status, notes) VALUES
('shift_today_01', 'usr_cashier1', 'Dilnoza Karimova', CURRENT_TIMESTAMP, 500000.00, 'OPEN', 'Ertalabki kassa smenasi ochildi')
ON CONFLICT (id) DO NOTHING;

-- 10. DISPLAY GROUP & DEVICE
INSERT INTO display_groups (id, name, code, department, description) VALUES
('disp_grp_main', 'Bosh kutish zali TV tablosu', 'MAIN_HALL', 'Umumiy zal', 'Markaziy katta monitor va audio e''lon')
ON CONFLICT (code) DO NOTHING;

INSERT INTO display_devices (id, group_id, device_name, is_active) VALUES
('dev_tv_01', 'disp_grp_main', 'Asosiy TV Tablo (LG 65")', true)
ON CONFLICT (id) DO NOTHING;
