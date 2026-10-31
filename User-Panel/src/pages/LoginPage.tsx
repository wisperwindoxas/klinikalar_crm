import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  ArrowRight,
  ShieldCheck,
  Ticket,
  AlertCircle,
  Eye,
  EyeOff,
  Phone,
  Activity,
  Sparkles,
  Building2,
  LockKeyhole,
  X
} from 'lucide-react';
import { UserApiClient } from '../api/client';
import { APP_LOGO } from '../utils/brand';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  // Input states - faqat telefon raqam (9 ta raqam) va parol
  const [phoneDigits, setPhoneDigits] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [capsLockActive, setCapsLockActive] = useState(false);

  // Eslab qolingan telefon raqamni yuklash
  useEffect(() => {
    const saved = localStorage.getItem('sadaf_remember_phone');
    if (saved) {
      const digits = saved.replace(/\D/g, '').slice(-9);
      setPhoneDigits(digits);
      setRememberMe(true);
      return;
    }
    // Eski saqlangan identifier bo'lsa undan faqat raqamlarini olish
    const oldSaved = localStorage.getItem('sadaf_remember_identifier');
    if (oldSaved) {
      const raw = oldSaved.replace(/\D/g, '');
      const digits = raw.startsWith('998') ? raw.slice(3) : raw;
      if (digits.length === 9) {
        setPhoneDigits(digits);
        setRememberMe(true);
      }
    }
  }, []);

  // O'zbekiston telefon raqamini formatlash: (90) 123-45-67
  const formatPhoneDigits = (raw: string): string => {
    const d = raw.replace(/\D/g, '').slice(0, 9);
    if (d.length === 0) return '';
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 5) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2, 5)}-${d.slice(5)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 5)}-${d.slice(5, 7)}-${d.slice(7, 9)}`;
  };

  // Telefon raqami kiritish va paste qilish hodisasi
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const val = e.target.value;
    let raw = val.replace(/\D/g, '');

    // Agar foydalanuvchi +998 yoki 998 bilan boshlangan to'liq raqamni paste qilsa
    if (val.trim().startsWith('+998') || (raw.length > 9 && raw.startsWith('998'))) {
      raw = raw.slice(3);
    }

    const digits = raw.slice(0, 9);
    setPhoneDigits(digits);
  };

  // Backspace va klaviatura hodisasi (hech qachon qotib qolmaydi, o'chirish bemalol ishlaydi)
  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockActive(true);
    } else {
      setCapsLockActive(false);
    }

    if (e.key === 'Backspace') {
      const input = e.currentTarget;
      const { selectionStart, selectionEnd } = input;

      // Agar biror qism belgilangan bo'lsa standart o'chirishga ruxsat
      if (selectionStart !== null && selectionEnd !== null && selectionStart !== selectionEnd) {
        return;
      }

      // Agar kursor formatlash belgisi (masalan ')', ' ', '-') oldida bo'lsa
      if (selectionStart !== null && selectionStart > 0) {
        const charBefore = input.value[selectionStart - 1];
        if (/\D/.test(charBefore)) {
          e.preventDefault();
          let digitsBefore = 0;
          for (let i = 0; i < selectionStart; i++) {
            if (/\d/.test(input.value[i])) {
              digitsBefore++;
            }
          }
          if (digitsBefore > 0) {
            const newDigits = phoneDigits.slice(0, digitsBefore - 1) + phoneDigits.slice(digitsBefore);
            setPhoneDigits(newDigits);
          }
        }
      }
    }
  };

  // Umumiy klaviatura hodisasi (Caps Lock kuzatish)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockActive(true);
    } else {
      setCapsLockActive(false);
    }
  };

  // Tizimga kirish
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneDigits || phoneDigits.length < 9) {
      setError('Telefon raqamingizni to‘liq 9 ta raqamini kiriting (masalan: (90) 123-45-67)');
      return;
    }

    if (!password.trim()) {
      setError('Maxfiy parolni kiriting');
      return;
    }

    setLoading(true);
    setError('');

    // Backend barcha formatlarni qabul qiladi, to'liq xalqaro format jo'natamiz
    const fullPhone = `+998${phoneDigits}`;

    try {
      const res = await UserApiClient.login(fullPhone, password);
      if (res.data?.user) {
        const user = res.data.user;
        localStorage.setItem('sadaf_user', JSON.stringify(user));

        if (rememberMe) {
          localStorage.setItem('sadaf_remember_phone', phoneDigits);
        } else {
          localStorage.removeItem('sadaf_remember_phone');
          localStorage.removeItem('sadaf_remember_identifier');
        }

        // Distinct routing based on database role
        const role = (user.role || '').toUpperCase();
        if (role === 'CASHIER') {
          navigate('/cashier');
        } else if (role === 'DOCTOR') {
          navigate('/doctor');
        } else {
          navigate('/manager');
        }
      } else {
        throw new Error('Foydalanuvchi ma’lumotlari topilmadi');
      }
    } catch (err: any) {
      setError(err.message || 'Telefon raqam yoki parol noto‘g‘ri. Iltimos, qayta urinib ko‘ring.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0FDFA] via-[#F8FAFC] to-[#EFF6FF] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden select-none">
      {/* Background Decorative Medical Elements */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-teal-200/25 rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/3 -translate-y-1/4 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-200/25 rounded-full blur-3xl -z-10 pointer-events-none -translate-x-1/4 translate-y-1/4" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-100/15 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* Main Container Card (Dual Column Responsive) */}
      <div className="w-full max-w-5xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-teal-950/10 border border-teal-100/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px] transition-all">
        {/* ================= LEFT COLUMN: Visual & Clinic Branding ================= */}
        <div className="lg:col-span-5 bg-medical-gradient p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle medical cross pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
              <defs>
                <pattern id="medical-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 20 10 L 20 30 M 10 20 L 30 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#medical-grid)" />
            </svg>
          </div>

          {/* Top Brand Header */}
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-transparent flex items-center justify-center shrink-0 filter drop-shadow-lg">
                <img src={APP_LOGO} alt="klinika-admin Logo" className="w-full h-full object-contain bg-transparent" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-1.5">
                  klinika-admin
                  <span className="text-[10px] bg-emerald-400 text-teal-950 font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                    PRO
                  </span>
                </h1>
                <p className="text-xs text-teal-100/90 font-medium">Elektron Navbat & Boshqaruv Tizimi</p>
              </div>
            </div>

            {/* Clinic Welcome Message */}
            <div className="space-y-2 pt-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-teal-100">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>2026 Yangi Avlod Tibbiyot Portali</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight text-white">
                Tezkor, tartibli va ishonchli klinika xizmati
              </h2>
              <p className="text-xs sm:text-sm text-teal-100/80 leading-relaxed">
                Shifokor xonalari, kassa hisob-kitobi va katta TV Tablo real vaqt rejimida yagona markazdan boshqariladi.
              </p>
            </div>
          </div>

          {/* Center Features Highlights */}
          <div className="relative z-10 py-6 space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15">
              <div className="p-2 rounded-xl bg-teal-500/30 text-teal-200 mt-0.5">
                <Ticket className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Avtomatlashtirilgan Elektron Navbat</h4>
                <p className="text-[11px] text-teal-100/70">Kassadan bir zumda talon berish va yo'naltirish</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15">
              <div className="p-2 rounded-xl bg-teal-500/30 text-teal-200 mt-0.5">
                <Activity className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">O'zbekcha Ovozli E'lon (Smart TTS)</h4>
                <p className="text-[11px] text-teal-100/70">Har bir xona va bemor uchun aniq ovozli e'lonlar</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15">
              <div className="p-2 rounded-xl bg-teal-500/30 text-teal-200 mt-0.5">
                <Building2 className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Shifokor & Boshqaruv Kabineti</h4>
                <p className="text-[11px] text-teal-100/70">Har bir mutaxassis uchun shaxsiy qabul paneli</p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: Modern Form & Controls ================= */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            {/* Top Form Title */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200/60 px-3 py-1 rounded-full">
                  Xodimlar Kirish Portali
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-2">
                Tizimga xush kelibsiz! 👋
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Klinika ma’muriyati tomonidan berilgan telefon raqamingiz va maxfiy parol orqali kiring.
              </p>
            </div>

            {/* Main Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Error Alert Box */}
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl flex items-start gap-2.5 animate-bounce-once shadow-sm">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Kirishda xatolik!</p>
                    <p className="text-[11px] text-red-600/90 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* 1. Phone Input with Fixed +998 Prefix */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-teal-600" />
                    <span>Telefon raqamingiz</span>
                  </label>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60">
                    🇺🇿 O'zbekiston (+998)
                  </span>
                </div>

                <div className="flex items-center w-full bg-slate-50/80 hover:bg-slate-50 focus-within:bg-white border border-slate-200 focus-within:border-teal-500 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 focus-within:ring-4 focus-within:ring-teal-500/15 transition-all shadow-sm overflow-hidden group">
                  {/* Fixed +998 Prefix */}
                  <div className="flex items-center gap-1.5 px-3.5 py-3 bg-slate-100/90 border-r border-slate-200 text-slate-700 font-bold select-none shrink-0">
                    <span className="text-base leading-none">🇺🇿</span>
                    <span className="text-slate-900 tracking-wide font-bold">+998</span>
                  </div>

                  {/* Phone digits input */}
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={formatPhoneDigits(phoneDigits)}
                    onChange={handlePhoneChange}
                    onKeyDown={handlePhoneKeyDown}
                    placeholder="(90) 123-45-67"
                    className="w-full px-3.5 py-3 bg-transparent border-0 focus:outline-none focus:ring-0 text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400"
                    autoFocus
                  />

                  {phoneDigits && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneDigits('');
                        setError('');
                      }}
                      className="p-1 mr-3 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition cursor-pointer shrink-0"
                      title="Tozalash"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Password with Eye Toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <LockKeyhole className="w-3.5 h-3.5 text-teal-600" />
                    <span>Maxfiy parol</span>
                  </label>
                  {capsLockActive && (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      ⚠️ Caps Lock yoniq
                    </span>
                  )}
                </div>

                <div className="relative group">
                  <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-teal-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />

                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-12 py-3 bg-slate-50/80 hover:bg-slate-50 focus-within:bg-white border border-slate-200 focus:border-teal-500 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-teal-500/15 transition-all shadow-sm"
                  />

                  {/* Eye Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all active:scale-95"
                    title={showPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-teal-600" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* 3. Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-md border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600"
                  />
                  <span className="text-xs font-semibold text-slate-600">Eslab qolish</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    alert("Parolni tiklash uchun klinika bosh administratori yoki IT bo'limiga murojaat qiling.");
                  }}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 transition hover:underline"
                >
                  Parolni unutdingizmi?
                </button>
              </div>

              {/* 4. Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-medical-gradient hover:opacity-95 disabled:from-slate-300 disabled:to-slate-400 text-white font-extrabold text-xs sm:text-sm rounded-2xl transition-all shadow-lg shadow-medical-blue/25 hover:shadow-medical-blue/35 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Tekshirilmoqda...</span>
                  </div>
                ) : (
                  <>
                    <span>Tizimga kirish</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Bottom Security Badge */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Xavfsiz 256-bit shifrlangan ulanish</span>
            </div>
            <span>© 2026 klinika-admin CRM</span>
          </div>
        </div>
      </div>
    </div>
  );
};
