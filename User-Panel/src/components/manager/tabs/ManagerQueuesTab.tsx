import React from 'react';
import {
  Ticket,
  Activity,
  Clock,
  CheckCircle2,
  Search,
  RefreshCw,
  Phone,
  Stethoscope,
  DoorOpen,
  Trash2,
} from 'lucide-react';

interface ManagerQueuesTabProps {
  allTicketsList: any[];
  queueSearch: string;
  setQueueSearch: (v: string) => void;
  queueStatusFilter: string;
  setQueueStatusFilter: (v: string) => void;
  visibleManagerTicketsCount: number;
  setVisibleManagerTicketsCount: React.Dispatch<React.SetStateAction<number>>;
  loadManagerData: () => void;
  navigate: (path: string) => void;
  promptCancelTicket: (ticket: any) => void;
  formatUzbekPhone: (phone: string) => string;
}

export const ManagerQueuesTab: React.FC<ManagerQueuesTabProps> = ({
  allTicketsList,
  queueSearch,
  setQueueSearch,
  queueStatusFilter,
  setQueueStatusFilter,
  visibleManagerTicketsCount,
  setVisibleManagerTicketsCount,
  loadManagerData,
  navigate,
  promptCancelTicket,
  formatUzbekPhone,
}) => {
  const totalTickets = allTicketsList.length;
  const waitingTickets = allTicketsList.filter(t => t.status === 'WAITING').length;
  const inProgressTickets = allTicketsList.filter(t => t.status === 'IN_PROGRESS' || t.status === 'CALLED').length;
  const completedTickets = allTicketsList.filter(t => t.status === 'COMPLETED').length;
  const cancelledTickets = allTicketsList.filter(t => t.status === 'CANCELLED').length;

  const filteredTickets = allTicketsList.filter(t => {
    // Status filter
    if (queueStatusFilter === 'WAITING' && t.status !== 'WAITING') return false;
    if (queueStatusFilter === 'IN_PROGRESS' && t.status !== 'IN_PROGRESS' && t.status !== 'CALLED') return false;
    if (queueStatusFilter === 'COMPLETED' && t.status !== 'COMPLETED') return false;
    if (queueStatusFilter === 'CANCELLED' && t.status !== 'CANCELLED') return false;

    // Text search filter
    if (!queueSearch) return true;
    const q = queueSearch.toLowerCase();
    return (
      t.full_number?.toLowerCase().includes(q) ||
      t.patient_name?.toLowerCase().includes(q) ||
      t.patient_phone?.toLowerCase().includes(q) ||
      t.doctor_name?.toLowerCase().includes(q) ||
      String(t.cabinet_number)?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. TOP STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Jami talonlar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3.5 hover:border-blue-300 transition">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Bugungi Jami Talonlar</span>
            <h4 className="text-xl font-black text-slate-800">{totalTickets} <span className="text-xs font-medium text-slate-400">ta</span></h4>
            <span className="text-[11px] text-blue-600 font-bold">Klinika bo‘yicha umumiy</span>
          </div>
        </div>

        {/* Hozir qabulda */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3.5 hover:border-purple-300 transition">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 relative">
            <Activity className="w-6 h-6 animate-pulse" />
            {inProgressTickets > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-600 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Hozir Qabulda</span>
            <h4 className="text-xl font-black text-purple-700">{inProgressTickets} <span className="text-xs font-medium text-purple-400">nafar</span></h4>
            <span className="text-[11px] text-purple-600 font-bold">Shifokor ko‘rigida</span>
          </div>
        </div>

        {/* Navbatda kutmoqda */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3.5 hover:border-amber-300 transition">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Navbatda Kutayotganlar</span>
            <h4 className="text-xl font-black text-amber-700">{waitingTickets} <span className="text-xs font-medium text-amber-400">nafar</span></h4>
            <span className="text-[11px] text-amber-600 font-bold">Kutish zalida</span>
          </div>
        </div>

        {/* Yakunlanganlar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3.5 hover:border-emerald-300 transition">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Yakunlangan Qabullar</span>
            <h4 className="text-xl font-black text-emerald-700">{completedTickets} <span className="text-xs font-medium text-emerald-400">nafar</span></h4>
            <span className="text-[11px] text-emerald-600 font-bold">Xizmat ko‘rsatildi</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN TABLE CONTAINER */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5">
        {/* Top Bar: Title, Search, Refresh & Talon berish */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172B4D]">Barcha Navbatlar va Talonlar Nazorati</h3>
                <p className="text-xs text-slate-500">Klinikada berilgan barcha navbat talonlari va ularning real holati</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Talon №, bemor yoki telefon..."
                value={queueSearch}
                onChange={e => setQueueSearch(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>

            <button
              onClick={() => loadManagerData()}
              className="p-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition cursor-pointer"
              title="Yangilash"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/cashier')}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-emerald-500/20 transition cursor-pointer whitespace-nowrap"
            >
              <Ticket className="w-4 h-4" />
              <span>Talon berish</span>
            </button>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setQueueStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              queueStatusFilter === 'ALL'
                ? 'bg-[#172B4D] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Barchasi ({totalTickets})
          </button>
          <button
            onClick={() => setQueueStatusFilter('WAITING')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
              queueStatusFilter === 'WAITING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Kutmoqda ({waitingTickets})</span>
          </button>
          <button
            onClick={() => setQueueStatusFilter('IN_PROGRESS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
              queueStatusFilter === 'IN_PROGRESS'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Qabulda ({inProgressTickets})</span>
          </button>
          <button
            onClick={() => setQueueStatusFilter('COMPLETED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
              queueStatusFilter === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Yakunlangan ({completedTickets})</span>
          </button>
          {cancelledTickets > 0 && (
            <button
              onClick={() => setQueueStatusFilter('CANCELLED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                queueStatusFilter === 'CANCELLED'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
              }`}
            >
              <span>Bekor qilingan ({cancelledTickets})</span>
            </button>
          )}
        </div>

        {/* Modern Table with Large Ticket Numbers */}
        <div 
          className="overflow-x-auto rounded-2xl border border-slate-100 max-h-[620px] overflow-y-auto"
          onScroll={(e) => {
            const target = e.currentTarget;
            if (target.scrollTop + target.clientHeight >= target.scrollHeight - 60) {
              if (visibleManagerTicketsCount < filteredTickets.length) {
                setVisibleManagerTicketsCount(prev => prev + 15);
              }
            }
          }}
        >
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px] sticky top-0 z-10">
                <th className="py-3.5 px-4">Talon №</th>
                <th className="py-3.5 px-4">Bemor</th>
                <th className="py-3.5 px-4">Shifokor / Xizmat</th>
                <th className="py-3.5 px-4">Kabinet</th>
                <th className="py-3.5 px-4">Berilgan Vaqt</th>
                <th className="py-3.5 px-4">To'lov Holati</th>
                <th className="py-3.5 px-4">Navbat Holati</th>
                <th className="py-3.5 px-4 text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Ticket className="w-10 h-10 text-slate-300 mb-2 stroke-1" />
                      <span className="font-bold text-sm text-slate-600">Mos keluvchi navbat taloni topilmadi</span>
                      <span className="text-xs text-slate-400 mt-0.5">Filtrlarni o‘zgartiring yoki yangi talon ro‘yxatga oling</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTickets.slice(0, visibleManagerTicketsCount).map((t: any) => (
                  <tr key={t.id} className="hover:bg-blue-50/40 transition">
                    {/* TALON RAQAMI: KATTA, ZAMONAVIY VA YORQIN */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="inline-flex items-center justify-center min-w-[72px] px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-mono font-black text-base sm:text-lg tracking-wider shadow-sm shadow-blue-500/25 ring-1 ring-white/20">
                        {t.full_number}
                      </div>
                    </td>

                    {/* BEMOR */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center shrink-0 border border-slate-200">
                          {t.patient_name ? t.patient_name.charAt(0).toUpperCase() : 'B'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-xs sm:text-sm">{t.patient_name || 'Nomaʼlum bemor'}</div>
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {t.patient_phone ? formatUzbekPhone(t.patient_phone) : "Telefon kiritilmagan"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* SHIFOKOR & XIZMAT */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{t.doctor_name || t.specialty_name || 'Umumiy qabul'}</span>
                        </div>
                        {t.service_name && (
                          <div className="text-[11px] text-slate-400 line-clamp-1">
                            {t.service_name}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* KABINET */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80 font-bold text-xs">
                        <DoorOpen className="w-3.5 h-3.5 text-slate-500" />
                        <span>{t.cabinet_number ? `${t.cabinet_number}-xona` : '-'}</span>
                      </div>
                    </td>

                    {/* VAQT */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-mono text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {t.issued_at
                            ? new Date(t.issued_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
                            : (t.created_at ? new Date(t.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '—')}
                        </span>
                      </div>
                    </td>

                    {/* TO'LOV HOLATI */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        t.payment_status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                          : 'bg-amber-50 text-amber-700 border border-amber-200/70'
                      }`}>
                        {t.payment_status === 'PAID' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>To'langan</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Kutilmoqda</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* NAVBAT HOLATI */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                        t.status === 'COMPLETED' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                        t.status === 'IN_PROGRESS' || t.status === 'CALLED' ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-xs' :
                        t.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {(t.status === 'IN_PROGRESS' || t.status === 'CALLED') && (
                          <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
                        )}
                        {t.status === 'COMPLETED' ? 'Yakunlangan' :
                         (t.status === 'IN_PROGRESS' || t.status === 'CALLED') ? 'Qabulda' :
                         t.status === 'CANCELLED' ? 'Bekor qilingan' : 'Kutmoqda'}
                      </span>
                    </td>

                    {/* AMAL */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      {t.status !== 'COMPLETED' && t.status !== 'CANCELLED' ? (
                        <button
                          onClick={() => promptCancelTicket(t)}
                          className="px-3 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1"
                          title="Talonni bekor qilish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Bekor qilish</span>
                        </button>
                      ) : (
                        <span className="text-slate-300 text-xs font-medium">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {visibleManagerTicketsCount < filteredTickets.length && (
            <div className="p-3 text-center border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setVisibleManagerTicketsCount(prev => prev + 15)}
                className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 transition shadow-sm"
              >
                Qolgan talonlarni yuklash ({visibleManagerTicketsCount} / {filteredTickets.length})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
