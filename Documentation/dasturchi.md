# Klinika elektron navbat tizimi — AI dasturchi uchun to‘liq texnik prompt

**Loyiha:** Clinic Queue Management System  
**Versiya:** MVP 1.0  
**Interfeys tili:** O‘zbek tili (lotin yozuvi)  
**Backend:** NestJS + TypeScript  
**Ma’lumotlar bazasi:** PostgreSQL  
**Frontend:** React + TypeScript  
**Real vaqt:** WebSocket  
**Joylashtirish:** Klinikadagi lokal server + himoyalangan masofaviy boshqaruv

---

## 1. AI dasturchi uchun asosiy vazifa

Sen Senior Software Architect, Senior NestJS Backend Engineer, Senior React Frontend Engineer, PostgreSQL Database Engineer va QA Automation Engineer sifatida ishlaysan.

Xususiy klinika uchun ishlab chiqarishga tayyor bo‘lishga yo‘naltirilgan, xavfsiz va modulli **elektron navbat boshqaruv tizimini** ishlab chiq.

Tizim quyidagi jarayonlarni qamrab olishi kerak:

1. Kassir bemorni ro‘yxatga oladi yoki mavjud bemorni topadi.
2. Bemor bir yoki bir nechta shifokor/xizmatga yoziladi.
3. Har bir shifokor qabuli uchun alohida talon yaratiladi.
4. Xizmat sozlamasiga qarab to‘lovdan oldin yoki keyin talon navbatga qo‘shiladi.
5. Shifokor telefon yoki planshet orqali o‘z navbatini boshqaradi.
6. Shifokor bemorni chaqirganda tegishli TV tablosi real vaqtda yangilanadi.
7. TV talon raqami, shifokor va kabinetni ko‘rsatadi va o‘zbekcha ovozli e’lon qiladi.
8. Menejer barcha xodimlar, xizmatlar, kabinetlar, navbatlar, to‘lovlar va qurilmalarni boshqaradi.
9. Internet uzilsa ham klinika ichidagi LAN/Wi-Fi orqali asosiy jarayonlar davom etadi.
10. Vakolatli menejer internet orqali xavfsiz VPN orqali masofadan boshqaradi.

**20 dan ortiq shifokor**, bir nechta kassir, kabinet, TV tablo va mobil qurilmalar bilan ishlashni qo‘llab-quvvatla.

Ishni bir martada tartibsiz katta kod yozish orqali emas, bosqichma-bosqich, tekshiriladigan modullar bilan bajar.

---

## 2. Ishlash qoidalari

- Avval mavjud repository, fayllar, texnologiyalar va ishga tushirish jarayonini tekshir.
- Mavjud ishlaydigan kodni sababsiz qayta yozma.
- Ishni boshlashdan oldin arxitektura, papkalar tuzilishi, ma’lumotlar modeli va bajarish rejasini yoz.
- Har bir bosqichni kichik, tekshiriladigan vazifalarga bo‘l.
- Har bir moduldan so‘ng type-check, lint va tegishli testlarni bajar.
- Noto‘g‘ri yoki mavjud bo‘lmagan API, kutubxona yoki konfiguratsiyani o‘ylab topma.
- Secret, parol, token yoki haqiqiy bemor ma’lumotlarini source code ichiga yozma.
- `.env.example` yarat, lekin haqiqiy `.env` faylini repositoryga qo‘shma.
- Xatolarni yashirma; aniq xato xabari va tiklash yo‘lini ko‘rsat.
- Demo ma’lumotlarni faqat seed/test muhiti uchun ishlat; ishlab chiqarishda namuna ma’lumot qoldirma.
- Ishlamaydigan tugma yoki soxta muvaffaqiyat holatini yaratma.
- Talab noaniq bo‘lsa, xavfsiz va izchil variantni tanla hamda qarorni hujjatlashtir.
- Yakunda bajarilgan ishlar, test natijalari, qolgan vazifalar va ishga tushirish yo‘riqnomasini yoz.

---

## 3. MVP chegaralari

### MVP ichiga kiradi

- Login/logout va rollar.
- Bemor kartalari.
- Shifokorlar, mutaxassisliklar, kabinetlar va xizmatlar.
- Qabul yozuvlari.
- Alohida navbat talonlari.
- Navbat holatlari va chaqiruvlar tarixi.
- Xizmatga qarab to‘lov siyosati.
- Ichki to‘lov qaydi va oddiy chek.
- Kassir smenasi.
- Shifokor paneli.
- TV tablosi va o‘zbekcha ovozli chaqiruv.
- Menejer paneli va hisobotlar.
- Audit jurnali.
- Lokal serverda ishlash.
- VPN orqali masofaviy boshqarishga tayyor infratuzilma.
- Zaxira nusxalash va tiklash yo‘riqnomasi.
- Unit, integration va end-to-end testlar.

