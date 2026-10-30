// Thermal Receipt & Ticket Printing Engine
// Provides zero-margin, exact-height printing for 80mm & 58mm thermal printers in both Web and Electron

export interface TicketConfig {
  clinicName?: string;
  showLogo?: boolean;
  address?: string;
  phone?: string;
  welcomeNote?: string;
  showDate?: boolean;
  showTicketNumber?: boolean;
  showSpecialty?: boolean;
  showDoctor?: boolean;
  showCabinet?: boolean;
  showPatientName?: boolean;
  showPaymentStatus?: boolean;
  showWaitTime?: boolean;
  showQrCode?: boolean;
  showCutLine?: boolean;
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
  const is80 = paperSize === '80mm';
  const paperWidthMm = is80 ? '80mm' : '58mm';
  const contentWidthMm = is80 ? '76mm' : '52mm';

  const clinicName = config.clinicName || 'KLINIKA-ADMIN';
  const address = config.address || '';
  const phone = config.phone || '';
  const welcomeNote = config.welcomeNote || '';
  const footerText = config.footerText || "Tashrifingiz uchun rahmat! Salomat bo'ling!";
  const footerNote = config.footerNote || 'Navbatingizni zal monitorida kuzatib boring';

  const now = new Date().toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const renderSingleTicket = (tck: any) => {
    const patientName = tck.patient_name || tck.patientName || "Noma'lum bemor";
    const specialty = tck.specialty_name || tck.specialtyName || 'Qabul';
    const cabinetNumber = tck.cabinet_number || tck.cabinetNumber || '1';
    const doctorName = tck.doctor_name || tck.doctorName || 'Shifokor';
    const ticketNum = tck.full_number || tck.fullNumber || tck.ticketNumber || '001';
    const paymentText =
      tck.payment_status === 'PAID'
        ? "To'langan"
        : tck.payment_status === 'EXEMPT'
        ? 'Imtiyozli (Bepul)'
        : "To'lov qabulda";
    const waitMinutes = tck.estimated_wait_minutes || tck.estimatedWaitMinutes || 15;

    return `
      <div class="ticket-card">
        <!-- HEADER -->
        <div class="ticket-header">
          <div class="clinic-name">${clinicName}</div>
          ${address ? `<div class="clinic-sub">${address}</div>` : ''}
          <div class="clinic-sub">
            ${phone ? `Tel: ${phone}` : ''}
            ${phone && config.showDate !== false ? ' • ' : ''}
            ${config.showDate !== false ? now : ''}
          </div>
          ${welcomeNote ? `<div class="clinic-welcome">${welcomeNote}</div>` : ''}
        </div>

        <div class="divider-dashed"></div>

        <!-- TICKET NUMBER -->
        ${
          config.showTicketNumber !== false
            ? `
          <div class="ticket-num-box">
            <div class="ticket-number">${ticketNum}</div>
            ${config.showSpecialty !== false ? `<div class="ticket-specialty">${specialty}</div>` : ''}
          </div>
        `
            : ''
        }

        <!-- CABINET & DOCTOR -->
        ${
          config.showCabinet !== false || config.showDoctor !== false
            ? `
          <div class="cabinet-box">
            ${config.showCabinet !== false ? `<div class="cabinet-num">KABINET № ${cabinetNumber}</div>` : ''}
            ${config.showDoctor !== false ? `<div class="doctor-name">${doctorName}</div>` : ''}
          </div>
        `
            : ''
        }

        <!-- PATIENT INFO -->
        ${
          config.showPatientName !== false
            ? `
          <div class="patient-section">
            <div class="patient-label">Bemor:</div>
            <div class="patient-name">${patientName}</div>
            ${
              config.showPaymentStatus !== false || config.showWaitTime !== false
                ? `
              <div class="patient-meta">
                ${config.showPaymentStatus !== false ? `<span>To'lov: <b>${paymentText}</b></span>` : ''}
                ${config.showWaitTime !== false ? `<span>Kutish: <b>~${waitMinutes} daq</b></span>` : ''}
              </div>
            `
                : ''
            }
          </div>
        `
            : ''
        }

        <!-- QR CODE -->
        ${
          config.showQrCode !== false
            ? `
          <div class="qr-section">
            <div class="qr-box">${QR_CODE_SVG}</div>
            <div class="qr-sub">Navbatni smartfonda kuzatish uchun QR-kodni skanerlang</div>
          </div>
        `
            : ''
        }

        <!-- FOOTER -->
        ${
          footerText || footerNote
            ? `
          <div class="footer-section">
            ${footerText ? `<div class="footer-main">${footerText}</div>` : ''}
            ${footerNote ? `<div class="footer-note">${footerNote}</div>` : ''}
          </div>
        `
            : ''
        }

        <!-- CUT LINE -->
        ${
          config.showCutLine !== false
            ? `
          <div class="cut-line">- - - Qirqish chizig'i - - -</div>
        `
            : ''
        }
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
        <div class="ticket-header">
          <div class="clinic-name">${clinicName}</div>
          <div class="receipt-badge">KASSA NOFISKAL KVITANSIYASI</div>
          <div class="clinic-sub">${receiptNum} • ${now}</div>
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
      padding: ${is80 ? '1mm 1mm 2mm 1mm' : '1mm 0.5mm 1.5mm 0.5mm'};
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
    .ticket-header {
      text-align: center;
      margin-bottom: 4px;
    }
    .clinic-name {
      font-size: ${is80 ? '15px' : '12px'};
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
      line-height: 1.2;
    }
    .clinic-sub {
      font-size: ${is80 ? '10px' : '8.5px'};
      line-height: 1.25;
      color: #000000;
    }
    .clinic-welcome {
      font-size: ${is80 ? '9.5px' : '8px'};
      font-style: italic;
      margin-top: 2px;
      line-height: 1.2;
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
    .ticket-num-box {
      margin: 3px 0 2px 0;
      text-align: center;
    }
    .ticket-number {
      font-size: ${is80 ? '68px' : '48px'};
      font-weight: 900;
      font-family: "Courier New", Courier, monospace;
      letter-spacing: -2px;
      line-height: 0.95;
      margin: 0;
    }
    .ticket-specialty {
      font-size: ${is80 ? '13px' : '11px'};
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 3px;
    }
    .cabinet-box {
      border: 1.5px solid #000000;
      border-radius: 6px;
      padding: ${is80 ? '5px 4px' : '4px 2px'};
      margin: 5px 0;
      text-align: center;
    }
    .cabinet-num {
      font-size: ${is80 ? '15px' : '12px'};
      font-weight: 900;
      letter-spacing: 0.5px;
    }
    .doctor-name {
      font-size: ${is80 ? '11px' : '9.5px'};
      font-weight: 700;
      margin-top: 2px;
      word-break: break-word;
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
    .qr-section {
      margin: 4px 0 2px 0;
      text-align: center;
    }
    .qr-box {
      display: inline-block;
      padding: 2px;
      border: 1.5px solid #000000;
      border-radius: 6px;
      background: #ffffff;
      margin-bottom: 2px;
    }
    .qr-box svg {
      width: ${is80 ? '38px' : '30px'};
      height: ${is80 ? '38px' : '30px'};
      display: block;
    }
    .qr-sub {
      font-size: ${is80 ? '9px' : '7.5px'};
      line-height: 1.2;
    }
    .footer-section {
      margin-top: 3px;
      text-align: center;
    }
    .footer-main {
      font-size: ${is80 ? '9.5px' : '8px'};
      font-weight: 700;
      line-height: 1.2;
    }
    .footer-note {
      font-size: ${is80 ? '8.5px' : '7px'};
      margin-top: 1px;
      line-height: 1.2;
    }
    .cut-line {
      border-bottom: 1.5px dashed #555555;
      font-size: ${is80 ? '9px' : '7.5px'};
      padding: 5px 0 1px 0;
      text-align: center;
      margin-top: 3px;
    }
    .receipt-items {
      padding: 4px 0;
      text-align: left;
    }
    .receipt-row {
      display: flex;
      justify-content: space-between;
      font-size: ${is80 ? '10.5px' : '9px'};
      padding: 1.5px 0;
    }
    .receipt-row-title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding-right: 4px;
    }
    .receipt-row-price {
      font-weight: 700;
      flex-shrink: 0;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      font-size: ${is80 ? '14px' : '11.5px'};
      font-weight: 900;
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
  const paperSize = options.paperSize || '80mm';

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

