# Klinika elektron navbat tizimi — UI/UX dizayn prompti

**Loyiha:** Clinic Queue Management System  
**Versiya:** 1.0 (MVP)  
**Til:** O‘zbek tili (lotin yozuvi)  
**Dizayn yo‘nalishi:** Zamonaviy, professional, minimal, klinikaga mos  
**Asosiy rang:** Teal `#0F766E`  
**Matn rangi:** Navy `#172B4D`

---

## 1. Vazifa

Siz tajribali Senior UI/UX Designer va Frontend Design Architect sifatida xususiy klinika uchun to‘liq elektron navbat boshqaruv tizimining dizaynini ishlab chiqing.

Tizim quyidagi to‘rtta interfeysdan iborat bo‘lsin:

1. **Kassir kompyuteri** — bemorlarni ro‘yxatga olish, xizmat tanlash, to‘lov qaydi va talon chiqarish.
2. **Shifokor telefoni/plansheti** — o‘z navbatini ko‘rish va bemorlarni chaqirish.
3. **Menejer paneli** — klinikaning barcha jarayonlarini boshqarish.
4. **TV tablo** — talon raqami, shifokor va kabinetni katta formatda ko‘rsatish, o‘zbekcha ovozli chaqiruv.

Klinikada 20 dan ortiq shifokor va bir nechta kabinet/TV tablo bo‘lishi mumkin. Dizayn ko‘p foydalanuvchili, tez ishlaydigan, tushunarli va keyinchalik kengaytirishga mos bo‘lsin.

**Muhim:** bu topshiriq faqat chiroyli dashboard chizish bilan cheklanmaydi. Barcha asosiy ekranlar, foydalanuvchi oqimlari, interaktiv holatlar, xatolar, bo‘sh holatlar va responsiv ko‘rinishlar ishlab chiqilsin.

---

## 2. Umumiy vizual konsepsiya

Professional, jiddiy, minimal va tibbiyot muassasasiga mos dizayn yarating.

- Ortiqcha ranglar, bezaklar, gradientlar va kuchli soyalarni ishlatmang.
- Oq kartalar, och kulrang sahifa foni, to‘q ko‘k matn va teal asosiy rangdan foydalaning.
- Muhim amallar vizual jihatdan darhol ajralib tursin.
- Interfeys o‘zbek tilida, lotin yozuvida bo‘lsin.
- Barcha ekranlarda yagona design system va komponentlar qo‘llansin.
- Rangning o‘zi holatni ifodalash uchun yetarli bo‘lmasin: matn va kerakli ikonka ham bo‘lsin.
- Har bir rol uchun faqat o‘z vazifasiga mos navigatsiya ko‘rsatilsin.

### Ranglar palitrasi

| Token | HEX | Qo‘llanilishi |
|---|---|---|
| `primary` | `#0F766E` | Asosiy tugmalar va faol elementlar |
| `primary-hover` | `#115E59` | Hover/bosilgan holat |
| `navy` | `#172B4D` | Sarlavha va asosiy matn |
| `page-bg` | `#F5F7FA` | Sahifa foni |
| `surface` | `#FFFFFF` | Kartalar va formalar |
| `border` | `#DCE3EA` | Chegaralar |
| `text-muted` | `#64748B` | Yordamchi matn |
| `success` | `#15803D` | Muvaffaqiyatli holat |
| `warning` | `#B45309` | Ogohlantirish |
| `danger` | `#B91C1C` | Xato va bekor qilish |
| `info` | `#1D4ED8` | Axborot holati |

### Tipografiya va spacing

- Shrift: Inter yoki mos sans-serif.
- Sahifa sarlavhasi: taxminan 24 px.
- Bo‘lim sarlavhasi: 18–20 px.
- Asosiy matn: 14–16 px.
- Yordamchi matn: 12–13 px; muhim ma’lumotlarni juda kichik yozmang.
- Spacing shkalasi: 4, 8, 12, 16, 24, 32 px.
- Kartalar radiusi: 12 px.
- Input va tugmalar radiusi: 8 px.
- Oddiy tugmalar balandligi: 40–48 px; mobil asosiy tugmalar kamida 48 px.
- Fokus holati klaviatura orqali ko‘rinadigan bo‘lsin.

---

## 3. Rollar va navigatsiya

### 3.1 Kassir (CASHIER)

Kassir quyidagi sahifalarni ko‘rsin:

- Bosh sahifa
- Bemorni qidirish / yangi bemor
- Qabul va xizmat tanlash
- To‘lovlar va oddiy chek
- Talon chiqarish
- Navbatlar jurnali
- Kassa smenasi
- Profil va tizimdan chiqish