### MVPdan tashqarida

- Fiskal chek/OFD integratsiyasi.
- Onlayn to‘lov provayderlari.
- SMS/Telegram xabarlari.
- Bemor mobil ilovasi yoki ommaviy onlayn navbat olish.
- Elektron tibbiy karta, laboratoriya va boshqa klinik tizimlar integratsiyasi.
- Bir nechta filialning avtomatik bulutli sinxronizatsiyasi.

Arxitektura kelajakdagi integratsiyalarni qo‘shishga xalaqit bermasin, ammo MVPga keraksiz murakkablik kiritma.

---

## 4. Texnologik stack

### Backend

- Node.js LTS va TypeScript.
- NestJS.
- REST API.
- WebSocket Gateway (NestJS WebSocket Gateway yoki mos yechim).
- PostgreSQL.
- ORM sifatida Prisma yoki TypeORM: repositoryda mavjud yechim bo‘lsa, uni saqla; yangi loyiha bo‘lsa, bittasini tanlab izchil ishlat.
- DTO validatsiyasi uchun `class-validator`/`class-transformer` yoki tanlangan stackka mos yechim.
- Swagger/OpenAPI.
- Structured logging.
- Unit va integration testlar.

### Frontend

- React + TypeScript.
- Vite yoki repositoryda mavjud build tizimi.
- React Router.
- Server state uchun TanStack Query yoki o‘xshash yechim.
- Form validatsiyasi uchun React Hook Form + Zod yoki ekvivalent.
- Markazlashgan API client.
- WebSocket client va reconnect mexanizmi.
- Responsive CSS yoki mavjud komponent kutubxonasi.
- UI matnlari o‘zbek tilida.

### Deploy

- Linux server.
- Docker Compose.
- PostgreSQL volume.
- API va frontend uchun alohida servislar.
- Reverse proxy (masalan, Nginx/Caddy) zarur bo‘lsa.
- Health-check.
- Avtomatik backup skripti.
- VPN konfiguratsiyasi alohida, xavfsizlik qoidalari bilan.

Versiyalarni bir-biriga mos tanla va lockfile saqla.

---

## 5. Arxitektura

Modulli monolit yarat. MVP uchun microservice arxitekturasi talab qilinmaydi.

### Asosiy qatlamlar

1. **Presentation:** React UI.
2. **API:** NestJS controller va DTO.
3. **Application:** biznes qoidalari va use-case/service qatlamlari.
4. **Domain:** navbat, qabul, to‘lov va ruxsatlar qoidalari.
5. **Persistence:** PostgreSQL repository/ORM.
6. **Realtime:** WebSocket hodisalari.
7. **Infrastructure:** logging, backup, health, configuration.

### Asosiy modullar

- `auth`
- `users`
- `roles-permissions`
- `patients`
- `specialties`
- `doctors`
- `cabinets`
- `services`
- `appointments`
- `queue`
- `queue-events`
- `payments`
- `cash-shifts`
- `displays`
- `notifications-audio`
- `reports`
- `audit`
- `settings`
- `backup`
- `health`

Modullar orasidagi bog‘lanishlar aniq bo‘lsin. Controller ichida biznes logikasini jamlama. Barcha ma’lumotlar bazasi so‘rovlarini validatsiya va ruxsat tekshiruvi bilan bajar.

---

## 6. Foydalanuvchi rollari va ruxsatlari

### CASHIER

Ruxsatlar:

- Bemorlarni qidirish va ro‘yxatga olish.
- Bemorning ruxsat berilgan ma’lumotlarini tahrirlash.
- Qabul yozuvini yaratish.
- Shifokor, xizmat va kabinet tanlash.
- To‘lov qaydini yaratish.
- Talon chiqarish va qayta chop etish.
- O‘z kassa smenasini boshqarish.
- Navbatlar jurnalini ruxsat chegarasida ko‘rish.

Kassir foydalanuvchi rollari va global tizim sozlamalarini o‘zgartira olmasin.

### DOCTOR

Ruxsatlar:

- Faqat o‘ziga biriktirilgan navbatlarni ko‘rish.
- Keyingi bemorni chaqirish.
- Talonni qayta chaqirish.
- Oldingi bemorga qaytish — alohida qayd bilan.
- Kelmadi holatini belgilash.
- Qabulni boshlash va yakunlash.
- O‘z chaqiruvlari tarixini ko‘rish.

Boshqa shifokor navbatlariga kirish server tomonda taqiqlansin.

### MANAGER

Ruxsatlar:

- Barcha navbat va bo‘limlarni ko‘rish.
- Foydalanuvchilar, rollar, shifokorlar, kabinetlar va xizmatlarni boshqarish.
- To‘lovlar, smenalar va hisobotlarni ko‘rish.
- Ruxsat berilgan holda bekor qilish, qayta tayinlash va tuzatish.
- TV qurilmalarini sozlash.
- Audit va server holatini ko‘rish.

