import React from 'react';
import { DoorOpen, Sparkles, X, Hash, Building2, Tag, Layers, Plus, CheckCircle2 } from 'lucide-react';

interface CabinetEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCabinetId: string | null;
  cabinetForm: {
    roomNumber: string;
    name: string;
    department: string;
    floor: number;
  };
  onFormChange: (form: any) => void;
  cabinetsList: any[];
  onSubmit: (e: React.FormEvent) => void;
}

export const CabinetEditModal: React.FC<CabinetEditModalProps> = ({
  isOpen,
  onClose,
  editingCabinetId,
  cabinetForm,
  onFormChange,
  cabinetsList,
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
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
              <DoorOpen className="w-6 h-6 text-blue-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">
                  {editingCabinetId ? "Kabinetni Tahrirlash" : "Yangi Kabinet Qo'shish"}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Xonalar
                </span>
              </div>
              <p className="text-xs text-blue-100/90 mt-0.5">Klinikada shifokorlar va qabul uchun xona raqami va qavatini belgilang</p>
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
              Kabinet Raqami <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Hash className="w-4 h-4 text-blue-600" />
              </div>
              <input
                type="text"
                required
                placeholder="Masalan: 7 yoki 12-A"
                value={cabinetForm.roomNumber}
                onChange={e => onFormChange({ ...cabinetForm, roomNumber: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Kabinet To'liq Nomi / Belgilanishi
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <input
                type="text"
                placeholder="Masalan: 7-kabinet (Urologiya & Ultratovush)"
                value={cabinetForm.name}
                onChange={e => onFormChange({ ...cabinetForm, name: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Bo'lim nomi
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Tag className="w-4 h-4 text-blue-600" />
              </div>
              <input
                type="text"
                placeholder="Masalan: Terapiya bloki, Jarrohlik, Diagnostika"
                value={cabinetForm.department}
                onChange={e => onFormChange({ ...cabinetForm, department: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>
          </div>

          {/* JOYLASHGAN QAVATI (ETAJ) QO'SHISH VA TANLASH */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Joylashgan Qavati (Etaj) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-semibold text-blue-600">
                Istalgan yangi etaj raqamini kiritish mumkin
              </span>
            </div>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Layers className="w-4 h-4 text-blue-600" />
              </div>
              <input
                type="number"
                min={1}
                max={50}
                required
                placeholder="Qavat raqami (masalan: 1, 2, 3, 4, 5...)"
                value={cabinetForm.floor}
                onChange={e => onFormChange({ ...cabinetForm, floor: Number(e.target.value) || 1 })}
                className="w-full pl-10 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                - qavat
              </div>
            </div>

            {/* Quick Floor Selector Chips */}
            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-slate-400 mr-1">Tezkor tanlash:</span>
              {Array.from(new Set([1, 2, 3, 4, 5, ...cabinetsList.map(c => Number(c.floor) || 1)]))
                .sort((a, b) => a - b)
                .map(fl => (
                  <button
                    key={fl}
                    type="button"
                    onClick={() => onFormChange({ ...cabinetForm, floor: fl })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      Number(cabinetForm.floor) === fl
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {fl}-qavat
                  </button>
                ))}
              <button
                type="button"
                onClick={() => {
                  const maxFl = cabinetsList.reduce((max, c) => Math.max(max, Number(c.floor) || 1), 1);
                  onFormChange({ ...cabinetForm, floor: maxFl + 1 });
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 transition cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Yangi qavat</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Agar kiritilgan qavat raqami hali mavjud bo‘lmasa, kabinet saqlangach u avtomatik yangi etaj sifatida ro‘yxatga qo‘shiladi.
            </p>
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
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingCabinetId ? "O'zgarishlarni Saqlash" : "Kabinetni Saqlash"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

