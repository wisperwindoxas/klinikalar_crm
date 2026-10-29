import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock, AlertTriangle, Phone, ShieldAlert, PauseCircle, Clock,
  MessageSquare, User, RefreshCw, ExternalLink
} from 'lucide-react';
import { UserApiClient } from '../api/client';

const API_BASE_URL = 'http://localhost:5001/api/v1';

interface SubscriptionData {
  id: string;
  clinic_id: string;
  clinic_name?: string;
  plan_code: string;
  status: string; // 'ACTIVE' | 'SUSPENDED' | 'BLOCKED' | 'EXPIRED' | etc.
  start_date: string;
  end_date: string;
  days_remaining: number;
  plan_name?: string;
  plan_price?: string;
}

export const SubscriptionGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rechecking, setRechecking] = useState(false);

  // Fetch subscription from backend
  const fetchSubscription = useCallback(async () => {
    try {
      let tenantId = 'tenant_sadaf_01';
      try {
        const userJson = localStorage.getItem('sadaf_user');
        if (userJson) {
          const u = JSON.parse(userJson);
          if (u.tenantId) tenantId = u.tenantId;
        }
      } catch (e) {}

      const res = await fetch(`${API_BASE_URL}/clinic/subscription?tenantId=${tenantId}`, {
        headers: { 'x-tenant-id': tenantId }
      }).then(r => r.json());
      if (res && res.data) {
        setSubscription(res.data);
      }
    } catch (e) {
      console.warn('Subscription check error:', e);
    } finally {
      setLoading(false);
      setRechecking(false);
    }
  }, []);

  // Initial load, real-time socket and periodic background polling
  useEffect(() => {
    fetchSubscription();

    // Setup WebSocket listener for real-time instant status updates
    try {
      const socket = UserApiClient.getSocket();
      const handleSubscriptionUpdated = (updatedSub: SubscriptionData) => {
        console.log('⚡ Real-time subscription status received:', updatedSub);
        if (updatedSub) {
          setSubscription(updatedSub);
        }
      };

      socket.on('clinic.subscription_updated', handleSubscriptionUpdated);

      // Periodic check every 6 seconds as a backup
      const interval = setInterval(fetchSubscription, 6000);

      return () => {
        socket.off('clinic.subscription_updated', handleSubscriptionUpdated);
        clearInterval(interval);
      };
    } catch (e) {
      const interval = setInterval(fetchSubscription, 6000);
      return () => clearInterval(interval);
    }
  }, [fetchSubscription]);

  // Determine current user role & path
  let role = 'MANAGER';
  try {
    const userJson = localStorage.getItem('sadaf_user');
    if (userJson) {
      const parsed = JSON.parse(userJson);
      role = String(parsed.role || 'MANAGER').toUpperCase();
    }
  } catch (e) {
    role = 'MANAGER';
  }

  const isDoctorOrCashierPath = typeof window !== 'undefined' && (
    window.location.pathname.includes('/doctor') ||
    window.location.pathname.includes('/cashier') ||
    window.location.pathname.includes('/operator')
  );
  const isDoctorOrCashier = role === 'DOCTOR' || role === 'CASHIER' || role === 'OPERATOR' || isDoctorOrCashierPath;

  // Evaluate Lock Status
  const statusUpper = String(subscription?.status || 'ACTIVE').toUpperCase();
  const daysLeft = typeof subscription?.days_remaining === 'number' ? subscription.days_remaining : 999;

  const isExpired = statusUpper === 'EXPIRED' || daysLeft < 0;
  const isSuspended = statusUpper === 'SUSPENDED' || statusUpper === 'PAUSED';
  const isBlocked = statusUpper === 'BLOCKED' || statusUpper === 'LOCKED';
  const isLocked = !loading && subscription !== null && (isBlocked || isSuspended || isExpired || (statusUpper !== 'ACTIVE' && statusUpper !== 'TRIAL'));

  // Evaluate 3 days warning banner
  const isExpiringSoon = !isLocked && subscription !== null && (statusUpper === 'ACTIVE' || statusUpper === 'TRIAL') && daysLeft <= 3 && daysLeft >= 0;

  // Block Developer Tools, Context Menu & Key Combinations when locked
  useEffect(() => {
    if (!isLocked) return;

    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const blockKeyboardShortcuts = (e: KeyboardEvent) => {
      // Block F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Block Ctrl+Shift+I / Cmd+Opt+I / Ctrl+Shift+J / Cmd+Opt+J / Ctrl+Shift+C / Cmd+Opt+C
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.shiftKey || e.altKey) &&
        ['I', 'i', 'J', 'j', 'C', 'c', 'K', 'k'].includes(e.key)
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Block Ctrl+U / Cmd+Opt+U (View Source) & Ctrl+S (Save)
      if ((e.ctrlKey || e.metaKey) && ['U', 'u', 'S', 's'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Attach with capture flag
    window.addEventListener('contextmenu', blockContextMenu, true);
    window.addEventListener('keydown', blockKeyboardShortcuts, true);
    document.addEventListener('contextmenu', blockContextMenu, true);
    document.addEventListener('keydown', blockKeyboardShortcuts, true);

    const prevOverflow = document.body.style.overflow;
    const prevSelect = document.body.style.userSelect;
    document.body.style.overflow = 'hidden';
    document.body.style.userSelect = 'none';

    return () => {
      window.removeEventListener('contextmenu', blockContextMenu, true);
      window.removeEventListener('keydown', blockKeyboardShortcuts, true);
      document.removeEventListener('contextmenu', blockContextMenu, true);
      document.removeEventListener('keydown', blockKeyboardShortcuts, true);
      document.body.style.overflow = prevOverflow;
      document.body.style.userSelect = prevSelect;
    };
  }, [isLocked]);

  const handleManualRecheck = () => {
    setRechecking(true);
    fetchSubscription();
  };

  return (
    <div className="relative min-h-screen">
      {/* ======================================================== */}
      {/* 1. OBUNA TUGASHIGA 3 KUN QOLGANDA TEPADAGI OGOHLANTIRISH */}
      {/* ======================================================== */}
      {isExpiringSoon && (
        <aside
          role="alert"
          aria-label="Obuna muddati haqida ogohlantirish"
          className="sticky top-0 z-[100] w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-xl px-4 py-2.5 transition-all animate-in slide-in-from-top duration-300"
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs md:text-sm font-semibold">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-transparent flex items-center justify-center shrink-0 filter drop-shadow-sm animate-pulse">
                <img src="/logo.png" alt="klinika-admin Logo" className="w-full h-full object-contain bg-transparent" />
              </div>
              <div>
                <span className="font-black uppercase tracking-wider text-yellow-200 mr-2">
                  DIQQAT! OBUNA MUDDATI TUGAMOQDA:
                </span>
                <span>
                  {daysLeft === 0
                    ? "Klinika obunasi bugun o'z nihoyasiga yetadi! Ertaga tizim avtomatik bloklanadi."
                    : `Klinika obunasi tugashiga ${daysLeft} kun qoldi! Tizim to'xtab qolmasligi uchun obunani yangilang.`}
                </span>
              </div>
            </div>

            {/* Contacts & Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {isDoctorOrCashier ? (
                <div className="px-3 py-1.5 bg-white/20 rounded-xl text-xs font-bold text-white border border-white/30 backdrop-blur-xs flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-yellow-200" />
                  <span>Iltimos, klinikangiz menegeri bilan bog'laning</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-yellow-100 hidden lg:inline font-bold">Admin bilan bog'lanish:</span>
                  <a
                    href="tel:+998703155565"
                    className="px-3 py-1.5 bg-white text-orange-700 hover:bg-orange-50 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>+998 70 315 55 65 (Xurshid)</span>
                  </a>
                  <a
                    href="tel:+998913171711"
                    className="px-3 py-1.5 bg-black/20 hover:bg-black/30 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 border border-white/25"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>+998 91 317 17 11 (Aziz)</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* ======================================================== */}
      {/* 2. ASOSIY DASTUR SAHIFA MAZMUNI                          */}
      {/* ======================================================== */}
      <div className={isLocked ? 'pointer-events-none select-none filter blur-sm opacity-20' : ''}>
        {children}
      </div>

      {/* ======================================================== */}
      {/* 3. TO'LIQ QULFLASH EKRANI (MARKAZDA, 100% BLOKLANGAN)    */}
      {/* ======================================================== */}
      {isLocked && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lock-modal-title"
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-[#050B14]/95 backdrop-blur-2xl select-none"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {/* Subtle Ambient Background Glows */}
          <div className="absolute w-[500px] h-[500px] rounded-full bg-rose-600/10 blur-[120px] pointer-events-none -top-24 -left-24" />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-amber-600/10 blur-[120px] pointer-events-none -bottom-24 -right-24" />

          {/* Central Modal Card */}
          <div className="relative w-full max-w-xl bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 md:p-10 text-center shadow-2xl shadow-black/80 flex flex-col items-center">
            
            {/* Animated Lock Shield Badge */}
            <div className="relative mb-6">
              <div className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl ${
                isBlocked
                  ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40 shadow-rose-500/20'
                  : isSuspended
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40 shadow-amber-500/20'
                  : 'bg-rose-600/20 text-rose-500 border border-rose-600/40 shadow-rose-600/20'
              }`}>
                {isBlocked ? (
                  <Lock className="w-12 h-12 stroke-[2.2] animate-pulse" />
                ) : isSuspended ? (
                  <PauseCircle className="w-12 h-12 stroke-[2.2] animate-pulse" />
                ) : (
                  <Clock className="w-12 h-12 stroke-[2.2] animate-pulse" />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-md border border-slate-900">
                {isBlocked ? 'Qulflangan' : isSuspended ? "To'xtatilgan" : 'Muddati Tugagan'}
              </div>
            </div>

            {/* Clinic Name Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold mb-3">
              <img src="/logo.png" alt="klinika-admin Logo" className="w-4 h-4 object-contain bg-transparent" />
              <span>{subscription?.clinic_name || 'klinika-admin Tizimi'}</span>
            </div>

            {/* Main Header Title */}
            <h1 id="lock-modal-title" className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
              {isBlocked
                ? 'Dastur Bloklangan'
                : isSuspended
                ? "Klinika Faoliyati To'xtatildi"
                : 'Obuna Muddati Tugagan'}
            </h1>

            {/* Detailed Explanation */}
            <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
              {isBlocked
                ? "Super Admin tomonidan ushbu klinika uchun xizmat ko'rsatish butunlay bloklangan va qulflangan."
                : isSuspended
                ? "Klinika faoliyati ma'muriyat tomonidan vaqtincha to'xtatildi. Barcha bo'limlar faoliyati cheklangan."
                : "Ushbu klinika uchun taqdim etilgan litsenziya yoki obuna muddati o'z nihoyasiga yetgan."}
            </p>

            {/* ======================================================== */}
            {/* ROLE SPECIFIC INSTRUCTION & CONTACTS                     */}
            {/* ======================================================== */}
            {isDoctorOrCashier ? (
              // 1. Shifokor va Kassir Paneli Uchun
              <div className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl p-5 text-left mb-6">
                <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm mb-2">
                  <User className="w-4 h-4" />
                  <span>Menegeringiz bilan bog'laning</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Hurmatli xodim, navbatlar va qabul tizimidan foydalanish uchun klinika litsenziyasi faollashtirilishi kerak. Iltimos, litsenziyani yangilash va tizimni qayta ishga tushirish uchun <b>Klinika Menegeri</b> yoki ma'muriyatiga murojaat qiling.
                </p>
              </div>
            ) : (
              // 2. Meneger Paneli Uchun (Admin bilan bog'lanish va kontaktlar)
              <div className="w-full bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 mb-6 text-left">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                    <Phone className="w-4 h-4" />
                    <span>Admin bilan bog'laning</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Obunani tiklash
                  </span>
                </div>

                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  Hurmatli Meneger, dasturdan foydalanishni davom ettirish va klinikangiz tizimini darhol qulfdan ochish uchun bosh administrator bilan bog'laning:
                </p>

                {/* Contact Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Contact 1: Xurshid */}
                  <a
                    href="tel:+998703155565"
                    className="p-3.5 bg-gradient-to-br from-blue-600/20 to-blue-500/10 hover:from-blue-600/30 hover:to-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 rounded-xl transition flex items-center justify-between group"
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] text-blue-400 font-medium">Bosh Administrator</div>
                      <div className="text-sm font-bold text-white group-hover:text-blue-300 transition">
                        +998 70 315 55 65
                      </div>
                      <div className="text-[11px] text-slate-400 font-semibold mt-0.5">Xurshid</div>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                  </a>

                  {/* Contact 2: Aziz */}
                  <a
                    href="tel:+998913171711"
                    className="p-3.5 bg-gradient-to-br from-teal-600/20 to-teal-500/10 hover:from-teal-600/30 hover:to-teal-500/20 border border-teal-500/30 hover:border-teal-500/50 rounded-xl transition flex items-center justify-between group"
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] text-teal-400 font-medium">Texnik Administrator</div>
                      <div className="text-sm font-bold text-white group-hover:text-teal-300 transition">
                        +998 91 317 17 11
                      </div>
                      <div className="text-[11px] text-slate-400 font-semibold mt-0.5">Aziz</div>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-md shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                  </a>
                </div>
              </div>
            )}

            {/* Recheck / Refresh Status Button */}
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={handleManualRecheck}
                disabled={rechecking}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700/80 active:bg-slate-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${rechecking ? 'animate-spin text-blue-400' : 'text-slate-400'}`} />
                <span>{rechecking ? 'Holat tekshirilmoqda...' : "Holatni qayta tekshirish"}</span>
              </button>
            </div>

            {/* Bottom Security Note */}
            <div className="mt-5 text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-medium">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-600" />
              <span>Xavfsizlik: Developer rejimiga kirish va sichqoncha amallari cheklangan.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
