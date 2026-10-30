import React from 'react';
import { 
  FileText, FileSpreadsheet, RefreshCw, Ticket, CreditCard, Layers, 
  Search, SlidersHorizontal, User, Eye 
} from 'lucide-react';

interface ManagerAuditTabProps {
  auditLogsList: any[];
  auditSearch: string;
  setAuditSearch: (val: string) => void;
  auditActionFilter: string;
  setAuditActionFilter: (val: string) => void;
  onRefresh: () => void;
  onExportExcel: () => void;
  onSelectAuditItem: (item: any) => void;
}

export const ManagerAuditTab: React.FC<ManagerAuditTabProps> = ({
  auditLogsList,
  auditSearch,
  setAuditSearch,
  auditActionFilter,
  setAuditActionFilter,
  onRefresh,
  onExportExcel,
  onSelectAuditItem,
}) => {
  const filteredLogs = auditLogsList.filter((log: any) => {
    const matchesSearch = !auditSearch ||
      (log.actor_name && log.actor_name.toLowerCase().includes(auditSearch.toLowerCase())) ||
      (log.patient_name && log.patient_name.toLowerCase().includes(auditSearch.toLowerCase())) ||
      (log.doctor_name && log.doctor_name.toLowerCase().includes(auditSearch.toLowerCase())) ||
      (log.object_reference && log.object_reference.toLowerCase().includes(auditSearch.toLowerCase())) ||
      (log.action && log.action.toLowerCase().includes(auditSearch.toLowerCase())) ||
      (log.id && log.id.toLowerCase().includes(auditSearch.toLowerCase()));

    const matchesFilter =
      auditActionFilter === 'ALL' ||
      (auditActionFilter === 'QUEUE_CALL' && log.log_type === 'QUEUE_CALL') ||
      (auditActionFilter === 'PAYMENT' && log.log_type === 'PAYMENT') ||
      (auditActionFilter === 'SHIFT' && log.log_type === 'SHIFT') ||
      (auditActionFilter === 'SYSTEM' && log.log_type === 'SYSTEM') ||
      (auditActionFilter === 'COMPLETE' && log.action === 'COMPLETE') ||
      (auditActionFilter === 'CALL_NEXT' && (log.action === 'CALL_NEXT' || log.action === 'RECALL'));

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-medical-gradient text-white p-7 rounded-3xl border border-white/25 shadow-xl shadow-medical-blue/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-white/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-56 h-56 bg-medical-blue-dark/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-md border border-white/30 shrink-0">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5 drop-shadow-xs">
                  Tizim Audit Jurnali & Nazorati
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30">
                    PostgreSQL 16
                  </span>
                </h2>
                <p className="text-xs text-white/95 mt-0.5 leading-relaxed">
                  Xavfsizlik, xodimlar harakati, navbat chaqiruvlari, kassa to'lovlari va tizim sozlamalari auditi
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/95 mt-3">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-medical-turquoise animate-pulse" />
                Audit Oqimi Faol
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-medium shadow-xs">
                Jami: {auditLogsList.length} ta yozuv
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-medium shadow-xs">
                Ko'rsatilmoqda: {filteredLogs.length} ta
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onExportExcel}
              className="px-4 py-2.5 rounded-2xl border border-white/30 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-medical-turquoise" />
              Excelga eksport
            </button>
            <button
              type="button"
              onClick={onRefresh}
              className="px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-medical-blue-dark text-xs font-black transition flex items-center gap-2 shadow-lg shadow-medical-blue-dark/20 border border-white/80 active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-medical-blue-dark stroke-[2.5]" />
              Yangilash
            </button>
          </div>
        </div>
      </div>

      {/* 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Jami Yozuvlar</p>
            <p className="text-base font-black text-slate-800">{auditLogsList.length}</p>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">PostgreSQL audit xotirasida</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Ticket className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Navbat & Ko'riklar</p>
            <p className="text-base font-black text-blue-700">
              {auditLogsList.filter(l => l.log_type === 'QUEUE_CALL').length}
            </p>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">Chaqiruv, qayta chaqiruv, yakun</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-medical-turquoise-dark" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Kassa & To'lovlar</p>
            <p className="text-base font-black text-slate-800">
              {auditLogsList.filter(l => l.log_type === 'PAYMENT').length}
            </p>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">Kassada qabul qilingan to'lovlar</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-purple-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Smena & Tizim</p>
            <p className="text-base font-black text-purple-700">
              {auditLogsList.filter(l => l.log_type === 'SHIFT' || l.log_type === 'SYSTEM').length}
            </p>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">Smena yopilishi va sozlamalar</p>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Talon raqami, bemor, shifokor, amal yoki xodim bo'yicha qidiruv..."
            value={auditSearch}
            onChange={e => setAuditSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20 outline-none transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'ALL', label: 'Barchasi' },
            { id: 'QUEUE_CALL', label: 'Navbat chaqiruvlari' },
            { id: 'COMPLETE', label: 'Qabul yakunlandi' },
            { id: 'PAYMENT', label: 'Kassa to\'lovlari' },
            { id: 'SHIFT', label: 'Smenalar' },
            { id: 'SYSTEM', label: 'Tizim sozlamalari' }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setAuditActionFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                auditActionFilter === f.id
                  ? 'bg-medical-blue text-white shadow-sm shadow-medical-blue/25'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* AUDIT TABLE (JADVAL KO'RINISHIDA) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">Vaqt & Sana</th>
                <th className="py-3.5 px-4">Amal / Hodisa turi</th>
                <th className="py-3.5 px-4">Mas'ul xodim (Ijrochi)</th>
                <th className="py-3.5 px-4">Bemor / Ob'ekt</th>
                <th className="py-3.5 px-4">Shifokor & Xona</th>
                <th className="py-3.5 px-4 text-center">Holati</th>
                <th className="py-3.5 px-4 text-right">Tafsilotlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                    <p className="font-bold text-slate-600">Audit yozuvlari topilmadi</p>
                    <p className="text-[11px] mt-0.5">Qidiruv parametrlarini o'zgartiring yoki filterni tozalang</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: any, idx: number) => {
                  const isCall = log.log_type === 'QUEUE_CALL';
                  const isPay = log.log_type === 'PAYMENT';
                  const isShift = log.log_type === 'SHIFT';
                  const isSys = log.log_type === 'SYSTEM';

                  return (
                    <tr
                      key={log.id || idx}
                      onClick={() => onSelectAuditItem(log)}
                      className="hover:bg-indigo-50/40 cursor-pointer transition group"
                    >
                      <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800">
                          {log.timestamp ? new Date(log.timestamp).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {log.timestamp ? new Date(log.timestamp).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isCall && (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                            log.action === 'COMPLETE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            log.action === 'RECALL' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            log.action === 'CANCEL' ? 'bg-red-50 text-red-700 border border-red-200' :
                            'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            <Ticket className="w-3 h-3" />
                            {log.action === 'COMPLETE' ? 'Qabul yakunlandi' :
                             log.action === 'RECALL' ? 'Qayta chaqiruv' :
                             log.action === 'CALL_NEXT' ? 'Navbat chaqirildi' :
                             log.action === 'START' ? 'Ko\'rik boshlandi' :
                             log.action === 'CANCEL' ? 'Talon bekor qilindi' : log.action}
                          </span>
                        )}
                        {isPay && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">
                            <CreditCard className="w-3 h-3" />
                            Kassa to'lovi ({Number(log.amount || 0).toLocaleString('uz-UZ')} so'm)
                          </span>
                        )}
                        {isShift && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <Layers className="w-3 h-3" />
                            {log.action === 'SMENA_YOPILDI' ? 'Smena yopildi' : 'Smena ochildi'}
                          </span>
                        )}
                        {isSys && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <SlidersHorizontal className="w-3 h-3" />
                            Sozlamalar yangilandi
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {log.actor_name || 'Tizim'}
                        </div>
                        <span className="text-[10px] text-slate-400 ml-5">
                          {log.actor_role || 'Xodim'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {log.patient_name ? (
                          <div>
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              {log.patient_name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono ml-3">
                              Talon: {log.object_reference || '-'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">
                            {log.object_reference || 'Tizim operatsiyasi'}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {log.doctor_name ? (
                          <div>
                            <div className="font-bold text-slate-700">{log.doctor_name}</div>
                            <div className="text-[10px] text-slate-400">
                              {log.room_number ? log.room_number + '-xona' : ''} {log.specialty_name ? '• ' + log.specialty_name : ''}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'COMPLETED' || log.status === 'PAID' || log.status === 'SUCCESS' || log.status === 'CLOSED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {log.status || 'OK'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAuditItem(log);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white transition text-[11px] font-bold inline-flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          Tahlil
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

