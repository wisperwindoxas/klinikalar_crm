import React, { useRef } from 'react';
import { 
  Sliders, Printer, RotateCcw, RefreshCw, Save, Check,
  Sparkles, SlidersHorizontal, Tag, FileText, QrCode,
  Image as ImageIcon, Upload, Trash2
} from 'lucide-react';
import { APP_LOGO } from '../../../utils/brand';

interface ManagerPrinterSettingsTabProps {
  printerSettings: any;
  setPrinterSettings: React.Dispatch<React.SetStateAction<any>>;
  isSavingPrinterSettings: boolean;
  onSave: () => void;
  onReset: () => void;
  onTestPrint: () => void;
  previewPaperSize: '80mm' | '58mm';
  setPreviewPaperSize: (val: '80mm' | '58mm') => void;
  onNavigateTab: (tabSlug: string) => void;
}

export const ManagerPrinterSettingsTab: React.FC<ManagerPrinterSettingsTabProps> = ({
  printerSettings,
  setPrinterSettings,
  isSavingPrinterSettings,
  onSave,
  onReset,
  onTestPrint,
  previewPaperSize,
  setPreviewPaperSize,
  onNavigateTab,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Logo yuklash va canvas orqali ixchamlashtirish (optimal termal o'lcham max 300px)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/png', 0.9);
          setPrinterSettings((prev: any) => ({
            ...prev,
            logoUrl: dataUrl,
            showLogo: true
          }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    setPrinterSettings((prev: any) => ({
      ...prev,
      logoUrl: '',
      showLogo: true
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Settings Sub-navigation Pills */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-2xs">
        <button
          type="button"
          onClick={() => onNavigateTab('sozlamalar')}
          className="px-4 py-2 rounded-xl text-xs font-bold transition text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-slate-500" />
          <span>Asosiy tizim sozlamalari</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigateTab('printer-sozlamalari')}
          className="px-4 py-2 rounded-xl text-xs font-bold transition bg-[#0084FF] text-white shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-white" />
          <span>Printer va talon sozlamalari</span>
          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-white/20 text-white rounded">Faol</span>
        </button>
      </div>

      {/* Header Banner with Title and Actions */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-[#172B4D]">Printer va Talon Sozlamalari</h3>
                <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-bold rounded-full border border-teal-200">
                  XP-80T / XP-58 Moslashuvchan
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kassirlar tomonidan chiqariladigan termal navbat talonlarining parametrlari, logotipi, qog'oz formati (80 mm / 58 mm) va barcha elementlarini to'liq boshqarish
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={onReset}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
            title="Boshlang'ich standart parametrlarga qaytarish"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Qaytarish</span>
          </button>

          <button
            type="button"
            onClick={onTestPrint}
            className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Hozirgi sozlamalarni printerda sinov tariqasida chop etib ko'rish"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>Sinov chop etish</span>
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={isSavingPrinterSettings}
            className="px-5 py-2.5 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
          >
            {isSavingPrinterSettings ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSavingPrinterSettings ? 'Saqlanmoqda...' : 'Saqlash va qo‘llash'}</span>
          </button>
        </div>
      </div>

      {/* Main Settings Grid: 2 Columns (Form Controls + Live Ticket Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Settings Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Printer va qog'oz formati */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#172B4D]">Printer va Qog'oz Formati</h4>
                <p className="text-[11px] text-slate-500">Termal printer qog'ozi kengligi va nusxalar soni</p>
              </div>
            </div>

            {/* Paper Size Radio Cards */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Standart Qog'oz Formati
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => {
                    setPrinterSettings((prev: any) => ({ ...prev, paperSize: '80mm' }));
                    setPreviewPaperSize('80mm');
                  }}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-start justify-between ${
                    (printerSettings.paperSize || previewPaperSize) === '80mm'
                      ? 'border-[#0F766E] bg-teal-50/40 ring-2 ring-teal-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-[#172B4D]">80 mm (Standart)</span>
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-teal-100 text-teal-800 rounded">Tavsiya etiladi</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Keng termal chek printerlar (XP-80T, Epson TM-T88, Xprinter XP-N160II va b.)
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    (printerSettings.paperSize || previewPaperSize) === '80mm' ? 'bg-[#0F766E] text-white' : 'border border-slate-300'
                  }`}>
                    {(printerSettings.paperSize || previewPaperSize) === '80mm' && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>

                <div
                  onClick={() => {
                    setPrinterSettings((prev: any) => ({ ...prev, paperSize: '58mm' }));
                    setPreviewPaperSize('58mm');
                  }}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-start justify-between ${
                    (printerSettings.paperSize || previewPaperSize) === '58mm'
                      ? 'border-[#0F766E] bg-teal-50/40 ring-2 ring-teal-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-[#172B4D]">58 mm (Ixcham)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Kichik ixcham termoprinterlar uchun (48 mm chop kengligi). Qog'ozni tejaydi.
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    (printerSettings.paperSize || previewPaperSize) === '58mm' ? 'bg-[#0F766E] text-white' : 'border border-slate-300'
                  }`}>
                    {(printerSettings.paperSize || previewPaperSize) === '58mm' && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            </div>

            {/* Copies Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Har bir navbat uchun talonlar soni
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={printerSettings.copies || 1}
                  onChange={e => setPrinterSettings((prev: any) => ({ ...prev, copies: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0F766E]"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Standart: 1 nusxa (bemor uchun)</span>
              </div>

              {/* Auto print toggle */}
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                  <div className="flex-1">
                    <span className="text-xs font-bold text-slate-800 block">Avtomatik chop etish</span>
                    <span className="text-[10px] text-slate-400">Kassirda talon berilganda printer oynasi ochilsin</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={printerSettings.autoPrint !== false}
                    onChange={e => setPrinterSettings((prev: any) => ({ ...prev, autoPrint: e.target.checked }))}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                </label>
              </div>
            </div>

            {/* Sound alert toggle */}
            <div>
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-800 block">Talon chiqarilganda ovozli signal (Ding)</span>
                  <span className="text-[10px] text-slate-400">Talon berilganda qisqa muvaffaqiyatli audio chalinadi</span>
                </div>
                <input
                  type="checkbox"
                  checked={printerSettings.soundAlert !== false}
                  onChange={e => setPrinterSettings((prev: any) => ({ ...prev, soundAlert: e.target.checked }))}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
              </label>
            </div>
          </div>

          {/* Card 2: Talon sarlavhasi, Logotip va klinika rekvizitlari */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#172B4D]">Klinika Rekvizitlari & Logotip</h4>
                <p className="text-[11px] text-slate-500">Talon yuqori qismida chiqadigan logotip va ma'lumotlar</p>
              </div>
            </div>

            {/* LOGO MANAGEMENT BOX */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-bold text-slate-800">Klinika Logotipi</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printerSettings.showLogo !== false}
                    onChange={e => setPrinterSettings((prev: any) => ({ ...prev, showLogo: e.target.checked }))}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Talonda ko'rsatish</span>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                {/* Logo Preview Box */}
                <div className="w-32 h-20 bg-white rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center p-2 shrink-0 shadow-2xs overflow-hidden">
                  {printerSettings.showLogo !== false ? (
                    <img
                      src={printerSettings.logoUrl || APP_LOGO}
                      alt="Logo"
                      className="w-full h-full object-contain filter grayscale contrast-125"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-semibold italic text-center">Logotip o'chiq</span>
                  )}
                </div>

                {/* Upload & Reset Buttons */}
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Logotip yuklash</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/svg+xml, image/webp"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>

                    {printerSettings.logoUrl && (
                      <button
                        type="button"
                        onClick={handleResetLogo}
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                        title="Standart klinika logotipiga qaytarish"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Standartga qaytarish</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Format: PNG, JPG yoki SVG. Termoprinterda chop etilishi sababli qora-oq yoki shaffof fondagi kontrastli logotip tavsiya etiladi.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Talon Sarlavhasi (Klinika nomi)
                </label>
                <input
                  type="text"
                  value={printerSettings.headerTitle || printerSettings.clinicName || ''}
                  onChange={e => setPrinterSettings((prev: any) => ({
                    ...prev,
                    headerTitle: e.target.value,
                    clinicName: e.target.value
                  }))}
                  placeholder="SADAF TIBBIYOT MARKAZI"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Qo'shimcha Tagline / Shior
                </label>
                <input
                  type="text"
                  value={printerSettings.headerSubtitle || printerSettings.welcomeNote || ''}
                  onChange={e => setPrinterSettings((prev: any) => ({
                    ...prev,
                    headerSubtitle: e.target.value,
                    welcomeNote: e.target.value
                  }))}
                  placeholder="Salomatligingiz — bizning oliy maqsadimiz!"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0F766E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Telefon Raqami (Qisqa)
                  </label>
                  <input
                    type="text"
                    value={printerSettings.phone || ''}
                    onChange={e => setPrinterSettings((prev: any) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+998 71 200-00-00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0F766E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Manzil (Talon uchun qisqacha)
                  </label>
                  <input
                    type="text"
                    value={printerSettings.address || ''}
                    onChange={e => setPrinterSettings((prev: any) => ({ ...prev, address: e.target.value }))}
                    placeholder="Toshkent sh., Navoiy ko'chasi 14"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0F766E]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Talonda ko'rinadigan elementlar (Checkboxes) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#172B4D]">Talon Tarkibiy Qismlari</h4>
                <p className="text-[11px] text-slate-500">Talonda qaysi bloklar ko'rinishini belgilash</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { key: 'showHeader', label: "Sarlavha & Klinika nomi" },
                { key: 'showLogo', label: "Klinika logotipi" },
                { key: 'showTicketNumber', label: "Katta Talon Raqami (A-012)", required: true },
                { key: 'showDoctorName', label: "Shifokor F.I.Sh." },
                { key: 'showDepartment', label: "Mutaxassislik yo'nalishi" },
                { key: 'showCabinet', label: "Kabinet / Qavat raqami" },
                { key: 'showPatientName', label: "Bemor F.I.Sh. (Xavfsiz)" },
                { key: 'showDate', label: "Chiqarilgan sana va soat" },
                { key: 'showWaitingCount', label: "Oldidagi odamlar soni" },
                { key: 'showEstimatedTime', label: "Taxminiy qabul vaqti" },
                { key: 'showServicePrice', label: "Xizmat narxi va to'lov turi" },
                { key: 'showQrCode', label: "QR-kod (Onlayn holat tekshiruvi)" },
                { key: 'showFooter', label: "Xayrlashuv eslatmasi (Footer)" },
                { key: 'showCutLine', label: "Qirqish chizig'i (- - -)" }
              ].map(item => (
                <label
                  key={item.key}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100 transition"
                >
                  <input
                    type="checkbox"
                    checked={item.required || printerSettings[item.key] !== false}
                    disabled={item.required}
                    onChange={e => {
                      const isChecked = e.target.checked;
                      setPrinterSettings((prev: any) => {
                        const updated = { ...prev, [item.key]: isChecked };
                        if (item.key === 'showDoctorName') updated.showDoctor = isChecked;
                        if (item.key === 'showDepartment') updated.showSpecialty = isChecked;
                        if (item.key === 'showServicePrice') updated.showPaymentStatus = isChecked;
                        if (item.key === 'showWaitingCount' || item.key === 'showEstimatedTime') updated.showWaitTime = isChecked;
                        return updated;
                      });
                    }}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-xs font-bold text-slate-700 flex-1">
                    {item.label}
                    {item.required && <span className="text-rose-500 ml-1">*</span>}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Card 4: Pastki qism (Footer Note) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#172B4D]">Talon Etagi & Eslatmalar</h4>
                <p className="text-[11px] text-slate-500">Talon eng pastki qismidagi minnatdorchilik va ko'rsatmalar</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Minnatdorchilik sarlavhasi
                </label>
                <input
                  type="text"
                  value={printerSettings.footerText || ''}
                  onChange={e => setPrinterSettings((prev: any) => ({ ...prev, footerText: e.target.value }))}
                  placeholder="Tashrifingiz uchun rahmat! Salomat bo'ling!"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Qo'shimcha eslatma matni
                </label>
                <textarea
                  rows={2}
                  value={printerSettings.footerNote || ''}
                  onChange={e => setPrinterSettings((prev: any) => ({ ...prev, footerNote: e.target.value }))}
                  placeholder="Iltimos, navbatingizni ekranda kuzatib boring! Salomat bo'ling!"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0F766E]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Preview (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 bg-slate-100/90 p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <h4 className="text-xs font-black uppercase tracking-wider text-[#172B4D]">Jonli Talon Ko'rinishi</h4>
              </div>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewPaperSize('80mm');
                    setPrinterSettings((prev: any) => ({ ...prev, paperSize: '80mm' }));
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    (printerSettings.paperSize || previewPaperSize) === '80mm' ? 'bg-[#0F766E] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  80 mm
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewPaperSize('58mm');
                    setPrinterSettings((prev: any) => ({ ...prev, paperSize: '58mm' }));
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    (printerSettings.paperSize || previewPaperSize) === '58mm' ? 'bg-[#0F766E] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  58 mm
                </button>
              </div>
            </div>

            {/* Thermal Receipt Paper Mockup (100% matched to thermal print output) */}
            <div className="flex justify-center p-2 overflow-x-auto">
              <div
                style={{
                  width: (printerSettings.paperSize || previewPaperSize) === '80mm' ? '300px' : '230px',
                  fontFamily: '"Courier New", Courier, monospace',
                  letterSpacing: '-0.3px'
                }}
                className="bg-white text-black p-4 rounded-xl shadow-md border border-slate-300 text-xs space-y-2 select-none transition-all duration-200"
              >
                {/* 1. CLINIC LOGO */}
                {printerSettings.showLogo !== false && (
                  <div className="text-center pb-1">
                    <img
                      src={printerSettings.logoUrl || APP_LOGO}
                      alt="Klinika Logotipi"
                      className="h-9 max-w-[130px] mx-auto object-contain filter grayscale contrast-125"
                    />
                  </div>
                )}

                {/* 2. RECEIPT HEADER */}
                {printerSettings.showHeader !== false && (
                  <div className="text-center pb-2 border-b border-dashed border-black/40 space-y-0.5">
                    <div className="font-extrabold text-sm uppercase tracking-wide">
                      {printerSettings.headerTitle || printerSettings.clinicName || "SADAF TIBBIYOT MARKAZI"}
                    </div>
                    {(printerSettings.headerSubtitle || printerSettings.welcomeNote) && (
                      <div className="text-[10px] font-medium text-slate-600">
                        {printerSettings.headerSubtitle || printerSettings.welcomeNote}
                      </div>
                    )}
                    {printerSettings.phone && (
                      <div className="text-[10px] font-mono font-bold text-slate-700">
                        Tel: {printerSettings.phone}
                      </div>
                    )}
                    {printerSettings.address && (
                      <div className="text-[9px] text-slate-500">
                        {printerSettings.address}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. DATE & TIME BAR */}
                {printerSettings.showDate !== false && (
                  <div className="flex items-center justify-between text-[10px] font-mono border-b border-black/20 pb-1 text-slate-700">
                    <span>{new Date().toLocaleDateString('uz-UZ')}</span>
                    <span>{new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}

                {/* 4. TICKET NUMBER - BIG & BOLD */}
                {printerSettings.showTicketNumber !== false && (
                  <div className="text-center py-2 border-b-2 border-black space-y-0.5">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-600">Sizning Navbatingiz</div>
                    <div className="text-4xl font-black font-mono tracking-tight text-black py-0.5">
                      A-012
                    </div>
                    {printerSettings.showCabinet !== false && (
                      <div className="text-[10px] font-bold text-slate-700">
                        KABINET № 7 • 2-QAVAT
                      </div>
                    )}
                  </div>
                )}

                {/* 5. DOCTOR & SERVICE DETAILS */}
                <div className="space-y-1.5 py-1 text-[11px] border-b border-dashed border-black/40">
                  {printerSettings.showDoctorName !== false && printerSettings.showDoctor !== false && (
                    <div className="flex items-start justify-between">
                      <span className="text-slate-500 text-[10px]">Shifokor:</span>
                      <span className="font-bold text-right text-slate-900">Dr. Bobur Ergashev</span>
                    </div>
                  )}

                  {printerSettings.showDepartment !== false && printerSettings.showSpecialty !== false && (
                    <div className="flex items-start justify-between">
                      <span className="text-slate-500 text-[10px]">Bo'lim:</span>
                      <span className="font-semibold text-right text-slate-800">Kardiologiya</span>
                    </div>
                  )}

                  {printerSettings.showCabinet !== false && printerSettings.showTicketNumber === false && (
                    <div className="flex items-start justify-between">
                      <span className="text-slate-500 text-[10px]">Xona:</span>
                      <span className="font-mono font-bold text-right text-slate-900">7-kabinet (2-etaj)</span>
                    </div>
                  )}

                  {printerSettings.showPatientName !== false && (
                    <div className="flex items-start justify-between">
                      <span className="text-slate-500 text-[10px]">Bemor:</span>
                      <span className="font-medium text-right text-slate-800">Rustamov O. (+998 90 *** 45)</span>
                    </div>
                  )}

                  {printerSettings.showServicePrice !== false && printerSettings.showPaymentStatus !== false && (
                    <div className="flex items-start justify-between pt-1 border-t border-dotted border-black/20 font-bold">
                      <span className="text-slate-600 text-[10px]">Xizmat:</span>
                      <span className="font-mono text-right text-slate-900">150,000 so'm (To'langan)</span>
                    </div>
                  )}
                </div>

                {/* 6. WAITING STATS */}
                {(printerSettings.showWaitingCount !== false || printerSettings.showEstimatedTime !== false) && (
                  <div className="bg-slate-50 p-2 rounded border border-black/15 text-[10px] space-y-1">
                    {printerSettings.showWaitingCount !== false && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Oldingizda:</span>
                        <span className="font-mono font-black text-slate-900">3 nafar bemor</span>
                      </div>
                    )}
                    {printerSettings.showEstimatedTime !== false && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Taxminiy vaqt:</span>
                        <span className="font-mono font-bold text-slate-900">~ 20-25 daqiqa</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 7. QR CODE MOCKUP */}
                {printerSettings.showQrCode !== false && (
                  <div className="text-center py-2 border-b border-dashed border-black/40">
                    <div className="inline-block p-1.5 bg-white border border-black/40 rounded">
                      <div className="w-14 h-14 bg-white border border-slate-300 mx-auto flex items-center justify-center text-slate-900">
                        <QrCode className="w-10 h-10" />
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-500 mt-1">
                      Navbatingizni telefonda kuzatish uchun skanerlang
                    </div>
                  </div>
                )}

                {/* 8. FOOTER NOTE */}
                {printerSettings.showFooter !== false && (
                  <div className="text-center pt-1 text-[10px] text-slate-700 leading-tight space-y-1">
                    <div className="font-bold">{printerSettings.footerText || "Tashrifingiz uchun rahmat! Salomat bo'ling!"}</div>
                    {printerSettings.footerNote && (
                      <div className="text-[9px] text-slate-500 italic">
                        {printerSettings.footerNote}
                      </div>
                    )}
                  </div>
                )}

                {/* 9. CUT LINE GUIDE */}
                {printerSettings.showCutLine !== false && (
                  <div className="pt-3 pb-1 border-b-2 border-dashed border-black/50 text-[10px] text-slate-500 font-sans text-center">
                    - - - Qirqish chizig'i - - -
                  </div>
                )}
              </div>
            </div>

            {/* Preview Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onTestPrint}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Sinov chop etish ({printerSettings.paperSize || previewPaperSize})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
