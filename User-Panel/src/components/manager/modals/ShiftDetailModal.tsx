import React from 'react';
import { X, BarChart3, Stethoscope, Ticket, FileSpreadsheet, Download, CheckCircle2 } from 'lucide-react';

interface ShiftDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftDetails: any;
  isLoading: boolean;
  onExportExcel: (shiftDetails: any) => void;
}

export const ShiftDetailModal: React.FC<ShiftDetailModalProps> = ({
  isOpen,
  onClose,
  shiftDetails,
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
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
              <BarChart3 className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">Smena Tafsilotlari & Moliyaviy Hisobot</h3>
                {shiftDetails?.shift && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    shiftDetails.shift.status === 'OPEN' ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-white'
                  }`}>
                    {shiftDetails.shift.status === 'OPEN' ? 'Ochiq smena' : 'Yopilgan smena'}
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-200/90 mt-0.5">
                ID: #{shiftDetails?.shift?.id || ''} • Kassir: {shiftDetails?.shift?.cashier_name || 'Kassir'} • {shiftDetails?.shift?.opened_at ? new Date(shiftDetails.shift.opened_at).toLocaleDateString('uz-UZ') : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {shiftDetails && (
              <button
                onClick={() => onExportExcel(shiftDetails)}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
                title="Excel fayl sifatida yuklab olish"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excelga yuklab olish</span>
              </button>
            )}
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
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-500 font-semibold">Smena tushumlari va shifokorlar hisoboti yuklanmoqda...</p>
            </div>
          ) : shiftDetails ? (
            <>
              {/* Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200/70 rounded-2xl">
                  <div className="text-[11px] font-bold text-emerald-800">Jami Tushum</div>
                  <div className="text-lg font-black text-emerald-700 font-mono mt-1">
                    {Number(shiftDetails.summary?.totalReceived || 0).toLocaleString()} so'm
                  </div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">
                    {shiftDetails.summary?.paymentsCount || 0} ta to'lov cheki
                  </div>
                </div>

                <div className="p-3.5 bg-blue-50 border border-blue-200/70 rounded-2xl">
                  <div className="text-[11px] font-bold text-blue-800">Naqd Pul Tushumi</div>
                  <div className="text-lg font-black text-blue-700 font-mono mt-1">
                    {Number(shiftDetails.summary?.cashTotal || 0).toLocaleString()} so'm
                  </div>
                  <div className="text-[10px] text-blue-600 mt-0.5">Kassaga kirim qilingan</div>
                </div>

                <div className="p-3.5 bg-purple-50 border border-purple-200/70 rounded-2xl">
                  <div className="text-[11px] font-bold text-purple-800">Karta & Onlayn</div>
                  <div className="text-lg font-black text-purple-700 font-mono mt-1">
                    {Number(shiftDetails.summary?.cardTotal || 0).toLocaleString()} so'm
                  </div>
                  <div className="text-[10px] text-purple-600 mt-0.5">Terminal orqali</div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="text-[11px] font-bold text-slate-700">Kassa Balansi</div>
                  <div className="text-xs font-mono font-bold text-slate-800 mt-1">
                    Boshlang'ich: {Number(shiftDetails.shift?.opening_balance || 0).toLocaleString()} so'm
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                    Yakuniy: {Number(shiftDetails.shift?.closing_balance || 0).toLocaleString()} so'm
                  </div>
                </div>
              </div>

              {/* Section 1: Qaysi shifokor uchun to'lov qilingan (Doctor breakdown) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Qaysi shifokor uchun to'lov qilingan (Shifokorlar taqsimoti)
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    Jami: {shiftDetails.doctorBreakdown?.length || 0} nafar shifokor
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-3">№</th>
                        <th className="py-2.5 px-3">Shifokor F.I.Sh.</th>
                        <th className="py-2.5 px-3">Mutaxassislik</th>
                        <th className="py-2.5 px-3 text-center">Talon / Qabul</th>
                        <th className="py-2.5 px-3 text-right">Tushgan Summa</th>
                        <th className="py-2.5 px-3">Ulushi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {shiftDetails.doctorBreakdown?.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400">
                            Ushbu smena davomida shifokorlar uchun qabullar qayd etilmagan
                          </td>
                        </tr>
                      ) : (
                        shiftDetails.doctorBreakdown?.map((doc: any, idx: number) => {
                          const totalDocsAmount = shiftDetails.doctorBreakdown.reduce((acc: number, d: any) => acc + (d.totalAmount || 0), 0) || 1;
                          const pct = Math.round((doc.totalAmount / totalDocsAmount) * 100);
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-bold text-slate-800 flex items-center gap-1.5">
                                <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                                <span>{doc.doctorName}</span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  {doc.specialtyName}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold font-mono text-slate-700">
                                {doc.ticketCount} ta
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                                {Number(doc.totalAmount).toLocaleString()} so'm
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-500 font-mono">{pct}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 2: Smenadagi barcha to'lovlar ro'yxati */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <Ticket className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Smenadagi barcha to'lov cheklari (Reestr)
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    {shiftDetails.payments?.length || 0} ta chek
                  </span>
                </div>

                <div className="overflow-x-auto max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Chek ID</th>
                        <th className="py-2.5 px-3">Bemor F.I.Sh.</th>
                        <th className="py-2.5 px-3">To'lov Turi</th>
                        <th className="py-2.5 px-3">Summa</th>
                        <th className="py-2.5 px-3">Vaqti</th>
                        <th className="py-2.5 px-3">Izoh / Talonlar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {shiftDetails.payments?.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400">To'lovlar topilmadi</td>
                        </tr>
                      ) : (
                        shiftDetails.payments?.map((p: any) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{p.receipt_number || p.id}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-800">{p.patient_name || '-'}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.method === 'CASH' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {p.method === 'CASH' ? 'Naqd' : 'Karta'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {Number(p.amount).toLocaleString()} so'm
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                              {p.created_at ? new Date(p.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 text-[11px]">{p.notes || '-'}</td>
                          </tr>
                        ))
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
            <span>Hisobot real PostgreSQL bazasidan shakllantirilgan</span>
          </div>
          <div className="flex items-center gap-2">
            {shiftDetails && (
              <button
                onClick={() => onExportExcel(shiftDetails)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Excel (.csv)</span>
              </button>
            )}
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

