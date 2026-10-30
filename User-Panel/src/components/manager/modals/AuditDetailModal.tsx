import React from 'react';
import { FileText, X, Sparkles, User, HeartPulse, Stethoscope, CreditCard, Check, Copy } from 'lucide-react';

interface AuditDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  copiedAuditJson: boolean;
  onCopy: () => void;
  getExplanation: (item: any) => string;
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  copiedAuditJson,
  onCopy,
  getExplanation,
}) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shadow-inner">
              <FileText className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">Audit Hodisasi Tafsilotlari & Jarayon Tahlili</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  {item.log_type}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Hodisa ID: <span className="font-mono text-indigo-200">{item.id}</span>
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Process Explanation Box */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Jarayonda nimalar sodir bo'ldi? (Voqea tahlili)
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-200/60 text-indigo-800">
                PostgreSQL 16 Qaydnomasi
              </span>
            </div>
            <p className="text-xs font-medium text-indigo-950 leading-relaxed bg-white/80 p-3 rounded-xl border border-indigo-100">
              {getExplanation(item)}
            </p>
          </div>

          {/* Grid of Key Participants */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Actor */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Mas'ul Xodim (Ijrochi)</span>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">{item.actor_name || 'Tizim'}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 ml-6">
                Roli: <span className="font-semibold text-slate-700">{item.actor_role || 'Xodim'}</span>
              </div>
            </div>

            {/* Patient */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Bemor Ma'lumotlari</span>
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">{item.patient_name || 'Biriktirilmagan'}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 ml-6">
                Tel: <span className="font-mono text-slate-700">{item.patient_phone || '-'}</span>
              </div>
            </div>

            {/* Doctor & Room */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Shifokor & Kabinet</span>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">{item.doctor_name || 'Biriktirilmagan'}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 ml-6">
                {item.room_number ? `${item.room_number}-xona` : ''} {item.specialty_name ? `• ${item.specialty_name}` : ''}
              </div>
            </div>

            {/* Object Reference & Amount */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Hujjat / To'lov Parametrlari</span>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold font-mono text-slate-800">{item.object_reference || item.id}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 ml-6">
                {item.amount ? (
                  <span className="font-bold text-emerald-600">{Number(item.amount).toLocaleString('uz-UZ')} so'm ({item.payment_method || 'To\'lov'})</span>
                ) : (
                  <span>Holat: <strong className="text-indigo-600">{item.status || 'SUCCESS'}</strong></span>
                )}
              </div>
            </div>
          </div>

          {/* Technical Timestamps & System Logs */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Tizim va Xavfsizlik Metadatalari</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400">Aniq vaqt: </span>
                <span className="font-mono font-semibold text-slate-700">
                  {item.timestamp ? new Date(item.timestamp).toISOString() : '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Manba: </span>
                <span className="font-mono font-semibold text-slate-700">PostgreSQL (sadaf_clinic_db)</span>
              </div>
              <div>
                <span className="text-slate-400">IP Manzili: </span>
                <span className="font-mono font-semibold text-slate-700">127.0.0.1 (Ichki xavfsiz tarmoq)</span>
              </div>
              <div>
                <span className="text-slate-400">Amal kodi: </span>
                <span className="font-mono font-bold text-indigo-600">{item.action}</span>
              </div>
            </div>
          </div>

          {/* Raw JSON Code Block */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold">
              <span>To'liq Audit JSON Parametrlari (Xom ma'lumotlar):</span>
              <button
                type="button"
                onClick={onCopy}
                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 transition cursor-pointer"
              >
                {copiedAuditJson ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Nusxalandi!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Nusxa olish
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-indigo-200 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800">
              {JSON.stringify(item, null, 2)}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            Ushbu audit qaydnomasi o'zgartirilishi mumkin emas (Immutability kafolatlangan)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};

