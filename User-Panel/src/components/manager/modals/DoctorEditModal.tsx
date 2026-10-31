import React from 'react';
import { Stethoscope, Sparkles, X, UserCheck, Award, ChevronDown, DoorOpen, Phone, ShieldCheck, User, Lock, CheckCircle2 } from 'lucide-react';
import { formatUzbekPhone } from '../../../utils/phone';
import { UzbekistanAddressSelect } from '../../UzbekistanAddressSelect';

interface DoctorEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingDoctorId: string | null;
  doctorForm: {
    displayName: string;
    specialtyId: string;
    cabinetNumber: string;
    phone: string;
    username: string;
    password?: string;
    address?: string;
  };
  onFormChange: (form: any) => void;
  specialtiesList: any[];
  onSubmit: (e: React.FormEvent) => void;
}

export const DoctorEditModal: React.FC<DoctorEditModalProps> = ({
  isOpen,
  onClose,
  editingDoctorId,
  doctorForm,
  onFormChange,
  specialtiesList,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
              <Stethoscope className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">
                  {editingDoctorId ? "Shifokor Ma'lumotlarini Tahrirlash" : "Yangi Shifokor Qo‘shish"}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Shifokor
                </span>
              </div>
              <p className="text-xs text-blue-100/90 mt-0.5">
                Klinikaga shifokor va uning qabul kabinetini biriktirish
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

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Shifokor F.I.Sh. <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <UserCheck className="w-4 h-4 text-blue-600" />
              </div>
              <input
                type="text"
                required
                placeholder="Masalan: Dr. Ergashev Bobur"
                value={doctorForm.displayName}
                onChange={e => {
                  const newName = e.target.value;
                  const updates: any = { displayName: newName };
                  if (!editingDoctorId) {
                    const clean = newName.toLowerCase().replace(/dr\.?\s*/i, '').replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
                    const suggestedLogin = clean ? `doc_${clean.slice(0, 15)}` : '';
                    if (!doctorForm.username || doctorForm.username.startsWith('doc_')) {
                      updates.username = suggestedLogin;
                    }
                  }
                  onFormChange({ ...doctorForm, ...updates });
                }}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mutaxassislik <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Award className="w-4 h-4 text-blue-600" />
                </div>
                <select
                  value={doctorForm.specialtyId}
                  onChange={e => onFormChange({ ...doctorForm, specialtyId: e.target.value })}
                  className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition appearance-none"
                >
                  <option value="">Mutaxassislikni tanlang</option>
                  {specialtiesList.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kabinet Raqami <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <DoorOpen className="w-4 h-4 text-blue-600" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Masalan: 3"
                  value={doctorForm.cabinetNumber}
                  onChange={e => onFormChange({ ...doctorForm, cabinetNumber: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Telefon Raqami <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Phone className="w-4 h-4 text-blue-600" />
              </div>
              <input
                type="tel"
                required
                value={doctorForm.phone}
                onChange={e => onFormChange({ ...doctorForm, phone: formatUzbekPhone(e.target.value) })}
                onKeyDown={e => {
                  if ((doctorForm.phone === '+998 ' || doctorForm.phone === '+998' || doctorForm.phone.length <= 5) && e.key === 'Backspace') {
                    e.preventDefault();
                    onFormChange({ ...doctorForm, phone: '+998 ' });
                  }
                }}
                placeholder="+998 (90) 123-45-67"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>
          </div>

          {/* Login and Password for Doctor Portal */}
          <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Shifokor Tizimga Kirish Ma'lumotlari (Login & Parol)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Foydalanuvchi Logini <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: doc_karimova"
                    value={doctorForm.username}
                    onChange={e => onFormChange({ ...doctorForm, username: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Shifokor ushbu login orqali kiradi</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {editingDoctorId ? 'Parolni yangilash' : 'Tizim Paroli'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Lock className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <input
                    type="text"
                    required={!editingDoctorId}
                    placeholder={editingDoctorId ? "O'zgarishsiz qoldirish" : "Masalan: doctor123"}
                    value={doctorForm.password || ''}
                    onChange={e => onFormChange({ ...doctorForm, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Standart: <b>doctor123</b></span>
              </div>
            </div>
          </div>

          <UzbekistanAddressSelect
            value={doctorForm.address || ''}
            onChange={addr => onFormChange({ ...doctorForm, address: addr })}
            label="Shifokor Yashash / Ishlash Manzili (Viloyat va Tuman)"
          />

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
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingDoctorId ? "O'zgarishlarni Saqlash" : "Shifokorni Saqlash"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