Kassirga menejer sozlamalari va boshqa shifokorlarning ichki boshqaruv funksiyalari ko‘rsatilmasin.

### 3.2 Shifokor (DOCTOR)

- Mening navbatim
- Kutayotgan bemorlar
- Hozirgi bemor
- Chaqiruvlar tarixi
- Profil va chiqish

Shifokor faqat o‘ziga biriktirilgan navbatlarni ko‘rsin.

### 3.3 Menejer (MANAGER)

- Dashboard
- Bemorlar
- Barcha navbatlar
- Shifokorlar
- Mutaxassisliklar
- Kabinetlar
- Xizmatlar va narxlar
- Kassalar va smenalar
- To‘lovlar va qaytarishlar
- Hisobotlar
- TV tablolari va qurilmalar
- Foydalanuvchilar va rollar
- Audit jurnali
- Tizim sozlamalari
- Server/ulanish holati
- Zaxiralash holati

### 3.4 TV tablo (DISPLAY)

TV interfeysi alohida, to‘liq ekran rejimida ishlasin. Unda boshqaruv paneli yoki shaxsiy ma’lumotlar chiqmasin.

---

## 4. Kassir kompyuteri — ekranlar

### K-01. Bosh sahifa

Ko‘rsating:

- Klinika nomi, sana/vaqt, kassir ismi va smena holati.
- Bugungi bemorlar soni.
- Kutayotgan navbatlar.
- Qabulda bo‘lganlar.
- Yakunlangan qabullar.
- Bugungi ichki to‘lovlar summasi.
- Asosiy CTA: **“Yangi qabul”**.
- So‘nggi ro‘yxatga olingan bemorlar jadvali.

### K-02. Bemorni qidirish va ro‘yxatga olish

Maydonlar:

- Bemor ID (tizim tomonidan yaratiladi).
- F.I.Sh.
- Telefon raqami.
- Tug‘ilgan sana.
- Zarur bo‘lsa, klinika belgilagan qo‘shimcha identifikatsiya maydonlari.

Talablar:

- Bemorni ID, F.I.Sh. yoki telefon bo‘yicha qidirish.
- Mavjud bemor topilsa, kartasini tanlash.
- Takroriy karta ehtimoli bo‘lsa, ogohlantirish.
- Saqlash, saqlash va davom etish, bekor qilish amallari.
- Validatsiya xabarlari maydon yonida ko‘rsatilsin.

### K-03. Shifokor va xizmat tanlash

- Mutaxassisliklar bo‘yicha filtrlash.
- Shifokor va kabinet tanlash.
- Xizmat nomi, narxi va taxminiy davomiyligi.
- Qabul vaqti yoki jonli navbat rejimi.
- Bitta bemorga bir nechta shifokor/xizmat qo‘shish.
- Har bir qabul uchun alohida talon yaratilishini ko‘rsatish.
- Tanlangan qabullarni tahrirlash va olib tashlash.

### K-04. To‘lov

- Xizmatlar ro‘yxati, narx va jami summa.
- To‘lov usuli: naqd, karta yoki klinika qo‘llaydigan ichki usul.
- To‘langan summa va qolgan qarzdorlik.
- To‘lov holati.
- Oddiy chekni chop etish va qayta chop etish.
- To‘lov qaydi fiskal chek emasligi UI matnlarida chalkashtirilmasin.

Har bir xizmat uchun menejer sozlaydigan to‘lov siyosati bo‘lsin:

- To‘lovdan keyin talon berish.
- To‘lovdan oldin talon berishga ruxsat.
- Qisman to‘lovga ruxsat.
- Bepul/imtiyozli xizmat.

### K-05. Talon tasdiqlash va chop etish

Har bir qabul uchun alohida talon ko‘rsating:

- Talon raqami, masalan `K-001`, `N-001`, `U-001`.
- Bemor ismi (faqat kassir interfeysida).
- Shifokor va kabinet.
- Xizmat.
- To‘lov holati.
- Talon chiqarish va qayta chop etish.

Talon dizayni printerga mos, sodda va o‘qilishi oson bo‘lsin. Chop etish xatosida qayta urinish va ekranda talon ma’lumotini ko‘rish imkoniyati bo‘lsin.

### K-06. Navbatlar jurnali

Jadval ustunlari:

- Talon raqami.
- Bemor.
- Shifokor.
- Kabinet.
- Xizmat.
- Berilgan vaqt.
- To‘lov holati.
- Navbat holati.
- Amallar.