Moliyaviy qaytarish, ruxsat o‘zgarishi va xavfli amallar tasdiqlash hamda audit jurnalini talab qilsin.

### DISPLAY

- Faqat o‘ziga biriktirilgan display group uchun ruxsat etilgan navbat hodisalarini qabul qiladi.
- Bemorning to‘liq F.I.Sh., telefon, to‘lov va tibbiy ma’lumotlarini olmasin.
- Qurilma identifikatori yoki tokeni xavfsiz boshqarilsin.

**Muhim:** frontenddagi yashirin tugma xavfsizlik hisoblanmaydi. Har bir endpointda backend authorization bo‘lishi shart.

---

## 7. Ma’lumotlar bazasi modeli

PostgreSQL uchun normalizatsiyalangan schema, migratsiyalar, foreign key, indekslar va zarur unique constraintlar yarat.

### 7.1 `patients`

Maydonlar:

- `id` — UUID primary key.
- `patient_number` — klinika ichidagi noyob bemor raqami.
- `full_name`.
- `phone` — nullable bo‘lishi mumkin.
- `birth_date` — nullable bo‘lishi mumkin.
- `created_at`, `updated_at`.
- Zarur bo‘lsa, `archived_at`.

Telefon raqamini yagona bemor identifikatori deb qabul qilma. Takroriy karta aniqlashda foydalanuvchiga mavjud bemorni tekshirish taklif qilinsin.

### 7.2 `users`

- `id`.
- `full_name`.
- `username` yoki login identifikatori.
- `password_hash`.
- `role_id` yoki ko‘p rolli tizim bo‘lsa alohida user-role bog‘lanishi.
- `is_active`.
- `last_login_at`.
- `created_at`, `updated_at`.

### 7.3 `roles`, `permissions`, `role_permissions`

Rollar va ruxsatlarni aniq kodlar bilan saqla. Kerak bo‘lsa, menejerga ruxsatlarni nozik boshqarish imkonini ber.

### 7.4 `specialties`

- `id`, `name`, `is_active`.

### 7.5 `doctors`

- `id`, `user_id`, `specialty_id`, `display_name`, `is_active`.
- Shifokorning ish jadvali uchun alohida jadval yoki mos model.

### 7.6 `cabinets`

- `id`, `name`/`number`, `department`, `is_active`.

### 7.7 `services`

- `id`, `name`, `specialty_id` nullable bo‘lishi mumkin.
- `price`.
- `duration_minutes`.
- `payment_policy`.
- `minimum_payment_amount` nullable.
- `is_active`.
- `created_at`, `updated_at`.

`payment_policy` enum yoki validatsiyalangan qiymatlar bilan saqlansin. Masalan:

- `PAY_BEFORE_TICKET`
- `TICKET_BEFORE_PAYMENT`
- `PARTIAL_PAYMENT_ALLOWED`
- `FREE_OR_EXEMPT`

Siyosat nomlari va biznes ma’nosini hujjatlashtir. Bepul/imtiyozli xizmatni kim tasdiqlashi ruxsatlar bilan boshqarilsin.

### 7.8 `appointments`

- `id`.
- `patient_id`.
- `doctor_id`.
- `service_id`.
- `cabinet_id`.
- `scheduled_at` nullable bo‘lishi mumkin.
- `status`.
- `payment_status`.
- `created_by`.
- `created_at`, `updated_at`.

Bitta bemorda ko‘p appointment bo‘lishi mumkin. Har bir shifokor qabuli mustaqil yozuv bo‘lsin.

### 7.9 `queue_tickets`

- `id` UUID.
- `appointment_id` — kerakli biznes qoidasiga ko‘ra unique.
- `queue_date`.
- `queue_prefix`.
- `queue_number`.
- `status`.
- `priority` — faqat ustuvorlik siyosati ishlatilsa.
- `issued_at`.
- `called_at`, `started_at`, `completed_at` nullable.
- `created_by`.
- `created_at`, `updated_at`.

Talon raqami uchun `(queue_date, queue_prefix, queue_number)` kombinatsiyasiga unique constraint qo‘y. Talon IDsi raqamdan mustaqil bo‘lsin.

### 7.10 `queue_call_events`

- `id`.
- `ticket_id`.
- `doctor_id`.
- `event_type`.
- `event_at`.
- `performed_by`.
- `display_group_id` nullable.
- Zarur metadata.

Chaqirish, qayta chaqirish, oldingi talonga qaytish, kelmadi, qabul boshlanishi va yakunlanishi tarixda saqlansin.

### 7.11 `payments`

