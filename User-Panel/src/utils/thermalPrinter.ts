// Thermal Receipt & Ticket Printing Engine
// Provides zero-margin, exact-height printing for 80mm & 58mm thermal printers in both Web and Electron
import { APP_LOGO } from './brand';

export interface TicketConfig {
  paperSize?: '80mm' | '58mm';
  copies?: number;
  autoPrint?: boolean;
  soundAlert?: boolean;

  // Header & Clinic Info
  clinicName?: string;
  headerTitle?: string;
  headerSubtitle?: string;
  welcomeNote?: string;
  address?: string;
  phone?: string;
  logoUrl?: string;

  // Toggle Visibility
  showLogo?: boolean;
  showHeader?: boolean;
  showTicketNumber?: boolean;
  showSpecialty?: boolean;
  showDepartment?: boolean;
  showDoctor?: boolean;
  showDoctorName?: boolean;
  showCabinet?: boolean;
  showPatientName?: boolean;
  showDate?: boolean;
  showPaymentStatus?: boolean;
  showServicePrice?: boolean;
  showWaitTime?: boolean;
  showWaitingCount?: boolean;
  showEstimatedTime?: boolean;
  showQrCode?: boolean;
  showFooter?: boolean;
  showCutLine?: boolean;

  // Footer text & notes
  footerText?: string;
  footerNote?: string;
}

export interface PrintThermalOptions {
  tickets: any[];
  config?: TicketConfig;
  paperSize?: '80mm' | '58mm';
  mode?: 'TICKETS' | 'RECEIPT';
  payment?: any;
  silent?: boolean;
}

const QR_CODE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;">
  <rect width="5" height="5" x="3" y="3" rx="1"/>
  <rect width="5" height="5" x="16" y="3" rx="1"/>
  <rect width="5" height="5" x="3" y="16" rx="1"/>
  <path d="M21 16V8a2 2 0 0 0-2-2h-5"/>
  <path d="M3 12h7"/>
  <path d="M14 21v-5a2 2 0 0 0-2-2H8"/>
  <path d="M17 14h.01"/>
  <path d="M17 17h.01"/>
  <path d="M20 21h.01"/>
