import React from 'react';
import { Wallet, Sparkles, X, User, ChevronDown, Banknote, FileText } from 'lucide-react';

interface ShiftOpenModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftForm: {
    cashierName: string;
    openingBalance: number;
    notes: string;
  };
  onFormChange: (form: { cashierName: string; openingBalance: number; notes: string }) => void;
  usersList: any[];
  onSubmit: (e: React.FormEvent) => void;
}

export const ShiftOpenModal: React.FC<ShiftOpenModalProps> = ({
  isOpen,
  onClose,
  shiftForm,
  onFormChange,
  usersList,
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
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
              <Wallet className="w-6 h-6 text-cyan-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">Yangi Kassa Smenasini Ochish</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Kassa
                </span>
              </div>
              <p className="text-xs text-cyan-100/90 mt-0.5">Kassir ish kuni uchun rasmiy moliyaviy smena va boshlang'ich kassa qoldig'ini kiriting</p>
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
              Bazada mavjud Kassirni tanlang <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <select
                required
                value={shiftForm.cashierName}
                onChange={e => onFormChange({ ...shiftForm, cashierName: e.target.value })}
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition cursor-pointer appearance-none"
              >
                <option value="">-- Kassirni tanlang --</option>
                {usersList
                  .filter(u => u.role_code === 'CASHIER' || u.role_name?.toLowerCase().includes('kassir'))
                  .map(u => (
                    <option key={u.id} value={u.full_name}>
                      {u.full_name} ({u.username}) • Rasmiy kassir
                    </option>
                  ))}
                <optgroup label="Boshqa xodimlar / Administratorlar">
                  {usersList
                    .filter(u => u.role_code !== 'CASHIER' && !u.role_name?.toLowerCase().includes('kassir'))
                    .map(u => (
                      <option key={u.id} value={u.full_name}>
                        {u.full_name} ({u.role_name || u.role_code})
                      </option>
                    ))}
                </optgroup>
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Bazada ro'yxatga olingan xodimlar orasidan smena ochuvchi kassir</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Boshlang'ich Kassa Qoldig'i (so'mda) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Banknote className="w-4 h-4 text-blue-600" />
              </div>
              <input
                type="number"
                required
                min="0"
                step="5000"
                value={shiftForm.openingBalance}
                onChange={e => onFormChange({ ...shiftForm, openingBalance: Number(e.target.value) })}
                className="w-full pl-10 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                so'm
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              {Number(shiftForm.openingBalance || 0).toLocaleString()} so'm
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Qayd / Izoh
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <input
                type="text"
                placeholder="Masalan: Ertalabki asosiy kassa smenasi"
                value={shiftForm.notes}
                onChange={e => onFormChange({ ...shiftForm, notes: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
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
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              <span>Smenani ochish</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