- `id`.
- `appointment_id` yoki tegishli billing modeliga bog‘lanish.
- `amount`.
- `currency` — klinika sozlamasiga mos, odatda UZS.
- `method`.
- `status`.
- `cashier_id`.
- `cash_shift_id`.
- `created_at`.

Bir qabulda bir nechta to‘lov bo‘lishi mumkin bo‘lsa, model shuni qo‘llab-quvvatlasin.

### 7.12 `payment_transactions`

- `id`.
- `payment_id`.
- `transaction_type`: payment, refund, adjustment va boshqalar.
- `amount`.
- `reference_id` nullable.
- `created_by`.
- `created_at`.

Moliyaviy tarixni oddiy delete bilan yo‘qotma. Qaytarish alohida transaction bo‘lsin.

### 7.13 `cash_shifts`

- `id`, `cashier_id`.
- `opened_at`, `closed_at`.
- `opening_balance`, `closing_balance`.
- Smena holati.

### 7.14 `display_groups`, `display_devices`

- Display group nomi va tegishli kabinet/bo‘limlar.
- Qurilma identifikatori, token hash, group ID, oxirgi aloqa vaqti, active status.

### 7.15 `audit_logs`

- `id`.
- `actor_id`.
- `action`.
- `entity_type`, `entity_id`.
- `created_at`.
- Zarur metadata va natija.

Auditga parol, token, to‘liq maxfiy tibbiy ma’lumot yoki boshqa ortiqcha maxfiy qiymatlarni yozma.

### 7.16 `clinic_settings`

Talon prefiksi, vaqt zonasi, ovoz tili, navbat raqamining kunlik reset siyosati va boshqa klinika sozlamalari.

### Database talablari

- Migratsiyalar majburiy.
- Foreign key va kerakli indekslar.
- Kerakli maydonlarga `NOT NULL`.
- Status va payment policy uchun enum/check constraint yoki validatsiyalangan schema.
- Barcha sanalar server vaqti bilan izchil saqlansin; interfeysda klinika vaqt zonasi ko‘rsatilsin.
- Talon raqami parallel so‘rovlarda takrorlanmasin.
- Qabul va talon yaratish bir transaction doirasida bajarilsin.
- Seed ma’lumotlari faqat development/test uchun bo‘lsin.

---

## 8. Navbat biznes qoidalari

### Talon yaratish

1. Kassir bemorni tanlaydi yoki yaratadi.
2. Bir yoki bir nechta shifokor/xizmatni tanlaydi.
3. Har bir qabul uchun mustaqil appointment yaratiladi.
4. Xizmatning `payment_policy` qiymati tekshiriladi.
5. To‘lov sharti bajarilgan bo‘lsa, tegishli talon navbatga qo‘shiladi.
6. Har bir talon noyob prefiks va raqam oladi.
7. Kassir talonlarni chop etadi.

Agar xizmat to‘lovdan oldin talon berishga ruxsat bersa, bu holat to‘lov holatidan alohida qayd etilsin. To‘lov holati va navbat holatini bitta statusga birlashtirma.

### Navbat statuslari

- `WAITING`
- `CALLED`
- `IN_PROGRESS`
- `COMPLETED`
- `SKIPPED`
- `CANCELLED`
- `ON_HOLD`

Status o‘tishlari backendda aniq validatsiya qilinsin.

### Keyingi bemorni chaqirish

1. Shifokor “Keyingi bemor”ni bosadi.
2. Backend userning doctor identity va ruxsatini tekshiradi.
3. Eng oldingi mos `WAITING` talonini transaction/locking yordamida tanlaydi.
4. Parallel so‘rovlar bir talonni ikki marta faol chaqirmasligi kafolatlansin.
5. Talon `CALLED` holatiga o‘tadi.
6. `queue_call_events` ga hodisa yoziladi.
7. Transaction muvaffaqiyatli yakunlangach, tegishli WebSocket hodisasi yuboriladi.
8. TV va shifokor interfeyslari yangilanadi.

### Qayta chaqirish va oldingi bemor

- `recall`: mavjud talonni yana e’lon qiladi, yangi talon yaratmaydi.
- `previous`: navbat tarixidagi avvalgi talonga qaytish. Amal audit/event tarixida qayd etilsin.
- `skip`: talonni `SKIPPED` holatiga o‘tkazish uchun sabab/amal yozilsin.
- `complete`: faqat ruxsat etilgan statusdan yakunlash mumkin.

Barcha amallar idempotency yoki takroriy yuborishga qarshi himoya bilan loyihalansin.

---

## 9. REST API spetsifikatsiyasi

API prefix: `/api/v1`.

Barcha endpointlarda:

- DTO validatsiyasi.
- Autentifikatsiya va rol tekshiruvi.
- Bir xil error response formati.
- Pagination/filtering kerak bo‘lgan ro‘yxatlarda.
- Audit talab qilinadigan amallar uchun event.
- OpenAPI/Swagger hujjatlari.

