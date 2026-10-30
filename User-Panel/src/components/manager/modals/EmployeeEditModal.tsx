import React from 'react';
import { ShieldCheck, Sparkles, X, User, Phone, Lock, Stethoscope, Wallet, CheckCircle2 } from 'lucide-react';
import { formatUzbekPhone } from '../../../utils/phone';

interface EmployeeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingUserId: string | null;
  userForm: {
    fullName: string;
    username: string;
    phone: string;
    password?: string;
    roleCode: string;
  };
  onFormChange: (form: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const EmployeeEditModal: React.FC<EmployeeEditModalProps> = ({
  isOpen,
  onClose,
  editingUserId,
  userForm,
  onFormChange,
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
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-6 h-6 text-purple-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">
                  {editingUserId ? "Xodim Ma'lumotlarini Tahrirlash" : "Yangi Xodim Qo‘shish"}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Xodimlar
                </span>
              </div>
              <p className="text-xs text-purple-100/90 mt-0.5">Tizim foydalanuvchisi, kirish login-paroli va huquq darajasi</p>
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
              Xodim To'liq F.I.Sh. <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <User className="w-4 h-4 text-indigo-600" />
              </div>
              <input
                type="text"
                required
                placeholder="Masalan: Dr. Karimov Sardor Baxtiyorovich"
                value={userForm.fullName}
                onChange={e => onFormChange({ ...userForm, fullName: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Login (username) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <span className="text-xs font-mono font-bold text-indigo-600">@</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="skarimov"
                  value={userForm.username}
                  onChange={e => onFormChange({ ...userForm, username: e.target.value })}
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Telefon raqami <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Phone className="w-4 h-4 text-indigo-600" />
                </div>
                <input
                  type="tel"
                  required
                  placeholder="+998 90 123 45 67"
                  value={userForm.phone}
                  onChange={e => onFormChange({ ...userForm, phone: formatUzbekPhone(e.target.value) })}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Parol {editingUserId ? "(O'zgartirmaslik uchun bo'sh qoldiring)" : <span className="text-rose-500">*</span>}
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Lock className="w-4 h-4 text-indigo-600" />
              </div>
              <input
                type="password"
                placeholder={editingUserId ? "Yangi parol (ixtiyoriy)" : "••••••••"}
                required={!editingUserId}
                value={userForm.password || ''}
                onChange={e => onFormChange({ ...userForm, password: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>
          </div>

          {/* Role Cards Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Tizimdagi Roli va Huquq Darajasi <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => onFormChange({ ...userForm, roleCode: 'DOCTOR' })}
                className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                  userForm.roleCode === 'DOCTOR'
                    ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/60'
                }`}
              >
                <Stethoscope className={`w-5 h-5 mx-auto mb-1 ${userForm.roleCode === 'DOCTOR' ? 'text-blue-600' : 'text-slate-400'}`} />
                <div className="text-xs font-bold text-slate-800">Shifokor</div>
                <div className="text-[10px] text-slate-400">DOCTOR</div>
              </button>

              <button
                type="button"
                onClick={() => onFormChange({ ...userForm, roleCode: 'CASHIER' })}
                className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                  userForm.roleCode === 'CASHIER'
                    ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/60'
                }`}
              >
                <Wallet className={`w-5 h-5 mx-auto mb-1 ${userForm.roleCode === 'CASHIER' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div className="text-xs font-bold text-slate-800">Kassir</div>
                <div className="text-[10px] text-slate-400">CASHIER</div>
              </button>

              <button
                type="button"
                onClick={() => onFormChange({ ...userForm, roleCode: 'MANAGER' })}
                className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                  userForm.roleCode === 'MANAGER'
                    ? 'border-indigo-500 bg-indigo-50/80 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/60'
                }`}
              >
                <ShieldCheck className={`w-5 h-5 mx-auto mb-1 ${userForm.roleCode === 'MANAGER' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <div className="text-xs font-bold text-slate-800">Menejer</div>
                <div className="text-[10px] text-slate-400">MANAGER</div>
              </button>
            </div>
          </div>

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
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingUserId ? "O'zgarishlarni Saqlash" : "Xodimni Saqlash"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