Filtrlar: sana, shifokor, kabinet, xizmat, to‘lov holati va navbat holati.

---

## 5. Shifokor telefoni/plansheti — ekranlar

Mobil-first dizayn ishlating. Asosiy amallar katta, oson bosiladigan va bir qo‘l bilan foydalanishga qulay bo‘lsin.

### D-01. Shifokor bosh paneli

- Shifokor ismi, mutaxassisligi va kabineti.
- Kutayotgan bemorlar soni.
- Hozirgi bemor/talon.
- Keyingi navbatdagi talon.
- Katta asosiy tugma: **“Keyingi bemor”**.
- Aloqa holati: online/offline.

### D-02. Navbat ro‘yxati

Har bir qator yoki karta:

- Talon raqami.
- Navbatga kelgan vaqt.
- Navbat holati.
- Xizmat, kerak bo‘lsa.
- Talonni chaqirish yoki tafsilotlarini ochish amali.

Faqat shifokorga ruxsat berilgan ma’lumotlar ko‘rsatilsin. Boshqa shifokorlarning navbati ochilmasin.

### D-03. Chaqiruv boshqaruvi

Tugmalar:

- Keyingi bemor.
- Qayta chaqirish.
- Oldingi bemorga qaytish.
- Kelmadi.
- Qabulni boshlash.
- Qabulni yakunlash.
- Zarur bo‘lsa, navbatni vaqtincha to‘xtatish.

“Oldingi bemor” va “Qayta chaqirish” alohida amallar bo‘lsin. Qayta chaqirish yangi talon yaratmasin. Har bir amalning natijasi va xatosi tushunarli ko‘rsatilsin.

### Shifokor interfeysi holatlari

- Navbat bo‘sh: “Hozircha kutayotgan bemor yo‘q”.
- Chaqiruv jarayonda: tugma vaqtincha bloklanadi.
- Bemor chaqirildi: talon va holat ajratib ko‘rsatiladi.
- Serverga aloqa uzildi: aniq ogohlantirish, eskirgan ma’lumot belgisi.
- Server tasdiqlamagan chaqiruv muvaffaqiyatli deb ko‘rsatilmasin.

---

## 6. Menejer paneli — ekranlar

### M-01. Dashboard

Statistik kartalar:

- Bugungi bemorlar.
- Kutayotgan navbatlar.
- Hozir qabulda.
- Yakunlangan qabullar.
- Bekor qilingan/kelmagan navbatlar.
- Ichki to‘lovlar summasi.

Qo‘shimcha bloklar:

- Shifokorlar bo‘yicha navbat yuklamasi.
- Kabinetlar holati.
- So‘nggi amallar.
- Offline qurilmalar haqida ogohlantirish.

Barcha raqamlar backenddan keladigan ma’lumotlar asosida ko‘rsatilsin. Namuna raqamlar ishlab chiqarish muhitida qolmasin.

### M-02. Shifokorlar va kabinetlar

- Shifokor qo‘shish/tahrirlash.
- Mutaxassislik va kabinet biriktirish.
- Ish jadvali.
- Faol/inaktiv holat.
- Shifokor navbati va yuklamasi.

### M-03. Umumiy navbat nazorati

- Barcha navbatlar jadvali.
- Sana, shifokor, kabinet, xizmat va holat bo‘yicha filtrlar.
- Talon tafsilotlari.
- Vakolatli foydalanuvchi uchun bekor qilish yoki qayta tayinlash.
- Har bir o‘zgarish audit jurnaliga yozilishi kerak.

### M-04. Xizmatlar va narxlar

- Xizmat nomi.
- Mutaxassislik yoki bo‘lim.
- Narx.
- Taxminiy davomiylik.
- Faol/inaktiv holat.
- To‘lov siyosati.
- Qisman to‘lov va bepul xizmat qoidalari.

### M-05. To‘lovlar va kassa

- To‘lovlar ro‘yxati.
- To‘lov usuli va holati.
- Kassir va smena.
- Oddiy chek.
- Qaytarish amali — faqat ruxsat va tasdiqlash bilan.
- Moliyaviy tarix o‘chirib yuborilmasin.

### M-06. Hisobotlar

- Kunlik/haftalik/oylik bemorlar.
- Shifokorlar bo‘yicha qabul soni.
- Kutish va qabul davomiyligi.
- Ichki to‘lovlar, qarzdorlik va qaytarishlar.
- CSV/Excel eksporti, agar MVPda qo‘llansa.

### M-07. TV va qurilmalar

