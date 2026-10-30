import React from 'react';
import { 
  Users, Stethoscope, Wallet, Activity, Search, FileSpreadsheet, 
  Plus, Phone, Eye, Edit2, Trash2 
} from 'lucide-react';
import { DateRangeFilter, DatePreset, isDateInRange } from '../../DateRangeFilter';

interface ManagerPatientsTabProps {
  patientsList: any[];
  patientDatePreset: DatePreset;
  setPatientDatePreset: (preset: DatePreset) => void;
  patientStartDate: string;
  setPatientStartDate: (date: string) => void;
  patientEndDate: string;
  setPatientEndDate: (date: string) => void;
  patientSearch: string;
  setPatientSearch: (val: string) => void;
  visibleManagerPatientsCount: number;
  setVisibleManagerPatientsCount: React.Dispatch<React.SetStateAction<number>>;
  onExportExcel: () => void;
  onOpenNewPatient: () => void;
  onOpenPatientModal: (patient: any, tab: any) => void;
  onDeletePatient: (patient: any) => void;
}

export const ManagerPatientsTab: React.FC<ManagerPatientsTabProps> = ({
  patientsList,
  patientDatePreset,
  setPatientDatePreset,
  patientStartDate,
  setPatientStartDate,
  patientEndDate,
  setPatientEndDate,
  patientSearch,
  setPatientSearch,
  visibleManagerPatientsCount,
  setVisibleManagerPatientsCount,
  onExportExcel,
  onOpenNewPatient,
  onOpenPatientModal,
  onDeletePatient,
}) => {
  const filteredPatients = patientsList.filter(p => {
    const matchesSearch = !patientSearch || 
      p.full_name?.toLowerCase().includes(patientSearch.toLowerCase()) || 
      p.phone?.includes(patientSearch) ||
      p.patient_number?.includes(patientSearch);
    const matchesDate = isDateInRange(p.created_at, patientDatePreset, patientStartDate, patientEndDate);
    return matchesSearch && matchesDate;
  });

  const totalVisitsCount = filteredPatients.reduce((acc, p) => acc + Number(p.total_visits || 0), 0);
  const totalRevenueCount = filteredPatients.reduce((acc, p) => acc + Number(p.total_paid || 0), 0);
  const activePatientsCount = filteredPatients.filter(p => Number(p.total_visits || 0) > 0).length;

  return (
    <div className="space-y-6">
      {/* DATE RANGE FILTER (Bugun, Kecha, 1 hafta, 1 oy, Barchasi) */}
      <DateRangeFilter
        preset={patientDatePreset}
        startDate={patientStartDate}
        endDate={patientEndDate}
        onPresetChange={setPatientDatePreset}
        onDateChange={(start, end) => {
          setPatientStartDate(start);
          setPatientEndDate(end);
        }}
        totalCount={filteredPatients.length}
        countLabel="nafar bemor"
      />

      {/* TOP STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Jami Bemorlar</span>
            <h4 className="text-xl font-black text-slate-800">{filteredPatients.length} <span className="text-xs font-medium text-slate-400">nafar</span></h4>
            <span className="text-[11px] text-emerald-600 font-bold">EMR kartasi mavjud</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Jami Qabullar (Tashriflar)</span>
            <h4 className="text-xl font-black text-slate-800">
              {totalVisitsCount}{' '}
              <span className="text-xs font-medium text-slate-400">marta</span>
            </h4>
            <span className="text-[11px] text-indigo-600 font-bold">Barcha shifokorlar qabuli</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Jami To'lovlar (Klinika Kirimi)</span>
            <h4 className="text-lg font-black text-emerald-600 font-mono">
              {totalRevenueCount.toLocaleString()}{' '}
              <span className="text-xs font-sans text-slate-500 font-semibold">so'm</span>
            </h4>
            <span className="text-[11px] text-emerald-700 font-bold">Bemorlar to'lovlari</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Qabulda Bo'lgan Bemorlar</span>
            <h4 className="text-xl font-black text-slate-800">
              {activePatientsCount}{' '}
              <span className="text-xs font-medium text-slate-400">ta</span>
            </h4>
            <span className="text-[11px] text-purple-600 font-bold">
              {filteredPatients.length > 0
                ? `${Math.round((activePatientsCount / filteredPatients.length) * 100)}% faollik`
                : '0% faollik'}
            </span>
          </div>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="space-y-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[#172B4D]">Bemorlar Bazasi (EMR)</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                {filteredPatients.length} bemor
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Bemorga bosing: qaysi shifokorda necha marta bo'lganligi, to'lovlari va oxirgi qabuli to'liq chiqadi
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Ism, telefon yoki karta №..."
                value={patientSearch}
                onChange={e => setPatientSearch(e.target.value)}
                className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>
            <button
              onClick={onExportExcel}
              className="px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer"
              title="Barcha bemorlar ro'yxatini Excel (.xlsx) formatida yuklab olish"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Excelga yuklash</span>
            </button>
            <button
              onClick={onOpenNewPatient}
              className="px-4 py-2 bg-[#0084FF] text-white text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-blue-600 transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi bemor</span>
            </button>
          </div>
        </div>

        <div 
          className="overflow-x-auto rounded-2xl border border-slate-100 max-h-[620px] overflow-y-auto"
          onScroll={(e) => {
            const target = e.currentTarget;
            if (target.scrollTop + target.clientHeight >= target.scrollHeight - 60) {
              setVisibleManagerPatientsCount(prev => prev + 15);
            }
          }}
        >
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider sticky top-0 z-10">
                <th className="py-3 px-3.5">Karta №</th>
                <th className="py-3 px-3.5">Bemor F.I.Sh.</th>
                <th className="py-3 px-3.5">Telefon</th>
                <th className="py-3 px-3.5">Oxirgi Shifokor Ko'rigi</th>
                <th className="py-3 px-3.5 text-center">Qabullar</th>
                <th className="py-3 px-3.5 text-right">Jami To'lov</th>
                <th className="py-3 px-3.5">Yashash Manzili</th>
                <th className="py-3 px-3.5 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients
                .slice(0, visibleManagerPatientsCount)
                .map((p: any) => {
                const lastDoc = p.last_visit;
                const visitCount = Number(p.total_visits || 0);
                const totalPaid = Number(p.total_paid || 0);

                return (
                  <tr
                    key={p.id}
                    onClick={() => onOpenPatientModal(p, 'OVERVIEW')}
                    className="hover:bg-blue-50/40 cursor-pointer transition group"
                  >
                    <td className="py-3.5 px-3.5 font-mono font-bold text-slate-700">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 group-hover:bg-blue-100 text-slate-800 group-hover:text-blue-800 transition">
                        #{p.patient_number || p.id?.substring(0, 6)}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {p.full_name?.charAt(0)?.toUpperCase() || 'B'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 group-hover:text-blue-600 transition flex items-center gap-1.5">
                            <span>{p.full_name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-600">
                              {p.gender === 'FEMALE' ? 'Ayol' : 'Erkak'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {p.birth_date ? `Tug'ilgan: ${p.birth_date.substring(0, 10)}` : "Tug'ilgan sana kiritilmagan"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5 font-mono text-slate-700 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.phone || '-'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5">
                      {lastDoc ? (
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Stethoscope className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="truncate max-w-[180px]">{lastDoc.doctor_name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span className="text-blue-600 font-medium">{lastDoc.specialty_name || 'Shifokor'}</span>
                            <span>•</span>
                            <span>{lastDoc.date || (lastDoc.time ? lastDoc.time.substring(0, 10) : '')}</span>
                            {lastDoc.cabinet_number && (
                              <span className="px-1 bg-slate-100 rounded text-[10px] font-mono">Kab: {lastDoc.cabinet_number}</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
                          Hali qabulda bo'lmagan
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${
                        visitCount > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Activity className="w-3 h-3" />
                        {visitCount} ta qabul
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono font-bold text-xs">
                      <span className={totalPaid > 0 ? 'text-emerald-600 font-extrabold' : 'text-slate-400'}>
                        {totalPaid > 0 ? `${totalPaid.toLocaleString()} so'm` : "0 so'm"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 text-slate-500 max-w-xs truncate">
                      {p.address || p.notes || '-'}
                    </td>
                    <td className="py-3.5 px-3.5 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenPatientModal(p, 'OVERVIEW')}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="Tarix va ma'lumotlar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenPatientModal(p, 'EDIT')}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Tahrirlash"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeletePatient(p)}
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
          {visibleManagerPatientsCount < filteredPatients.length && (
            <div className="p-3 text-center border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setVisibleManagerPatientsCount(prev => prev + 15)}
                className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 transition shadow-sm cursor-pointer"
              >
                Qolgan bemorlarni yuklash ({visibleManagerPatientsCount} / {filteredPatients.length})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
