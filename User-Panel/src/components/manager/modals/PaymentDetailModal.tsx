import React from 'react';
import { FileText, X, User, Phone, Stethoscope, UserCheck, Banknote, CheckCircle2, FileSpreadsheet, Printer } from 'lucide-react';

interface PaymentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPayment: any;
  onPrintReceipt: (payment: any) => void;
}

export const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({
  isOpen,
  onClose,
  selectedPayment,
  onPrintReceipt,
}) => {
  if (!isOpen || !selectedPayment) return null;

  const relatedTickets = Array.isArray(selectedPayment.related_tickets) ? selectedPayment.related_tickets : [];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-3xl w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">To'lov Cheki va Tafsilotlari</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white/20 text-white">
                  № {selectedPayment.receipt_number || selectedPayment.id}
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Sana: {selectedPayment.created_at ? new Date(selectedPayment.created_at).toLocaleString('uz-UZ') : 'Bugun'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 hover:bg-white/15 rounded-xl text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Bemor (Kim to'lov qilgan) */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>To'lovchi Bemor</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  {selectedPayment.patient_number ? `№ ${selectedPayment.patient_number}` : 'Bemor'}
                </span>
              </div>
              <div className="text-base font-black text-slate-900">
                {selectedPayment.patient_name || 'Noma\'lum bemor'}
              </div>
              <div className="text-xs text-slate-600 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono font-bold">{selectedPayment.patient_phone || 'Telefon kiritilmagan'}</span>
              </div>
              {selectedPayment.patient_gender && (
                <div className="text-[11px] text-slate-500">
                  Jinsi: <span className="font-semibold text-slate-700">{selectedPayment.patient_gender === 'MALE' ? 'Erkak' : 'Ayol'}</span>
                </div>
              )}
            </div>

            {/* Card 2: Shifokor (Qaysi shifokor uchun qilingan) */}
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
                  <span>Qaysi Shifokor Uchun</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-200/80 text-purple-900">
                  {relatedTickets.length > 0 ? `${relatedTickets.length} ta talon` : 'Navbat'}
                </span>
              </div>

              {relatedTickets.length > 0 ? (
                <div className="space-y-1.5 pt-0.5">
                  {relatedTickets.map((t: any, idx: number) => (
                    <div key={t.ticket_id || idx} className="flex items-center justify-between bg-white/80 p-2 rounded-xl border border-purple-100">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{t.doctor_name}</div>
                        <div className="text-[10px] text-slate-500">
                          {t.specialty_name} • <span className="font-bold text-purple-700">{t.cabinet_number}-xona</span>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-purple-600 text-white rounded-lg font-mono font-black text-xs shadow-xs">
                        {t.full_number}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="text-sm font-bold text-slate-800">
                    {selectedPayment.appointment_doctor_name || 'Tibbiy ko\'rik / Laboratoriya'}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {selectedPayment.notes || "Klinika umumiy qabul to'lovi"}
                  </div>
                </div>
              )}
            </div>

            {/* Card 3: Kassa va Kassir */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kassa va Kassir</span>
              </span>
              <div className="text-sm font-black text-slate-900">
                {selectedPayment.cashier_name || 'Kassir 1'}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Smena: <span className="font-bold text-slate-700">{selectedPayment.cash_shift_id || 'shift_today_01'}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Valyuta: <span className="font-mono font-bold text-emerald-700">{selectedPayment.currency || 'UZS (So\'m)'}</span>
              </div>
            </div>

            {/* Card 4: To'lov Summasi va Holati */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                  <span>To'lov Miqdori</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">
                  {selectedPayment.method === 'CASH' ? 'Naqd' : selectedPayment.method === 'CARD' ? 'Karta' : 'Onlayn'}
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-700">
                {Number(selectedPayment.amount).toLocaleString()} <span className="text-xs font-normal text-slate-400">so'm</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>To'liq to'langan (Muvaffaqiyatli)</span>
              </div>
            </div>
          </div>

          {/* To'lov hisob-kitob jadvali (TABLITSADA TO'LIQ MA'LUMOT) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>To'lov tarkibi va xizmatlar jadvali</span>
              </h4>
              <span className="text-xs text-slate-400">PostgreSQL tranzaksiyasi: {selectedPayment.id}</span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3.5 w-10 text-center">№</th>
                    <th className="py-2.5 px-3.5">Talon / Chek №</th>
                    <th className="py-2.5 px-3.5">Shifokor & Mutaxassislik</th>
                    <th className="py-2.5 px-3.5">Xona</th>
                    <th className="py-2.5 px-3.5">To'lov Usuli</th>
                    <th className="py-2.5 px-3.5">Summa</th>
                    <th className="py-2.5 px-3.5 text-right">Holat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {relatedTickets.length > 0 ? (
                    relatedTickets.map((t: any, index: number) => {
                      const splitAmount = Math.round(Number(selectedPayment.amount) / relatedTickets.length);
                      return (
                        <tr key={t.ticket_id || index} className="hover:bg-slate-50">
                          <td className="py-3 px-3.5 text-center font-bold text-slate-400">{index + 1}</td>
                          <td className="py-3 px-3.5 font-mono font-black text-blue-700">{t.full_number}</td>
                          <td className="py-3 px-3.5">
                            <div className="font-bold text-slate-800">{t.doctor_name}</div>
                            <div className="text-[10px] text-slate-400">{t.specialty_name}</div>
                          </td>
                          <td className="py-3 px-3.5 font-mono font-bold text-slate-700">{t.cabinet_number}-kabinet</td>
                          <td className="py-3 px-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {selectedPayment.method === 'CASH' ? 'Naqd pul' : 'Plastik karta'}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 font-mono font-bold text-emerald-700">
                            {splitAmount.toLocaleString()} so'm
                          </td>
                          <td className="py-3 px-3.5 text-right">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              To'langan
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-3.5 text-center font-bold text-slate-400">1</td>
                      <td className="py-3 px-3.5 font-mono font-black text-blue-700">{selectedPayment.receipt_number || selectedPayment.id}</td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-800">
                          {selectedPayment.appointment_doctor_name || 'Shifokor ko\'rigi va konsultatsiya'}
                        </div>
                        <div className="text-[10px] text-slate-400">{selectedPayment.notes || 'Qabul to\'lovi'}</div>
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-700">
                        {selectedPayment.appointment_doctor_room ? `${selectedPayment.appointment_doctor_room}-xona` : '1-qavat'}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {selectedPayment.method === 'CASH' ? 'Naqd pul' : 'Plastik karta'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-emerald-700">
                        {Number(selectedPayment.amount).toLocaleString()} so'm
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          To'langan
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50/80 font-bold border-t border-slate-200">
                    <td colSpan={5} className="py-3 px-3.5 text-right text-slate-600">
                      Jami to'langan summa:
                    </td>
                    <td colSpan={2} className="py-3 px-3.5 font-mono font-black text-emerald-700 text-sm">
                      {Number(selectedPayment.amount).toLocaleString()} so'm
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes Block */}
          {selectedPayment.notes && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
              <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-700">Qo'shimcha izoh: </span>
                <span>{selectedPayment.notes}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            Chek ID: <span className="font-mono font-bold text-slate-600">{selectedPayment.id}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onPrintReceipt(selectedPayment)}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Chekni chop etish</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md shadow-emerald-600/20"
            >
              Yopish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

