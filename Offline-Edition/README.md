# 🏥 Klinika-admin — Oflayn (Standalone) Nashri

Ushbu papka — dasturni **100% oflayn (internetsiz)** ishlatishni xohlovchi mijozlar va klinikalar uchun maxsus mustaqil nashr (Standalone Edition) hisoblanadi. Asosiy bulutli/SaaS tizimga hech qanday ta’sir o‘tkazmaydi.

---

## ⚡ Asosiy Imkoniyatlar va Afzalliklar

1. **Zero-Config Database (PGlite)**:
   - Mijoz kompyuteriga alohida **PostgreSQL**, **Docker** yoki server o‘rnatish **talab etilmaydi**!
   - Barcha ma’lumotlar to‘g‘ridan-to‘g‘ri kompyuterning qattiq diskiga (`data/clinic_offline_pgdata` yoki `AppData` papkasiga) xavfsiz fayl ko‘rinishida saqlanadi.
   - Dastur yopilganda (`X` bosilganda) yoki kompyuter o‘chirilganda — bemorlar, to‘lovlar va kassa tarixi **aslo o‘chib ketmaydi**, 100% diskda qoladi.

2. **Avtomatik Fondagi Server (Auto-spawn)**:
   - Mijoz dasturni (Desktop `.exe` yoki `.dmg`) ochishi bilan fonda Node.js server va baza avtomatik o‘zi yonadi.
   - Dastur yopilganda xotirani bo‘shatish uchun o‘zi to‘xtaydi.

3. **System Tray (Minimize-to-Tray) Himoyasi**:
   - Retseptsiya yoki xodim adashib `X` tugmasini bossa ham dastur yopilmaydi — soat yonidagi Tray menyusiga yashirinadi.
   - Butun klinikadagi shifokorlar va TV ekrani uzilishsiz ishlashda davom etadi.

4. **Lokal Wi-Fi Tarmoq orqali ulash**:
   - Klinikaning asosiy kompyuterida dastur yoqilgach, boshqa xonalardagi shifokorlar, kassir va zaldagi TV ekran shu kompyuterning lokal IP-manzili orqali ulanadi:
     - **Boshqaruv & Qabul:** `http://192.168.1.100:5001`
     - **TV Navbat Ekrani:** `http://192.168.1.100:5001/tv`
     - **Mobil ilova:** IP kiritish maydoniga `192.168.1.100:5001` kiritiladi.

---

## 🔑 Standart Tizimga Kirish Ma’lumotlari

Birinchi marta ishga tushganda baza avtomatik yaratiladi va quyidagi foydalanuvchilar faollashadi:

| Rol | Login | Parol |
| :--- | :--- | :--- |
| 👑 **Menejer (Boshqaruv)** | `admin` | `admin123` |
| 💳 **Kassir (Qabulxona)** | `kassir1` | `admin123` |
| 💳 **Kassir 2** | `kassir2` | `admin123` |
| 🩺 **Shifokor (Kardiolog)** | `doc_kardio1` | `admin123` |
| 🩺 **Shifokor (Terapevt)** | `doc_terapevt1` | `admin123` |
| 🩺 **Shifokor (Nevropatolog)** | `doc_nevro1` | `admin123` |

*(Parol va xodimlarni Menejer panelidagi "Xodimlar" bo‘limidan istalgan vaqtda o‘zgartirish mumkin).*

---

## 🚀 Ishga Tushirish (Test qilish)

### macOS / Linux:
```bash
./start-offline-mac.sh
```

### Windows:
```cmd
start-offline-win.bat
```

---

## 📦 Mijozga Sotish Uchun O‘rnatuvchi Fayl (.exe / .dmg) Yasash

Mijozga berish uchun tayyor o‘rnatuvchi paketlarni yig‘ish:

```bash
cd Desktop-App

# Windows uchun (.exe o‘rnatuvchi):
npm run build:win

# macOS uchun (.dmg o‘rnatuvchi):
npm run build:mac
```

Yig‘ilgan tayyor fayllar `Offline-Edition/Desktop-App/release/` jildida hosil bo‘ladi va uni mijozga fleshkada yoki telegram orqali topshirishingiz mumkin.
