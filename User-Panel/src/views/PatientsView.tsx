import React, { useState } from 'react';
import {
  Users, Search, UserPlus, Phone, Calendar, MapPin, FileText,
  Clock, CheckCircle2, DollarSign, X, AlertCircle, Stethoscope
} from 'lucide-react';
import { NewPatientModal } from '../components/NewPatientModal';

const API_BASE_URL = 'http://189.74.99.251:5001/api/v1';

interface PatientsViewProps {
  patients: any[];
  onRefresh: () => void;
}

export const PatientsView: React.FC<PatientsViewProps> = ({ patients, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePatientCard, setActivePatientCard] = useState<any>(null);
  const [cardLoading, setCardLoading] = useState(false);

  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    return (
      (p.full_name || p.fullName)?.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      (p.patient_number || p.patientNumber)?.includes(q)
    );
  });

  const handleOpenCard = async (patient: any) => {
    setCardLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/patients/${patient.id}`);
      const json = await res.json();
      if (json.data) {
        setActivePatientCard(json.data);
      } else {
        setActivePatientCard({ patient, tickets: [], payments: [] });
      }
    } catch (e) {
      setActivePatientCard({ patient, tickets: [], payments: [] });
    } finally {
      setCardLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#DCE3EA] shadow-sm">
        <div>
          <h1 className="text-xl font-black text-[#172B4D] tracking-tight">Bemorlar bazasi</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Ro‘yxatga olingan barcha bemorlar, kasallik tarixi va to‘lovlar arxivi
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Yangi bemor qo‘shish</span>
        </button>
      </div>

      {/* SEARCH AND TABLE */}
      <div className="bg-white p-5 rounded-2xl border border-[#DCE3EA] shadow-sm space-y-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ism, telefon yoki karta raqami bo‘yicha qidirish..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#F5F7FA] border border-[#DCE3EA] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DCE3EA] text-[11px] font-bold text-[#64748B]">
                <th className="pb-3">Karta №</th>
                <th className="pb-3">Bemor F.I.SH</th>
                <th className="pb-3">Telefon</th>
                <th className="pb-3">Tug‘ilgan sana</th>
                <th className="pb-3">Jinsi</th>
                <th className="pb-3">Manzili / Izoh</th>
                <th className="pb-3 text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-[#F5F7FA] transition">
                  <td className="py-3 font-mono font-bold text-[#0F766E]">
                    #{p.patient_number || p.patientNumber}
                  </td>
                  <td className="py-3 font-bold text-[#172B4D]">{p.full_name || p.fullName}</td>
                  <td className="py-3 text-[#172B4D]">{p.phone || '-'}</td>
                  <td className="py-3 text-[#64748B]">{p.birth_date || p.birthDate || '-'}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">
                      {p.gender === 'MALE' ? 'Erkak' : 'Ayol'}
                    </span>
                  </td>
                  <td className="py-3 text-[#64748B] max-w-xs truncate">{p.address || p.notes || '—'}</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleOpenCard(p)}
                      className="px-3 py-1.5 bg-[#F0FDFA] text-[#0F766E] hover:bg-[#CCFBF1] rounded-lg text-xs font-bold transition border border-[#CCFBF1]"
                    >
                      Tibbiy Karta
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REAL ELECTRONIC MEDICAL CARD (EMR) MODAL */}
      {activePatientCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B4D]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-[#DCE3EA] animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-5 bg-[#0F766E] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-base">
                  {activePatientCard.patient?.full_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base">{activePatientCard.patient?.full_name}</h3>
                  <div className="text-xs text-[#99F6E4]">
                    Karta № #{activePatientCard.patient?.patient_number} • Tel: {activePatientCard.patient?.phone || '-'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActivePatientCard(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
              {/* Patient Profile Details */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-[#F5F7FA] rounded-2xl border border-[#DCE3EA] text-xs">
                <div>
                  <span className="text-[#64748B]">Tug'ilgan sana:</span>
                  <div className="font-bold text-[#172B4D] mt-0.5">
                    {activePatientCard.patient?.birth_date || 'Kiritilmagan'}
                  </div>
                </div>
                <div>
                  <span className="text-[#64748B]">Jinsi:</span>
                  <div className="font-bold text-[#172B4D] mt-0.5">
                    {activePatientCard.patient?.gender === 'MALE' ? 'Erkak' : 'Ayol'}
                  </div>
                </div>
                <div>
                  <span className="text-[#64748B]">Manzili:</span>
                  <div className="font-bold text-[#172B4D] mt-0.5 truncate">
                    {activePatientCard.patient?.address || 'Toshkent sh.'}
                  </div>
                </div>
              </div>

              {/* History of Visits & Tickets */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F766E] flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Qabullar va Talonlar tarixi ({activePatientCard.tickets?.length || 0})</span>
                </h4>

                {(!activePatientCard.tickets || activePatientCard.tickets.length === 0) ? (
                  <div className="p-6 text-center text-xs text-[#64748B] bg-slate-50 rounded-xl border border-dashed border-[#DCE3EA]">
                    Ushbu bemorda hali qabullar qayd etilmagan
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activePatientCard.tickets.map((t: any) => (
                      <div
                        key={t.id}
                        className="p-3 bg-white border border-[#DCE3EA] rounded-xl flex items-center justify-between text-xs shadow-sm"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-[#0F766E]">{t.full_number}</span>
                            <span className="font-bold text-[#172B4D]">{t.doctor_name}</span>
                          </div>
                          <div className="text-[11px] text-[#64748B] mt-0.5">
                            {t.specialty_name} • Kabinet {t.cabinet_number}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded text-[10px]">
                            {t.status}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {new Date(t.issued_at || t.created_at).toLocaleDateString('uz-UZ')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payments History */}
              <div className="space-y-3 pt-2 border-t border-[#DCE3EA]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F766E] flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span>To‘lovlar tarixi ({activePatientCard.payments?.length || 0})</span>
                </h4>

                {(!activePatientCard.payments || activePatientCard.payments.length === 0) ? (
                  <div className="p-4 text-center text-xs text-[#64748B] bg-slate-50 rounded-xl">
                    To'lov yozuvlari mavjud emas
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activePatientCard.payments.map((p: any) => (
                      <div
                        key={p.id}
                        className="p-3 bg-[#F0FDFA] border border-[#CCFBF1] rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-[#172B4D]">Kvitansiya {p.receipt_number}</span>
                          <div className="text-[11px] text-[#64748B]">{p.notes || "Qabul to'lovi"}</div>
                        </div>
                        <div className="font-black text-[#15803D]">
                          {Number(p.amount).toLocaleString()} so'm
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-[#DCE3EA] text-right">
              <button
                onClick={() => setActivePatientCard(null)}
                className="px-5 py-2 bg-[#0F766E] text-white text-xs font-bold rounded-xl"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      <NewPatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => onRefresh()}
      />
    </div>
  );
};
