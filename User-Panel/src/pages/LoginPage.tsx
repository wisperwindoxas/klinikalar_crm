import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Ticket,
  AlertCircle,
  Eye,
  EyeOff,
  Phone,
  Activity,
  CheckCircle2,
  Tv,
  HeartPulse,
  Sparkles,
  Building2,
  LockKeyhole
} from 'lucide-react';
import { UserApiClient } from '../api/client';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  // Input states
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [inputMode, setInputMode] = useState<'smart' | 'phone' | 'username'>('smart');

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [capsLockActive, setCapsLockActive] = useState(false);

  // Load remembered identifier on mount
  useEffect(() => {
    const saved = localStorage.getItem('sadaf_remember_identifier');
    if (saved) {
      setIdentifier(saved);
      setRememberMe(true);
    }
  }, []);

  // Format Uzbekistan phone numbers dynamically
  const formatUzbekPhone = (input: string): string => {
    let digits = input.replace(/\D/g, '');

    // If starts with country code 998, strip it to work with remaining 9 digits
    if (digits.startsWith('998')) {
      digits = digits.slice(3);
    }

    // Limit to 9 digits (2 digits code + 7 digits number)
    digits = digits.slice(0, 9);

    if (digits.length === 0) {
      return '';
    }

    let res = '+998';
    if (digits.length > 0) {
      res += ` (${digits.slice(0, 2)}`;
      if (digits.length >= 2) {
        res += `) `;
      }
    }
    if (digits.length > 2) {
      res += digits.slice(2, 5);
    }
    if (digits.length > 5) {
      res += `-${digits.slice(5, 7)}`;
    }
    if (digits.length > 7) {
      res += `-${digits.slice(7, 9)}`;
    }
    return res;
  };

  // Smart input change handler
  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setError('');

    // If empty
    if (!val) {
      setIdentifier('');
      return;
    }

    // Check if input is likely a phone number
    const isPhoneLike = val.startsWith('+') || /^\d/.test(val) || val.startsWith('998');

    if (isPhoneLike) {
      const formatted = formatUzbekPhone(val);
      setIdentifier(formatted);
      setInputMode('phone');
    } else {
      // It's a text username like 'admin', 'doctor', 'kassir', 'doc_kardio1'
      setIdentifier(val);
      setInputMode('username');
    }
  };

  // Caps lock detection
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockActive(true);
    } else {
      setCapsLockActive(false);
    }
  };

  // Submit Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setError('Telefon raqam yoki loginni kiriting');
      return;
    }
    if (!password.trim()) {
      setError('Parolni kiriting');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await UserApiClient.login(cleanIdentifier, password);
      if (res.data?.user) {
        const user = res.data.user;
        localStorage.setItem('sadaf_user', JSON.stringify(user));

        if (rememberMe) {
          localStorage.setItem('sadaf_remember_identifier', cleanIdentifier);
        } else {
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
      setError(err.message || 'Login yoki parol noto‘g‘ri. Iltimos, qayta urinib ko‘ring.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Role Fillers
  const handleQuickRole = (roleLogin: string, rolePass: string) => {
    setIdentifier(roleLogin);
    setPassword(rolePass);
    setInputMode(roleLogin.startsWith('+') ? 'phone' : 'username');
    setError('');
  };

  const isCurrentRole = (roleKey: string) => {
    if (roleKey === 'admin' && (identifier === 'admin' || identifier === 'manager')) return true;
    if (roleKey === 'kassir' && (identifier === 'kassir' || identifier.includes('935554433'))) return true;
    if (roleKey === 'doctor' && (identifier === 'doctor' || identifier === 'doc_kardio1' || identifier.includes('901234567'))) return true;
    return false;
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
        <div className="lg:col-span-5 bg-gradient-to-br from-[#0F766E] via-[#0D9488] to-[#115E59] p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
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
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-lg text-emerald-300">
                <HeartPulse className="w-7 h-7 animate-pulse text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-1.5">
                  SADAF CLINIC
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

          {/* Bottom Live System Indicator */}
          <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
              </span>
              <span className="text-teal-100 font-medium">Server holati: Onlayn</span>
            </div>
            <span className="text-teal-200/80 font-mono text-[11px]">PostgreSQL 16 • SSL</span>
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
                <a
                  href="http://localhost:3002"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 transition flex items-center gap-1.5 hover:underline"
                >
                  <Tv className="w-3.5 h-3.5 text-teal-600" />
                  <span>TV Tablo (3002)</span>
                </a>
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-2">
                Tizimga xush kelibsiz! 👋
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Klinika ma’muriyati tomonidan berilgan login yoki telefon raqamingiz orqali kiring.
              </p>
            </div>

            {/* Quick Role Fillers (Tezkor Namunaviy Rollar) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Tezkor namuna (Rol bo'yicha):
                </label>
                <span className="text-[11px] text-teal-600 font-semibold">1 bosish bilan to'ldirish</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {/* 1. Menejer */}
                <button
                  type="button"
                  onClick={() => handleQuickRole('admin', 'admin123')}
                  className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between relative ${
                    isCurrentRole('admin')
                      ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                      : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className={`p-1.5 rounded-lg ${isCurrentRole('admin') ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    {isCurrentRole('admin') && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-slate-800">Menejer</div>
                    <div className="text-[10px] text-slate-500 font-mono">admin</div>
                  </div>
                </button>

                {/* 2. Kassir */}
                <button
                  type="button"
                  onClick={() => handleQuickRole('kassir', 'kassir123')}
                  className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between relative ${
                    isCurrentRole('kassir')
                      ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className={`p-1.5 rounded-lg ${isCurrentRole('kassir') ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      <Ticket className="w-4 h-4" />
                    </div>
                    {isCurrentRole('kassir') && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-slate-800">Kassir</div>
                    <div className="text-[10px] text-slate-500 font-mono">kassir</div>
                  </div>
                </button>

                {/* 3. Shifokor */}
                <button
                  type="button"
                  onClick={() => handleQuickRole('doctor', 'doctor123')}
                  className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between relative ${
                    isCurrentRole('doctor')
                      ? 'bg-teal-50/80 border-teal-500 ring-2 ring-teal-500/20 shadow-sm'
                      : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className={`p-1.5 rounded-lg ${isCurrentRole('doctor') ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    {isCurrentRole('doctor') && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-slate-800">Shifokor</div>
                    <div className="text-[10px] text-slate-500 font-mono">doctor</div>
                  </div>
                </button>
              </div>
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

              {/* 1. Identifier (Phone or Login) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    {inputMode === 'phone' ? (
                      <>
                        <Phone className="w-3.5 h-3.5 text-teal-600" />
                        <span>Telefon raqamingiz</span>
                      </>
                    ) : (
                      <>
                        <User className="w-3.5 h-3.5 text-teal-600" />
                        <span>Login yoki Telefon raqam</span>
                      </>
                    )}
                  </label>
                  {inputMode === 'phone' && (
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60">
                      🇺🇿 O'zbekiston (+998)
                    </span>
                  )}
                </div>

                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    {inputMode === 'phone' ? (
                      <div className="flex items-center gap-1 text-slate-700 font-bold text-xs bg-slate-200/70 px-2 py-0.5 rounded-md">
                        <span>🇺🇿</span>
                      </div>
                    ) : (
                      <User className="w-4 h-4 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                    )}
                  </div>

                  <input
                    type="text"
                    value={identifier}
                    onChange={handleIdentifierChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Masalan: +998 (90) 123-45-67 yoki admin"
                    className={`w-full ${
                      inputMode === 'phone' ? 'pl-16' : 'pl-10'
                    } pr-4 py-3 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-teal-500 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-teal-500/15 transition-all shadow-sm`}
                  />
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
                    className="w-full pl-10 pr-12 py-3 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-teal-500 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-teal-500/15 transition-all shadow-sm"
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
                className="w-full py-3.5 bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-extrabold text-xs sm:text-sm rounded-2xl transition-all shadow-lg shadow-teal-700/25 hover:shadow-teal-700/35 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
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
            <span>© 2026 SADAF KLINIKA CRM</span>
          </div>
        </div>
      </div>
    </div>
  );
};