- TV qurilmalari ro‘yxati.
- Qurilma nomi va biriktirilgan bo‘lim.
- Ko‘rsatiladigan kabinetlar.
- Online/offline holati.
- Oxirgi aloqa vaqti.
- Ovoz sozlamasi.
- Sinov chaqiruvi.
- Tablo guruhini yaratish va tahrirlash.

### M-08. Foydalanuvchilar va xavfsizlik

- Foydalanuvchi yaratish va bloklash.
- Kassir, shifokor va menejer rollari.
- Ruxsatlar.
- Audit jurnali.
- Server va zaxiralash holati.

---

## 7. TV tablosi dizayni

TV interfeysi 16:9 nisbatda, to‘liq ekran rejimida va uzoq masofadan o‘qilishi uchun yaratiladi.

### Maket

1. Yuqori qism: klinika nomi, bo‘lim va vaqt.
2. Markaz: hozir chaqirilayotgan talon raqami.
3. Talon ostida: shifokor/mutaxassislik.
4. Kabinet raqami juda aniq ko‘rsatiladi.
5. Pastki qism: oxirgi 4–8 ta chaqiruv.
6. Ovozli e’lon bilan sinxron yangilanish.

### Vizual talablar

- To‘q navy fon va yuqori kontrastli oq/teal matn.
- Talon raqami boshqa barcha matnlardan ancha katta.
- Animatsiya qisqa va sokin bo‘lsin; miltillash ishlatilmasin.
- TVda telefon raqami, to‘lov summasi, tashxis yoki keraksiz shaxsiy ma’lumotlar ko‘rsatilmasin.
- Chaqiruv ovozi o‘zbek tilida bo‘lsin.
- Ovoz bloklangan yoki ijro etilmagan holat uchun texnik ogohlantirish bo‘lsin.
- Server bilan aloqa uzilganda: “Aloqa uzildi — ma’lumot yangilanmayapti” xabari ko‘rsatilsin.
- TVdagi oxirgi chaqiruvlar yangi server holati kelganda yangilansin.

### Ovozli e’lon namunasi

“Diqqat! K nol nol bir navbat raqami. Kardiolog, uchinchi kabinetga marhamat!”

Talon prefiksi va raqamlari noto‘g‘ri o‘qilmasligi uchun alohida tekshiriladigan audio/TTS qoidalari bo‘lsin. Ovoz internetga bog‘liq bo‘lmasligi uchun tanlangan TTS mexanizmi yoki zarur audio fayllar lokal mavjud bo‘lsin.

---

## 8. Responsiv dizayn

| Qurilma | Talab |
|---|---|
| Desktop ≥ 1440 px | To‘liq sidebar, jadvallar, ko‘p ustunli formalar |
| Noutbuk 1024–1439 px | Ixcham sidebar, moslashuvchi jadvallar |
| Planshet 768–1023 px | Katta touch tugmalar, bir ustunli formalar |
| Telefon 360–767 px | Mobil-first shifokor paneli, kartali ro‘yxatlar |
| TV 1920×1080 / 4K | Full-screen, katta shrift va yuqori kontrast |

- Keng jadvallar kichik ekranda ichki scroll yoki kartali ko‘rinishga o‘tsin.
- Mobil tugmalar kamida 44–48 px balandlikda bo‘lsin.
- Asosiy funksiyalar 200% zoomda ham foydalanish mumkin bo‘lsin.
- TVda browser zoom va operatsion tizim masshtabi tekshirilsin.
- Kassir va menejer interfeyslari desktopga, shifokor interfeysi mobil qurilmalarga ustuvor moslashtirilsin.

---

## 9. Design system komponentlari

Quyidagi qayta ishlatiladigan komponentlarni yarating:

- Button: primary, secondary, outline, danger, disabled, loading.
- Input: default, focus, error, disabled.
- Search/select/autocomplete.
- Date/time picker.
- Table, pagination, sorting, filters.
- Status badge.
- Patient card.
- Queue ticket card.
- Doctor/cabinet card.
- Payment summary.
- Modal/dialog.
- Toast/alert.
- Empty state.
- Skeleton/loading.
- Offline indicator.
- Confirmation dialog.
- Navigation sidebar/topbar.
- TV call panel.
- Audio status indicator.

Har bir komponent uchun default, hover, focus, active, disabled, loading, error va kerakli responsive holatlarni ko‘rsating.

---

## 10. Navbat holatlari va UI ranglari

Navbat holatlari:

