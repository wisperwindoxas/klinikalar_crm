import React from 'react';
import { Search, Plus, MapPin, Edit2, Trash2 } from 'lucide-react';

interface ManagerDoctorsTabProps {
  doctorsList: any[];
  doctorSearch: string;
  setDoctorSearch: (val: string) => void;
  onAddNewDoctor: () => void;
  onEditDoctor: (doc: any) => void;
  onDeleteDoctor: (doc: any) => void;
}

export const ManagerDoctorsTab: React.FC<ManagerDoctorsTabProps> = ({
  doctorsList,
  doctorSearch,
  setDoctorSearch,
  onAddNewDoctor,
  onEditDoctor,
  onDeleteDoctor,
}) => {
  return (
    <div className="space-y-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#172B4D]">Klinika Shifokorlari (20+)</h3>
          <p className="text-xs text-slate-500">Menejer shifokorlarni qo'shish, o'zgartirish va o'chirish huquqiga ega</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Shifokor qidirish..."
              value={doctorSearch}
              onChange={e => setDoctorSearch(e.target.value)}
              className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium w-56"
            />
          </div>
          <button
            onClick={onAddNewDoctor}
            className="px-4 py-2 bg-[#0084FF] text-white text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-blue-600 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi shifokor</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
              <th className="py-3 px-3">Shifokor ismi & Logini</th>
              <th className="py-3 px-3">Mutaxassislik</th>
              <th className="py-3 px-3">Kabinet</th>
              <th className="py-3 px-3">Kutayotganlar</th>
              <th className="py-3 px-3">Holat</th>
              <th className="py-3 px-3 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {doctorsList
              .filter(d => !doctorSearch || d.display_name?.toLowerCase().includes(doctorSearch.toLowerCase()) || d.specialty_name?.toLowerCase().includes(doctorSearch.toLowerCase()))
              .map((doc: any) => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                      <span>{doc.display_name}</span>
                      <span className="text-[10px] bg-blue-50 text-blue-700 font-mono font-bold px-1.5 py-0.5 rounded border border-blue-200">
                        @{doc.login || doc.username || (doc.phone ? doc.phone : 'biriktirilmagan')}
                      </span>
                    </div>
                    {doc.address ? (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 max-w-xs truncate" title={doc.address}>
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{doc.address}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400">Manzil kiritilmagan</div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-semibold">{doc.specialty_name || 'Umumiy'}</td>
                  <td className="py-3 px-3 font-mono text-slate-700">{doc.cabinet_number || doc.room_number || '-'}-kabinet</td>
                  <td className="py-3 px-3 font-bold text-rose-600">{doc.waiting_count || 0} ta</td>
                  <td className="py-3 px-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      Faol
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEditDoctor(doc)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                        title="Tahrirlash"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteDoctor(doc)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
