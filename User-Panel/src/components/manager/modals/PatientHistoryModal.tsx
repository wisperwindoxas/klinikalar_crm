import React from 'react';
import { 
  Phone, Calendar, X, Stethoscope, Activity, Wallet, MapPin, 
  CreditCard, Ticket, Edit2, RefreshCw, Clock, CheckCircle2, 
  Sparkles, User, FileText 
} from 'lucide-react';
import { formatUzbekPhone } from '../../../utils/phone';
import { UzbekistanAddressSelect } from '../../UzbekistanAddressSelect';

interface PatientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPatientDetail: any;
  patientPayments: any[];
  patientTickets: any[];
  patientHistoryLoading: boolean;
  patientModalTab: 'DOCTORS' | 'PAYMENTS' | 'TICKETS' | 'EDIT' | 'OVERVIEW';
  onTabChange: (tab: any) => void;
  patientForm: {
    fullName: string;
    phone: string;
    birthDate: string;
    gender: string;
    address: string;
    notes: string;
  };
  onFormChange: (form: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const PatientHistoryModal: React.FC<PatientHistoryModalProps> = ({
  isOpen,
  onClose,
  selectedPatientDetail,
  patientPayments,
  patientTickets,
  patientHistoryLoading,
  patientModalTab,
  onTabChange,
  patientForm,
  onFormChange,
  onSubmit,
}) => {
  if (!isOpen || !selectedPatientDetail) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-teal-800 via-emerald-800 to-teal-900 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner text-white font-bold text-lg">
              {selectedPatientDetail.full_name?.charAt(0)?.toUpperCase() || 'B'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black tracking-tight">{selectedPatientDetail.full_name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white/20 text-emerald-100 border border-white/25">
                  #{selectedPatientDetail.patient_number || selectedPatientDetail.id?.substring(0, 6)}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/30 text-white">
                  {selectedPatientDetail.gender === 'FEMALE' ? 'Ayol' : 'Erkak'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-emerald-100/90 mt-1">
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-emerald-300" />
                  {selectedPatientDetail.phone || 'Telefon kiritilmagan'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                  {selectedPatientDetail.birth_date ? `Tug'ilgan: ${selectedPatientDetail.birth_date.substring(0, 10)}` : "Tug'ilgan sana yo'q"}
                </span>
              </div>
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

        {/* Top 4 KPI Summary Cards */}
        <div className="p-6 pb-2 shrink-0 bg-slate-50/70 border-b border-slate-200/80">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1: Oxirgi Shifokor Ko'rigi */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Oxirgi Shifokor</span>
                <Stethoscope className="w-4 h-4 text-blue-600" />
              </div>
              {selectedPatientDetail.last_visit ? (
                <div>
                  <div className="text-xs font-extrabold text-slate-800 truncate" title={selectedPatientDetail.last_visit.doctor_name}>
                    {selectedPatientDetail.last_visit.doctor_name}
                  </div>
                  <div className="text-[11px] text-blue-600 font-semibold mt-0.5">
                    {selectedPatientDetail.last_visit.specialty_name || 'Shifokor'}
                    {selectedPatientDetail.last_visit.cabinet_number ? ` • Kab: ${selectedPatientDetail.last_visit.cabinet_number}` : ''}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {selectedPatientDetail.last_visit.date || (selectedPatientDetail.last_visit.time ? selectedPatientDetail.last_visit.time.substring(0, 10) : '')}
                  </div>
                </div>
              ) : (
                <div className="text-xs font-semibold text-slate-400 mt-1">Hali ko'rikda bo'lmagan</div>
              )}
            </div>

            {/* 2: Qabullar & Shifokorlar Soni */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tashriflar Soni</span>
                <Activity className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xl font-black text-slate-800">
                {Number(selectedPatientDetail.total_visits || 0)}{' '}
                <span className="text-xs font-medium text-slate-400">marta</span>
              </div>
              <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">
                {Array.isArray(selectedPatientDetail.doctor_visits) ? selectedPatientDetail.doctor_visits.length : 0} ta turli shifokorda
              </div>
            </div>

            {/* 3: Jami Qilingan To'lovlar */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Jami To'lov</span>
                <Wallet className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-lg font-black text-emerald-600 font-mono">
                {Number(selectedPatientDetail.total_paid || 0).toLocaleString()}{' '}
                <span className="text-xs font-sans text-slate-500 font-semibold">so'm</span>
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                {patientPayments.length > 0 ? `${patientPayments.length} ta chek to'langan` : "To'lovlar hisobi"}
              </div>
            </div>

            {/* 4: Yashash Manzili & Qaydlar */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Manzil / Qayd</span>
                <MapPin className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-xs font-bold text-slate-800 truncate" title={selectedPatientDetail.address || 'Kiritilmagan'}>
                {selectedPatientDetail.address || "Manzil ko'rsatilmagan"}
              </div>
              <div className="text-[11px] text-slate-500 truncate mt-0.5" title={selectedPatientDetail.notes || ''}>
                {selectedPatientDetail.notes ? `Qayd: ${selectedPatientDetail.notes}` : "Qo'shimcha izoh yo'q"}
              </div>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center gap-2 mt-4 border-b border-slate-200/80 -mb-[1px]">
            <button
              type="button"
              onClick={() => onTabChange('DOCTORS')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 cursor-pointer ${
                patientModalTab === 'DOCTORS' || patientModalTab === 'OVERVIEW'
                  ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Shifokorlar Bo'yicha Ko'riklar</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700">
                {Array.isArray(selectedPatientDetail.doctor_visits) ? selectedPatientDetail.doctor_visits.length : 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('PAYMENTS')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 cursor-pointer ${
                patientModalTab === 'PAYMENTS'
                  ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>To'lovlar Tarixi</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700">
                {patientPayments.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('TICKETS')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 cursor-pointer ${
                patientModalTab === 'TICKETS'
                  ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>Barcha Talonlar Tarixi</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700">
                {patientTickets.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('EDIT')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 cursor-pointer ${
                patientModalTab === 'EDIT'
                  ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Edit2 className="w-4 h-4" />
              <span>Ma'lumotlarni Tahrirlash</span>
            </button>
          </div>
        </div>

        {/* TAB CONTENTS (SCROLLABLE) */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          {patientHistoryLoading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-500">Bemor tarixi PostgreSQL bazasidan yuklanmoqda...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: DOCTORS BREAKDOWN TABLE */}
              {(patientModalTab === 'DOCTORS' || patientModalTab === 'OVERVIEW') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        Ushbu Bemor Qaysi Shifokorlarda Bo'lganligi va Qabullar Soni
                      </h4>
                      <p className="text-xs text-slate-500">
                        Har bir shifokor mutaxassisligi, kabinet raqami, tashriflar soni va oxirgi marta qachon ko'rikdan o'tganligi
                      </p>
                    </div>
                  </div>

                  {Array.isArray(selectedPatientDetail.doctor_visits) && selectedPatientDetail.doctor_visits.length > 0 ? (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                            <th className="py-3 px-4">Shifokor F.I.Sh.</th>
                            <th className="py-3 px-4">Mutaxassislik</th>
                            <th className="py-3 px-4 text-center">Kabinet</th>
                            <th className="py-3 px-4 text-center">Qabullar Soni</th>
                            <th className="py-3 px-4">Oxirgi Ko'rik Sanasi</th>
                            <th className="py-3 px-4 text-right">Holat</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedPatientDetail.doctor_visits.map((dv: any, idx: number) => {
                            const isLastDoctor = selectedPatientDetail.last_visit?.doctor_name === dv.doctor_name;
                            return (
                              <tr key={idx} className={`hover:bg-slate-50/80 transition ${isLastDoctor ? 'bg-emerald-50/30' : ''}`}>
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                                      <Stethoscope className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <div className="font-bold text-slate-800 flex items-center gap-2">
                                        <span>{dv.doctor_name}</span>
                                        {isLastDoctor && (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                            Oxirgi qabul
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-slate-400">Klinika shifokori</div>
                                      {dv.doctor_conclusion && dv.doctor_conclusion.trim() && dv.doctor_conclusion !== 'Xulosa berilmadi' && dv.doctor_conclusion !== 'null' ? (
                                        <div className="mt-1.5 p-2 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-[11px] text-emerald-900 font-medium leading-relaxed max-w-sm">
                                          <span className="font-bold text-emerald-800 block text-[10px] uppercase tracking-wider mb-0.5">Tibbiy xulosa:</span>
                                          {dv.doctor_conclusion}
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 font-semibold text-slate-700">
                                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
                                    {dv.specialty_name || 'Umumiy amaliyot'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                                  {dv.cabinet_number ? (
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                      № {dv.cabinet_number}
                                    </span>
                                  ) : '-'}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    <Activity className="w-3.5 h-3.5" />
                                    {dv.visit_count} marta
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="text-slate-700 font-semibold flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <span>
                                      {dv.last_visited_at ? new Date(dv.last_visited_at).toLocaleString('uz-UZ') : '-'}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Ko'rikdan o'tgan
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                      <Stethoscope className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">Ushbu bemor hali shifokorlar ko'rigida bo'lmagan</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Navbat talonlari olinganda qabullar tarixi shu yerda avtomatik jamlanadi</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PAYMENTS HISTORY TABLE */}
              {patientModalTab === 'PAYMENTS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        Bemor Qilgan To'lovlar Tarixi
                      </h4>
                      <p className="text-xs text-slate-500">
                        Kassaga qilingan to'lovlar, kvitansiyalar va to'lov usullari ro'yxati
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500">Jami to'langan:</span>
                      <span className="text-sm font-black text-emerald-600 font-mono ml-2">
                        {Number(selectedPatientDetail.total_paid || 0).toLocaleString()} so'm
                      </span>
                    </div>
                  </div>

                  {patientPayments.length > 0 ? (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                            <th className="py-3 px-4">Kvitansiya №</th>
                            <th className="py-3 px-4">Sana & Vaqt</th>
                            <th className="py-3 px-4">To'lov Usuli</th>
                            <th className="py-3 px-4 text-right">Summa (so'm)</th>
                            <th className="py-3 px-4 text-right">Holati</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {patientPayments.map((pm: any, idx: number) => (
                            <tr key={pm.id || idx} className="hover:bg-slate-50/80 transition">
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                                #{pm.receipt_number || pm.id?.substring(0, 8)}
                              </td>
                              <td className="py-3.5 px-4 text-slate-600">
                                {pm.created_at ? new Date(pm.created_at).toLocaleString('uz-UZ') : '-'}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                                  {pm.payment_method === 'CASH' ? "💵 Naqd pul" :
                                   pm.payment_method === 'UZCARD' ? "💳 Uzcard" :
                                   pm.payment_method === 'HUMO' ? "💳 Humo" :
                                   pm.payment_method === 'CLICK' ? "📱 Click" :
                                   pm.payment_method === 'PAYME' ? "📱 Payme" : (pm.payment_method || 'Naqd')}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono font-extrabold text-emerald-600 text-sm">
                                {Number(pm.amount || 0).toLocaleString()} so'm
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3" />
                                  {pm.status === 'COMPLETED' ? "To'langan" : pm.status || "Tasdiqlangan"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                      <Wallet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">Ushbu bemor nomiga to'lov cheklari mavjud emas</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Kassada xizmat to'lovlari amalga oshirilganda bu yerda ko'rinadi</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: TICKETS HISTORY TABLE */}
              {patientModalTab === 'TICKETS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        Barcha Navbat Talonlari Tarixi
                      </h4>
                      <p className="text-xs text-slate-500">
                        Bemor tomonidan klinika qabuliga olingan barcha elektron talonlar
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700">
                      Jami {patientTickets.length} ta talon
                    </span>
                  </div>

                  {patientTickets.length > 0 ? (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                            <th className="py-3 px-4">Talon №</th>
                            <th className="py-3 px-4">Shifokor & Mutaxassislik</th>
                            <th className="py-3 px-4">Xizmat</th>
                            <th className="py-3 px-4 text-center">Kabinet</th>
                            <th className="py-3 px-4">Vaqti</th>
                            <th className="py-3 px-4 text-right">Holat</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {patientTickets.map((t: any, idx: number) => (
                            <tr key={t.id || idx} className="hover:bg-slate-50/80 transition">
                              <td className="py-3.5 px-4 font-mono font-black text-slate-800">
                                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-mono text-xs">
                                  {t.ticket_number}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-800">{t.doctor_name || 'Shifokor'}</div>
                                <div className="text-[11px] text-blue-600 font-medium">{t.specialty_name || ''}</div>
                              </td>
                              <td className="py-3.5 px-4 text-slate-600 font-medium">
                                {t.service_name || "Ko'rik xizmati"}
                              </td>
                              <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                                {t.cabinet_number ? `№ ${t.cabinet_number}` : '-'}
                              </td>
                              <td className="py-3.5 px-4 text-slate-500">
                                {t.created_at ? new Date(t.created_at).toLocaleString('uz-UZ') : t.queue_date || '-'}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                                  t.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' :
                                  t.status === 'IN_PROGRESS' || t.status === 'CALLED' ? 'bg-blue-100 text-blue-800' :
                                  'bg-amber-100 text-amber-800'
                                }`}>
                                  {t.status === 'COMPLETED' ? "Yakunlangan" :
                                   t.status === 'CANCELLED' ? "Bekor qilingan" :
                                   t.status === 'IN_PROGRESS' || t.status === 'CALLED' ? "Qabulda" : "Kutmoqda"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                      <Ticket className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">Navbat talonlari topilmadi</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: EDIT PATIENT FORM */}
              {patientModalTab === 'EDIT' && (
                <form onSubmit={onSubmit} className="space-y-4 max-w-2xl mx-auto">
                  <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200/80 flex items-center gap-3 text-xs text-emerald-800 font-medium mb-4">
                    <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Bemorning F.I.Sh., telefon raqami, tug'ilgan sanasi va boshqa ma'lumotlarini o'zgartirishingiz mumkin. O'zgarishlar PostgreSQL bazasida darhol yangilanadi.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Bemor To'liq F.I.Sh. <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <User className="w-4 h-4 text-emerald-600" />
                      </div>
                      <input
                        type="text"
                        required
                        value={patientForm.fullName}
                        onChange={e => onFormChange({ ...patientForm, fullName: e.target.value })}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Telefon Raqami <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <Phone className="w-4 h-4 text-emerald-600" />
                        </div>
                        <input
                          type="tel"
                          required
                          value={patientForm.phone}
                          onChange={e => onFormChange({ ...patientForm, phone: formatUzbekPhone(e.target.value) })}
                          onKeyDown={e => {
                            if ((patientForm.phone === '+998 ' || patientForm.phone === '+998') && e.key === 'Backspace') {
                              e.preventDefault();
                              onFormChange({ ...patientForm, phone: '' });
                            }
                          }}
                          placeholder="+998 (90) 123-45-67"
                          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Tug'ilgan Sana</label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <Calendar className="w-4 h-4 text-emerald-600" />
                        </div>
                        <input
                          type="date"
                          value={patientForm.birthDate}
                          onChange={e => onFormChange({ ...patientForm, birthDate: e.target.value })}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Jinsi</label>
                    <div className="flex items-center gap-4 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                        <input
                          type="radio"
                          name="patientModalGender"
                          checked={patientForm.gender === 'MALE'}
                          onChange={() => onFormChange({ ...patientForm, gender: 'MALE' })}
                          className="w-4 h-4 text-emerald-600"
                        />
                        <span>Erkak</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                        <input
                          type="radio"
                          name="patientModalGender"
                          checked={patientForm.gender === 'FEMALE'}
                          onChange={() => onFormChange({ ...patientForm, gender: 'FEMALE' })}
                          className="w-4 h-4 text-emerald-600"
                        />
                        <span>Ayol</span>
                      </label>
                    </div>
                  </div>

                  <UzbekistanAddressSelect
                    value={patientForm.address}
                    onChange={addr => onFormChange({ ...patientForm, address: addr })}
                    label="Bemor Yashash Manzili (Viloyat va Tuman)"
                  />

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Qaydlar / Shikoyatlar / Diagnoz</label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-3 text-slate-400 pointer-events-none">
                        <FileText className="w-4 h-4 text-emerald-600" />
                      </div>
                      <textarea
                        rows={3}
                        value={patientForm.notes}
                        onChange={e => onFormChange({ ...patientForm, notes: e.target.value })}
                        placeholder="Bemor haqida maxsus eslatmalar yoki tashxislar..."
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                      />
                    </div>
                  </div>

                  <div className="pt-4 pb-6 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => onTabChange('DOCTORS')}
                      className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      Tarixga qaytish
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>O'zgarishlarni Saqlash</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>PostgreSQL EMR Bazasi</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition cursor-pointer text-xs"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
