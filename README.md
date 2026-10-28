# SADAF CLINIC MANAGEMENT SAAS PLATFORM
## Enterprise Multi-Tenant Clinic Management, Queue Engine & Telemetry System

---

## 🏛 Loyiha Haqida

Ushbu platforma yuzlab va minglab klinikalar uchun **Multi-Tenant SaaS (Software-as-a-Service)** modeli asosida ishlab chiqilgan.
Platformada har bir klinika o'z brendi (White-label), filiallarii, shifokorlari, operatorlari, navbat tizimi va to'lovlari bilan mustaqil ishlaydi. Super Admin esa butun SaaS ekotizimini, obunalarni, tariflarni va daromadni nazorat qiladi.

---

## 📁 Repozitoriya Strukturasi

```text
klinika_navbat/
├── Design/                   # Asl UI/UX etalon rasmlari
│   ├── Super_Admin.png       # Super Admin boshqaruv paneli
│   ├── User_panel.png        # Klinika bosh sahifasi (Asosiy panel)
│   ├── Meneger.png           # Menejer operatsion paneli & monitoring
│   ├── Doctor.png            # Shifokor qabul jarayoni & EMR
│   ├── Operator.png          # Operator talon berish terminali
│   └── Mobile.png            # Mobil ilova arxitekturasi
│
├── Documentation/
│   └── ARCHITECTURE.md       # 14 ta arxitektura diagrammasi va spetsifikatsiyalari
│
├── Backend/                  # Multi-Tenant Modular Core Engine (Port: 5001)
│   ├── src/
│   │   ├── config/           # Konfiguratsiyalar
│   │   ├── database/         # Multi-tenant ma'lumotlar ombori & auto-seed
│   │   ├── middleware/       # Auth (JWT), Tenant Boundary, Quota Guard
│   │   ├── modules/          # Auth, Super-Admin, Clinics, Doctors, Patients, Queues, Reports
│   │   └── websocket/        # Real-time Socket.IO Gateway
│   └── test/                 # Avtomatlashtirilgan xavfsizlik & quota testlari
│
├── Super-Admin-Panel/        # React + Vite + Tailwind (Port: 3000)
│   ├── src/
│   │   ├── components/       # Yangi klinika qo'shish, Tariflar, Audit loglar modallari
│   │   └── App.tsx           # Aynan Super_Admin.png dizaynidagi to'liq panel
│
├── User-Panel/               # React + Vite + Tailwind (Port: 3001)
│   ├── src/
│   │   ├── views/
│   │   │   ├── ManagerView.tsx   # Meneger.png & User_panel.png
│   │   │   ├── DoctorView.tsx    # Doctor.png (Qabul jarayoni, chaqirish, EMR)
│   │   │   ├── OperatorView.tsx  # Operator.png (Touchscreen talon berish)
│   │   │   ├── PatientsView.tsx  # Bemorlar bazasi
│   │   │   └── SettingsView.tsx  # White-label brend sozlamalari
│   │   └── App.tsx               # Filial almashtirgich, real-vaqt yangilanish
│
├── TV-Display/               # Fullscreen Digital Signage Screen (Port: 3002)
│   ├── src/
│   │   ├── audio/chime.ts    # Web Audio API Ding-Dong 2-tonli audio qo'ng'iroq
│   │   └── App.tsx           # Fullscreen katta talon ekrani + WebSocket
│
├── docker-compose.yml        # Barcha konteynerlarni boshqarish
└── README.md
```

---

## 🚀 Ishga tushirish (Tezkor va oson)

### 1-usul: Docker Compose orqali (Barcha servislarni bir vaqtda)
```bash
docker compose up --build
```

### 2-usul: Mahalliy (Local Development)

#### A. Backendni ishga tushirish:
```bash
cd Backend
npm install
npm test      # Xavfsizlik va tenant izolatsiyasi testlarini tekshirish
npm start     # http://localhost:5001 da ishga tushadi
```

#### B. Super Admin panelini ishga tushirish:
```bash
cd Super-Admin-Panel
npm install
npm run dev   # http://localhost:3000 da ochiladi
```

#### C. User Panel (Menejer, Shifokor, Operator)ni ishga tushirish:
```bash
cd User-Panel
npm install
npm run dev   # http://localhost:3001 da ochiladi
```

#### D. TV Display (Katta navbat ekrani)ni ishga tushirish:
```bash
cd TV-Display
npm install
npm run dev   # http://localhost:3002 da ochiladi
```

---

## 🔑 Demo hisoblar & Kirish ma'lumotlari

| Rol | Login (Email / Telefon) | Parol | Ruxsat doirasi |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@sadaf.uz` | `admin123` | Barcha klinikalar, tariflar, MRR va audit |
| **Menejer** | `azizbek@sadaf.uz` | `sadaf123` | SADAF Klinika monitoringi, navbat, tushum |
| **Operator** | `dilnoza@sadaf.uz` | `sadaf123` | Bemor qidirish, shifokor tanlash, talon berish |
| **Shifokor** | `doc_1@sadaf.uz` | `sadaf123` | Qabul jarayoni, chaqirish, diagnoz, retsept |

---

## 🛡️ O'tkazilgan Majburiy Testlar (14/14 PASS)
- **Tenant Isolation Test (Rule 60)**: Klinika A foydalanuvchisi Klinika B bemorini ko'rishga uringanda qat'iy taqiqlanadi (`403 Forbidden`).
- **Subscription Quota Limit Test (Rule 61)**: Starter tarifidagi klinika (5 ta shifokor limiti) 6-shifokor qo'shmoqchi bo'lganda bloklanadi.
- **Queue State Machine (Rule 35)**: WAITING ➔ CALLED ➔ IN_PROGRESS ➔ COMPLETED oqimi va EMR tarixi saqlanishi 100% tasdiqlangan.