### Auth

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- Zarur bo‘lsa, `POST /auth/refresh`

Cookie yoki token strategiyasini xavfsizlik talablariga mos tanla va hujjatlashtir.

### Patients

- `GET /patients?search=&page=&limit=`
- `GET /patients/:id`
- `POST /patients`
- `PATCH /patients/:id`

Bemor ma’lumotlari uchun validatsiya va ruxsat tekshiruvi.

### Doctors / Specialties / Cabinets

- `GET /doctors`
- `POST /doctors`
- `PATCH /doctors/:id`
- `GET /specialties`
- `POST /specialties`
- `GET /cabinets`
- `POST /cabinets`
- `PATCH /cabinets/:id`

Menejer uchun yozish amallari; boshqa rollarga faqat tegishli o‘qish ruxsati.

### Services

- `GET /services`
- `POST /services`
- `PATCH /services/:id`
- `PATCH /services/:id/payment-policy`

To‘lov siyosati o‘zgarishi auditga yozilsin.

### Appointments

- `GET /appointments`
- `GET /appointments/:id`
- `POST /appointments`
- `PATCH /appointments/:id`
- `POST /appointments/:id/cancel`

### Queue

- `GET /queues`
- `GET /queues/my`
- `GET /queues/:id`
- `POST /appointments/:id/ticket`
- `POST /queues/:id/call-next`
- `POST /queues/:id/recall`
- `POST /queues/:id/previous`
- `POST /queues/:id/skip`
- `POST /queues/:id/start`
- `POST /queues/:id/complete`
- `POST /queues/:id/cancel`

`call-next` endpointi talon IDsi bilan emas, tegishli shifokor navbati doirasida navbatdagi talonni atomik tanlashi kerak. Endpoint nomlari va semantikasi izchil bo‘lsin.

### Payments / Cash shifts

- `GET /payments`
- `POST /payments`
- `GET /payments/:id`
- `POST /payments/:id/refunds`
- `GET /cash-shifts/current`
- `POST /cash-shifts/open`
- `POST /cash-shifts/:id/close`

MVPda to‘lovlar ichki hisobga olinadi. Fiskal chek chiqarildi deb yolg‘on ko‘rsatma.

### Displays

- `GET /display-groups`
- `POST /display-groups`
- `PATCH /display-groups/:id`
- `GET /display-devices`
- `POST /display-devices/register`
- `POST /display-devices/:id/revoke`
- Display uchun alohida, minimal ma’lumotli joriy navbat endpointi.

### Reports / Audit / Health

- `GET /reports/daily`
- `GET /reports/queue`
- `GET /reports/payments`
- `GET /audit-logs`
- `GET /health`
- `GET /ready` — zarur bo‘lsa readiness tekshiruvi.

Barcha endpointlar uchun request/response misollarini OpenAPI’da hujjatlashtir.

---

## 10. WebSocket real-time spetsifikatsiyasi

Autentifikatsiya qilingan WebSocket kanalini yarating. Display qurilmalari faqat o‘z display groupiga ruxsat etilgan hodisalarni olsin.

### Hodisalar

- `queue.ticket.created`
- `queue.ticket.called`
- `queue.ticket.recalled`
- `queue.ticket.skipped`
- `queue.ticket.started`
- `queue.ticket.completed`
- `queue.state.updated`
- `display.connection.status`

Har bir eventda kamida:

- `eventId`
- `eventType`
- `occurredAt`
- `ticketId` (kerakli auditoriya uchun)
- `displayGroupId` yoki tegishli routing ma’lumoti
- Display uchun xavfsiz payload

### Talablar

- Server eventni DB transaction muvaffaqiyatli bo‘lgandan keyin yuborsin.
- Reconnect bo‘lganda client joriy holatni API orqali qayta yuklasin.
- Takroriy eventlar UIda takroriy chaqiruvga olib kelmasin.
- Aloqa uzilishi aniq ko‘rsatilsin.
- Event payloadida keraksiz bemor shaxsiy ma’lumotlari bo‘lmasin.
- Bir klinikaning display eventlari boshqa guruhlarga yuborilmasin.

---

## 11. O‘zbekcha ovozli chaqiruv

TV tablosida o‘zbek tilidagi ovozli e’lon bo‘lsin.

Misol:
“Diqqat! K nol nol bir navbat raqami. Kardiolog, uchinchi kabinetga marhamat!”

Talablar:

