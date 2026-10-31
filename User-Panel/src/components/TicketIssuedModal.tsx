import React, { useState, useEffect } from 'react';
import { X, Printer, Ticket, QrCode, FileText, Check } from 'lucide-react';
import { printThermalTicket } from '../utils/thermalPrinter';
import { APP_LOGO } from '../utils/brand';

interface TicketIssuedModalProps {
  isOpen: boolean;
  tickets: any[];
  payment?: any;
  initialPaperSize?: '58mm' | '80mm';
  config?: any;
  onPaperSizeChange?: (size: '58mm' | '80mm') => void;
  onClose: () => void;
}

export const TicketIssuedModal: React.FC<TicketIssuedModalProps> = React.memo(({
  isOpen,
  tickets,
  payment,
  initialPaperSize,
  config: propConfig,
  onPaperSizeChange,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'TICKETS' | 'RECEIPT'>('TICKETS');
  const [config, setConfig] = useState<any>(() => {
    if (propConfig) return propConfig;
    try {
      const saved = localStorage.getItem('sadaf_ticket_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      clinicName: 'SADAF TIBBIYOT MARKAZI',
      headerTitle: 'SADAF TIBBIYOT MARKAZI',
      headerSubtitle: "Navbat talonini qabul yakunigacha saqlang",
      showLogo: true,
      logoUrl: '',
      address: "Toshkent sh., Chilonzor tumani, Bunyodkor ko'chasi 15-uy",
      phone: "+998 71 200 00 20",
      welcomeNote: "Navbat talonini qabul yakunigacha saqlang",
      showDate: true,
      showTicketNumber: true,
      showSpecialty: true,
      showDepartment: true,
      showDoctor: true,
      showDoctorName: true,
      showCabinet: true,
      showPatientName: true,
      showPaymentStatus: true,
      showServicePrice: true,
      showWaitTime: true,
      showWaitingCount: true,
      showEstimatedTime: true,
      showQrCode: true,
      showFooter: true,
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
    if (!isOpen) return;
    if (initialPaperSize) {
      setPaperSize(initialPaperSize);
    }
    if (propConfig) {
      setConfig(propConfig);
      return;
    }
    try {
      const saved = localStorage.getItem('sadaf_ticket_settings');
      if (saved) setConfig(JSON.parse(saved));
    } catch {}
  }, [isOpen, initialPaperSize, propConfig]);

  if (!isOpen || !tickets || tickets.length === 0) return null;

  const handleSelectPaperSize = (size: '58mm' | '80mm') => {
    if (paperSize === size) return;
    setPaperSize(size);
    try {
      const saved = localStorage.getItem('sadaf_cashier_settings');
      const parsed = saved ? JSON.parse(saved) : {};
      parsed.printerPaperSize = size;
      localStorage.setItem('sadaf_cashier_settings', JSON.stringify(parsed));
    } catch {}
  };

  const handleCloseModal = () => {
    if (onPaperSizeChange) {
      onPaperSizeChange(paperSize);
    }
    onClose();
  };

  const handlePrint = async () => {
    await printThermalTicket({
      tickets,
      config,
      paperSize,
      mode: activeTab,
      payment,
      silent: false
    });
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
    const ticketNum = tck.full_number || tck.fullNumber || tck.ticketNumber || tck.ticket_number || '001';
    
    let paymentText = "To'lov qabulda";
    if (tck.payment_status === 'PAID') {
      paymentText = tck.service_price ? `${Number(tck.service_price).toLocaleString()} so'm (To'langan)` : "To'langan";
    } else if (tck.payment_status === 'EXEMPT') {
      paymentText = 'Imtiyozli (Bepul)';
    } else if (tck.service_price) {
      paymentText = `${Number(tck.service_price).toLocaleString()} so'm (To'lov qabulda)`;
    }

    const waitCount = tck.waiting_count ?? tck.ahead_count ?? 3;
    const waitMinutes = tck.estimated_wait_minutes || tck.estimatedWaitMinutes || 20;

    return (
      <div
        key={idx}
        className="thermal-ticket-card text-center space-y-2 pb-1"
        style={{ width: '100%', boxSizing: 'border-box' }}
      >
        {/* 1. CLINIC LOGO */}
        {config.showLogo !== false && (config.logoUrl || APP_LOGO) && (
          <div className="text-center pb-1">
            <img
              src={config.logoUrl || APP_LOGO}
              alt="Klinika Logotipi"
              className="h-9 max-w-[130px] mx-auto object-contain filter grayscale contrast-125"
            />
          </div>
        )}

        {/* 2. CLINIC HEADER */}
        {config.showHeader !== false && (
          <div className="space-y-0.5 border-b-2 border-dashed border-black pb-2 text-center">
            <div className={`font-black uppercase tracking-wider text-black ${is80mm ? 'text-base' : 'text-sm'}`}>
              {config.headerTitle || config.clinicName || 'SADAF TIBBIYOT MARKAZI'}
            </div>
            {(config.headerSubtitle || config.welcomeNote) && (
              <div className={`text-black font-sans leading-tight ${is80mm ? 'text-[10px]' : 'text-[8.5px]'}`}>
                {config.headerSubtitle || config.welcomeNote}
              </div>
            )}
            {config.phone && (
              <div className={`text-black font-sans font-medium ${is80mm ? 'text-[10px]' : 'text-[8.5px]'}`}>
                Tel: {config.phone}
              </div>
            )}
            {config.address && (
              <div className={`text-black font-sans leading-tight ${is80mm ? 'text-[9.5px]' : 'text-[8px]'}`}>
                {config.address}
              </div>
            )}
          </div>
        )}

        {/* 3. DATE & TIME BAR */}
        {config.showDate !== false && (
          <div className="flex items-center justify-between text-[10px] font-mono border-b border-black/20 pb-1 text-black">
            <span>{new Date().toLocaleDateString('uz-UZ')}</span>
            <span>{new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}

        {/* 4. BIG QUEUE NUMBER - ULTRA PROMINENT FOR EASY READING */}
        {config.showTicketNumber !== false && (
          <div className="py-1 text-center border-b-2 border-black space-y-0.5">
            <div className="text-[10px] uppercase font-bold tracking-wider text-black">SIZNING NAVBATINGIZ</div>
            <div
              className={`font-black text-black font-mono leading-none tracking-tight ${
                is80mm ? 'text-[54px] sm:text-[60px]' : 'text-[42px] sm:text-[46px]'
              }`}
              style={{ letterSpacing: '-0.04em' }}
            >
              {ticketNum}
            </div>
            {config.showCabinet !== false && (
              <div className={`font-bold text-black mt-1 ${is80mm ? 'text-xs' : 'text-[11px]'}`}>
                KABINET № {cabinetNumber}
              </div>
            )}
          </div>
        )}

        {/* 5. DETAILS LIST (DOCTOR, DEPARTMENT, ROOM, PATIENT, SERVICE) */}
        <div className="space-y-1.5 py-1 text-[11px] border-b border-dashed border-black/40 text-left font-sans">
          {config.showDoctorName !== false && config.showDoctor !== false && (
            <div className="flex items-start justify-between">
              <span className="text-black/70 text-[10px]">Shifokor:</span>
              <span className="font-bold text-right text-black">{doctorName}</span>
            </div>
          )}

          {config.showDepartment !== false && config.showSpecialty !== false && (
            <div className="flex items-start justify-between">
              <span className="text-black/70 text-[10px]">Bo'lim:</span>
              <span className="font-semibold text-right text-black">{specialty}</span>
            </div>
          )}

          {config.showCabinet !== false && config.showTicketNumber === false && (
            <div className="flex items-start justify-between">
              <span className="text-black/70 text-[10px]">Xona:</span>
              <span className="font-mono font-bold text-right text-black">{cabinetNumber}-kabinet</span>
            </div>
          )}

          {config.showPatientName !== false && (
            <div className="flex items-start justify-between">
              <span className="text-black/70 text-[10px]">Bemor:</span>
              <span className="font-medium text-right text-black break-words">{patientName}</span>
            </div>
          )}

          {config.showServicePrice !== false && config.showPaymentStatus !== false && (
            <div className="flex items-start justify-between pt-1 border-t border-dotted border-black/20 font-bold">
              <span className="text-black/80 text-[10px]">Xizmat:</span>
              <span className="font-mono text-right text-black">{paymentText}</span>
            </div>
          )}
        </div>

        {/* 6. WAITING STATS */}
        {(config.showWaitingCount !== false || config.showEstimatedTime !== false) && (
          <div className="bg-slate-50 p-2 rounded border border-black/15 text-[10px] space-y-1">
            {config.showWaitingCount !== false && (
              <div className="flex items-center justify-between">
                <span className="text-black/70">Oldingizda:</span>
                <span className="font-mono font-black text-black">{waitCount} nafar bemor</span>
              </div>
            )}
            {config.showEstimatedTime !== false && (
              <div className="flex items-center justify-between">
                <span className="text-black/70">Taxminiy vaqt:</span>
                <span className="font-mono font-bold text-black">~ {waitMinutes} daqiqa</span>
              </div>
            )}
          </div>
        )}

        {/* 7. QR CODE & INSTRUCTION */}
        {config.showQrCode !== false && (
          <div className="pt-1.5 flex flex-col items-center justify-center space-y-1 text-center border-b border-dashed border-black/40 pb-2">
            <div className={`border-2 border-black rounded-lg flex items-center justify-center text-black p-1 bg-white ${is80mm ? 'w-14 h-14' : 'w-12 h-12'}`}>
              <QrCode className={is80mm ? 'w-10 h-10' : 'w-9 h-9'} />
            </div>
            <div className={`text-black font-sans leading-tight text-center ${is80mm ? 'text-[10px]' : 'text-[8.5px]'}`}>
              Navbatingizni telefonda kuzatish uchun skanerlang
            </div>
          </div>
        )}

        {/* 8. FOOTER TEXT */}
        {config.showFooter !== false && (config.footerText || config.footerNote) && (
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

        {/* 9. CUT GUIDE */}
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
      {config.showLogo !== false && (config.logoUrl || APP_LOGO) && (
        <div className="text-center pb-1">
          <img
            src={config.logoUrl || APP_LOGO}
            alt="Klinika Logotipi"
            className="h-9 max-w-[130px] mx-auto object-contain filter grayscale contrast-125"
          />
        </div>
      )}
      <div className="space-y-0.5 border-b-2 border-dashed border-black pb-2 text-center">
        <div className={`font-black uppercase tracking-wider text-black ${is80mm ? 'text-base' : 'text-sm'}`}>
          {config.headerTitle || config.clinicName || 'SADAF TIBBIYOT MARKAZI'}
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
      {/* ON-SCREEN MODAL DIALOG */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B4D]/75 p-4 print:hidden">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-[#DCE3EA] flex flex-col max-h-[92vh]">
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
            <button onClick={handleCloseModal} className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 transition cursor-pointer" title="Yopish">
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
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
              className={`bg-white shadow-md border border-slate-300 font-mono text-black ${
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
              onClick={handleCloseModal}
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
    </>
  );
});
