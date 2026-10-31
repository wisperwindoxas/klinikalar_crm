import React, { useState, useEffect } from 'react';
import { 
  Sliders, Shield, Clock, AlertTriangle, Key, 
  CheckCircle2, RefreshCw, Save, Database, Lock,
  User, Mail, Phone, LockKeyhole, Eye, EyeOff, Sparkles, Server, Globe
} from 'lucide-react';
import { ApiClient } from '../api/client';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'system'>('profile');

  // --- Profile State ---
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // --- System Settings State ---
  const [settings, setSettings] = useState<any[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedSuccessKey, setSavedSuccessKey] = useState<string | null>(null);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    loadProfile();
    loadSettings();
  }, []);

  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      setProfileError(null);
      const res = await ApiClient.getMe();
      if (res.data?.user) {
        const u = res.data.user;
        setFullName(u.fullName || '');
        setPhone(u.phone || '');
        setEmail(u.email || '');
      }
    } catch (e: any) {
      setProfileError(e.message || 'Profil ma‘lumotlarini yuklashda xatolik');
    } finally {
      setProfileLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      setSettingsLoading(true);
      setSystemError(null);
      const res = await ApiClient.getSystemSettings();
      if (res.data) {
        setSettings(res.data);
      }
    } catch (e: any) {
      setSystemError(e.message || 'Tizim sozlamalarini yuklashda xatolik');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (newPassword && newPassword !== confirmPassword) {
      setProfileError('Yangi parol va tasdiqlash paroli bir-biriga mos kelmadi');
      return;
    }

    if (newPassword && !currentPassword) {
      setProfileError('Parolni yangilash uchun amaldagi parolingizni kiritishingiz shart');
      return;
    }

    try {
      setProfileSaving(true);
      const payload: any = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
      };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await ApiClient.updateProfile(payload);
      if (res.success) {
        setProfileSuccess('Profil ma‘lumotlari muvaffaqiyatli saqlandi!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (res.data?.user) {
          localStorage.setItem('sadaf_super_admin_user', JSON.stringify(res.data.user));
        }
        setTimeout(() => setProfileSuccess(null), 4000);
      } else {
        setProfileError(res.message || 'Saqlashda xatolik yuz berdi');
      }
    } catch (err: any) {
      setProfileError(err.message || 'Serverga ulanishda xatolik');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdateSetting = async (key: string, value: string) => {
    try {
      setSavingKey(key);
      await ApiClient.updateSystemSetting(key, value);
      setSettings(settings.map(s => s.key === key ? { ...s, value } : s));
      setSavedSuccessKey(key);
      setTimeout(() => setSavedSuccessKey(null), 2500);
    } catch (e: any) {
      alert(e.message || 'Sozlamani saqlashda xatolik');
    } finally {
      setSavingKey(null);
    }
  };

  const handleToggle = (key: string, currentValue: string) => {
    const nextVal = currentValue === 'true' ? 'false' : 'true';
    handleUpdateSetting(key, nextVal);
  };

  const filteredSettings = settings.filter(s => 
    s.key?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tizim va Profil Sozlamalari</h1>
            <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 font-bold text-xs rounded-full border border-teal-200">
              SaaS v2.6
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Super Administrator hisobi, xavfsizlik parametrlari va butun SaaS platformasi global konfiguratsiyasi
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/90 rounded-2xl shadow-sm self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'profile'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Administrator Profili</span>
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'system'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Platforma Konfiguratsiyasi</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ADMINISTRATOR PROFILI */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {profileSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-semibold shadow-xs">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold shadow-xs">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600" />
              <span>{profileError}</span>
            </div>
          )}

          {profileLoading ? (
            <div className="py-24 bg-white rounded-2xl border border-slate-200/90 flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
              <span className="text-xs font-medium">Profil ma‘lumotlari yuklanmoqda...</span>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
                <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900">Shaxsiy & Aloqa Ma‘lumotlari</h2>
                    <p className="text-[11px] text-slate-400">Super Administrator hisobi rekvizitlari</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      F.I.SH (To‘liq Ism)
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Masalan: Azizbek Rahimov"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Telefon Raqami
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+998901234567"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Login yoki Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="superadmin"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Change Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
                <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <LockKeyhole className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900">Xavfsizlik & Parolni Yangilash</h2>
                    <p className="text-[11px] text-slate-400">Agar parolni o‘zgartirmoqchi bo‘lmasangiz, bo‘sh qoldiring</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Amaldagi Parol
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
                      >
                        {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Yangi Parol
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Kamida 6 belgi"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Yangi Parolni Qayta Kiriting
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Parolni tasdiqlang"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20 transition flex items-center gap-2 disabled:opacity-60"
                  >
                    {profileSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saqlanmoqda...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>O‘zgarishlarni Saqlash</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 2: TIZIM SOZLAMALARI */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          {systemError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{systemError}</span>
            </div>
          )}

          {/* Search & Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Parametr nomi yoki tavsifi bo‘yicha qidirish..."
                className="w-full px-4 py-2 bg-white border border-slate-200/90 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 shadow-sm"
              />
            </div>

            <button
              onClick={loadSettings}
              disabled={settingsLoading}
              className="px-3.5 py-2 bg-white border border-slate-200/90 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-sm flex items-center gap-2 self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${settingsLoading ? 'animate-spin text-teal-600' : ''}`} />
              <span>Qayta yuklash</span>
            </button>
          </div>

          {/* Settings Grid */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900">Platforma Siyosati & Parametrlari</h2>
                  <p className="text-[11px] text-slate-400">Har bir parametr darhol PostgreSQL ma‘lumotlar bazasida yangilanadi</p>
                </div>
              </div>
            </div>

            {settingsLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
                <span className="text-xs font-medium">Sozlamalar yuklanmoqda...</span>
              </div>
            ) : filteredSettings.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                Qidiruv bo‘yicha sozlama topilmadi.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredSettings.map((s) => {
                  const isBool = s.value === 'true' || s.value === 'false';
                  const isSaving = savingKey === s.key;
                  const isSaved = savedSuccessKey === s.key;

                  return (
                    <div key={s.key} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900 font-mono tracking-wide">{s.key}</span>
                          {isSaved && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Saqlandi
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{s.description}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        {isBool ? (
                          <button
                            onClick={() => handleToggle(s.key, s.value)}
                            disabled={isSaving}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                              s.value === 'true' ? 'bg-teal-600' : 'bg-slate-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                s.value === 'true' ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              defaultValue={s.value}
                              onBlur={(e) => {
                                if (e.target.value !== s.value) {
                                  handleUpdateSetting(s.key, e.target.value);
                                }
                              }}
                              className="w-36 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-center focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                            />
                          </div>
                        )}

                        {isSaving && <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Database & Infrastructure Info Card */}
          <div className="p-5 bg-gradient-to-r from-teal-900 to-slate-900 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-teal-300 text-xs font-bold uppercase tracking-wider">
                <Database className="w-4 h-4" />
                <span>PostgreSQL 16 Multi-Tenant Cluster</span>
              </div>
              <h3 className="text-base font-black">Xavfsiz va Markazlashgan Konfiguratsiya</h3>
              <p className="text-xs text-slate-300 max-w-xl">
                Barcha tenantlar va klinikalar uchun amaldagi qoidalar xotirada keshlanadi va o‘zgartirilganda bir zumda sinxronlanadi.
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-bold self-start sm:self-auto">
              <Lock className="w-3.5 h-3.5 text-teal-400" />
              <span>SSL 256-bit Shifrlangan</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