- Harfli prefikslar va raqamlar to‘g‘ri o‘qilsin.
- Shifokor nomi va kabinet e’loni konfiguratsiyadan olinishi mumkin bo‘lsin.
- Audio/TTS ishlamay qolsa, ekrandagi vizual chaqiruv baribir ishlasin.
- Browser audio autoplay bloklashi mumkinligini hisobga ol; TV qurilmasida ovozni birinchi marta yoqish bo‘yicha setup ko‘rsatmasi ber.
- Internet uzilganda ovoz ishlashi uchun TTS mexanizmi lokal ishlasin yoki zarur audio fayllar lokal mavjud bo‘lsin.
- Ovozli chaqiruvlar navbat bilan ijro etilsin; bir vaqtdagi hodisalar ovozlarni ustma-ust qo‘ymasligi kerak.
- TVda maxfiy bemor ma’lumotlari ovozli aytilmasin.

---

## 12. Frontend ekranlari

### Kassir

- Bosh sahifa.
- Bemor qidirish/yangi bemor.
- Bemor kartasi.
- Shifokor va xizmat tanlash.
- To‘lov va chek.
- Talon tasdiqlash/chop etish.
- Navbatlar jurnali.
- Kassa smenasi.

### Shifokor

- Bosh panel.
- Kutayotgan navbatlar.
- Hozirgi bemor.
- Chaqiruv boshqaruvi.
- Chaqiruvlar tarixi.
- Offline/reconnect holatlari.

### Menejer

- Dashboard.
- Bemorlar.
- Barcha navbatlar.
- Shifokorlar.
- Mutaxassisliklar.
- Kabinetlar.
- Xizmatlar va to‘lov siyosati.
- Kassalar va smenalar.
- To‘lovlar va qaytarishlar.
- Hisobotlar.
- TV qurilmalari.
- Foydalanuvchilar/rollar.
- Audit jurnali.
- Sozlamalar.
- Server va backup holati.

### TV

- Full-screen current call.
- Oxirgi chaqiruvlar.
- Audio holati.
- Server offline/online holati.
- Display groupga mos ma’lumot.

Barcha UI matnlari o‘zbekcha bo‘lsin. UI kodida biznes mantiqni takrorlamang; API ma’lumotlari va server qoidalarini asosiy manba deb qabul qiling.

---

## 13. Design system

Quyidagi rang tokenlarini ishlat:

- Primary: `#0F766E`
- Primary hover: `#115E59`
- Navy: `#172B4D`
- Page background: `#F5F7FA`
- Surface: `#FFFFFF`
- Border: `#DCE3EA`
- Muted text: `#64748B`
- Success: `#15803D`
- Warning: `#B45309`
- Danger: `#B91C1C`
- Info: `#1D4ED8`

Umumiy talablar:

- Inter shrift yoki mos sans-serif.
- Kartalar 12 px radius.
- Input/tugmalar 8 px radius.
- Spacing 4/8/12/16/24/32 px.
- Desktopda sidebar; mobil shifokor panelida sodda navigatsiya.
- Touch target kamida 44 px.
- Keyboard focus ko‘rinadigan bo‘lsin.
- Status rang bilan birga matn orqali ham ifodalansin.
- Loading, empty, error, disabled, offline va success holatlari ishlab chiqilsin.

---

## 14. Offline arxitektura

Asosiy backend va PostgreSQL klinikaning lokal serverida ishlasin.

### Internet uzilganda davom etishi kerak

- Kassir bemorni ro‘yxatga olishi.
- Qabul va talon yaratish.
- Ichki to‘lovni qayd etish.
- Shifokor navbatni boshqarishi.
- TV tablo yangilanishi va lokal ovozli chaqiruv.
- Lokal audit va ma’lumotlar saqlanishi.

### Internet uzilganda ishlamasligi mumkin

- Klinikadan tashqaridagi masofaviy VPN ulanishi.
- Internet talab qiladigan tashqi xizmatlar.

### Muhim farq

Agar internet uzilsa-yu, lokal LAN ishlasa, tizim ishlashda davom etadi. Agar mahalliy server yoki lokal tarmoqning o‘zi ishlamay qolsa, online/offline UI holati aniq ko‘rsatilsin; server tasdig‘isiz navbat yoki to‘lov muvaffaqiyatli deb yozilmasin.

### Deploy talablari

- Docker Compose.
- PostgreSQL persistent volume.
- Health-check va restart policy.
- `.env.example`.
- Production secrets source controlga kirmasin.
- VPN orqali masofaviy boshqarish.
- PostgreSQL porti internetga bevosita ochilmasin.
- HTTPS va tegishli session/token xavfsizligi.
- Avtomatik backup va restore yo‘riqnomasi.

### Backup

- Rejalashtirilgan PostgreSQL backup.
- Alohida saqlash joyiga nusxa.
- Backup muvaffaqiyati va xatosi logga yozilsin.
- Restore sinovi hujjatlashtirilsin.
- Backup fayllari himoyalangan bo‘lsin.

---

## 15. Xavfsizlik talablari

