import React, { useState } from 'react';
import {
  Phone, User, Hash, QrCode, Search, UserPlus, Clock,
  ChevronRight, Stethoscope, Ticket, CheckCircle2, ArrowLeft
} from 'lucide-react';
import { UserApiClient } from '../api/client';
import { NewPatientModal } from '../components/NewPatientModal';
import { TicketIssuedModal } from '../components/TicketIssuedModal';

interface OperatorViewProps {
  doctors: any[];
  patients: any[];
  onRefresh: () => void;
}

export const OperatorView: React.FC<OperatorViewProps> = ({ doctors, patients, onRefresh }) => {
  const [searchType, setSearchType] = useState<'PHONE' | 'NAME' | 'ID' | 'QR'>('PHONE');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('Barchasi');
  const [selectedPatient, setSelectedPatient] = useState<any>(patients[0] || null);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [issuedTicket, setIssuedTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const specialties = [
    'Barchasi', 'Terapevt', 'Jarroh', 'Ortodont', 'Implantolog', 'Bolalar doktori', 'Parodontolog'
  ];

  const filteredDoctors = doctors.filter(d => {
    if (selectedSpecialty === 'Barchasi') return true;
    return d.specialtyName?.toLowerCase().includes(selectedSpecialty.toLowerCase());
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const found = patients.find(p =>
      p.phone.includes(searchQuery) ||
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patientNumber.includes(searchQuery)
    );
    if (found) {
      setSelectedPatient(found);
    } else {
      alert('Bemor topilmadi. Yangi bemor qo‘shishingiz mumkin.');
      setIsNewPatientModalOpen(true);
    }
  };

  const handleSelectDoctor = async (doctor: any) => {
    if (!selectedPatient) {
      alert('Iltimos, avval bemorni tanlang yoki qidiring.');
      return;
    }

    setLoading(true);
    try {
      const res = await UserApiClient.createTicket({
        doctorId: doctor.id,
        patientId: selectedPatient.id,
        branchId: doctor.branchId,
        complaint: 'Operator orqali talon berildi'
      });
      setIssuedTicket(res.data);
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Talon berish</h1>
        <p className="text-xs text-slate-500 mt-0.5">Bemorni qidiriring va shifokorni tanlang</p>
      </div>

      {/* 1. TOP PATIENT SEARCH UNIT (Touchscreen-friendly) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        {/* Search Mode Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {[
              { id: 'PHONE', label: 'Telefon', icon: Phone },
              { id: 'NAME', label: 'Ism', icon: User },
              { id: 'ID', label: 'ID', icon: Hash },
              { id: 'QR', label: 'QR', icon: QrCode }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = searchType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSearchType(tab.id as any)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-teal-800 text-white shadow-md shadow-teal-800/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* New Patient Prompt Button */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Bemor topilmadimi?</span>
            <button
              onClick={() => setIsNewPatientModalOpen(true)}
              className="px-4 py-2 bg-white border border-teal-600 text-teal-800 hover:bg-teal-50 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Yangi bemor</span>
            </button>
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder={
                searchType === 'PHONE' ? '+998 (__) ___-__-__' :
                searchType === 'NAME' ? 'Bemor ismi yoki familiyasi...' :
                'Bemor kartasi ID raqami...'
              }
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-800/20 flex items-center gap-2 transition"
          >
            <Search className="w-4 h-4" />
            <span>Bemorni qidirish</span>
          </button>
        </div>

        {/* Active Selected Patient Banner */}
        {selectedPatient && (
          <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-xs">
                {selectedPatient.fullName.charAt(0)}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>{selectedPatient.fullName}</span>
                  <span className="text-[10px] text-teal-800 font-mono bg-white px-2 py-0.5 rounded border border-teal-200">
                    № {selectedPatient.patientNumber}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">{selectedPatient.phone}</div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-teal-800 bg-white px-2.5 py-1 rounded-lg border border-teal-200">
              Tanlangan bemor ✓
            </span>
          </div>
        )}
      </div>

      {/* 2. SPECIALTY FILTER CHIPS */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {specialties.map(spec => {
          const isActive = selectedSpecialty === spec;
          return (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-teal-800 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {spec}
            </button>
          );
        })}
      </div>

      {/* 3. DOCTORS GRID (8 cards matching Operator.png) */}
      <div className="grid grid-cols-4 gap-4">
        {filteredDoctors.map(doctor => (
          <div
            key={doctor.id}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <img
                  src={doctor.avatarUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150'}
                  alt={doctor.fullName}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">{doctor.fullName}</h4>
                  <div className="flex items-center gap-1 text-[11px] text-teal-800 font-semibold mt-1">
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>{doctor.specialtyName}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Kabinet {doctor.cabinetNumber}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1 font-semibold text-slate-700">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Hozir navbat: {doctor.waitingCount || 0}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>~{doctor.avgConsultationMinutes || 10} min</span>
                </div>
              </div>
            </div>

            <button
              disabled={loading}
              onClick={() => handleSelectDoctor(doctor)}
              className="w-full py-2.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 shadow-md shadow-teal-800/20 transition disabled:opacity-50"
            >
              <span>TANLASH</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Bottom info strip matching Operator.png */}
      <div className="p-4 bg-teal-50 border border-teal-200/80 rounded-2xl flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-teal-800 text-white flex items-center justify-center">
          <Ticket className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-teal-900">Tanlangan shifokor uchun talon beriladi</div>
          <div className="text-[11px] text-teal-700">Avval bemorni qidiring va shifokorni tanlang</div>
        </div>
      </div>

      <NewPatientModal
        isOpen={isNewPatientModalOpen}
        onClose={() => setIsNewPatientModalOpen(false)}
        onSuccess={newP => {
          setSelectedPatient(newP);
          onRefresh();
        }}
      />

      <TicketIssuedModal
        isOpen={!!issuedTicket}
        tickets={issuedTicket ? [issuedTicket] : []}
        onClose={() => setIssuedTicket(null)}
      />
    </div>
  );
};
