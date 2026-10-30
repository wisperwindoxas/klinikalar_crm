import React from 'react';
import { DoorOpen, Plus, Layers, Search, Edit2, Trash2 } from 'lucide-react';

interface ManagerCabinetsTabProps {
  cabinetsList: any[];
  doctorsList: any[];
  cabinetFloorFilter: string;
  setCabinetFloorFilter: (val: string) => void;
  cabinetSearch: string;
  setCabinetSearch: (val: string) => void;
  onAddNewCabinet: () => void;
  onEditCabinet: (cab: any) => void;
  onDeleteCabinet: (cab: any) => void;
}

export const ManagerCabinetsTab: React.FC<ManagerCabinetsTabProps> = ({
  cabinetsList,
  doctorsList,
  cabinetFloorFilter,
  setCabinetFloorFilter,
  cabinetSearch,
  setCabinetSearch,
  onAddNewCabinet,
  onEditCabinet,
  onDeleteCabinet,
}) => {
  return (
    <div className="space-y-5 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#172B4D]">Klinika Kabinetlari va Qavatlar</h3>
              <p className="text-xs text-slate-500">Xonalar ro‘yxati (spisok), qavatlar taqsimoti va shifokorlar birikmasi</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onAddNewCabinet}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-blue-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi kabinet</span>
          </button>
        </div>
      </div>

      {/* Filters & Floor Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCabinetFloorFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              cabinetFloorFilter === 'ALL'
                ? 'bg-[#172B4D] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Barcha qavatlar ({cabinetsList.length})
          </button>
          {Array.from(new Set(cabinetsList.map(c => Number(c.floor) || 1)))
            .sort((a, b) => a - b)
            .map(fl => {
              const count = cabinetsList.filter(c => (Number(c.floor) || 1) === fl).length;
              return (
                <button
                  key={fl}
                  onClick={() => setCabinetFloorFilter(String(fl))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    cabinetFloorFilter === String(fl)
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{fl}-qavat</span>
                  <span className="opacity-70 text-[10px]">({count})</span>
                </button>
              );
            })}
        </div>

        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Kabinet yoki nom qidirish..."
            value={cabinetSearch}
            onChange={e => setCabinetSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Cabinets Spisok (Table) */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Xona raqami</th>
              <th className="py-3 px-4">Kabinet nomi va bo'limi</th>
              <th className="py-3 px-4">Qavat</th>
              <th className="py-3 px-4">Biriktirilgan shifokor(lar)</th>
              <th className="py-3 px-4">Holati</th>
              <th className="py-3 px-4 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cabinetsList
              .filter(cab => {
                if (cabinetFloorFilter !== 'ALL' && String(cab.floor || 1) !== cabinetFloorFilter) return false;
                if (!cabinetSearch) return true;
                const q = cabinetSearch.toLowerCase();
                const num = String(cab.number || cab.room_number || '').toLowerCase();
                const name = String(cab.name || '').toLowerCase();
                const dept = String(cab.department || '').toLowerCase();
                return num.includes(q) || name.includes(q) || dept.includes(q);
              })
              .map((cab: any) => {
                const cabNum = cab.number || cab.room_number || '';
                const assignedDocs = doctorsList.filter(
                  d => d.cabinet_id === cab.id || String(d.room_number) === String(cabNum)
                );

                return (
                  <tr key={cab.id} className="hover:bg-blue-50/40 transition">
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-xl bg-blue-50 text-blue-700 font-mono font-black text-sm border border-blue-200/80 shadow-2xs">
                        {cabNum || '-'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 text-xs">
                        {cab.name || `${cabNum}-kabinet`}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {cab.department || 'Ambulatoriya'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        <span>{cab.floor || 1}-qavat</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {assignedDocs.length > 0 ? (
                        <div className="space-y-1">
                          {assignedDocs.map((doc: any) => (
                            <div key={doc.id} className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                                {doc.display_name?.substring(0, 2).toUpperCase() || 'DR'}
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 text-xs">{doc.display_name}</span>
                                <span className="text-[10px] text-slate-400 ml-1.5">({doc.specialty_name || 'Shifokor'})</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Shifokor biriktirilmagan</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Faol
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEditCabinet(cab)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Tahrirlash"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteCabinet(cab)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
