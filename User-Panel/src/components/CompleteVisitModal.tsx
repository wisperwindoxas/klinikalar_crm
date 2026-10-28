import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Stethoscope, 
  FileText, 
  Sparkles, 
  RotateCcw, 
  User, 
  Clock, 
  Building2, 
  AlertCircle,
  Plus,
  Send,
  HeartPulse,
  Activity,
  Smile,
  Eye,
  Scissors,
  Baby
} from 'lucide-react';

export interface CompleteVisitModalProps {
  isOpen: boolean;
  ticket: any;
  doctorInfo: {
    id?: string;
    display_name?: string;
    specialty_name?: string;
    cabinet_number?: string | number;
  };
  initialNotes?: string;
  onClose: () => void;
  onConfirm: (conclusion: string) => Promise<void> | void;
  isLoading?: boolean;
}

// 1. Shifokor sohasi bo'yicha tezkor xulosalar bazasi
interface SpecialtyTemplate {
  key: string;
  label: string;
  icon: any;
  templates: string[];
}

const SPECIALTY_TEMPLATES: SpecialtyTemplate[] = [
  {
    key: 'stomat',
    label: 'Stomatologiya',
    icon: Smile,
    templates: [
      "O'tkir o'rta karies davolandi, fotopolimer kompozit plomba qo'yildi va silliqlandi.",
      "Pulpit davolandi, ildiz kanallari kengaytirilib plombalandi.",
      "Tish toshlari va pigmentli karashlar ultratovush yordamida tozalandi.",
      "Og'iz bo'shlig'i sanatsiyasi o'tkazildi, profilaktik gigiyena tavsiya etildi.",
      "Profilaktik stomatologik ko'rik: yangi patologiya aniqlanmadi.",
    ],
  },
  {
    key: 'kardio',
    label: 'Kardiologiya',
    icon: HeartPulse,
    templates: [
      "EKG o'tkazildi: sinus ritmi me'yorda. Arterial gipertoniya I-bosqich, gipotenziv davo belgilandi.",
      "Arterial qon bosimi barqarorlashtirildi, tuzsiz parhez va kunlik kundalik yuritish tavsiya etildi.",
      "Yurak qon-tomir faoliyati qoniqarli, jismoniy zo'riqishlarni cheklash tayinlandi.",
      "Kardiologik nazorat, 1 oydan so'ng takroriy EKG va ko'rikka kelish tavsiya etildi.",
    ],
  },
  {
    key: 'terap',
    label: 'Terapiya',
    icon: Stethoscope,
    templates: [
      "O'RVI (o'tkir respirator virusli infeksiya) alomatlari, simptomatik davo va ko'p suyuqlik buyurildi.",
      "Umumiy ahvoli qoniqarli, umumiy qon va siydik tahlillari topshirish tavsiya etildi.",
      "Surunkali gastrit remissiya davrida, №1 parhez stoli va antatsid vositalar tavsiya etildi.",
      "Somatik sog'lom, shikoyatlari mavjud emas, profilaktik rejim.",
    ],
  },
  {
    key: 'nevro',
    label: 'Nevrologiya',
    icon: Activity,
    templates: [
      "Umurtqa pog'onasi osteoxondrozi, mushak-tonik sindromi. Massaj va B guruhi vitaminlari buyurildi.",
      "Vegeto-qon tomir distoniyasi, tinchlantiruvchi rejim va uyqu gigiyenasi tavsiya etildi.",
      "Nevrologik statusda o'choqli zararlanishlar aniqlanmadi.",
      "Miyaning funksional zo'riqishi, surunkali charchoq sindromi. Mehnat va dam olish balansi tavsiya qilindi.",
    ],
  },
  {
    key: 'pediatr',
    label: 'Pediatriya',
    icon: Baby,
    templates: [
      "Bola jismoniy rivojlanishi yosh normasiga mos, o'tkir somatik patologiya aniqlanmadi.",
      "Mavsumiy shamollash, vitaminoterapiya va iliq suyuqlik ichish tavsiya etildi.",
      "Profilaktik emlash (vaksina) olishga qarshi ko'rsatmalar yo'q, ruxsat berildi.",
      "Funksional dispepsiya, yoshga mos ovqatlanish ratsioni buyurildi.",
    ],
  },
  {
    key: 'oftalm',
    label: 'Oftalmologiya',
    icon: Eye,
    templates: [
      "Ko'rish o'tkirligi tekshirildi, ko'zoynak korreksiyasi bo'yicha retsept berildi.",
      "Birlamchi konyunktivit, antiseptik va namlantiruvchi ko'z tomchilari buyurildi.",
      "Ko'z tubi va ko'z ichi bosimi me'yorda, glaukoma belgilari yo'q.",
      "Kompyuter ko'rish sindromi, dam olish mashqlari va tomchilar tavsiya etildi.",
    ],
  },
  {
    key: 'lor',
    label: 'LOR (Quloq, burun, tomoq)',
    icon: Stethoscope,
    templates: [
      "Surunkali tonzillit remissiyada, tomoqni antiseptik chayish buyurildi.",
      "O'tkir vazomotor rinit, burun tomchilari va ingalyatsiya tavsiya etildi.",
      "Quloq-burun-tomoq a'zolari tekshirildi, o'tkir yallig'lanish aniqlanmadi.",
      "Tashqi otit, maxsus quloq tomchilari va quruq issiqlik tayinlandi.",
    ],
  },
  {
    key: 'jarroh',
    label: 'Jarrohlik',
    icon: Scissors,
    templates: [
      "Birlamchi jarrohlik ishlovi berildi, aseptik steril bog'lam qo'yildi.",
      "Choklar ko'zdan kechirildi, jarohat birlamchi bitgan.",
      "O'tkir jarrohlik patologiyasi aniqlanmadi.",
      "Bog'lov almashtirish (perevyazka) uchun 2 kundan so'ng kelish tavsiya etildi.",
    ],
  },
  {
    key: 'derma',
    label: 'Dermatologiya',
    icon: Activity,
    templates: [
      "Allergik dermatit, gipoallergen parhez va antigistamin preparatlar tavsiya etildi.",
      "Terida o'tkir infeksion yoki zamburug'li zararlanish aniqlanmadi.",
      "Seboreyali dermatit, maxsus davolovchi krem va terini parvarishlash tavsiya etildi.",
    ],
  },
  {
    key: 'gineko',
    label: 'Ginekologiya',
    icon: Activity,
    templates: [
      "Profilaktik ko'rik: patologik o'zgarishlar topilmadi, a'zolar me'yorda.",
      "Rejali homiladorlik nazorati, skrining ko'rsatkichlari qoniqarli.",
      "Profilaktik tavsiyalar va vitaminlar buyurildi.",
    ],
  },
  {
    key: 'uro',
    label: 'Urologiya',
    icon: Activity,
    templates: [
      "Siydik-tanosil a'zolari ko'rikdan o'tkazildi, o'tkir yallig'lanish yo'q.",
      "Urologik tahlillar va UZI tekshiruvi topshirish tavsiya etildi.",
      "Ko'p suyuqlik ichish tartibi va fitoterapiya buyurildi.",
    ],
  },
  {
    key: 'uzi',
    label: 'UZI Diagnostika',
    icon: Activity,
    templates: [
      "Qorin bo'shlig'i a'zolarida o'choqli patologik o'zgarishlar aniqlanmadi.",
      "Jigar va o't pufagi tekshirildi, o'lchamlari me'yorda.",
      "Buyraklar va siydik pufagi patologiyasiz, konkrementlar (toshlar) topilmadi.",
    ],
  },
];