- Parollarni zamonaviy password hashing algoritmi bilan saqla.
- Session/token strategiyasini hujjatlashtir.
- Authentication va authorizationni barcha himoyalangan endpointlarda tekshir.
- Login va muhim endpointlarda rate limit qo‘llashni ko‘rib chiq.
- DTO va server-side validation.
- SQL injection, XSS, CSRF va noto‘g‘ri CORS konfiguratsiyasidan himoya.
- Maxfiy qiymatlar logga tushmasin.
- Audit logda muhim amallar qayd etilsin.
- Bemor ma’lumotlari faqat zarur rolga ko‘rsatilsin.
- Display API minimal payload qaytarsin.
- Xavfli amal uchun tasdiqlash va audit.
- Bemor ma’lumotlarini hard delete qilishdan qoch; klinika siyosati va qonuniy talablarga mos arxivlash/saqlash muddatini qo‘lla.
- O‘zbekistonning shaxsga doir ma’lumotlar va tibbiy ma’lumotlarga oid talablarini ishlab chiqarishga chiqarishdan oldin alohida tekshirish kerak.

---

## 16. Test strategiyasi

### Unit testlar

Kamida:

- Talon raqami generatori.
- To‘lov siyosati.
- Navbat status transitionlari.
- Role/permission tekshiruvi.
- Qabul va talon validatsiyasi.
- Audio announcement matni generatori.

### Integration testlar

- Bemor yaratish va qidirish.
- Bir bemorga bir nechta qabul va talon yaratish.
- Xizmatga qarab to‘lov qoidalari.
- Payment va refund transactionlari.
- Shifokorning faqat o‘z navbatiga kirishi.
- Call-next parallel so‘rovlari.
- Audit event yozilishi.
- Display group izolyatsiyasi.

### E2E testlar

1. Kassir login qiladi.
2. Bemorni topadi yoki yaratadi.
3. Uchta shifokor/xizmat tanlaydi.
4. Har bir qabul uchun alohida talon oladi.
5. Kerakli to‘lov qaydlarini bajaradi.
6. Shifokor login qiladi va keyingi bemorni chaqiradi.
7. TV tablosi yangilanadi.
8. Qayta chaqirish yangi talon yaratmasligini tekshiradi.
9. Bemor kelmadi va qabul yakunlandi oqimlarini tekshiradi.
10. Internet uzilishi simulyatsiyasida lokal tizim ishlashini tekshiradi.
11. Server qayta ishga tushgach ma’lumotlar saqlanganini tekshiradi.
12. Ruxsatsiz endpointlarga kirish rad etilishini tekshiradi.

### Performance va concurrency

- 20+ shifokor va bir nechta kassir/TV qurilmasi bilan sinov.
- Bir vaqtning o‘zida chaqiruvlar.
- Takroriy tugma bosish va qayta yuborilgan HTTP so‘rovlari.
- WebSocket reconnect va event takrorlanishi.
- Kutilayotgan foydalanuvchilar soni bo‘yicha yuklama testini hujjatlashtir.

Aniq performance ko‘rsatkichlarini test muhiti va real qurilmalar asosida belgila; o‘lchanmagan natijani kafolat sifatida yozma.

---

## 17. Qabul qilish mezonlari

MVP qabul qilinishi uchun:

- 20+ shifokorni sozlash mumkin.
- Bir bemorga bir nechta mustaqil talon yaratiladi.
- Talon raqamlari takrorlanmaydi.
- Bir talon ikki marta parallel faol chaqirilmaydi.
- To‘lov siyosati xizmat bo‘yicha to‘g‘ri ishlaydi.
- Oddiy chek ichki to‘lov qaydini to‘g‘ri ko‘rsatadi.
- Shifokor faqat o‘z navbatini boshqaradi.
- TV faqat tegishli display group hodisalarini oladi.
- O‘zbekcha ovoz lokal rejimda ishlaydi yoki aniq xato ko‘rsatadi.
- Internet uzilganda lokal LAN ichidagi ish davom etadi.
- Server qayta ishga tushganda ma’lumotlar saqlanadi.
- Backup va restore yo‘riqnomasi sinovdan o‘tadi.
- Audit va ruxsatlar tekshiruvlari ishlaydi.
- Unit, integration va E2E testlar bajariladi.
- O‘rnatish, yangilash va nosozlikni bartaraf etish hujjatlari mavjud.

---

## 18. Tavsiya etiladigan repository tuzilishi

