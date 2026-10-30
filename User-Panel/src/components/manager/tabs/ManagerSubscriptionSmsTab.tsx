import React from 'react';
import { 
  CreditCard, RefreshCw, Lock, Pause, CheckCircle2, Layers, 
  Calendar, MessageSquare, Building2, Ticket, Clock, Shield, Phone 
} from 'lucide-react';

interface ManagerSubscriptionSmsTabProps {
  clinicSubscription: any;
  smsSettings: any;
  loadingSubscription: boolean;
  onRefresh: () => void;
}

export const ManagerSubscriptionSmsTab: React.FC<ManagerSubscriptionSmsTabProps> = ({
  clinicSubscription,
  smsSettings,
  loadingSubscription,
  onRefresh,
}) => {
  return (
    <div className="space-y-6 w-full">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-medical-gradient text-white p-7 rounded-3xl border border-white/25 shadow-xl shadow-medical-blue/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-white/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-56 h-56 bg-medical-blue-dark/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-md border border-white/30 shrink-0">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5 drop-shadow-xs">
                  Obuna va SMS Boshqaruvi
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30">
                    Super Admin Boshqaruvida
                  </span>
                </h2>
                <p className="text-xs text-white/95 mt-0.5 leading-relaxed">
                  Klinikaning faol tarifi, amal qilish muddati, SMS xabarnomalar balansi va tizim qulf holati
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/95 mt-3">
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border backdrop-blur-md font-semibold shadow-xs ${
                clinicSubscription?.status === 'ACTIVE'
                  ? 'bg-white/20 border-white/30 text-white'
                  : clinicSubscription?.status === 'SUSPENDED'
                  ? 'bg-amber-500/25 border-amber-300/40 text-amber-100'
                  : 'bg-rose-500/25 border-rose-300/40 text-rose-100'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  clinicSubscription?.status === 'ACTIVE' ? 'bg-medical-turquoise animate-pulse' :
                  clinicSubscription?.status === 'SUSPENDED' ? 'bg-amber-300' : 'bg-rose-300'
                }`} />
                Holat: {clinicSubscription?.status === 'ACTIVE' ? 'Faol Obuna' :
                        clinicSubscription?.status === 'SUSPENDED' ? 'To‘xtatilgan' :
                        clinicSubscription?.status === 'TRIAL' ? 'Sinov Muddati' : 'Qulflangan'}
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-medium shadow-xs">
                Klinika ID: {clinicSubscription?.clinic_id || 'tenant_sadaf_01'}
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold shadow-xs">
                SMS Balansi: {Number(clinicSubscription?.sms_balance ?? smsSettings?.balance ?? 1000).toLocaleString('uz-UZ')} dona
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loadingSubscription}
              className="px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-medical-blue-dark text-xs font-black transition flex items-center gap-2 shadow-lg shadow-medical-blue-dark/20 border border-white/80 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-medical-blue-dark stroke-[2.5] ${loadingSubscription ? 'animate-spin' : ''}`} />
              <span>Yangilash</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Alert Card */}
      {clinicSubscription?.status === 'BLOCKED' ? (
        <div className="p-5 bg-rose-50 border-2 border-rose-400 rounded-3xl flex items-start gap-4 shadow-sm animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-rose-900">Klinika Tizimi Qulflangan (BLOCKED)</h3>
            <p className="text-xs text-rose-700 mt-1 leading-relaxed">
              Ushbu klinikaning xizmati Super Admin tomonidan qulflangan. Obuna to'lovi muddati o'tgan yoki faoliyat to'xtatilgan.
              Qayta faollashtirish uchun Super Admin boshqaruviga murojaat qiling: <strong>+998 (71) 200-00-00</strong> yoki <strong>@sadaf_support</strong>
            </p>
          </div>
        </div>
      ) : clinicSubscription?.status === 'SUSPENDED' ? (
        <div className="p-5 bg-amber-50 border-2 border-amber-400 rounded-3xl flex items-start gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <Pause className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-amber-900">Klinika Xizmati To'xtatilgan (SUSPENDED)</h3>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              Sizning obunangiz Super Admin tomonidan vaqtincha to'xtatilgan. Xizmatni davom ettirish uchun Super Admin bilan bog'laning.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-5 bg-cyan-50/70 border border-cyan-200/80 rounded-3xl flex items-start gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-medical-blue text-white flex items-center justify-center shrink-0 shadow-md shadow-medical-blue/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-medical-blue-dark">Klinika Obunasi To'liq Faol (ACTIVE)</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Sizning klinika tizimingiz cheklovlarsiz ishlamoqda. Shifokorlar xonasi, kassa, TV tablosi va SMS xabarnomalar xizmati 100% faol.
            </p>
          </div>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-medical-blue flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Joriy Tarif Rejasi</div>
            <div className="text-lg font-black text-slate-900">
              {clinicSubscription?.plan_name || clinicSubscription?.plan_code || 'STARTER'}
            </div>
            <span className="text-[11px] font-bold text-medical-blue">
              {Number(clinicSubscription?.plan_price || 490000).toLocaleString('uz-UZ')} so'm / oy
            </span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-medical-turquoise-dark flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Amal Qilish Muddati</div>
            <div className="text-lg font-black text-slate-900">
              {clinicSubscription?.end_date ? String(clinicSubscription.end_date).split('T')[0] : '2026-12-31'}
            </div>
            <span className="text-[11px] font-bold text-emerald-600">
              {clinicSubscription?.days_remaining ?? 65} kun qoldi
            </span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Klinika SMS Balansi</div>
            <div className="text-lg font-black text-teal-900 font-mono">
              {Number(clinicSubscription?.sms_balance ?? smsSettings?.balance ?? 1000).toLocaleString('uz-UZ')} <span className="text-xs font-bold font-sans">dona</span>
            </div>
            <span className={`text-[11px] font-bold ${clinicSubscription?.sms_enabled !== false ? 'text-teal-600' : 'text-rose-600'}`}>
              {clinicSubscription?.sms_enabled !== false ? 'SMS Xizmati Yoqilgan' : 'SMS Xizmati O‘chirilgan'}
            </span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            clinicSubscription?.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' :
            clinicSubscription?.status === 'SUSPENDED' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
          }`}>
            {clinicSubscription?.status === 'ACTIVE' ? <CheckCircle2 className="w-6 h-6" /> :
             clinicSubscription?.status === 'SUSPENDED' ? <Pause className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Tizim Qulf Holati</div>
            <div className="text-lg font-black text-slate-900">
              {clinicSubscription?.status === 'ACTIVE' ? 'Faol / Ochiq' :
               clinicSubscription?.status === 'SUSPENDED' ? 'To‘xtatilgan' : 'Qulflangan'}
            </div>
            <span className="text-[11px] font-bold text-slate-500">
              Super Admin boshqaruvida
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Tarif Imkoniyatlari */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">Tarif Rejasi va Imkoniyatlari</h4>
                <p className="text-xs text-slate-400">Joriy tarif bo‘yicha kiritilgan xususiyatlar</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded-full text-xs">
              {clinicSubscription?.plan_code || 'STARTER'}
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {[
              { title: 'Filiallar soni', desc: 'Asosiy markaziy klinika filiali', val: '1 ta filial' },
              { title: 'Shifokorlar va kabinetlar', desc: 'Cheklanmagan shifokorlar navbati', val: 'Faol' },
              { title: 'Elektron navbat va TV tablo', desc: 'Jonli ovozli e\'lon va TV monitori', val: 'Faol' },
              { title: 'Kassa va moliyaviy hisobotlar', desc: 'Kassir smenalari va chek integratsiyasi', val: 'Faol' },
              { title: 'Bemorlar kartotekasi (EMR)', desc: 'Barcha tashriflar tarixi va xulosalar', val: 'Faol' },
              { title: 'SMS xabarnomalar integratsiyasi', desc: 'Eskiz.uz orqali bemorga SMS', val: 'Faol' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">{item.title}</div>
                    <div className="text-[11px] text-slate-400">{item.desc}</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-700">{item.val}</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-blue-900">Tarifni ko'tarish yoki uzaytirish</div>
              <div className="text-[11px] text-blue-600">PREMIUM yoki ENTERPRISE tariflariga o'tish</div>
            </div>
            <span className="text-xs font-extrabold text-blue-700">Super Admin orqali</span>
          </div>
        </div>

        {/* Panel 2: SMS Xabarnomalar Xizmati */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">SMS Xabarnomalar Tizimi</h4>
                <p className="text-xs text-slate-400">Eskiz.uz SMS Gateway holati va shablonlar</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-teal-100 text-teal-800 font-bold rounded-full text-xs">
              {clinicSubscription?.sms_enabled !== false ? 'SMS Faol' : 'O\'chirilgan'}
            </span>
          </div>

          {/* SMS Balance Highlight Card */}
          <div className="p-5 bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-blue-500/10 border border-teal-200 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-teal-900">Mavjud SMS Balansi:</div>
              <div className="text-3xl font-black text-teal-900 font-mono mt-0.5">
                {Number(clinicSubscription?.sms_balance ?? smsSettings?.balance ?? 1000).toLocaleString('uz-UZ')}
                <span className="text-xs font-bold text-teal-700 font-sans ml-1.5">dona SMS</span>
              </div>
              <div className="text-[11px] text-teal-600 mt-1">SMS Jo'natuvchi (Sender): <strong>{smsSettings?.sender_name || 'SadafMed'}</strong></div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md">
              <MessageSquare className="w-7 h-7" />
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider text-[11px]">Avtomatik SMS hodisalari:</div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Ticket className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="text-xs font-bold text-slate-800">Talon berilganda</div>
                  <div className="text-[11px] text-slate-400">Bemor telefoniga navbat kodi va kabinet SMS ketadi</div>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold">Faol</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <div>
                  <div className="text-xs font-bold text-slate-800">Navbat yaqinlashganda</div>
                  <div className="text-[11px] text-slate-400">Oldinda 2 ta bemor qolganda ogohlantirish SMS</div>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold">Faol</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="text-xs font-bold text-slate-800">Qabul yakunlanganda</div>
                  <div className="text-[11px] text-slate-400">Shifokor ko'rigi xulosasi va tavsiyalar SMS</div>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold">Faol</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Super Admin Support & Contact Box */}
      <div className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>Super Admin Boshqaruvi va Xavfsizlik</span>
          </div>
          <h4 className="text-lg font-black text-white">Obunani uzaytirish yoki SMS paketini to'ldirish kerakmi?</h4>
          <p className="text-xs text-slate-400 max-w-2xl">
            Har bir klinikaning obuna holati, qulflash/ochish va SMS balansi Super Admin paneli orqali 100% real vaqtda nazorat qilinadi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <a
            href="tel:+998712000000"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 border border-white/15"
          >
            <Phone className="w-4 h-4 text-teal-400" />
            <span>+998 (71) 200-00-00</span>
          </a>
          <a
            href="https://t.me"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-teal-500/25"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Super Admin Aloqa</span>
          </a>
        </div>
      </div>
    </div>
  );
};
