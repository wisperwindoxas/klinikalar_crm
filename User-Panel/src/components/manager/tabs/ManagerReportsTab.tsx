import React from 'react';
import { Sparkles, Phone, ArrowRight } from 'lucide-react';
import { DateRangeFilter, DatePreset, isDateInRange } from '../../DateRangeFilter';

interface ManagerReportsTabProps {
  allTicketsList: any[];
  paymentsList: any[];
  doctorsList: any[];
  reportDatePreset: DatePreset;
  setReportDatePreset: (preset: DatePreset) => void;
  reportStartDate: string;
  setReportStartDate: (date: string) => void;
  reportEndDate: string;
  setReportEndDate: (date: string) => void;
  onOpenDoctorReport: (doctor: any) => void;
}

export const ManagerReportsTab: React.FC<ManagerReportsTabProps> = ({
  allTicketsList,
  paymentsList,
  doctorsList,
  reportDatePreset,
  setReportDatePreset,
  reportStartDate,
  setReportStartDate,
  reportEndDate,
  setReportEndDate,
  onOpenDoctorReport,
}) => {
  const reportFilteredTickets = allTicketsList.filter(t => 
    isDateInRange(t.created_at || t.queue_date, reportDatePreset, reportStartDate, reportEndDate)
  );

  const reportFilteredPayments = paymentsList.filter(p => 
    isDateInRange(p.created_at, reportDatePreset, reportStartDate, reportEndDate)
  );

  const reportTotal = reportFilteredTickets.length;
  const reportWaiting = reportFilteredTickets.filter(t => t.status === 'WAITING').length;
  const reportCompleted = reportFilteredTickets.filter(t => t.status === 'COMPLETED').length;

  const repTotalSum = reportFilteredPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const repCashSum = reportFilteredPayments.filter(p => p.method === 'CASH').reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const repCardSum = reportFilteredPayments.filter(p => p.method === 'CARD').reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  const doctorPerformanceList = (doctorsList || []).map((doc: any) => {
    const docTickets = reportFilteredTickets.filter((t: any) => 
      t.doctor_id === doc.id || 
      t.doctor_name?.toLowerCase() === doc.display_name?.toLowerCase() ||
      t.doctor_name?.toLowerCase() === doc.fullName?.toLowerCase()
    );
    const waiting = docTickets.filter((t: any) => t.status === 'WAITING').length;
    const inProgress = docTickets.filter((t: any) => t.status === 'IN_PROGRESS' || t.status === 'CALLED').length;
    const completed = docTickets.filter((t: any) => t.status === 'COMPLETED').length;

    const docPayments = reportFilteredPayments.filter((p: any) => {
      if (p.doctor_id === doc.id) return true;
      if (Array.isArray(p.related_tickets)) {
        return p.related_tickets.some((rt: any) => 
          rt.doctor_id === doc.id || 
          rt.doctor_name?.toLowerCase() === doc.display_name?.toLowerCase()
        );
      }
      return false;
    });
    const totalRev = docPayments.reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0);

    return {
      ...doc,
      waiting,
      in_progress: inProgress,
      completed,
      total_tickets: docTickets.length,
      total_revenue: totalRev
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#172B4D]">Klinika Umumiy Hisobotlari</h3>
          <p className="text-xs text-slate-500">Tibbiy, moliyaviy va shifokorlar bo'yicha real vaqt ko'rsatkichlari</p>
        </div>
      </div>

      {/* DATE RANGE FILTER (Bugun, Kecha, 1 hafta, 1 oy, Barchasi) */}
      <DateRangeFilter
        preset={reportDatePreset}
        startDate={reportStartDate}
        endDate={reportEndDate}
        onPresetChange={setReportDatePreset}
        onDateChange={(start, end) => {
          setReportStartDate(start);
          setReportEndDate(end);
        }}
        totalCount={reportTotal}
        countLabel="ta qabul"
      />

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200/90 rounded-3xl shadow-sm">
          <div className="text-xs font-bold text-blue-600">Umumiy qabullar</div>
          <div className="text-3xl font-black text-[#172B4D] mt-1 font-mono">{reportTotal} ta</div>
          <div className="text-[11px] text-slate-400 mt-1">Barcha shifokorlarga</div>
        </div>

        <div className="p-5 bg-white border border-slate-200/90 rounded-3xl shadow-sm">
          <div className="text-xs font-bold text-amber-600">Kutilayotgan navbatlar</div>
          <div className="text-3xl font-black text-amber-600 mt-1 font-mono">{reportWaiting} ta</div>
          <div className="text-[11px] text-slate-400 mt-1">Zalda kutmoqda</div>
        </div>

        <div className="p-5 bg-white border border-slate-200/90 rounded-3xl shadow-sm">
          <div className="text-xs font-bold text-purple-600">Qabul yakunlangan</div>
          <div className="text-3xl font-black text-purple-600 mt-1 font-mono">{reportCompleted} ta</div>
          <div className="text-[11px] text-slate-400 mt-1">Xizmat ko'rsatildi</div>
        </div>

        <div className="p-5 bg-white border border-slate-200/90 rounded-3xl shadow-sm">
          <div className="text-xs font-bold text-emerald-600">Jami tushum (Kassa)</div>
          <div className="text-3xl font-black text-emerald-700 mt-1 font-mono">
            {repTotalSum.toLocaleString()} so'm
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Naqd: {repCashSum.toLocaleString()} | Karta: {repCardSum.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Doctors Performance Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-[#172B4D]">Shifokorlar ish yuki, qabullar va tushumlar hisoboti</h4>
            <p className="text-xs text-slate-500">Ixtiyoriy shifokor ustiga bosing: uning kutayotgan bemorlari, qabul qilganlari, tushumi va bemorlar jurnali ochiladi</p>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 flex items-center gap-1.5 self-start">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Real vaqt statistikasi</span>
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Shifokor F.I.Sh.</th>
                <th className="py-3 px-4">Mutaxassislik</th>
                <th className="py-3 px-4">Kabinet</th>
                <th className="py-3 px-4">Kutayotganlar</th>
                <th className="py-3 px-4">Qabuldagilar</th>
                <th className="py-3 px-4">Qabul qilganlar</th>
                <th className="py-3 px-4">Shu shifokordan tushum</th>
                <th className="py-3 px-4 text-right">Batafsil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {doctorPerformanceList.map((doc: any) => {
                const waiting = Number(doc.waiting || 0);
                const inProgress = Number(doc.in_progress || 0);
                const completed = Number(doc.completed || 0);
                const totalRev = Number(doc.total_revenue || 0);

                return (
                  <tr
                    key={doc.id}
                    onClick={() => onOpenDoctorReport(doc)}
                    className="hover:bg-blue-50/60 cursor-pointer transition group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition">
                          {doc.display_name?.substring(0, 2).toUpperCase() || 'DR'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-xs group-hover:text-blue-600 transition">
                            {doc.display_name}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{doc.phone || '+998 90 000 00 00'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                        {doc.specialty_name || 'Umumiy'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-mono font-bold text-xs border border-blue-200/60">
                        {doc.room_number || doc.cabinet_number || '-'}-xona
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                        waiting > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {waiting} ta
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                        inProgress > 0 ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {inProgress} ta
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-100 text-emerald-800">
                        {completed} ta
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-black text-xs text-slate-900">
                        {totalRev.toLocaleString()} so'm
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDoctorReport(doc);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                      >
                        <span>Ko'rish</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