```text
clinic-queue/
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── auth/
│   │       ├── users/
│   │       ├── roles-permissions/
│   │       ├── patients/
│   │       ├── specialties/
│   │       ├── doctors/
│   │       ├── cabinets/
│   │       ├── services/
│   │       ├── appointments/
│   │       ├── queue/
│   │       ├── queue-events/
│   │       ├── payments/
│   │       ├── cash-shifts/
│   │       ├── displays/
│   │       ├── notifications-audio/
│   │       ├── reports/
│   │       ├── audit/
│   │       ├── settings/
│   │       ├── backup/
│   │       └── main.ts
│   └── web/
│       └── src/
│           ├── app/
│           ├── layouts/
│           ├── pages/
│           │   ├── cashier/
│           │   ├── doctor/
│           │   ├── manager/
│           │   └── display/
│           ├── components/
│           ├── features/
│           ├── services/
│           ├── hooks/
│           └── main.tsx
├── packages/
│   └── shared/
├── database/
│   ├── migrations/
│   └── seeds/
├── deploy/
│   ├── docker-compose.yml
│   ├── reverse-proxy/
│   └── backup/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
└── README.md
```

Repository mavjud bo‘lsa, shu tuzilishga moslashtir, lekin ishlayotgan loyihani sababsiz qayta tashkil qilma.

---

## 19. Ishlab chiqish bosqichlari

### 1-bosqich — Foundation

- Repository va dependencylarni tekshirish.
- Backend/frontend skeleti.
- Environment konfiguratsiyasi.
- PostgreSQL va migratsiyalar.
- Auth, users, roles.
- Lint, type-check va test infratuzilmasi.

**Qabul mezoni:** dastur ishga tushadi, login va rol tekshiruvi ishlaydi.

### 2-bosqich — Bemorlar va kataloglar

- Patients.
- Doctors/specialties/cabinets.
- Services.
- Menejerning asosiy CRUD ekranlari.
- Validatsiya va audit.

**Qabul mezoni:** bemor va katalog ma’lumotlari yaratiladi, qidiriladi va ruxsatlar tekshiriladi.

### 3-bosqich — Qabul, to‘lov va talon

- Appointments.
- Payment policy.
- Payments va cash shifts.
- Ticket generator.
- Print view.
- Queue statuslar.

**Qabul mezoni:** bir bemorga bir nechta qabul va alohida talonlar to‘g‘ri yaratiladi.

### 4-bosqich — Shifokor va real-time TV

- Doctor panel.
- Call-next/recall/previous/skip/start/complete.
- Concurrency himoyasi.
- WebSocket events.
- Display groups/devices.
- O‘zbekcha ovoz.

**Qabul mezoni:** shifokor chaqiruvi TVda yangilanadi va parallel chaqiruvlar xavfsiz boshqariladi.

### 5-bosqich — Menejer va hisobotlar

- Dashboard.
- Queue monitoring.
- Payment reports.
- Audit viewer.
- Device monitoring.
- Sozlamalar.

**Qabul mezoni:** menejer asosiy klinika jarayonlarini boshqara oladi.

### 6-bosqich — Hardening va deploy

- Offline sinovlari.
- Backup/restore.
- Security review.
- E2E va performance testlar.
- Docker Compose.
- O‘rnatish va texnik hujjatlar.

**Qabul mezoni:** pilot muhitga o‘rnatish va asosiy ish oqimlarini sinash mumkin.

---

## 20. AI dasturchining har bir bosqichdagi yakuniy hisoboti

Har bir bosqich oxirida quyidagilarni ber:

1. Bajarilgan funksiyalar.
2. Yaratilgan yoki o‘zgartirilgan fayllar.
3. Ishlatilgan API va schema o‘zgarishlari.
4. Bajargan testlar va natijalar.
5. Hali qolgan muammolar.
6. Ishga tushirish buyruqlari.
7. Keyingi bosqich vazifalari.

Agar testlar bajarilmagan bo‘lsa, ularni bajarilgandek ko‘rsatma. Agar tashqi qurilma (printer, TV audio, VPN) mavjud bo‘lmasa, bu cheklovni aniq yoz va sinash tartibini ko‘rsat.

---

## 21. Ishni boshlash bo‘yicha birinchi buyruq

Avval repositoryni tekshir va quyidagi natijalarni tayyorla:

1. Mavjud texnologiyalar va ishga tushirish tartibi.
2. Tavsiya etilgan yakuniy arxitektura.
3. Ma’lumotlar bazasi ER modeli.
4. Backend modullar ro‘yxati.
5. Frontend ekranlar xaritasi.
6. API va WebSocket hodisalari ro‘yxati.
7. Test strategiyasi.
8. Bosqichma-bosqich bajarish rejasi.

Shundan keyin **1-bosqichni amalda bajarishni boshlagin**. Faqat reja yozib to‘xtab qolma. Har bir bosqichda kodni yarat, test qil, xatolarni tuzat va natijani hisobot qil.

**Yakuniy maqsad:** lokal tarmoqda internetga qaram bo‘lmasdan ishlaydigan, internet orqali xavfsiz masofadan boshqariladigan, 20+ shifokor va bir nechta TV tablosini qo‘llaydigan, o‘zbekcha ovozli chaqiruvga ega, xavfsiz va testlangan klinika elektron navbat tizimini ishlab chiqish.