- `WAITING` — Kutmoqda.
- `CALLED` — Chaqirildi.
- `IN_PROGRESS` — Qabulda.
- `COMPLETED` — Yakunlandi.
- `SKIPPED` — Kelmadi/o‘tkazib yuborildi.
- `CANCELLED` — Bekor qilindi.
- `ON_HOLD` — Vaqtincha to‘xtatilgan.

Ranglar ma’noli ishlatilsin, lekin status matni ham ko‘rsatilsin. UI backend statusini o‘zboshimchalik bilan o‘zgartirmasin.

### Xato va bo‘sh holatlar

- Bemor topilmadi.
- Takroriy bemor ehtimoli.
- To‘lov saqlanmadi.
- Talon printerga yuborilmadi.
- Talon allaqachon chaqirilgan.
- Server aloqasi uzildi.
- Ovoz ijro etilmadi.
- Navbat bo‘sh.
- Qidiruv natijasi yo‘q.
- Ruxsat yetarli emas.

Har bir xabarda nima sodir bo‘lgani va keyingi qadam imkon qadar tushunarli yozilsin.

---

## 11. UX, xavfsizlik va offline holat

- Foydalanuvchi faqat o‘z roliga ruxsat etilgan sahifalarni ko‘rsin.
- Shifokor faqat o‘z navbatlarini ko‘rsin.
- Xavfli amallar tasdiqlashni talab qilsin.
- Tugma bosilganda takroriy so‘rov yuborilishi cheklansin.
- Server tasdiqlamagan amal muvaffaqiyatli deb ko‘rsatilmasin.
- Aloqa uzilganda offline indikator va oxirgi yangilanish vaqti ko‘rsatilsin.
- Lokal serverga ulanib turgan qurilmalar internet uzilganda ishlashni davom ettirishi kerak.
- Masofaviy boshqaruv himoyalangan VPN orqali amalga oshiriladi.
- TVda bemorning shaxsiy yoki tibbiy ma’lumotlari oshkor qilinmasin.
- Audit talab qilinadigan amallar uchun foydalanuvchi va vaqt qayd etilsin.
- Klaviatura navigatsiyasi va fokus indikatorlari qo‘llab-quvvatlansin.
- Rang kontrasti va matn o‘lchamlari o‘qilishi qulay bo‘lsin.

---

## 12. Figma yoki dizayn fayli uchun topshiriladigan natijalar

Quyidagi sahifalarni tartibli tayyorlang:

1. `00 — Design System`
2. `01 — Cashier Desktop`
3. `02 — Doctor Mobile & Tablet`
4. `03 — Manager Dashboard`
5. `04 — TV Queue Display`
6. `05 — Components & States`
7. `06 — Responsive Layouts`
8. `07 — User Flows`
9. `08 — Error, Empty & Offline States`

Har bir ekran uchun:

- Nom va maqsad.
- Foydalanuvchi roli.
- Asosiy amal.
- Komponentlar.
- Loading, empty, error va offline holatlari.
- Responsive variant.
- Navigatsiya yo‘li.

Figma ishlatilsa, Auto Layout, qayta ishlatiladigan komponentlar, variantlar va rang/shrift tokenlaridan foydalaning. Agar kod bilan ishlaydigan dizayn muhiti bo‘lsa, komponentlarni qayta ishlatiladigan qilib yarating.

---

## 13. Yakuniy sifat talablari

Dizaynni yakunlashdan oldin tekshiring:

- Bemor → xizmat/shifokor → to‘lov qoidasi → alohida talon oqimi tushunarli.
- Bitta bemor bir nechta shifokorga yozilganda har biri uchun mustaqil talon ko‘rsatiladi.
- Shifokorning keyingi bemorni chaqirish amali eng ko‘zga ko‘rinadigan element.
- TV tablosi uzoq masofadan o‘qiladi.
- 20+ shifokor va bir nechta TVni boshqarish qulay.
- Barcha asosiy ekranlar bir xil design systemdan foydalanadi.
- Offline, server xatosi, printer xatosi va ovoz xatosi holatlari mavjud.
- Shaxsiy ma’lumotlar TVda ko‘rsatilmaydi.
- Interfeys barcha asosiy o‘lchamlarda tekshiriladi.
- Dizayn faqat statik maket emas, foydalanuvchi oqimlarini ham qamrab oladi.

**Yakuniy maqsad:** kassir uchun tezkor, shifokor uchun sodda, menejer uchun to‘liq nazoratli va bemorlar uchun aniq, o‘zbekcha ovozli chaqiruvga ega bo‘lgan professional klinika elektron navbat tizimining UI/UX dizaynini ishlab chiqish.
