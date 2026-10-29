import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Ticket, QrCode, FileText, Check } from 'lucide-react';

interface TicketIssuedModalProps {
  isOpen: boolean;
  tickets: any[];
  payment?: any;
  initialPaperSize?: '58mm' | '80mm';
  onPaperSizeChange?: (size: '58mm' | '80mm') => void;
  onClose: () => void;
}

export const TicketIssuedModal: React.FC<TicketIssuedModalProps> = ({
  isOpen,
  tickets,
  payment,
  initialPaperSize,
  onPaperSizeChange,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'TICKETS' | 'RECEIPT'>('TICKETS');
  const [config, setConfig] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('sadaf_ticket_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      clinicName: 'KLINIKA-ADMIN',
      showLogo: true,
      address: "Toshkent sh., Chilonzor tumani, Bunyodkor ko'chasi 15-uy",
      phone: "+998 71 200 00 20",
      welcomeNote: "Navbat talonini qabul yakunigacha saqlang",
      showDate: true,
      showTicketNumber: true,
      showSpecialty: true,
      showDoctor: true,
      showCabinet: true,
      showPatientName: true,
      showPaymentStatus: true,
      showWaitTime: true,
      showQrCode: true,
      showCutLine: true,
      footerText: "Tashrifingiz uchun rahmat! Salomat bo'ling!",
      footerNote: "Navbatingizni zal monitorida kuzatib boring"
    };
  });

  const [paperSize, setPaperSize] = useState<'58mm' | '80mm'>(() => {
    if (initialPaperSize) return initialPaperSize;
    try {
      const savedTicketSettings = localStorage.getItem('sadaf_ticket_settings');
      if (savedTicketSettings) {
        const parsedT = JSON.parse(savedTicketSettings);
        if (parsedT.paperSize) return parsedT.paperSize;
      }
      const saved = localStorage.getItem('sadaf_cashier_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.printerPaperSize) return parsed.printerPaperSize;
      }
    } catch {}
    return '80mm'; // Default to 80mm for XP-80T thermal printer
  });

  useEffect(() => {
    if (initialPaperSize) {
      setPaperSize(initialPaperSize);
    }
  }, [initialPaperSize]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sadaf_ticket_settings');
      if (saved) setConfig(JSON.parse(saved));
    } catch {}
    fetch('http://localhost:5001/api/v1/clinic/settings')
      .then(r => r.json())
      .then(res => {
        if (res.data?.printer_settings) {
          const ps = typeof res.data.printer_settings === 'string'
            ? JSON.parse(res.data.printer_settings)
            : res.data.printer_settings;
          setConfig((prev: any) => ({ ...prev, ...ps }));
          if (ps.paperSize && !initialPaperSize) {
            setPaperSize(ps.paperSize);
          }
        }
      })
      .catch(() => {});
  }, [isOpen, initialPaperSize]);

  if (!isOpen || !tickets || tickets.length === 0) return null;

  const handleSelectPaperSize = (size: '58mm' | '80mm') => {
    setPaperSize(size);
    if (onPaperSizeChange) {
      onPaperSizeChange(size);
    }
    try {
      const saved = localStorage.getItem('sadaf_cashier_settings');
      const parsed = saved ? JSON.parse(saved) : {};
      parsed.printerPaperSize = size;
      localStorage.setItem('sadaf_cashier_settings', JSON.stringify(parsed));
    } catch {}
  };

  const handlePrint = () => {
    window.print();
  };

  const firstTicket = tickets[0];
  const now = new Date().toLocaleString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const is80mm = paperSize === '80mm';

  // Render Single Ticket Card (used for both screen modal and body print portal)
  const renderTicketItem = (tck: any, idx: number, forPrint = false) => {
    const patientName = tck.patient_name || tck.patientName || "Noma'lum bemor";
    const specialty = tck.specialty_name || tck.specialtyName || 'Qabul';
    const cabinetNumber = tck.cabinet_number || tck.cabinetNumber || '1';
    const doctorName = tck.doctor_name || tck.doctorName || 'Shifokor';
    const ticketNum = tck.full_number || tck.fullNumber || tck.ticketNumber || '001';
    const paymentText = tck.payment_status === 'PAID'
      ? "To'langan"
      : tck.payment_status === 'EXEMPT'
      ? 'Imtiyozli (Bepul)'
      : "To'lov qabulda";
    const waitMinutes = tck.estimated_wait_minutes || tck.estimatedWaitMinutes || 15;

    return (
      <div
        key={idx}
        className="thermal-ticket-card text-center space-y-2 pb-1"
        style={{ width: '100%', boxSizing: 'border-box' }}
      >
        {/* HEADER */}
        <div className="space-y-0.5 border-b-2 border-dashed border-black pb-2 text-center">
          <div className={`font-black uppercase tracking-wider text-black ${is80mm ? 'text-base' : 'text-sm'}`}>
            {config.clinicName || 'KLINIKA-ADMIN'}
          </div>
          {config.address && (
            <div className={`text-black font-sans leading-tight ${is80mm ? 'text-[11px]' : 'text-[9.5px]'}`}>
              {config.address}
            </div>
          )}
          <div className={`text-black font-sans font-medium ${is80mm ? 'text-[11px]' : 'text-[9.5px]'}`}>
            {config.phone && `Tel: ${config.phone}`}
            {config.phone && config.showDate !== false && ' • '}
            {config.showDate !== false && now}
          </div>
          {config.welcomeNote && (
            <div className={`text-black font-sans italic pt-0.5 ${is80mm ? 'text-[10px]' : 'text-[8.5px]'}`}>
              {config.welcomeNote}
            </div>
          )}
        </div>

        {/* BIG QUEUE NUMBER - ULTRA PROMINENT FOR EASY READING */}
        {config.showTicketNumber !== false && (
          <div className="py-1 text-center">
            <div
              className={`font-black text-black font-mono leading-none tracking-tight ${
                is80mm ? 'text-[72px] sm:text-[76px]' : 'text-[50px] sm:text-[54px]'
              }`}
              style={{ letterSpacing: '-0.04em' }}
            >
              {ticketNum}
            </div>
            {config.showSpecialty !== false && (
              <div
                className={`font-sans font-black text-black uppercase mt-1 tracking-wider ${
                  is80mm ? 'text-sm' : 'text-xs'
                }`}
              >
                {specialty}
              </div>
            )}
          </div>
        )}

        {/* CABINET AND DOCTOR */}
        {(config.showCabinet !== false || config.showDoctor !== false) && (
          <div className="w-full p-2 border-2 border-black rounded-lg text-center space-y-0.5 font-sans bg-transparent my-1">
            {config.showCabinet !== false && (
              <div className={`font-black text-black ${is80mm ? 'text-base' : 'text-sm'}`}>
                KABINET № {cabinetNumber}
              </div>
            )}
            {config.showDoctor !== false && (
              <div className={`font-bold text-black break-words ${is80mm ? 'text-xs' : 'text-[11px]'}`}>
                {doctorName}
              </div>
            )}
          </div>
        )}

        {/* PATIENT SECTION - LEFT-ALIGNED & CLEARLY GROUPED */}
        {config.showPatientName !== false && (
          <div className="w-full text-left font-sans py-2 border-t-2 border-b-2 border-dashed border-black space-y-1 my-1">
            <div className="text-[10px] font-black text-black uppercase tracking-wider">
              Bemor:
            </div>
            <div className={`font-black text-black leading-snug break-words ${is80mm ? 'text-sm' : 'text-xs'}`}>
              {patientName}
            </div>
            {(config.showPaymentStatus !== false || config.showWaitTime !== false) && (
              <div className="flex items-center justify-between text-[11px] text-black pt-1 border-t border-dotted border-black/40 font-mono">
                {config.showPaymentStatus !== false && <span>To'lov: <b>{paymentText}</b></span>}
                {config.showWaitTime !== false && <span>Kutish: <b>~{waitMinutes} daq</b></span>}
              </div>
            )}
          </div>
        )}

        {/* QR CODE & INSTRUCTION */}
        {config.showQrCode !== false && (
          <div className="pt-1.5 flex flex-col items-center justify-center space-y-1 text-center">
            <div className={`border-2 border-black rounded-lg flex items-center justify-center text-black p-1 bg-white ${is80mm ? 'w-14 h-14' : 'w-12 h-12'}`}>
              <QrCode className={is80mm ? 'w-10 h-10' : 'w-9 h-9'} />
            </div>
            <div className={`text-black font-sans leading-tight text-center ${is80mm ? 'text-[10px]' : 'text-[8.5px]'}`}>
              Navbatni smartfonda kuzatish uchun QR-kodni skanerlang
            </div>
          </div>
        )}

        {/* FOOTER TEXT */}
        {(config.footerText || config.footerNote) && (
          <div className="pt-1 text-center font-sans space-y-0.5">
            {config.footerText && (
              <div className={`text-black font-bold leading-tight ${is80mm ? 'text-[10px]' : 'text-[8.5px]'}`}>
                {config.footerText}
              </div>
            )}
            {config.footerNote && (
              <div className={`text-black leading-tight ${is80mm ? 'text-[9px]' : 'text-[7.5px]'}`}>
                {config.footerNote}
              </div>
            )}
          </div>
        )}

        {/* CUT GUIDE */}
        {config.showCutLine !== false && (
          <div className="pt-2 pb-0.5 border-b-2 border-dashed border-black/60 text-[9.5px] text-black font-sans text-center">
            - - - Qirqish chizig'i - - -
          </div>
        )}
      </div>
    );
  };

  // Render Payment Receipt
  const renderReceiptItem = () => (
    <div className="thermal-ticket-card text-center space-y-2 pb-2" style={{ width: '100%', boxSizing: 'border-box' }}>
      <div className="space-y-0.5 border-b-2 border-dashed border-black pb-2 text-center">
        <div className={`font-black uppercase tracking-wider text-black ${is80mm ? 'text-base' : 'text-sm'}`}>
          {config.clinicName || 'KLINIKA-ADMIN'}
        </div>
        <div className="text-[10px] text-black font-sans font-bold">KASSA NOFISKAL KVITANSIYASI</div>
        <div className="text-[10px] text-black font-mono">
          {payment?.receipt_number || 'RCP-892110'} • {now}
        </div>
      </div>

      {/* RECEIPT PATIENT & CASHIER */}
      <div className="text-left font-sans py-2 border-b-2 border-dashed border-black space-y-1">
        <div>
          <div className="text-[10px] font-bold text-black uppercase tracking-wider">Bemor:</div>
          <div className={`font-black text-black leading-snug break-words ${is80mm ? 'text-sm' : 'text-xs'}`}>
            {firstTicket?.patient_name || firstTicket?.patientName || "Noma'lum bemor"}
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] text-black pt-1 border-t border-dotted border-black/40">
          <span>To'lov turi: <b>{payment?.method === 'CARD' ? 'Karta' : payment?.method === 'TRANSFER' ? "O'tkazma" : 'Naqd'}</b></span>
          <span>Kassir: <b>Dilnoza Karimova</b></span>
        </div>
      </div>

      {/* RECEIPT ITEMS */}
      <div className="border-b-2 border-dashed border-black py-2 font-sans space-y-1 text-left">
        {tickets.map((t, idx) => (
          <div key={idx} className="flex justify-between text-[11px] text-black">
            <span className="truncate pr-1">{t.specialty_name || t.specialtyName || 'Xizmat'}</span>
            <span className="font-bold shrink-0">
              {t.service_price ? `${Number(t.service_price).toLocaleString()} so'm` : "Ko'rik"}
            </span>
          </div>
        ))}
      </div>

      {/* TOTAL AMOUNT */}
      <div className="flex justify-between items-center text-black py-1 font-sans">
        <span className="font-bold text-xs uppercase">JAMI TO'LANDI:</span>
        <span className={`font-black ${is80mm ? 'text-base' : 'text-sm'}`}>
          {Number(payment?.amount || 0).toLocaleString()} so'm
        </span>
      </div>

      <div className="text-[9px] text-center text-black pt-2 border-t border-dashed border-black font-sans">
        Tibbiy xizmatlarimizdan foydalanganingiz uchun tashakkur! Salomat bo'ling!
      </div>
    </div>
  );

  return (
    <>
      {/* 1. ULTRA-PRECISE THERMAL PRINT CSS FOR XP-80T (80mm) & XP-58 (58mm) */}
      <style>{`
        @media print {
          @page {
            size: ${is80mm ? '80mm auto' : '58mm auto'};
            margin: 0 !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          html, body {
            width: ${is80mm ? '80mm' : '58mm'} !important;
            min-width: ${is80mm ? '80mm' : '58mm'} !important;
            max-width: ${is80mm ? '80mm' : '58mm'} !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
          }
          /* COMPLETELY HIDE #root IN PRINT MODE SO HEIGHT IS ZERO AND NEVER PRINTS EXTRA PAGES */
          #root {
            display: none !important;
          }
          /* PRINT DIRECTLY FROM BODY PORTAL */
          #thermal-print-portal {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 100% !important;
            margin: 0 !important;
            padding: ${is80mm ? '2mm 3.5mm 3mm 3.5mm' : '1.5mm 2mm 2.5mm 2mm'} !important;
            box-sizing: border-box !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", monospace !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .thermal-ticket-card {
            box-sizing: border-box !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .thermal-ticket-card + .thermal-ticket-card {
            page-break-before: always !important;
            break-before: page !important;
            padding-top: 3mm !important;
          }
          .thermal-ticket-card * {
            color: #000000 !important;
            border-color: #000000 !important;
            background-color: transparent !important;
          }
        }
      `}</style>

      {/* 2. ON-SCREEN MODAL DIALOG (Hidden in print mode) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B4D]/60 backdrop-blur-sm p-4 print:hidden">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#DCE3EA] flex flex-col max-h-[92vh]">
          {/* MODAL HEADER */}
          <div className="p-4 bg-[#0F766E] text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#99F6E4]" />
              <div>
                <span className="text-sm font-bold block">
                  {tickets.length > 1 ? `${tickets.length} ta talon berildi` : 'Talon rasmiylashtirildi'}
                </span>
                <span className="text-[11px] text-[#99F6E4]/90">
                  Tanlangan printer: <b>{is80mm ? 'XP-80T (80 mm)' : 'XP-58 (58 mm)'}</b>
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 transition cursor-pointer" title="Yopish">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* PAPER SIZE SELECTOR */}
          <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-700">Printer qog'oz formati:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSelectPaperSize('80mm')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  is80mm
                    ? 'bg-[#0F766E] text-white shadow-sm ring-2 ring-[#0F766E]/30'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                {is80mm && <Check className="w-3.5 h-3.5" />}
                <span>80 mm (XP-80T)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectPaperSize('58mm')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  !is80mm
                    ? 'bg-[#0F766E] text-white shadow-sm ring-2 ring-[#0F766E]/30'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                {!is80mm && <Check className="w-3.5 h-3.5" />}
                <span>58 mm (XP-58)</span>
              </button>
            </div>
          </div>

          {/* TAB SELECTOR IF PAYMENT EXISTS */}
          {payment && (
            <div className="flex border-b border-[#DCE3EA] bg-[#F5F7FA] px-4 pt-2 shrink-0">
              <button
                onClick={() => setActiveTab('TICKETS')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'TICKETS'
                    ? 'border-[#0F766E] text-[#0F766E] bg-white rounded-t-lg'
                    : 'border-transparent text-[#64748B] hover:text-[#172B4D]'
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Navbat talonlari ({tickets.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('RECEIPT')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'RECEIPT'
                    ? 'border-[#0F766E] text-[#0F766E] bg-white rounded-t-lg'
                    : 'border-transparent text-[#64748B] hover:text-[#172B4D]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Kassa cheki</span>
              </button>
            </div>
          )}

          {/* SCREEN PREVIEW AREA */}
          <div className="p-6 overflow-y-auto bg-slate-200/70 flex justify-center">
            <div
              className={`bg-white shadow-md border border-slate-300 transition-all font-mono text-black ${
                is80mm ? 'w-[360px] p-5 rounded-xl' : 'w-[260px] p-3.5 rounded-lg'
              }`}
            >
              {activeTab === 'TICKETS' ? (
                tickets.map((tck, idx) => renderTicketItem(tck, idx, false))
              ) : (
                renderReceiptItem()
              )}
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="p-4 bg-white border-t border-[#DCE3EA] flex items-center justify-between gap-3 shrink-0">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-[#F5F7FA] hover:bg-[#DCE3EA] text-[#172B4D] text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Yopish
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Chop etish ({is80mm ? 'XP-80T 80mm' : 'XP-58 58mm'})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. DIRECT BODY PORTAL FOR REAL THERMAL PRINTING (Hidden on screen, rendered on document.body) */}
      {typeof document !== 'undefined' && createPortal(
        <div id="thermal-print-portal" className="hidden font-mono text-black">
          {activeTab === 'TICKETS' ? (
            tickets.map((tck, idx) => renderTicketItem(tck, idx, true))
          ) : (
            renderReceiptItem()
          )}
        </div>,
        document.body
      )}
    </>
  );
};
