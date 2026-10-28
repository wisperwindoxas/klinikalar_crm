import React, { useState } from 'react';
import { X, Printer, CheckCircle2, Ticket, QrCode, FileText } from 'lucide-react';

interface TicketIssuedModalProps {
  isOpen: boolean;
  tickets: any[];
  payment?: any;
  onClose: () => void;
}

export const TicketIssuedModal: React.FC<TicketIssuedModalProps> = ({
  isOpen,
  tickets,
  payment,
  onClose
}) => {
  if (!isOpen || !tickets || tickets.length === 0) return null;

  const [activeTab, setActiveTab] = useState<'TICKETS' | 'RECEIPT'>('TICKETS');

  const handlePrint = () => {
    window.print();
  };

  const firstTicket = tickets[0];
  const now = new Date().toLocaleString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B4D]/60 backdrop-blur-sm p-4 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#DCE3EA] print:border-none print:shadow-none print:w-full">
        {/* MODAL HEADER (Hidden on Print) */}
        <div className="p-4 bg-[#0F766E] text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#99F6E4]" />
            <span className="text-sm font-bold">
              {tickets.length > 1 ? `${tickets.length} ta talon berildi` : 'Talon rasmiylashtirildi'}
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-white/80">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB SELECTOR IF PAYMENT EXISTS (Hidden on Print) */}
        {payment && (
          <div className="flex border-b border-[#DCE3EA] bg-[#F5F7FA] px-4 pt-2 print:hidden">
            <button
              onClick={() => setActiveTab('TICKETS')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
                activeTab === 'TICKETS'
                  ? 'border-[#0F766E] text-[#0F766E] bg-white rounded-t-lg'
                  : 'border-transparent text-[#64748B] hover:text-[#172B4D]'
              }`}
            >
              Navbat talonlari ({tickets.length})
            </button>
            <button
              onClick={() => setActiveTab('RECEIPT')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
                activeTab === 'RECEIPT'
                  ? 'border-[#0F766E] text-[#0F766E] bg-white rounded-t-lg'
                  : 'border-transparent text-[#64748B] hover:text-[#172B4D]'
              }`}
            >
              Kassa cheki
            </button>
          </div>
        )}

        {/* CONTENT AREA: 58mm / 80mm THERMAL RECEIPT STYLE */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6 bg-slate-50 print:bg-white print:p-0">
          {activeTab === 'TICKETS' ? (
            tickets.map((tck, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-dashed border-[#DCE3EA] shadow-sm text-center space-y-3 font-mono print:border-none print:shadow-none print:page-break-after"
              >
                <div className="text-xs font-bold tracking-widest text-[#0F766E] uppercase">
                  SADAF KLINIKA
                </div>
                <div className="text-[10px] text-[#64748B] font-sans">
                  Toshkent sh., Chilonzor tumani, Bunyodkor ko'chasi 15-uy
                </div>
                <div className="text-[10px] text-[#64748B] font-sans border-b border-dashed border-[#DCE3EA] pb-2">
                  Tel: +998 71 200 00 20 • {now}
                </div>

                {/* BIG TICKET NUMBER */}
                <div className="py-2">
                  <div className="text-5xl font-black text-[#172B4D] tracking-tight">
                    {tck.full_number || tck.fullNumber || tck.ticketNumber}
                  </div>
                  <div className="text-xs font-sans font-bold text-[#15803D] mt-1">
                    {tck.specialty_name || tck.specialtyName}
                  </div>
                </div>

                {/* CABINET AND DOCTOR */}
                <div className="p-2.5 bg-[#F0FDFA] border border-[#CCFBF1] rounded-xl text-center space-y-1 font-sans">
                  <div className="text-sm font-black text-[#0F766E]">
                    KABINET № {tck.cabinet_number || tck.cabinetNumber}
                  </div>
                  <div className="text-xs text-[#172B4D] font-semibold">
                    {tck.doctor_name || tck.doctorName}
                  </div>
                </div>

                <div className="text-left text-[11px] font-sans text-[#64748B] space-y-1 pt-2 border-t border-dashed border-[#DCE3EA]">
                  <div className="flex justify-between">
                    <span>Bemor:</span>
                    <span className="font-bold text-[#172B4D]">{tck.patient_name || tck.patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>To'lov holati:</span>
                    <span className="font-bold text-[#0F766E]">
                      {tck.payment_status === 'PAID' ? "To'langan" : tck.payment_status === 'EXEMPT' ? 'Imtiyozli (Bepul)' : "To'lov qabulda"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxminiy kutish:</span>
                    <span>~{tck.estimated_wait_minutes || tck.estimatedWaitMinutes || 15} daqiqa</span>
                  </div>
                </div>

                {/* QR CODE & INSTRUCTION */}
                <div className="pt-3 flex flex-col items-center justify-center border-t border-dashed border-[#DCE3EA]">
                  <div className="w-16 h-16 bg-slate-100 border border-[#DCE3EA] rounded-lg flex items-center justify-center text-[#172B4D] mb-1">
                    <QrCode className="w-12 h-12" />
                  </div>
                  <div className="text-[9px] text-[#64748B] font-sans">
                    Navbatni smartfonda kuzatish uchun QR-kodni skanerlang
                  </div>
                </div>
              </div>
            ))
          ) : (
            /* PAYMENT RECEIPT */
            <div className="bg-white p-6 rounded-2xl border border-dashed border-[#DCE3EA] shadow-sm font-mono text-xs space-y-3 print:border-none print:shadow-none">
              <div className="text-center space-y-1 border-b border-dashed border-[#DCE3EA] pb-3">
                <div className="font-bold text-sm text-[#172B4D]">SADAF KLINIKA</div>
                <div className="text-[10px] text-[#64748B] font-sans">KASSA NOFISKAL KVITANSIYASI</div>
                <div className="text-[10px] text-[#64748B]">{payment.receipt_number || 'RCP-892110'} • {now}</div>
              </div>

              <div className="space-y-1.5 pt-2 font-sans">
                <div className="flex justify-between text-slate-600">
                  <span>Bemor:</span>
                  <span className="font-bold text-[#172B4D]">{firstTicket?.patient_name || firstTicket?.patientName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>To'lov turi:</span>
                  <span className="font-bold text-[#172B4D]">
                    {payment.method === 'CARD' ? 'Plastik karta' : payment.method === 'TRANSFER' ? 'O\'tkazma' : 'Naqd pul'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Kassir:</span>
                  <span className="text-[#172B4D]">Dilnoza Karimova</span>
                </div>
              </div>

              <div className="border-t border-b border-dashed border-[#DCE3EA] py-3 my-2 font-sans space-y-1">
                {tickets.map((t, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span>{t.specialty_name || t.specialtyName}</span>
                    <span className="font-bold">
                      {t.service_price ? `${Number(t.service_price).toLocaleString()} so'm` : "Ko'rik"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-sm font-black text-[#172B4D] pt-1">
                <span>JAMI TO'LANDI:</span>
                <span className="text-[#0F766E]">{Number(payment.amount || 0).toLocaleString()} so'm</span>
              </div>

              <div className="text-[10px] text-center text-[#64748B] pt-4 border-t border-dashed border-[#DCE3EA] font-sans">
                Tibbiy xizmatlarimizdan foydalanganingiz uchun tashakkur! Salomat bo'ling!
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS (Hidden on Print) */}
        <div className="p-4 bg-white border-t border-[#DCE3EA] flex items-center justify-between gap-3 print:hidden">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-[#F5F7FA] hover:bg-[#DCE3EA] text-[#172B4D] text-xs font-bold rounded-xl transition"
          >
            Yopish
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition"
          >
            <Printer className="w-4 h-4" />
            <span>Chop etish (Termoprinter)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
