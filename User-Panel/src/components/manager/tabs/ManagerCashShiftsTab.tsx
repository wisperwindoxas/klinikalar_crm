import React from 'react';
import { Lock, Plus, User, Eye } from 'lucide-react';

interface ManagerCashShiftsTabProps {
  currentShift: any;
  pb: {
    cash: number;
    card: number;
    online: number;
    total: number;
  };
  allShiftsList: any[];
  onOpenCloseShift: (shift: any) => void;
  onOpenNewShift: () => void;
  onOpenShiftDetails: (shift: any) => void;
}

export const ManagerCashShiftsTab: React.FC<ManagerCashShiftsTabProps> = ({
  currentShift,
  pb,
  allShiftsList,
  onOpenCloseShift,
  onOpenNewShift,
  onOpenShiftDetails,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#172B4D]">Kassa Smenalari va Balans</h3>
          <p className="text-xs text-slate-500">Kassirlarning ish smenalari, naqd va karta tushumi nazorati</p>
        </div>
        <div className="flex items-center gap-3">
          {currentShift ? (
            <button
              onClick={() => onOpenCloseShift(currentShift)}
              className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shadow-rose-500/20 transition cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Smenani yopish</span>
            </button>
          ) : (
            <div className="px-3.5 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-200">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Faol smena yo'q</span>
            </div>
          )}
          <button
            onClick={onOpenNewShift}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shadow-blue-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi smena ochish</span>
          </button>
        </div>
      </div>

      {/* Shift Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
          <div className="text-xs text-slate-500 font-semibold">Faol Smena</div>
          <div className="text-base font-bold text-slate-800 mt-1">
            {currentShift ? `${currentShift.cashier_name || 'Kassir'} (Kassa)` : 'Faol smena yo\'q'}
          </div>
          {currentShift ? (
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                Smena ochiq
              </span>
              <button
                onClick={() => onOpenCloseShift(currentShift)}
                className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 hover:underline transition cursor-pointer"
              >
                <Lock className="w-3 h-3" />
                <span>Smenani yopish</span>
              </button>
            </div>
          ) : (
            <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full">
              Yopiq
            </span>
          )}
        </div>

        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
          <div className="text-xs text-slate-500 font-semibold">Naqd pul tushumi</div>
          <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">
            {Number(pb.cash).toLocaleString()} so'm
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Hozirgi smena kassasida</div>
        </div>

        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
          <div className="text-xs text-slate-500 font-semibold">Karta & Onlayn tushum</div>
          <div className="text-2xl font-black text-[#0084FF] mt-1 font-mono">
            {Number(pb.card + pb.online).toLocaleString()} so'm
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Bank hisobiga tushgan</div>
        </div>

        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
          <div className="text-xs text-slate-500 font-semibold">Jami Kunlik Tushum</div>
          <div className="text-2xl font-black text-[#172B4D] mt-1 font-mono">
            {Number(pb.total).toLocaleString()} so'm
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Barcha to'lovlar</div>
        </div>
      </div>

      {/* Shifts Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-800">Smenalar jurnali</h4>
            <p className="text-xs text-slate-500">Ixtiyoriy smenani bosing: uning tushumi, qaysi shifokorga to'lov qilingani va Excelga yuklab olish imkoni ochiladi</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Smena ID</th>
                <th className="py-3 px-3">Kassir</th>
                <th className="py-3 px-3">Ochilgan vaqti</th>
                <th className="py-3 px-3">Yopilgan vaqti</th>
                <th className="py-3 px-3">Boshlang'ich qoldiq</th>
                <th className="py-3 px-3">Jami tushum</th>
                <th className="py-3 px-3">Holat</th>
                <th className="py-3 px-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allShiftsList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-slate-400">Smenalar mavjud emas</td>
                </tr>
              ) : (
                allShiftsList.map((s: any) => (
                  <tr 
                    key={s.id} 
                    onClick={() => onOpenShiftDetails(s)}
                    className="hover:bg-blue-50/70 cursor-pointer transition-colors group"
                    title="Batafsil ko'rish uchun bosing"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-blue-600 group-hover:underline">{s.id}</td>
                    <td className="py-3 px-3 font-bold text-slate-800 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.cashier_name || 'Kassir'}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">
                      {s.opened_at ? new Date(s.opened_at).toLocaleString('uz-UZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '-'}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">
                      {s.closed_at ? new Date(s.closed_at).toLocaleString('uz-UZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '-'}
                    </td>
                    <td className="py-3 px-3 font-mono">{Number(s.opening_balance || 0).toLocaleString()} so'm</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600">
                      {Number(s.total_received || 0).toLocaleString()} so'm
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        s.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {s.status === 'OPEN' ? 'Ochiq' : 'Yopilgan'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => onOpenShiftDetails(s)}
                          className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                          title="Hisobot va shifokorlar tushumi"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Tafsilotlar</span>
                        </button>
                        {s.status === 'OPEN' && (
                          <button
                            onClick={() => onOpenCloseShift(s)}
                            className="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Smenani yopish"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Yopish</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
