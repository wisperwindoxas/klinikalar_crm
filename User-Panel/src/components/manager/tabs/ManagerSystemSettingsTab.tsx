import React from 'react';
import { 
  SlidersHorizontal, RotateCcw, Save, RefreshCw, Building2, CreditCard, 
  Clock, Phone, Sparkles, ImageIcon, Upload, Trash2, Mail, MapPin, 
  Globe, Calendar, Ticket, CheckCircle2, Volume2, Tv, Eye, ShieldCheck 
} from 'lucide-react';
import { showNotification } from '../../ToastNotification';
import { formatUzbekPhone } from '../../../utils/phone';
import { APP_LOGO, APP_VERSION } from '../../../utils/brand';

interface ManagerSystemSettingsTabProps {
  settingsForm: any;
  setSettingsForm: React.Dispatch<React.SetStateAction<any>>;
  clinicSettings: any;
  isSavingSettings: boolean;
  onSaveSettings: (e?: React.FormEvent) => void;
  onResetSettings: () => void;
  onOpenUpdateModal: () => void;
  onNavigateTab: (tabSlug: string) => void;
}

export const ManagerSystemSettingsTab: React.FC<ManagerSystemSettingsTabProps> = ({
  settingsForm,
  setSettingsForm,
  clinicSettings,
  isSavingSettings,
  onSaveSettings,
  onResetSettings,
  onOpenUpdateModal,
  onNavigateTab,
}) => {
  const isElectron = typeof window !== 'undefined' && (
    Boolean((window as any).electron) || 
    Boolean((window as any).electronAPI) ||
    Boolean((window as any).ipcRenderer) ||
    navigator.userAgent.toLowerCase().includes('electron')
  );

  return (
    <div className="space-y-6 w-full">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-medical-gradient text-white p-7 rounded-3xl border border-white/25 shadow-xl shadow-medical-blue/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-white/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-56 h-56 bg-medical-blue-dark/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-md border border-white/30 shrink-0">
                <SlidersHorizontal className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5 drop-shadow-xs">
                  Tizim va Sayt Sozlamalari
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30">
                    PostgreSQL 16
                  </span>
                </h2>
                <p className="text-xs text-white/95 mt-0.5 leading-relaxed">
                  Klinika brendi, elektron navbat qoidalari, ish rejimi va sayt aloqa ma'lumotlarini real vaqtda boshqarish
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/95 mt-3">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-medical-turquoise animate-pulse" />
                Tizim Faol
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-medium shadow-xs">
                Oxirgi yangilanish: {clinicSettings?.updated_at ? new Date(clinicSettings.updated_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : 'Hozir'}
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-medium shadow-xs">
                Valyuta: {settingsForm.currency}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onResetSettings}
              disabled={isSavingSettings}
              className="px-4 py-2.5 rounded-2xl border border-white/30 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4 text-medical-turquoise" />
              Tiklash
            </button>
            <button
              type="button"
              onClick={() => onSaveSettings()}
              disabled={isSavingSettings}
              className="px-6 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-medical-blue-dark text-xs font-black transition flex items-center gap-2 shadow-lg shadow-medical-blue-dark/20 border border-white/80 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSavingSettings ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-medical-blue-dark" />
                  Saqlanmoqda...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-medical-blue-dark stroke-[2.5]" />
                  Sozlamalarni saqlash
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 4 Quick Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Klinika Brendi</p>
            <p className="text-xs font-black text-slate-800 truncate">{settingsForm.clinicName || 'Klinika nomi'}</p>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">{settingsForm.slogan || 'Shior kiritilmagan'}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-medical-turquoise-dark" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">To'lov Tartibi</p>
            <p className="text-xs font-black text-medical-blue-dark truncate">
              {settingsForm.defaultPaymentPolicy === 'PAY_BEFORE_CALL' ? "Oldindan to'lov" : "Xizmatdan so'ng"}
            </p>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">Prefiks: {settingsForm.defaultQueuePrefix} (Talon)</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-purple-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Ish Vaqti</p>
            <p className="text-xs font-black text-purple-700 truncate">{settingsForm.workStartTime} - {settingsForm.workEndTime}</p>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">{settingsForm.workDays}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Aloqa Markazi</p>
            <p className="text-xs font-black text-slate-800 truncate">{settingsForm.phone || 'Telefon kiritilmagan'}</p>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">{settingsForm.email || 'Email kiritilmagan'}</p>
          </div>
        </div>
      </div>

      {/* DASTUR YANGILANISHI (FAQAT ELECTRON JS DASTURIDA) */}
      {isElectron && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-medical-blue to-teal-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-medical-blue/20">
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900">Dastur Yangilanishi</h3>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-medical-blue border border-blue-200 text-[10px] font-black">
                    v{APP_VERSION}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dasturning yangi versiyasini tekshirish, o'zgarishlar bilan tanishish va avtomatik yangilash
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenUpdateModal}
              className="px-5 py-2.5 bg-gradient-to-r from-medical-blue to-teal-600 hover:opacity-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-medical-blue/20 active:scale-95 cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Yangilanishlarni tekshirish</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Settings Form in Organized Grid */}
      <form onSubmit={onSaveSettings} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* SECTION 1: ASOSIY KLINIKA VA SAYT MA'LUMOTLARI */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Klinika va Sayt Umumiy Ma'lumotlari</h3>
                <p className="text-[11px] text-slate-400">Brend, sayt sarlavhasi va aloqa kontaktlari</p>
              </div>
            </div>

            <div className="space-y-3.5 pt-1">
              {/* Klinika Logotipi */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Klinika logotipi</span>
                </label>
                <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200/90 rounded-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center overflow-hidden shrink-0 p-1.5">
                    <img
                      src={settingsForm.logoUrl || clinicSettings?.logo_url || APP_LOGO}
                      alt="Logo preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs">
                        <Upload className="w-3.5 h-3.5 text-blue-600" />
                        <span>Rasm yuklash</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                showNotification('Hajm katta', 'Logotip hajmi 2MB dan oshmasligi kerak', 'error');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = () => {
                                setSettingsForm((prev: any) => ({ ...prev, logoUrl: reader.result as string }));
                                showNotification('Logotip tanlandi', 'Logotip tanlandi. Saqlash tugmasini bosing.', 'success');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      {(settingsForm.logoUrl || clinicSettings?.logo_url) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSettingsForm((prev: any) => ({ ...prev, logoUrl: '' }));
                            showNotification('Logotip o\'chirildi', 'Standart dastur logotipi tiklandi. Saqlash tugmasini bosing.', 'info');
                          }}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-rose-200 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>O'chirish</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      PNG, JPG, SVG tavsiya etiladi. Logotip yuklanmasa, standart dastur logotipi ishlatiladi.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Klinika rasmiy nomi
                </label>
                <input
                  type="text"
                  value={settingsForm.clinicName}
                  onChange={e => setSettingsForm({ ...settingsForm, clinicName: e.target.value })}
                  placeholder="Klinika nomini kiriting"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                  Klinika shiori / Sayt tavsifi
                </label>
                <input
                  type="text"
                  value={settingsForm.slogan}
                  onChange={e => setSettingsForm({ ...settingsForm, slogan: e.target.value })}
                  placeholder="Klinika shiorini kiriting"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Aloqa telefoni
                  </label>
                  <input
                    type="text"
                    value={settingsForm.phone}
                    onChange={e => setSettingsForm({ ...settingsForm, phone: formatUzbekPhone(e.target.value) })}
                    placeholder="+998 (__) ___-__-__"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Elektron pochta
                  </label>
                  <input
                    type="email"
                    value={settingsForm.email}
                    onChange={e => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    placeholder="Masalan: info@klinika.uz"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Klinika manzili
                </label>
                <input
                  type="text"
                  value={settingsForm.address}
                  onChange={e => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  placeholder="Masalan: Toshkent sh., Chilonzor tumani..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  Rasmiy veb-sayt / Telegram boti
                </label>
                <input
                  type="text"
                  value={settingsForm.websiteUrl}
                  onChange={e => setSettingsForm({ ...settingsForm, websiteUrl: e.target.value })}
                  placeholder="Masalan: https://klinika.uz yoki @klinika_bot"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: ISH TARTIBI VA SMENA SOZLAMALARI */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Ish Rejimi va Smena Tartibi</h3>
                <p className="text-[11px] text-slate-400">Klinika qabul soatlari va smenalarni avtomatik nazorati</p>
              </div>
            </div>

            <div className="space-y-3.5 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Ish kunlari
                </label>
                <select
                  value={settingsForm.workDays}
                  onChange={e => setSettingsForm({ ...settingsForm, workDays: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                >
                  <option value="Dushanba - Shanba">Dushanba - Shanba (Olti kunlik)</option>
                  <option value="Dushanba - Juma">Dushanba - Juma (Besh kunlik)</option>
                  <option value="Har kuni (Dush - Yak)">Har kuni (Dushanba - Yakshanba)</option>
                  <option value="Dam olish kunlarisiz 24/7">Dam olish kunlarisiz 24/7</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Ish boshlanish vaqti
                  </label>
                  <input
                    type="time"
                    value={settingsForm.workStartTime}
                    onChange={e => setSettingsForm({ ...settingsForm, workStartTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Ish tugash vaqti
                  </label>
                  <input
                    type="time"
                    value={settingsForm.workEndTime}
                    onChange={e => setSettingsForm({ ...settingsForm, workEndTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-purple-50/50 rounded-2xl border border-purple-100">
                <div className="pr-3">
                  <div className="text-xs font-bold text-slate-800">Kassa smenasini avtomatik yopish</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Har kuni soat 23:59 da ochiq kassa smenalari avtomatik yopiladi va kunlik hisobotga o'tkaziladi
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={settingsForm.cashierAutoCloseShift}
                    onChange={e => setSettingsForm({ ...settingsForm, cashierAutoCloseShift: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-slate-600 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Tizim vaqt mintaqasi:</span>
                <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">Asia/Tashkent (UTC+5)</span>
              </div>
            </div>
          </div>

          {/* SECTION 3: ELEKTRON NAVBAT VA QABUL SIYOSATI */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Ticket className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Elektron Navbat va Qabul Siyosati</h3>
                <p className="text-[11px] text-slate-400">To'lov tartibi, navbat chaqiruv qoidalari va prefikslar</p>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Standart To'lov Qoidasi (Klinika bo'yicha)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSettingsForm({ ...settingsForm, defaultPaymentPolicy: 'PAY_BEFORE_CALL' })}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      settingsForm.defaultPaymentPolicy === 'PAY_BEFORE_CALL'
                        ? 'bg-blue-50/80 border-blue-500 shadow-sm shadow-blue-500/10'
                        : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Oldindan to'lov</span>
                      {settingsForm.defaultPaymentPolicy === 'PAY_BEFORE_CALL' && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Bemor avval kassada to'laydi, so'ng shifokor xonasiga chaqiriladi (PAY_BEFORE_CALL)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettingsForm({ ...settingsForm, defaultPaymentPolicy: 'PAY_AFTER_SERVICE' })}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      settingsForm.defaultPaymentPolicy === 'PAY_AFTER_SERVICE'
                        ? 'bg-purple-50/80 border-purple-500 shadow-sm shadow-purple-500/10'
                        : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Xizmatdan so'ng to'lov</span>
                      {settingsForm.defaultPaymentPolicy === 'PAY_AFTER_SERVICE' && (
                        <CheckCircle2 className="w-4 h-4 text-purple-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Shifokor ko'rigidan keyin kassa to'lovi amalga oshiriladi (PAY_AFTER_SERVICE)
                    </p>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Talon prefiksi
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    value={settingsForm.defaultQueuePrefix}
                    onChange={e => setSettingsForm({ ...settingsForm, defaultQueuePrefix: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-center text-slate-800 uppercase focus:bg-white focus:border-blue-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Kutish limiti (daq)
                  </label>
                  <select
                    value={settingsForm.ticketAutoCancelMinutes}
                    onChange={e => setSettingsForm({ ...settingsForm, ticketAutoCancelMinutes: parseInt(e.target.value) || 15 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition"
                  >
                    <option value={10}>10 daqiqa</option>
                    <option value={15}>15 daqiqa</option>
                    <option value={20}>20 daqiqa</option>
                    <option value={30}>30 daqiqa</option>
                    <option value={60}>60 daqiqa</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Kunlik qabul limiti
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={500}
                    value={settingsForm.maxDailyTicketsPerDoctor}
                    onChange={e => setSettingsForm({ ...settingsForm, maxDailyTicketsPerDoctor: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="pr-3">
                    <div className="text-xs font-bold text-slate-800">Avtomatik navbat chaqirish</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Shifokor qabuli yakunlangach, navbatdagi bemor avtomatik tarzda chaqiriladi
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={settingsForm.autoCallNext}
                      onChange={e => setSettingsForm({ ...settingsForm, autoCallNext: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="pr-3">
                    <div className="text-xs font-bold text-slate-800">Favqulodda (CITO) ustuvorlik</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Og'ir ahvoldagi va shoshilinch yordamga muhtoj bemorlar umumiy navbatdan oldin olinadi
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={settingsForm.emergencyPriority}
                      onChange={e => setSettingsForm({ ...settingsForm, emergencyPriority: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: OVOZ, TV VA MOLIYAVIY SOZLAMALAR */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Ovoz, TV va Moliyaviy Integratsiya</h3>
                <p className="text-[11px] text-slate-400">TV Tablo ovozli xabarlari, chaqiruv takrorlanishi va kassa hisoboti</p>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between p-3.5 bg-amber-50/50 rounded-2xl border border-amber-100">
                <div className="pr-3">
                  <div className="text-xs font-bold text-slate-800">TV ekranda ovozli e'lonlar (Ding-dong)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Har bir bemor chaqirilganda yoqimli signal va o'zbek tilida tabiiy suxandon ovozi yangraydi
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={settingsForm.soundAlertsEnabled}
                    onChange={e => setSettingsForm({ ...settingsForm, soundAlertsEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Asosiy valyuta
                  </label>
                  <select
                    value={settingsForm.currency}
                    onChange={e => setSettingsForm({ ...settingsForm, currency: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition"
                  >
                    <option value="UZS">UZS - O'zbekiston so'mi</option>
                    <option value="USD">USD - AQSH dollari</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    QQS stavkasi (VAT %)
                  </label>
                  <select
                    value={settingsForm.vatPercent}
                    onChange={e => setSettingsForm({ ...settingsForm, vatPercent: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition"
                  >
                    <option value={0}>0% (QQSsiz)</option>
                    <option value={12}>12% (QQS bilan)</option>
                  </select>
                </div>
              </div>

              {/* TV Screen template shortcut */}
              <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-blue-900">TV Tablo Ovoz Shablonini sozlash</p>
                  <p className="text-[11px] text-blue-600 mt-0.5">TV ekrandagi e'lon matnlari va ovoz shablonlarini tahrirlash</p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab('tv-tablosi')}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                >
                  <Tv className="w-3.5 h-3.5" />
                  TV Tablosiga o'tish
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* LIVE PREVIEW: SAYTDAGI JONLI BLOK */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Sayt va Kioskdagi Jonli Ko'rinishi (Real-time Preview)</h4>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Jonli Sinxron
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center p-1 overflow-hidden shadow-sm">
                <img
                  src={settingsForm.logoUrl || clinicSettings?.logo_url || APP_LOGO}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h5 className="text-base font-black text-slate-900">{settingsForm.clinicName || clinicSettings?.clinic_name || 'Klinika-admin'}</h5>
                <p className="text-xs text-slate-500">{settingsForm.slogan || "Shior ko'rsatilmagan"}</p>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {settingsForm.address || "Manzil ko'rsatilmagan"}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {settingsForm.workDays}: {settingsForm.workStartTime} - {settingsForm.workEndTime}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              {settingsForm.phone && (
                <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  {settingsForm.phone}
                </div>
              )}
              <div className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 font-bold text-xs">
                Prefiks: {settingsForm.defaultQueuePrefix}
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs">
                {settingsForm.defaultPaymentPolicy === 'PAY_BEFORE_CALL' ? "Oldindan to'lov" : "Xizmatdan so'ng"}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Barcha kiritilgan parametrlar bevosita <strong>PostgreSQL 16</strong> ma'lumotlar bazasiga yoziladi</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onResetSettings}
              disabled={isSavingSettings}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSavingSettings ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Barcha sozlamalarni saqlash
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
