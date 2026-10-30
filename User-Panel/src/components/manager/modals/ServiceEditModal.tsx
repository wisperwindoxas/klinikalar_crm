import React from 'react';
import { Tag, Sparkles, X, Edit2, Stethoscope, FileSpreadsheet, Award, Clock, DollarSign, CreditCard, CheckCircle2, DoorOpen } from 'lucide-react';

interface ServiceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingServiceId: string | null;
  selectedServiceForDetail: any;
  serviceModalTab: 'EDIT' | 'DOCTORS';
  onTabChange: (tab: 'EDIT' | 'DOCTORS') => void;
  serviceForm: {
    name: string;
    specialtyId: string;
    price: number;
    durationMinutes: number;
    paymentPolicy: string;
  };
  onFormChange: (form: any) => void;
  specialtiesList: any[];
  onExportDoctorsExcel: (service: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ServiceEditModal: React.FC<ServiceEditModalProps> = ({
  isOpen,
  onClose,
  editingServiceId,
  selectedServiceForDetail,
  serviceModalTab,
  onTabChange,
  serviceForm,
  onFormChange,
  specialtiesList,
  onExportDoctorsExcel,
  onSubmit,
}) => {
  if (!isOpen) return null;

  const docCount = Number(selectedServiceForDetail?.doctor_count) || 
    (Array.isArray(selectedServiceForDetail?.doctors) ? selectedServiceForDetail.doctors.length : 0);
  const doctorsListForService = Array.isArray(selectedServiceForDetail?.doctors) ? selectedServiceForDetail.doctors : [];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
              <Tag className="w-6 h-6 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">
                  {editingServiceId ? (selectedServiceForDetail?.name || "Xizmatni Tahrirlash") : "Yangi Xizmat Qo'shish"}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  {editingServiceId ? 'Tahrirlash' : 'Yangi'}
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                {editingServiceId 
                  ? "Xizmat parametrlari va ushbu xizmat bo'yicha qabul qiluvchi shifokorlar" 
                  : "Tibbiy xizmat nomi, tegishli mutaxassislik va to'lov siyosatini belgilang"}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 hover:bg-white/15 rounded-xl text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs if editing existing service */}
        {editingServiceId && (
          <div className="px-6 pt-3 pb-0 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onTabChange('EDIT')}
                className={`pb-3 px-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  serviceModalTab === 'EDIT'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Xizmatni Tahrirlash</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('DOCTORS')}
                className={`pb-3 px-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  serviceModalTab === 'DOCTORS'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Biriktirilgan Shifokorlar</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  docCount > 0 ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {docCount}
                </span>
              </button>
            </div>

            {serviceModalTab === 'DOCTORS' && docCount > 0 && (
              <button
                type="button"
                onClick={() => onExportDoctorsExcel(selectedServiceForDetail)}
                className="mb-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Shifokorlar ro'yxatini Excel (.xlsx) formatida yuklab olish"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excelga (.xlsx)</span>
              </button>
            )}
          </div>
        )}

        {/* Tab 1: EDIT FORM */}
        {(!editingServiceId || serviceModalTab === 'EDIT') && (
          <form onSubmit={onSubmit} className="p-6 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Xizmat Nomi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Tag className="w-4 h-4 text-emerald-600" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Masalan: EKG tekshiruvi, Qon tahlili, MRT..."
                  value={serviceForm.name}
                  onChange={e => onFormChange({ ...serviceForm, name: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mutaxassislik Yo'nalishi <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Award className="w-4 h-4 text-emerald-600" />
                  </div>
                  <select
                    value={serviceForm.specialtyId}
                    onChange={e => onFormChange({ ...serviceForm, specialtyId: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  >
                    {specialtiesList.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Davomiyligi (daqiqada)
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Clock className="w-4 h-4 text-emerald-600" />
                  </div>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    step="5"
                    value={serviceForm.durationMinutes}
                    onChange={e => onFormChange({ ...serviceForm, durationMinutes: Number(e.target.value) })}
                    className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                    daq
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Xizmat Narxi (so'mda) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={serviceForm.price}
                  onChange={e => onFormChange({ ...serviceForm, price: Number(e.target.value) })}
                  className="w-full pl-10 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                  so'm
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                {Number(serviceForm.price || 0).toLocaleString()} so'm
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                To‘lov Tartibi va Siyosati <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => onFormChange({ ...serviceForm, paymentPolicy: 'PAY_BEFORE_CALL' })}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    serviceForm.paymentPolicy === 'PAY_BEFORE_CALL' || serviceForm.paymentPolicy === 'PAY_BEFORE_TICKET'
                      ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/30'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
                    <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                    <span>Oldindan to‘lov</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Talon olishdan oldin kassada to'lanadi</p>
                </button>

                <button
                  type="button"
                  onClick={() => onFormChange({ ...serviceForm, paymentPolicy: 'PAY_AFTER_SERVICE' })}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    serviceForm.paymentPolicy === 'PAY_AFTER_SERVICE' || serviceForm.paymentPolicy === 'TICKET_BEFORE_PAYMENT'
                      ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-400/30'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-blue-900">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Xizmatdan so‘ng</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Shifokor ko'rigidan so'ng to'lanadi</p>
                </button>
              </div>
            </div>

            {/* Connected Doctors Quick Notice */}
            {editingServiceId && (
              <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-purple-950">
                      Ushbu yo'nalish bo'yicha: <span className="text-purple-700 font-black">{docCount} nafar shifokor</span>
                    </div>
                    <p className="text-[11px] text-purple-700/80 mt-0.5">
                      {docCount > 0 
                        ? "Xizmatni ko'rsatuvchi shifokorlar ro'yxatini ko'rish uchun yorliqqa o'ting" 
                        : "Hozircha biriktirilgan shifokor mavjud emas"}
                    </p>
                  </div>
                </div>

                {docCount > 0 && (
                  <button
                    type="button"
                    onClick={() => onTabChange('DOCTORS')}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
                  >
                    Ro'yxatni ko'rish ({docCount})
                  </button>
                )}
              </div>
            )}

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingServiceId ? "O'zgarishlarni Saqlash" : "Xizmatni Saqlash"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: DOCTORS LIST BREAKDOWN */}
        {editingServiceId && serviceModalTab === 'DOCTORS' && (
          <div className="p-6 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  {selectedServiceForDetail?.name} bo'yicha shifokorlar
                </h4>
                <p className="text-xs text-slate-500">
                  Mutaxassislik: <span className="font-bold text-slate-700">{selectedServiceForDetail?.specialty_name || 'Umumiy'}</span>
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                Jami: {docCount} nafar shifokor
              </span>
            </div>

            {doctorsListForService.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Stethoscope className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                <div className="font-semibold text-slate-600 text-sm">Biriktirilgan shifokorlar yo'q</div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ushbu mutaxassislik bo'yicha bazada faol shifokor biriktirilmagan
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3.5 w-10 text-center">№</th>
                      <th className="py-3 px-3.5">Shifokor F.I.Sh</th>
                      <th className="py-3 px-3.5">Xona / Kabinet</th>
                      <th className="py-3 px-3.5">Telefon</th>
                      <th className="py-3 px-3.5">Qabul vaqti</th>
                      <th className="py-3 px-3.5 text-right">Holat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {doctorsListForService.map((d: any, idx: number) => (
                      <tr key={d.id || idx} className="hover:bg-purple-50/30 transition">
                        <td className="py-3 px-3.5 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0">
                              {d.display_name?.replace('Dr. ', '').charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{d.display_name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{d.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-mono font-bold text-xs border border-blue-200">
                            <DoorOpen className="w-3.5 h-3.5" />
                            <span>{d.room_number}-xona</span>
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-slate-600 font-mono">
                          {d.phone || '—'}
                        </td>
                        <td className="py-3 px-3.5 text-slate-600">
                          {d.avg_consultation_minutes || 15} daqiqa
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Faol
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => onTabChange('EDIT')}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                ← Xizmatni tahrirlashga qaytish
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

