import React from 'react';
import { 
  Banknote, FileSpreadsheet, Wallet, CreditCard, FileText, 
  Search, Phone, Check, Eye 
} from 'lucide-react';
import { DateRangeFilter, DatePreset, isDateInRange } from '../../DateRangeFilter';

interface ManagerPaymentsTabProps {
  paymentsList: any[];
  paymentDatePreset: DatePreset;
  setPaymentDatePreset: (preset: DatePreset) => void;
  paymentStartDate: string;
  setPaymentStartDate: (date: string) => void;
  paymentEndDate: string;
  setPaymentEndDate: (date: string) => void;
  paymentSearch: string;
  setPaymentSearch: (val: string) => void;
  paymentMethodFilter: string;
  setPaymentMethodFilter: (val: string) => void;
  visibleManagerPaymentsCount: number;
  setVisibleManagerPaymentsCount: React.Dispatch<React.SetStateAction<number>>;
  onExportExcel: () => void;
  onSelectPayment: (payment: any) => void;
}

export const ManagerPaymentsTab: React.FC<ManagerPaymentsTabProps> = ({
  paymentsList,
  paymentDatePreset,
  setPaymentDatePreset,
  paymentStartDate,
  setPaymentStartDate,
  paymentEndDate,
  setPaymentEndDate,
  paymentSearch,
  setPaymentSearch,
  paymentMethodFilter,
  setPaymentMethodFilter,
  visibleManagerPaymentsCount,
  setVisibleManagerPaymentsCount,
  onExportExcel,
  onSelectPayment,
}) => {
  const dateFilteredPayments = paymentsList.filter(p =>
    isDateInRange(p.created_at, paymentDatePreset, paymentStartDate, paymentEndDate)
  );

  const filteredPayments = dateFilteredPayments.filter(p => {
    const matchesSearch = !paymentSearch || 
      p.patient_name?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      p.receipt_number?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      (p.patient_phone && p.patient_phone.includes(paymentSearch)) ||
      (p.notes && p.notes.toLowerCase().includes(paymentSearch.toLowerCase())) ||
      (Array.isArray(p.related_tickets) && p.related_tickets.some((t: any) => 
        t.doctor_name?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
        t.specialty_name?.toLowerCase().includes(paymentSearch.toLowerCase())
      ));
    const matchesMethod = paymentMethodFilter === 'ALL' || p.method === paymentMethodFilter;
    return matchesSearch && matchesMethod;
  });

  const totalSum = dateFilteredPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const cashPayments = dateFilteredPayments.filter(p => p.method === 'CASH');
  const cashSum = cashPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const cardPayments = dateFilteredPayments.filter(p => p.method === 'CARD');
  const cardSum = cardPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-medical-gradient rounded-3xl p-6 text-white shadow-xl shadow-medical-blue/20 border border-white/25 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-56 h-56 bg-white/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-48 h-48 bg-medical-blue-dark/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/25 backdrop-blur-md text-white border border-white/30 text-xs font-semibold mb-2 shadow-xs transition">
            <Banknote className="w-3.5 h-3.5 text-medical-turquoise" />
            <span>Klinika Kassasi & Moliyaviy Cheklar</span>
          </div>
          <h3 className="text-2xl font-black tracking-tight text-white drop-shadow-xs">Barcha To'lovlar Jurnali</h3>
          <p className="text-xs text-white/95 max-w-xl mt-1 leading-relaxed">
            Klinika kassasiga qabul qilingan barcha to'lovlar, qaysi shifokor uchun to'langanligi va chek tafsilotlari (PostgreSQL)
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={onExportExcel}
            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 text-xs font-bold rounded-2xl flex items-center gap-2 transition shadow-sm cursor-pointer active:scale-95"
            title="Barcha to'lovlar jurnalini .xlsx formatida yuklab olish"
          >
            <FileSpreadsheet className="w-4 h-4 text-medical-turquoise" />
            <span>Excelga eksport (.xlsx)</span>
          </button>

          <div className="px-5 py-2 bg-white/20 hover:bg-white/25 backdrop-blur-md rounded-2xl text-right border border-white/30 shadow-sm transition">
            <div className="text-[10px] text-white/90 font-bold uppercase tracking-wider">Tanlangan davr tushumi</div>
            <div className="text-lg font-black text-white font-mono drop-shadow-xs">{totalSum.toLocaleString()} so'm</div>
          </div>
        </div>
      </div>

      {/* DATE RANGE FILTER (Bugun, Kecha, 1 hafta, 1 oy, Barchasi) */}
      <DateRangeFilter
        preset={paymentDatePreset}
        startDate={paymentStartDate}
        endDate={paymentEndDate}
        onPresetChange={setPaymentDatePreset}
        onDateChange={(start, end) => {
          setPaymentStartDate(start);
          setPaymentEndDate(end);
        }}
        totalCount={filteredPayments.length}
        countLabel="ta to'lov"
      />

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-medical-blue shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400">Jami tushum</div>
            <div className="text-xl font-black text-slate-800 font-mono">
              {totalSum.toLocaleString()} <span className="text-xs font-normal text-slate-400">so'm</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-medical-turquoise-dark shrink-0">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400">Naqd tushum ({cashPayments.length} ta)</div>
            <div className="text-xl font-black text-slate-800 font-mono">
              {cashSum.toLocaleString()} <span className="text-xs font-normal text-slate-400">so'm</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-medical-blue-dark shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400">Plastik karta ({cardPayments.length} ta)</div>
            <div className="text-xl font-black text-slate-800 font-mono">
              {cardSum.toLocaleString()} <span className="text-xs font-normal text-slate-400">so'm</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400">Jami cheklar soni</div>
            <div className="text-xl font-black text-slate-800">{dateFilteredPayments.length} ta chek</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Bemor, chek № yoki shifokor ismi..."
            value={paymentSearch}
            onChange={e => setPaymentSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-medical-blue/20 focus:border-medical-blue transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPaymentMethodFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                paymentMethodFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Barchasi
            </button>
            <button
              onClick={() => setPaymentMethodFilter('CASH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                paymentMethodFilter === 'CASH'
                  ? 'bg-medical-blue text-white shadow-xs shadow-medical-blue/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Naqd pul
            </button>
            <button
              onClick={() => setPaymentMethodFilter('CARD')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                paymentMethodFilter === 'CARD'
                  ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Plastik karta
            </button>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div 
          className="overflow-x-auto max-h-[620px] overflow-y-auto"
          onScroll={(e) => {
            const target = e.currentTarget;
            if (target.scrollTop + target.clientHeight >= target.scrollHeight - 60) {
              setVisibleManagerPaymentsCount(prev => prev + 15);
            }
          }}
        >
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px] sticky top-0 z-10">
                <th className="py-3.5 px-4">Chek №</th>
                <th className="py-3.5 px-4">Sana va Vaqt</th>
                <th className="py-3.5 px-4">Bemor (To'lov qilgan)</th>
                <th className="py-3.5 px-4">Qaysi shifokor uchun</th>
                <th className="py-3.5 px-4">To'lov usuli</th>
                <th className="py-3.5 px-4">Summa</th>
                <th className="py-3.5 px-4">Kassir</th>
                <th className="py-3.5 px-4">Holat</th>
                <th className="py-3.5 px-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Banknote className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <div className="font-semibold text-slate-600 text-sm">To'lovlar topilmadi</div>
                    <p className="text-xs text-slate-400 mt-0.5">Filtrlar yoki qidiruvni o'zgartirib ko'ring</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.slice(0, visibleManagerPaymentsCount).map((p: any) => {
                  const relatedTickets = Array.isArray(p.related_tickets) ? p.related_tickets : [];
                  return (
                    <tr
                      key={p.id}
                      onClick={() => onSelectPayment(p)}
                      className="hover:bg-blue-50/40 transition cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-mono font-bold text-slate-800 group-hover:text-blue-600 transition">
                            {p.receipt_number || p.id}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {p.created_at ? (
                          <div>
                            <div className="text-slate-700 font-bold">
                              {new Date(p.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(p.created_at).toLocaleDateString('uz-UZ')}
                            </div>
                          </div>
                        ) : (
                          '14:22'
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{p.patient_name || 'Bemor'}</div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-300" />
                          <span>{p.patient_phone || 'Mavjud emas'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {relatedTickets.length > 0 ? (
                          <div className="space-y-1">
                            {relatedTickets.map((t: any, idx: number) => (
                              <div key={t.ticket_id || idx} className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-800 font-mono font-bold text-[10px]">
                                  {t.full_number}
                                </span>
                                <span className="font-bold text-slate-700">{t.doctor_name}</span>
                                <span className="text-[10px] text-slate-400">({t.cabinet_number}-xona)</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">
                            {p.notes || 'Navbat orqali qabul'}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          p.method === 'CASH' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : p.method === 'CARD' 
                              ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                              : 'bg-purple-100 text-purple-800 border border-purple-200'
                        }`}>
                          {p.method === 'CASH' ? 'Naqd pul' : p.method === 'CARD' ? 'Plastik karta' : 'Onlayn'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-black text-emerald-700 text-sm whitespace-nowrap">
                        {Number(p.amount).toLocaleString()} so‘m
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                        {p.cashier_name || 'Kassir 1'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          To'langan
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectPayment(p)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Batafsil</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {visibleManagerPaymentsCount < filteredPayments.length && (
            <div className="p-3 text-center border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setVisibleManagerPaymentsCount(prev => prev + 15)}
                className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 transition shadow-sm cursor-pointer"
              >
                Qolgan to'lovlarni yuklash ({visibleManagerPaymentsCount} / {filteredPayments.length})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
