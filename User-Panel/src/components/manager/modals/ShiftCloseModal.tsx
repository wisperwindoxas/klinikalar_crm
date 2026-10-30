import React from 'react';
import { Lock, X, Banknote } from 'lucide-react';

interface ShiftCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  closingShiftData: any;
  closingCashAmount: string | number;
  onAmountChange: (val: string) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const ShiftCloseModal: React.FC<ShiftCloseModalProps> = ({
  isOpen,
  onClose,
  closingShiftData,
  closingCashAmount,
  onAmountChange,
  isSubmitting,
  onSubmit,
}) => {
  if (!isOpen || !closingShiftData) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-600 via-rose-600 to-rose-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
              <Lock className="w-6 h-6 text-rose-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">Kassa Smenasini Yopish</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white flex items-center gap-1">
                  Yakunlash
                </span>
              </div>
              <p className="text-xs text-rose-100/90 mt-0.5">Smena #{closingShiftData.id} bo'yicha moliyaviy hisobotni yakunlash</p>
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
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">Kassir xodim:</span>
              <span className="font-bold text-slate-800">{closingShiftData.cashier_name || 'Kassir'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">Boshlang'ich kassa:</span>
              <span className="font-mono font-bold text-slate-700">
                {Number(closingShiftData.opening_balance || 0).toLocaleString()} so'm
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
              <span className="text-slate-500 font-semibold">Smenadagi jami tushum:</span>
              <span className="font-mono font-bold text-emerald-600">
                +{Number(closingShiftData.total_received || 0).toLocaleString()} so'm
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Kassadagi Haqiqiy Naqd Qoldiq (so'mda) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Banknote className="w-4 h-4 text-rose-600" />
              </div>
              <input
                type="number"
                required
                min="0"
                step="1000"
                value={closingCashAmount}
                onChange={e => onAmountChange(e.target.value)}
                className="w-full pl-10 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                so'm
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              {Number(closingCashAmount || 0).toLocaleString()} so'm
            </p>
            <p className="text-[11px] text-slate-500 mt-2 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-800">
              Eslatma: Smena yopilgach, barcha qabullar va tushumlar saqlanadi hamda keyingi smenaga o'tiladi.
            </p>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20 flex items-center gap-2 transition cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{isSubmitting ? "Yopilmoqda..." : "Smenani Yopish"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