// 2. Barcha sohalar uchun universal tezkor xulosalar
const UNIVERSAL_TEMPLATES = [
  { text: "Bemor sog'lom, shikoyatlari yo'q", icon: "✅" },
  { text: "Ambulator davolanish va rejim tavsiya etildi", icon: "💊" },
  { text: "Konsultatsiya berildi, qayta ko'rik 7 kundan keyin", icon: "📅" },
  { text: "Qo'shimcha laborator tahlillar topshirish tavsiya etildi", icon: "🔬" },
  { text: "Boshqa tor soha mutaxassisi ko'rigiga yo'naltirildi", icon: "👨‍⚕️" },
  { text: "Dori-darmonlar retsepti berildi va parhez buyurildi", icon: "📋" },
];

export const CompleteVisitModal: React.FC<CompleteVisitModalProps> = ({
  isOpen,
  ticket,
  doctorInfo,
  initialNotes = '',
  onClose,
  onConfirm,
  isLoading = false
}) => {
  const [conclusion, setConclusion] = useState('');

  // When modal opens, sync with initialNotes if provided by doctor
  useEffect(() => {
    if (isOpen) {
      setConclusion(initialNotes || '');
    }
  }, [isOpen, initialNotes]);

  if (!isOpen || !ticket) return null;

  // Resolve specialty templates for this doctor
  const specName = (doctorInfo.specialty_name || '').toLowerCase();
  const matchedSpec = SPECIALTY_TEMPLATES.find(s => 
    specName.includes(s.key) || 
    (s.key === 'jarroh' && specName.includes('xirurg')) ||
    (s.key === 'terap' && (specName.includes('umumiy') || specName.includes('terapiya')))
  ) || SPECIALTY_TEMPLATES[2]; // Default to Terapiya if no exact match

  // Helper to add or replace template
  const handleApplyTemplate = (text: string) => {
    if (!conclusion.trim() || conclusion.trim() === "Xulosa berilmadi") {
      setConclusion(text);
    } else {
      setConclusion(prev => `${prev.trim()}\n• ${text}`);
    }
  };

  const handleSetNoConclusion = () => {
    setConclusion("Xulosa berilmadi");
  };

  const handleClear = () => {
    setConclusion('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Agar bo'sh bo'lsa "Xulosa berilmadi" deb yuboriladi
    const finalVal = conclusion.trim().length > 0 ? conclusion.trim() : "Xulosa berilmadi";
    onConfirm(finalVal);
  };

  const SpecIcon = matchedSpec.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 my-auto flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">Qabulni yakunlash</h2>
                <span className="text-[11px] font-mono font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                  {ticket.full_number || ticket.ticket_number || ticket.ticketNumber}
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">
                Bemor: <span className="font-bold text-white">{ticket.patient_name || ticket.patientName || "Bemor"}</span>
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            disabled={isLoading}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Patient & Doctor Context Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Bemor</div>
                <div className="font-bold text-slate-800">{ticket.patient_name || ticket.patientName}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Xona & Mutaxassislik</div>
                <div className="font-bold text-slate-800">
                  {doctorInfo.cabinet_number ? `${doctorInfo.cabinet_number}-xona • ` : ''}
                  {doctorInfo.specialty_name || 'Shifokor'}
                </div>
              </div>
            </div>

            {ticket.patient_phone && (
              <div className="flex items-center gap-2">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Telefon:</div>
                <div className="font-mono font-bold text-slate-700">{ticket.patient_phone}</div>
              </div>
            )}
          </div>

          {/* Info Notice (Kiritish majburiy emas, bo'sh qolsa 'Xulosa berilmadi' bo'ladi) */}
          <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/60 flex items-start gap-2.5 text-xs text-blue-900 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Eslatma:</span> Xulosa kiritish majburiy emas. Agar bo'sh qoldirsangiz, tizim avtomatik <span className="font-bold text-blue-800">«Xulosa berilmadi»</span> deb saqlaydi. Ko'r-ko'rona noto'g'ri tashxis kiritilmaydi.
            </div>
          </div>

          {/* Textarea for Doctor Conclusion */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Bemor ko'rik xulosasi, tashxis yoki ko'rsatmalar (Ixtiyoriy)</span>
              </label>
              
              <div className="flex items-center gap-2 text-[11px]">
                {conclusion && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-slate-400 hover:text-rose-600 font-medium flex items-center gap-1 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Tozalash</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSetNoConclusion}
                  className="text-teal-600 hover:text-teal-700 font-bold hover:underline transition cursor-pointer"
                >
                  «Xulosa berilmadi» deb belgilash
                </button>
              </div>
            </div>

            <textarea
              rows={3}
              value={conclusion}
              onChange={e => setConclusion(e.target.value)}
              placeholder="Bemor shikoyati, ko'rik natijasi, tashxis yoki tavsiyalar (ixtiyoriy)..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition resize-none leading-relaxed"
            />
          </div>

          {/* SECTION 1: SOHAGA OID TEZKOR SHABLONLAR */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <SpecIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>{matchedSpec.label} sohasi bo'yicha tezkor xulosalar:</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Bosing va maydonga qo'shiladi</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {matchedSpec.templates.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="px-2.5 py-1.5 bg-emerald-50/80 hover:bg-emerald-100/90 text-emerald-900 border border-emerald-200/70 rounded-xl text-[11px] font-semibold transition text-left flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-[1.01]"
                >
                  <Plus className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                  <span>{tpl}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 2: UNIVERSAL TEZKOR XULOSALAR */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Universal tezkor xulosalar (Barcha sohalar uchun):</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {UNIVERSAL_TEMPLATES.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyTemplate(item.text)}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200/80 hover:border-teal-300 rounded-xl text-[11px] font-medium transition text-left flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <span className="text-xs">{item.icon}</span>
                  <span className="truncate">{item.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition cursor-pointer"
            >
              Bekor qilish
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs shadow-md shadow-emerald-600/25 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isLoading ? "Yakunlanmoqda..." : "Qabulni yakunlash"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