</svg>
`;

export function generateThermalHtml({
  tickets,
  config = {},
  paperSize = '80mm',
  mode = 'TICKETS',
  payment
}: PrintThermalOptions): string {
  const effectivePaperSize = config.paperSize || paperSize || '80mm';
  const is80 = effectivePaperSize === '80mm';
  const paperWidthMm = is80 ? '80mm' : '58mm';
  const contentWidthMm = is80 ? '76mm' : '52mm';

  // Resolved config values with full fallback support
  const clinicName = config.headerTitle || config.clinicName || 'SADAF TIBBIYOT MARKAZI';
  const headerSubtitle = config.headerSubtitle || config.welcomeNote || '';
  const address = config.address || '';
  const phone = config.phone || '';
  const logoUrl = config.logoUrl || APP_LOGO;
  
  const showLogo = config.showLogo !== false && !!logoUrl;
  const showHeader = config.showHeader !== false;
  const showTicketNumber = config.showTicketNumber !== false;
  const showDoctorName = config.showDoctorName !== false && config.showDoctor !== false;
  const showDepartment = config.showDepartment !== false && config.showSpecialty !== false;
  const showCabinet = config.showCabinet !== false;
  const showPatientName = config.showPatientName !== false;
  const showDate = config.showDate !== false;
  const showWaitingCount = config.showWaitingCount !== false && config.showWaitTime !== false;
  const showEstimatedTime = config.showEstimatedTime !== false && config.showWaitTime !== false;
  const showServicePrice = config.showServicePrice !== false && config.showPaymentStatus !== false;
  const showQrCode = config.showQrCode !== false;
  const showFooter = config.showFooter !== false;
  const showCutLine = config.showCutLine !== false;

  const footerText = config.footerText || "Tashrifingiz uchun rahmat! Salomat bo'ling!";
  const footerNote = config.footerNote || '';

  const now = new Date();
  const dateStr = now.toLocaleDateString('uz-UZ');
  const timeStr = now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

  const renderSingleTicket = (tck: any) => {
    const patientName = tck.patient_name || tck.patientName || "Rustamov O. (+998 90 *** 45)";
    const specialty = tck.specialty_name || tck.specialtyName || 'Kardiologiya';
    const cabinetNumber = tck.cabinet_number || tck.cabinetNumber || '7 • 2-QAVAT';
    const doctorName = tck.doctor_name || tck.doctorName || 'Dr. Bobur Ergashev';
    const ticketNum = tck.full_number || tck.fullNumber || tck.ticketNumber || tck.ticket_number || 'A-012';

    let paymentText = "150,000 so'm (To'langan)";
    if (tck.payment_status === 'PAID') {
      paymentText = tck.service_price ? `${Number(tck.service_price).toLocaleString()} so'm (To'langan)` : "To'langan";
    } else if (tck.payment_status === 'EXEMPT') {
      paymentText = "Imtiyozli (Bepul)";
    } else if (tck.service_price) {
      paymentText = `${Number(tck.service_price).toLocaleString()} so'm (To'lov qabulda)`;
    }

    const waitCount = tck.waiting_count ?? tck.ahead_count ?? 3;
    const waitMinutes = tck.estimated_wait_minutes || tck.estimatedWaitMinutes || 20;

    return `
      <div class="ticket-card">
        <!-- 1. CLINIC LOGO -->
        ${showLogo ? `
          <div class="ticket-logo-box">
            <img src="${logoUrl}" alt="Klinika Logotipi" class="ticket-logo-img" />
          </div>
        ` : ''}

        <!-- 2. CLINIC HEADER -->
        ${showHeader ? `
          <div class="ticket-header">
            <div class="clinic-name">${clinicName}</div>
            ${headerSubtitle ? `<div class="clinic-subtitle">${headerSubtitle}</div>` : ''}
            ${phone ? `<div class="clinic-phone">Tel: ${phone}</div>` : ''}
            ${address ? `<div class="clinic-address">${address}</div>` : ''}
          </div>
        ` : ''}

        <!-- 3. DATE & TIME BAR -->
        ${showDate ? `
          <div class="datetime-bar">
            <span>${dateStr}</span>
            <span>${timeStr}</span>
          </div>
        ` : ''}

        <!-- 4. BIG TICKET NUMBER -->
        ${showTicketNumber ? `
          <div class="ticket-num-box">
            <div class="ticket-label">SIZNING NAVBATINGIZ</div>
            <div class="ticket-number">${ticketNum}</div>
            ${showCabinet ? `
              <div class="ticket-cabinet-badge">KABINET № ${cabinetNumber}</div>
            ` : ''}
          </div>
        ` : ''}

        <!-- 5. DETAILS LIST (DOCTOR, DEPARTMENT, ROOM, PATIENT, SERVICE) -->
        <div class="ticket-details-list">
          ${showDoctorName ? `
            <div class="detail-row">
              <span class="detail-label">Shifokor:</span>
              <span class="detail-value font-bold">${doctorName}</span>
            </div>
          ` : ''}

          ${showDepartment ? `
            <div class="detail-row">
              <span class="detail-label">Bo'lim:</span>
              <span class="detail-value">${specialty}</span>
            </div>
          ` : ''}

          ${showCabinet && !showTicketNumber ? `
            <div class="detail-row">
              <span class="detail-label">Xona:</span>
              <span class="detail-value font-bold">${cabinetNumber}</span>
            </div>
          ` : ''}

          ${showPatientName ? `
            <div class="detail-row">
              <span class="detail-label">Bemor:</span>
              <span class="detail-value">${patientName}</span>
            </div>
          ` : ''}

          ${showServicePrice ? `
            <div class="detail-row border-top-dotted">
              <span class="detail-label">Xizmat:</span>
              <span class="detail-value font-bold">${paymentText}</span>
            </div>
          ` : ''}
        </div>

        <!-- 6. WAITING STATS -->
        ${(showWaitingCount || showEstimatedTime) ? `
          <div class="waiting-stats-box">
            ${showWaitingCount ? `
              <div class="waiting-row">
                <span>Oldingizda:</span>
                <span class="font-bold">${waitCount} nafar bemor</span>
              </div>
            ` : ''}
            ${showEstimatedTime ? `
              <div class="waiting-row">
                <span>Taxminiy vaqt:</span>
                <span class="font-bold">~ ${waitMinutes} daqiqa</span>
              </div>
            ` : ''}
          </div>
        ` : ''}

        <!-- 7. QR CODE -->
        ${showQrCode ? `
          <div class="qr-section">
            <div class="qr-box">${QR_CODE_SVG}</div>
            <div class="qr-sub">Navbatingizni telefonda kuzatish uchun skanerlang</div>
          </div>
        ` : ''}

        <!-- 8. FOOTER NOTE -->
        ${showFooter ? `
          <div class="footer-section">
            <div class="footer-main">${footerText}</div>
            ${footerNote ? `<div class="footer-note">${footerNote}</div>` : ''}
          </div>
        ` : ''}

        <!-- 9. CUT LINE -->
        ${showCutLine ? `
          <div class="cut-line">- - - Qirqish chizig'i - - -</div>
        ` : ''}
      </div>
    `;
  };

  const renderReceipt = () => {
    const firstTicket = tickets[0] || {};
    const patientName = firstTicket.patient_name || firstTicket.patientName || "Noma'lum bemor";
    const receiptNum = payment?.receipt_number || 'RCP-892110';
    const payMethod =
      payment?.method === 'CARD' ? 'Karta' : payment?.method === 'TRANSFER' ? "O'tkazma" : 'Naqd';
    const totalAmount = Number(payment?.amount || 0).toLocaleString();

    return `
      <div class="ticket-card">
        ${showLogo ? `
          <div class="ticket-logo-box">
            <img src="${logoUrl}" alt="Klinika Logotipi" class="ticket-logo-img" />
          </div>
        ` : ''}

        <div class="ticket-header">
          <div class="clinic-name">${clinicName}</div>
          <div class="receipt-badge">KASSA NOFISKAL KVITANSIYASI</div>
          <div class="clinic-sub">${receiptNum} • ${dateStr} ${timeStr}</div>
        </div>

        <div class="divider-dashed"></div>

        <div class="patient-section">
          <div class="patient-label">Bemor:</div>
          <div class="patient-name">${patientName}</div>
          <div class="patient-meta">
            <span>To'lov turi: <b>${payMethod}</b></span>
            <span>Kassir: <b>Navbatchi</b></span>
          </div>
        </div>

        <div class="receipt-items">
          ${tickets
            .map(
              (t) => `
            <div class="receipt-row">
              <span class="receipt-row-title">${t.specialty_name || t.specialtyName || 'Tibbiy xizmat'}</span>
              <span class="receipt-row-price">${
                t.service_price ? Number(t.service_price).toLocaleString() + " so'm" : "Ko'rik"
              }</span>
            </div>
          `
            )
            .join('')}
        </div>

        <div class="divider-dashed"></div>

        <div class="total-row">
          <span>JAMI TO'LANDI:</span>
          <span>${totalAmount} so'm</span>
        </div>

        <div class="footer-section">
          <div class="footer-main">Tibbiy xizmatlarimizdan foydalanganingiz uchun tashakkur! Salomat bo'ling!</div>
        </div>

        <div class="cut-line">- - - Qirqish chizig'i - - -</div>
      </div>
    `;
  };

  const bodyContent =
    mode === 'RECEIPT'
      ? renderReceipt()
      : tickets
          .map((t, idx) => `
            ${idx > 0 ? '<div class="page-break"></div>' : ''}
            ${renderSingleTicket(t)}
          `)
          .join('');

  return `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="utf-8">
  <title>Talon - ${clinicName}</title>
  <style>
    @page {
      size: ${paperWidthMm} auto;
      margin: 0 !important;
    }
    * {
      box-sizing: border-box !important;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      width: ${paperWidthMm} !important;
      min-width: ${paperWidthMm} !important;
      max-width: ${paperWidthMm} !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #000000 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      font-size: ${is80 ? '11px' : '9.5px'};
      line-height: 1.25;
      overflow: visible !important;
    }
    .print-wrapper {
      width: ${contentWidthMm};
      max-width: ${contentWidthMm};
      margin: 0 auto;
      padding: ${is80 ? '2mm 1mm 3mm 1mm' : '1.5mm 0.5mm 2mm 0.5mm'};
      text-align: center;
    }
    .ticket-card {
      width: 100%;
      text-align: center;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .page-break {
      page-break-before: always;
      break-before: page;
      height: 3mm;
    }
    .ticket-logo-box {
      text-align: center;
      margin: 0 auto 3px auto;
      padding: 0;
    }
    .ticket-logo-img {
      max-height: ${is80 ? '42px' : '32px'};
      max-width: 80%;
      object-fit: contain;
      margin: 0 auto;
      display: block;
      filter: grayscale(100%) contrast(140%);
    }
    .ticket-header {
      text-align: center;
      margin-bottom: 4px;
      padding-bottom: 4px;
      border-bottom: 1.5px dashed #000000;
    }
    .clinic-name {
      font-size: ${is80 ? '15px' : '12px'};
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
      line-height: 1.2;
    }
    .clinic-subtitle {
      font-size: ${is80 ? '10px' : '8.5px'};
      font-style: italic;
      color: #333333;
      margin-bottom: 2px;
    }
    .clinic-phone {
      font-size: ${is80 ? '10px' : '8.5px'};
      font-weight: 700;
      font-family: "Courier New", Courier, monospace;
      color: #000000;
    }
    .clinic-address {
      font-size: ${is80 ? '9.5px' : '8px'};
      color: #333333;
      line-height: 1.2;
    }
    .datetime-bar {
      display: flex;
      justify-content: space-between;
      font-size: ${is80 ? '10px' : '8.5px'};
      font-family: "Courier New", Courier, monospace;
      padding: 2px 0 3px 0;
      border-bottom: 1px dotted #888888;
      color: #000000;
    }
    .ticket-num-box {
      margin: 4px 0 4px 0;
      padding: 4px 0 6px 0;
      border-bottom: 2px solid #000000;
      text-align: center;
    }
    .ticket-label {
      font-size: ${is80 ? '10px' : '8.5px'};
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #444444;
      margin-bottom: 1px;
    }
    .ticket-number {
      font-size: ${is80 ? '60px' : '44px'};
      font-weight: 900;
      font-family: "Courier New", Courier, monospace;
      letter-spacing: -2px;
      line-height: 0.95;
      margin: 0;
      color: #000000;
    }
    .ticket-cabinet-badge {
      font-size: ${is80 ? '12px' : '10px'};
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
      color: #000000;
    }
    .ticket-details-list {
      padding: 4px 0;
      border-bottom: 1.5px dashed #000000;
      font-size: ${is80 ? '11px' : '9.5px'};
      line-height: 1.35;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 2px;
    }
    .detail-label {
      color: #555555;
      font-size: ${is80 ? '10px' : '8.5px'};
      flex-shrink: 0;
      margin-right: 6px;
    }
    .detail-value {
      text-align: right;
      color: #000000;
      word-break: break-word;
    }
    .font-bold {
      font-weight: 700 !important;
    }
    .border-top-dotted {
      border-top: 1px dotted #888888;
      padding-top: 3px;
      margin-top: 2px;
    }
    .waiting-stats-box {
      margin: 4px 0;
      padding: 4px 6px;
      background: #f8f8f8;
      border: 1px solid #cccccc;
      border-radius: 4px;
      font-size: ${is80 ? '10px' : '8.5px'};
    }
    .waiting-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1px;
    }
    .qr-section {
      margin: 4px 0 2px 0;
      text-align: center;
      padding-bottom: 4px;
      border-bottom: 1.5px dashed #000000;
    }
    .qr-box {
      display: inline-block;
      padding: 2px;
      border: 1.5px solid #000000;
      border-radius: 4px;
      background: #ffffff;
      margin-bottom: 2px;
    }
    .qr-box svg {
      width: ${is80 ? '40px' : '32px'};
      height: ${is80 ? '40px' : '32px'};
      display: block;
    }
    .qr-sub {
      font-size: ${is80 ? '9px' : '7.5px'};
      line-height: 1.2;
      color: #555555;
    }
    .footer-section {
      margin-top: 4px;
      text-align: center;
      font-size: ${is80 ? '10px' : '8.5px'};
      line-height: 1.3;
    }
    .footer-main {
      font-weight: 800;
      color: #000000;
    }
    .footer-note {
      font-size: ${is80 ? '9px' : '7.5px'};
      color: #555555;
      font-style: italic;
      margin-top: 1px;
    }
    .cut-line {
      border-bottom: 1.5px dashed #666666;
      font-size: ${is80 ? '9px' : '7.5px'};
      padding: 6px 0 1px 0;
      text-align: center;
      margin-top: 4px;
      color: #666666;
      font-family: sans-serif;
    }
    .receipt-badge {
      font-size: ${is80 ? '10.5px' : '9px'};
      font-weight: 800;
      margin: 2px 0;
      letter-spacing: 0.5px;
    }
    .divider-dashed {
      border-bottom: 1.5px dashed #000000;
      margin: 4px 0;
      width: 100%;
    }
    .patient-section {
      text-align: left;
      padding: 4px 0;
      margin: 4px 0;
      border-top: 1.5px dashed #000000;
      border-bottom: 1.5px dashed #000000;
    }
    .patient-label {
      font-size: ${is80 ? '9.5px' : '8px'};
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .patient-name {
      font-size: ${is80 ? '13px' : '11px'};
      font-weight: 900;
      line-height: 1.2;
      margin-top: 1px;
      word-break: break-word;
    }
    .patient-meta {
      display: flex;
      justify-content: space-between;
      font-size: ${is80 ? '10px' : '8.5px'};
      margin-top: 3px;
      padding-top: 3px;
      border-top: 1px dotted #888888;
      font-family: "Courier New", Courier, monospace;
    }
    .receipt-items {
      padding: 4px 0;
      text-align: left;
    }
    .receipt-row {
      display: flex;
      justify-content: space-between;
      font-size: ${is80 ? '10.5px' : '9px'};
      margin-bottom: 2px;
    }
    .receipt-row-title {
      color: #333333;
    }
    .receipt-row-price {
      font-weight: 700;
      font-family: "Courier New", Courier, monospace;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: ${is80 ? '12px' : '10.5px'};
      font-weight: 900;
      padding: 4px 0;
      margin: 3px 0;
      font-family: "Courier New", Courier, monospace;
    }
  </style>
</head>
<body>
  <div class="print-wrapper">
    ${bodyContent}
  </div>
</body>
</html>`;
}

/**
 * Clean isolated thermal print executor:
 * - In Electron: delegates HTML to hidden offscreen BrowserWindow with zero margins & dynamic height
 * - In Web Browser: writes HTML to isolated hidden iframe and calls iframe.contentWindow.print()
 */
export async function printThermalTicket(options: PrintThermalOptions): Promise<{ success: boolean; error?: string }> {
  const html = generateThermalHtml(options);
  const paperSize = options.paperSize || options.config?.paperSize || '80mm';

  // 1. Electron Desktop Environment
  if (typeof window !== 'undefined' && (window as any).electronAPI?.printTicket) {
    try {
      const res = await (window as any).electronAPI.printTicket({
        html,
        paperSize,
        silent: Boolean(options.silent)
      });
      return res || { success: true };
    } catch (err: any) {
      console.warn('Electron printTicket error, falling back to iframe print:', err);
    }
  }

  // 2. Web Browser Environment (Hidden isolated iframe)
  return new Promise<{ success: boolean; error?: string }>((resolve) => {
    try {
      const existing = document.getElementById('thermal-isolated-print-frame');
      if (existing) {
        existing.remove();
      }

      const iframe = document.createElement('iframe');
      iframe.id = 'thermal-isolated-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!frameDoc) {
        window.print();
        resolve({ success: true });
        return;
      }

      frameDoc.open();
      frameDoc.write(html);
      frameDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          resolve({ success: true });
        } catch (printErr: any) {
          console.warn('iframe.print error, fallback window.print:', printErr);
          window.print();
          resolve({ success: false, error: printErr?.message });
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              iframe.remove();
            }
          }, 2000);
        }
      }, 200);
    } catch (e: any) {
      window.print();
      resolve({ success: false, error: e?.message });
    }
  });
}
