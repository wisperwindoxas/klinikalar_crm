import React from 'react';
import { X, Sparkles, Users, FileSpreadsheet, Download, CheckCircle2 } from 'lucide-react';

interface DoctorPerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: any;
  isLoading: boolean;
  onExportExcel: (reportData: any) => void;
}

export const DoctorPerformanceModal: React.FC<DoctorPerformanceModalProps> = ({
  isOpen,
  onClose,
  reportData,
  isLoading,
  onExportExcel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner text-xl font-black">
              {reportData?.doctor?.display_name?.substring(0, 2).toUpperCase() || 'DR'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">
                  {reportData?.doctor?.display_name || 'Shifokor Hisoboti'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Shifokor
                </span>
              </div>
              <p className="text-xs text-blue-200/90 mt-0.5 flex items-center gap-3">
                <span>Mutaxassislik: <strong>{reportData?.doctor?.specialty_name || 'Umumiy'}</strong></span>
                <span>•</span>
                <span>Kabinet: <strong>{reportData?.doctor?.cabinet_number || reportData?.doctor?.room_number || '-'}-xona</strong></span>
                <span>•</span>
                <span>Tel: {reportData?.doctor?.phone || '+998 90 000 00 00'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onExportExcel(reportData)}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
              title="Shifokor hisobotini Excel formatida yuklab olish"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excelga yuklab olish</span>
            </button>
            <button 
              type="button"
              onClick={onClose} 
              className="p-2 hover:bg-white/15 rounded-xl text-white/80 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="py-16 text-center">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-500 font-semibold">Shifokorning navbatlari, qabullari va tushumi yuklanmoqda...</p>
            </div>
          ) : reportData ? (
            <>
              {/* 4 Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl">
                  <div className="text-[11px] font-bold text-amber-800">Kutayotgan Bemorlar</div>
                  <div className="text-2xl font-black text-amber-600 font-mono mt-1">
                    {reportData.stats?.waiting || 0} ta
                  </div>
                  <div className="text-[10px] text-amber-700/80 mt-0.5">Hozir zalda kutmoqda</div>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200/80 rounded-2xl">
                  <div className="text-[11px] font-bold text-purple-800">Qabul Jarayonida</div>
                  <div className="text-2xl font-black text-purple-600 font-mono mt-1">
                    {reportData.stats?.inProgress || 0} ta
                  </div>
                  <div className="text-[10px] text-purple-700/80 mt-0.5">Xonada ko'rikda</div>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl">
                  <div className="text-[11px] font-bold text-emerald-800">Qabul Qilingan Bemorlar</div>
                  <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
                    {reportData.stats?.completed || 0} ta
                  </div>
                  <div className="text-[10px] text-emerald-700/80 mt-0.5">Xizmat to'liq ko'rsatildi</div>
                </div>

                <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200/80 rounded-2xl">
                  <div className="text-[11px] font-bold text-indigo-900">Shu Shifokordan Tushum</div>
                  <div className="text-xl font-black text-indigo-700 font-mono mt-1">
                    {Number(reportData.stats?.totalRevenue || 0).toLocaleString()} so'm
                  </div>
                  <div className="text-[10px] text-indigo-600 mt-0.5">
                    Jami ro'yxat: {reportData.stats?.totalTickets || 0} ta bemor
                  </div>
                </div>
              </div>

              {/* Doctor's Patients & Tickets History Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Shifokor Qabulidagi Bemorlar Jurnali
                    </h4>
                  </div>
                  <span className="text-xs text-slate-400">
                    So'nggi 50 ta bemor ro'yxati
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Talon</th>
                        <th className="py-2.5 px-3">Bemor F.I.Sh.</th>
                        <th className="py-2.5 px-3">Telefon</th>
                        <th className="py-2.5 px-3">Xizmat</th>
                        <th className="py-2.5 px-3">Narxi</th>
                        <th className="py-2.5 px-3">To'lov</th>
                        <th className="py-2.5 px-3">Holati</th>
                        <th className="py-2.5 px-3">Vaqti</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {!reportData.tickets || reportData.tickets.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            Ushbu shifokorga biriktirilgan talonlar hozircha mavjud emas
                          </td>
                        </tr>
                      ) : (
                        reportData.tickets.map((t: any) => {
                          const isCompleted = t.status === 'COMPLETED';
                          const isCalled = t.status === 'CALLED';
                          const isInProg = t.status === 'IN_PROGRESS';
                          const isWaiting = t.status === 'WAITING';
                          const isCancelled = t.status === 'CANCELLED';

                          return (
                            <tr key={t.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-mono font-black text-xs border border-blue-200/80">
                                  {t.full_number}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-800">{t.patient_name || 'Bemor'}</td>
                              <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{t.patient_phone || '-'}</td>
                              <td className="py-2.5 px-3 text-slate-700">{t.service_name || 'Konsultatsiya'}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                {Number(t.price || 0).toLocaleString()} so'm
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  t.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {t.payment_status === 'PAID' ? "To'langan" : "Kutilmoqda"}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isCompleted ? 'bg-emerald-100 text-emerald-800' :
                                  isCalled ? 'bg-amber-100 text-amber-800 animate-pulse' :
                                  isInProg ? 'bg-purple-100 text-purple-800' :
                                  isWaiting ? 'bg-blue-100 text-blue-800' :
                                  isCancelled ? 'bg-rose-100 text-rose-800' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {isCompleted ? 'Yakunlangan' : isCalled ? 'Chaqirilmoqda' : isInProg ? 'Qabulda' : isWaiting ? 'Kutmoqda' : isCancelled ? 'Bekor qilingan' : t.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                                {t.issued_at ? new Date(t.issued_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '-'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Barcha ma'lumotlar real PostgreSQL bazasidan olindi</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onExportExcel(reportData)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Excel (.csv)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Yopish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

