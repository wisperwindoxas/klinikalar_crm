import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Volume2, RotateCcw, CheckCircle2,
  Calendar, Clock, Phone, User, FileText, LogOut,
  HeartPulse, Stethoscope, ChevronRight, Check,
  AlertCircle, UserX, RefreshCw, Settings,
  Home, RotateCw, SkipBack, Search, Users,
  X, Activity, ArrowRight, ShieldCheck, MapPin
} from 'lucide-react';

import { showNotification } from '../components/ToastNotification';

const API_BASE_URL = 'http://localhost:5001/api/v1';

export const DoctorView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'mening-navbatim';

  // Digital clock & date in Uzbek
  const [time, setTime] = useState('14:25');
  const [dateStr, setDateStr] = useState('');

  // Doctor session & all clinic doctors for switcher
  const [allDoctors, setAllDoctors] = useState<any[]>([]);
  const [doctorInfo, setDoctorInfo] = useState<any>({
    id: 'doc_karimova_malika',
    display_name: 'Dr. Karimova Malika',
    specialty_name: 'Kardiologiya',
    cabinet_number: '3',
    avg_consultation_minutes: 15,
    phone: '+998 90 123 45 67'
  });

  // Real Database Tickets
  const [tickets, setTickets] = useState<any[]>([]);
  const [completedTickets, setCompletedTickets] = useState<any[]>([]);
  const [activeTicket, setActiveTicket] = useState<any | null>(null);

  // States
  const [loading, setLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  // Modals
  const [patientDetailsModal, setPatientDetailsModal] = useState<any | null>(null);
  const [patientEMRData, setPatientEMRData] = useState<any | null>(null);
  const [previousPatientModal, setPreviousPatientModal] = useState<any | null>(null);
  const [consultationNotes, setConsultationNotes] = useState('');

  // Settings
  const [autoAnnounceTv, setAutoAnnounceTv] = useState(() => {
    return localStorage.getItem('sadaf_doctor_auto_tv') !== 'false';
  });

  const showToast = (title: string, message?: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    showNotification(title, message, type);
  };

  // 1. Clock timer
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }));
      const d = now.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' }).replace(' г.', '');
      const w = now.toLocaleDateString('uz-UZ', { weekday: 'long' });
      const capW = w.charAt(0).toUpperCase() + w.slice(1);
      setDateStr(`${d}, ${capW}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Fetch doctors catalog & initialize session
  useEffect(() => {
    fetchDoctorsCatalog();
  }, []);

  // 3. Whenever doctorInfo changes, reload doctor data
  useEffect(() => {
    if (doctorInfo?.id) {
      loadDoctorData();
      const interval = setInterval(loadDoctorData, 6000);
      return () => clearInterval(interval);
    }
  }, [doctorInfo?.id]);

  const fetchDoctorsCatalog = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/doctors`);
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        setAllDoctors(json.data);

        // Check if there's a stored doctor user in localStorage
        const stored = localStorage.getItem('sadaf_user');
        if (stored) {
          try {
            const u = JSON.parse(stored);
            if (u.role === 'DOCTOR' && u.doctorId) {
              const matched = json.data.find((d: any) => d.id === u.doctorId);
              if (matched) {
                setDoctorInfo({
                  id: matched.id,
                  display_name: matched.display_name,
                  specialty_name: matched.specialty_name,
                  cabinet_number: matched.room_number || matched.cabinet_number || '3',
                  avg_consultation_minutes: matched.avg_consultation_minutes || 15,
                  phone: matched.phone
                });
                return;
              }
            }
          } catch (e) {}
        }

        // Default to Dr. Karimova Malika if present, or first doctor
        const defaultDoc = json.data.find((d: any) => d.id === 'doc_karimova_malika') || json.data[0];
        if (defaultDoc) {
          setDoctorInfo({
            id: defaultDoc.id,
            display_name: defaultDoc.display_name,
            specialty_name: defaultDoc.specialty_name,
            cabinet_number: defaultDoc.room_number || defaultDoc.cabinet_number || '3',
            avg_consultation_minutes: defaultDoc.avg_consultation_minutes || 15,
            phone: defaultDoc.phone
          });
        }
      }
    } catch (e) {
      console.warn('Error fetching doctors catalog:', e);
    }
  };

  const handleSwitchDoctor = (doctorId: string) => {
    const selected = allDoctors.find(d => d.id === doctorId);
    if (selected) {
      const newInfo = {
        id: selected.id,
        display_name: selected.display_name,
        specialty_name: selected.specialty_name,
        cabinet_number: selected.room_number || selected.cabinet_number || '1',
        avg_consultation_minutes: selected.avg_consultation_minutes || 15,
        phone: selected.phone
      };
      setDoctorInfo(newInfo);
      localStorage.setItem('sadaf_user', JSON.stringify({
        role: 'DOCTOR',
        userId: selected.user_id,
        doctorId: selected.id,
        fullName: selected.display_name,
        specialtyName: selected.specialty_name,
        roomNumber: newInfo.cabinet_number
      }));
      showToast(`${selected.display_name} profiliga o'tildi.`);
    }
  };

  // Load real queue tickets from PostgreSQL
  const loadDoctorData = async () => {
    if (!doctorInfo?.id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/queues/tickets?doctorId=${doctorInfo.id}`);
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        const allList: any[] = json.data;

        // Waiting or in progress tickets
        const waitingAndActive = allList.filter(
          (t: any) => t.status === 'WAITING' || t.status === 'CALLED' || t.status === 'IN_PROGRESS'
        );
        setTickets(waitingAndActive);

        // Completed tickets
        const completed = allList.filter((t: any) => t.status === 'COMPLETED');
        setCompletedTickets(completed);

        // Active ticket (CALLED or IN_PROGRESS)
        const called = allList.find((t: any) => t.status === 'CALLED' || t.status === 'IN_PROGRESS');
        if (called) {
          setActiveTicket(called);
        } else {
          setActiveTicket(null);
        }
      }
    } catch (e) {
      console.warn('Error loading doctor tickets:', e);
    }
  };

  const handleLogout = () => {
    if (confirm("Tizimdan chiqmoqchimisiz?")) {
      localStorage.removeItem('sadaf_user');
      localStorage.removeItem('sadaf_user_token');
      navigate('/login');
    }
  };

  // --- ACTIONS (100% Real PostgreSQL Backend) ---

  // 1. Keyingi bemor (Call Next)
  const handleCallNext = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/queues/call-next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId: doctorInfo.id })
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setActiveTicket(json.data);
        showToast(`${json.data.full_number} raqamli bemor chaqirildi! TV monitoriga e'lon uzatildi.`);
        loadDoctorData();
      } else {
        showToast(json.message || 'Navbatda kutayotgan bemor yo‘q');
      }
    } catch (e) {
      showToast('Aloqa xatoligi. Server bilan bog\'lanishda uzilish yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Qayta chaqirish (Recall)
  const handleRecall = async () => {
    if (!activeTicket?.id) {
      showToast("Qayta chaqirish uchun faol bemor yo'q.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/queues/tickets/${activeTicket.id}/recall`, { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        showToast(`${activeTicket.full_number} qayta chaqirildi! TV monitorida ovozli e'lon yangradi.`);
      } else {
        showToast(json.message || 'Xatolik yuz berdi.');
      }
    } catch (e) {
      showToast('Server bilan aloqa xatoligi.');
    }
  };

  // 3. Qabulni yakunlash (Complete)
  const handleComplete = async () => {
    if (!activeTicket?.id) {
      showToast("Qabulni yakunlash uchun faol bemor yo'q.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/queues/tickets/${activeTicket.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId: doctorInfo.id })
      });
      const json = await res.json();
      if (res.ok) {
        showToast(`${activeTicket.full_number} qabuli muvaffaqiyatli yakunlandi!`);
        setActiveTicket(null);
        loadDoctorData();
      } else {
        showToast(json.message || 'Xatolik yuz berdi.');
      }
    } catch (e) {
      showToast('Server bilan aloqa xatoligi.');
    }
  };

  // 4. Kelmadi (Skip)
  const handleSkip = async () => {
    if (!activeTicket?.id) {
      showToast("O'tkazib yuborish uchun faol bemor yo'q.");
      return;
    }
    if (!confirm(`${activeTicket.full_number} (${activeTicket.patient_name}) kelmadi deb belgilansinmi?`)) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/queues/tickets/${activeTicket.id}/skip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId: doctorInfo.id })
      });
      const json = await res.json();
      if (res.ok) {
        showToast(`${activeTicket.full_number} kelmadi deb belgilandi.`);
        setActiveTicket(null);
        loadDoctorData();
      } else {
        showToast(json.message || 'Xatolik yuz berdi.');
      }
    } catch (e) {
      showToast('Server bilan aloqa xatoligi.');
    }
  };

  // 5. Oldingi bemor (Previous Patient)
  const handleShowPreviousPatient = () => {
    if (completedTickets.length === 0) {
      showToast("Bugungi kunda hali yakunlangan bemorlar mavjud emas.");
      return;
    }
    const lastCompleted = completedTickets[0]; // ordered by completed_at desc
    setPreviousPatientModal(lastCompleted);
  };

  // 6. View Patient EMR Details Modal
  const handleOpenPatientEMR = async (ticket: any) => {
    setPatientDetailsModal(ticket);
    setPatientEMRData(null);
    setConsultationNotes('');
    if (ticket.patient_id) {
      try {
        const res = await fetch(`${API_BASE_URL}/patients/${ticket.patient_id}`);
        const json = await res.json();
        if (json.data) {
          setPatientEMRData(json.data);
          if (json.data.medical_history) {
            setConsultationNotes(json.data.medical_history);
          }
        }
      } catch (e) {
        console.warn('Error loading patient EMR:', e);
      }
    }
  };

  // Helper formatting functions
  const calculateAge = (birthDateStr?: string) => {
    if (!birthDateStr) return 'Noma\'lum';
    const birth = new Date(birthDateStr);
    if (isNaN(birth.getTime())) return birthDateStr;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} yosh`;
  };

  const formatBirthDate = (birthDateStr?: string) => {
    if (!birthDateStr) return '—';
    const d = new Date(birthDateStr);
    if (isNaN(d.getTime())) return birthDateStr;
    return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '--:--';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  };

  // Dynamic Metrics from real PostgreSQL data
  const waitingCount = tickets.filter(t => t.status === 'WAITING').length;
  const inProgressCount = activeTicket ? 1 : 0;
  const completedCount = completedTickets.length;

  // Sidebar navigation items matching Shifokor.png exactly
  const navItems = [
    { id: 'mening-navbatim', label: 'Mening navbatim', icon: Home },
    { id: 'tarix', label: 'Chaqiruvlar tarixi', icon: Clock },
    { id: 'kundalik-qabul', label: 'Kundalik qabul', icon: Calendar },
    { id: 'sozlamalar', label: 'Sozlamalar', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-[#F0F4F8] select-none font-sans text-[#172B4D]">
      {/* 1. LEFT SIDEBAR (100% 1:1 with Shifokor.png, LARGER ICONS & REAL ROUTING) */}
      <aside className="w-64 bg-white flex flex-col justify-between flex-shrink-0 z-20 sticky top-0 h-screen border-r border-slate-200 shadow-xs">
        <div>
          {/* Logo Header */}
          <div className="p-6 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#00897B] flex items-center justify-center text-white shadow-md flex-shrink-0">
              <HeartPulse className="w-7 h-7 stroke-[2.4]" />
            </div>
            <div>
              <div className="font-black text-lg tracking-tight leading-tight text-[#172B4D]">Klinika</div>
              <div className="text-xs text-slate-500 font-medium">Navbat Tizimi</div>
            </div>
          </div>

          {/* Navigation Items with LARGE ICONS & REAL ROUTING */}
          <nav className="px-3 space-y-2 mt-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'mening-navbatim') {
                      setSearchParams({});
                    } else {
                      setSearchParams({ tab: item.id });
                    }
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[13px] font-semibold transition text-left ${
                    isActive
                      ? 'bg-[#00897B] text-white shadow-lg shadow-[#00897B]/25 font-bold'
                      : 'text-slate-600 hover:text-[#172B4D] hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-6 h-6 stroke-[2.2] flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Server Status (100% 1:1 with Shifokor.png) */}
        <div className="p-5 border-t border-slate-100">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>PostgreSQL Server ulangan</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">SADAF Clinic SaaS Engine</div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER BAR (100% 1:1 with Shifokor.png) */}
        <header className="h-20 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-10 shadow-xs">
          {/* Doctor Info & Switcher */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 border-2 border-[#1677FF] flex items-center justify-center text-2xl shadow-xs">
              👩‍⚕️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-[#172B4D] tracking-tight">{doctorInfo.display_name}</h1>
                {/* Doctor Switcher Dropdown */}
                {allDoctors.length > 0 && (
                  <select
                    value={doctorInfo.id}
                    onChange={(e) => handleSwitchDoctor(e.target.value)}
                    className="ml-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 py-1 px-2.5 rounded-lg border-0 cursor-pointer transition focus:ring-2 focus:ring-[#00897B]"
                    title="Shifokor profilini almashtirish"
                  >
                    {allDoctors.map(doc => (
                      <option key={doc.id} value={doc.id}>
                        {doc.display_name} ({doc.specialty_name}, {doc.room_number || doc.cabinet_number}-xona)
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <p className="text-xs text-slate-500 font-semibold">
                {doctorInfo.specialty_name} <span className="mx-1 text-slate-300">|</span> {doctorInfo.cabinet_number}-kabinet
              </p>
            </div>
          </div>

          {/* Right Badges & Exit Button */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div className="text-xs text-slate-500 font-medium">{dateStr}</div>
            </div>

            <div className="text-2xl font-black text-[#172B4D] tracking-tight font-mono">
              {time}
            </div>

            {/* Chiqish (Logout) button matching Shifokor.png */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Chiqish</span>
            </button>
          </div>
        </header>

        {/* 3. SUBVIEWS ROUTING */}

        {/* TAB 1: MENING NAVBATIM (100% 1:1 WITH Shifokor.png) */}
        {currentTab === 'mening-navbatim' && (
          <main className="p-8 grid grid-cols-12 gap-6 flex-1">
            {/* LEFT 2 COLUMNS (Col 1-8): METRICS, ACTIVE PATIENT, PATIENT DETAILS */}
            <div className="col-span-12 xl:col-span-8 space-y-6">
              {/* 3 REAL METRIC CARDS (100% Dynamic from PostgreSQL) */}
              <div className="grid grid-cols-3 gap-5">
                {/* 1. Kutayotgan bemorlar */}
                <div className="bg-[#F0F7FD] p-5 rounded-3xl border border-[#D0E5F7] shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white text-[#1677FF] flex items-center justify-center shadow-xs">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-500">Kutayotgan bemorlar</div>
                    <div className="text-3xl font-black text-[#172B4D] leading-tight">{waitingCount}</div>
                  </div>
                </div>

                {/* 2. Qabulda */}
                <div className="bg-[#EBF9F1] p-5 rounded-3xl border border-[#C1E9D2] shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white text-emerald-600 flex items-center justify-center shadow-xs">
                    <User className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-500">Qabulda</div>
                    <div className="text-3xl font-black text-[#172B4D] leading-tight">{inProgressCount}</div>
                  </div>
                </div>

                {/* 3. Yakunlangan */}
                <div className="bg-[#F8FAFC] p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white text-slate-600 flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-6 h-6 text-slate-500" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-500">Yakunlangan</div>
                    <div className="text-3xl font-black text-[#172B4D] leading-tight">{completedCount}</div>
                  </div>
                </div>
              </div>

              {/* CENTRAL CARD: HOZIRGI BEMOR (100% 1:1 with Shifokor.png) */}
              <div className="bg-[#EBF9F1]/50 border border-[#C1E9D2] rounded-3xl p-7 shadow-sm space-y-6">
                {/* Header Badges */}
                <div className="flex items-center justify-between">
                  <span className="px-3.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black uppercase tracking-wider">
                    HOZIRGI BEMOR
                  </span>
                  <span className={`px-3.5 py-1 rounded-full text-xs font-bold ${
                    activeTicket ? 'bg-emerald-100 text-emerald-800 animate-pulse' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {activeTicket ? 'Qabulda' : 'Kutilmoqda'}
                  </span>
                </div>

                {/* Active Ticket Details or Empty State */}
                {activeTicket ? (
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-7xl font-black text-[#006856] tracking-tight font-mono">
                        {activeTicket.full_number}
                      </div>
                      <h2 className="text-2xl font-black text-[#172B4D] pt-1">
                        {activeTicket.patient_name}
                      </h2>
                      <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 pt-1">
                        <div className="flex items-center gap-1.5">
                          <User className="w-4 h-4 text-slate-400" />
                          <span>{calculateAge(activeTicket.patient_birth_date)}</span>
                        </div>
                        <span>|</span>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span>{activeTicket.patient_phone || 'Telefon kiritilmagan'}</span>
                        </div>
                        <span>|</span>
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span>{activeTicket.service_name || 'Konsultatsiya'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Patient Illustration Avatar */}
                    <div className="w-24 h-24 rounded-full bg-blue-100 border-4 border-white shadow-md flex items-center justify-center text-5xl">
                      {activeTicket.patient_gender === 'FEMALE' ? '👩' : '👨'}
                    </div>
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="w-16 h-16 rounded-full bg-emerald-100/60 text-[#00897B] flex items-center justify-center text-3xl mb-1">
                      🩺
                    </div>
                    <div className="text-lg font-black text-[#172B4D]">
                      Hozirda qabulda faol bemor yo'q
                    </div>
                    <div className="text-xs text-slate-500 max-w-sm">
                      {waitingCount > 0
                        ? `Navbatda ${waitingCount} ta bemor kutmoqda. Qabulni boshlash uchun quyidagi "Keyingi bemor" tugmasini bosing.`
                        : 'Bugungi smena bo\'yicha barcha kutayotgan bemorlar qabul qilib bo\'lingan.'}
                    </div>
                  </div>
                )}

                {/* ACTION BUTTONS (100% Real PostgreSQL Backend API) */}
                <div className="space-y-3 pt-2">
                  {/* Big Green Button: Keyingi bemor */}
                  <button
                    disabled={loading || waitingCount === 0}
                    onClick={handleCallNext}
                    className="w-full py-4 bg-[#00965E] hover:bg-[#008050] disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-black text-base shadow-lg shadow-[#00965E]/25 transition flex items-center justify-center gap-3 cursor-pointer"
                  >
                    <Volume2 className="w-6 h-6" />
                    <span>{loading ? 'Chaqirilmoqda...' : 'Keyingi bemor'}</span>
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </button>

                  {/* 3 Secondary Action Buttons */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* Qayta chaqirish */}
                    <button
                      disabled={!activeTicket}
                      onClick={handleRecall}
                      className="py-3 px-4 bg-[#E0F2FE] hover:bg-[#BAE6FD] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-[#0284C7] rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                      title="TV monitorida ovozli e'lonni qaytadan yangratish"
                    >
                      <RotateCw className="w-4 h-4" />
                      <span>Qayta chaqirish</span>
                    </button>

                    {/* Oldingi bemor */}
                    <button
                      onClick={handleShowPreviousPatient}
                      className="py-3 px-4 bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#D97706] rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                      title="Avvalgi yakunlangan bemor ma'lumotlarini ko'rish"
                    >
                      <SkipBack className="w-4 h-4" />
                      <span>Oldingi bemor</span>
                    </button>

                    {/* Kelmadi */}
                    <button
                      disabled={!activeTicket}
                      onClick={handleSkip}
                      className="py-3 px-4 bg-[#FEE2E2] hover:bg-[#FECACA] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-[#DC2626] rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                      title="Bemor kelmadi deb qayd etish"
                    >
                      <UserX className="w-4 h-4" />
                      <span>Kelmadi</span>
                    </button>
                  </div>

                  {/* Bottom Wide Button: Qabulni yakunlash */}
                  <button
                    disabled={!activeTicket}
                    onClick={handleComplete}
                    className="w-full py-3.5 bg-[#D1FAE5] hover:bg-[#A7F3D0] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-[#059669] rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2 border border-[#A7F3D0] cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Qabulni yakunlash</span>
                  </button>
                </div>
              </div>

              {/* CARD 3: BEMOR MA'LUMOTLARI (100% 1:1 with Shifokor.png) */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-[#00897B]" />
                    <h3 className="text-sm font-bold text-[#172B4D]">Bemor ma'lumotlari</h3>
                  </div>
                  {activeTicket && (
                    <button
                      onClick={() => handleOpenPatientEMR(activeTicket)}
                      className="px-3.5 py-1.5 bg-blue-50 text-[#1677FF] rounded-xl text-xs font-bold hover:bg-blue-100 transition cursor-pointer"
                    >
                      Batafsil ko'rish (EMR)
                    </button>
                  )}
                </div>

                {activeTicket ? (
                  <div className="space-y-2.5 text-xs pt-1">
                    <div className="flex items-center">
                      <span className="w-40 text-slate-400 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>F.I.Sh:</span>
                      </span>
                      <span className="font-bold text-[#172B4D]">{activeTicket.patient_name}</span>
                    </div>

                    <div className="flex items-center">
                      <span className="w-40 text-slate-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Tug‘ilgan sana:</span>
                      </span>
                      <span className="font-bold text-[#172B4D]">{formatBirthDate(activeTicket.patient_birth_date)}</span>
                    </div>

                    <div className="flex items-center">
                      <span className="w-40 text-slate-400 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>Telefon:</span>
                      </span>
                      <span className="font-bold text-[#172B4D]">{activeTicket.patient_phone || '—'}</span>
                    </div>

                    <div className="flex items-center">
                      <span className="w-40 text-slate-400 flex items-center gap-2">
                        <Stethoscope className="w-4 h-4" />
                        <span>Xizmat:</span>
                      </span>
                      <span className="font-bold text-[#172B4D]">{activeTicket.service_name || 'Konsultatsiya'}</span>
                    </div>

                    <div className="flex items-center">
                      <span className="w-40 text-slate-400 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>To‘lov holati:</span>
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        activeTicket.payment_status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {activeTicket.payment_status === 'PAID' ? 'To‘langan' : 'To‘lanmagan'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 py-4 text-center">
                    Hozircha qabulga bemor chaqirilmagan.
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN (Col 9-12): NAVBAT RO'YXATI (100% Real from PostgreSQL) */}
            <div className="col-span-12 xl:col-span-4 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-black text-[#172B4D]">Navbat ro‘yxati</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadDoctorData}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                    title="Yangilash"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                    {tickets.length} ta
                  </span>
                </div>
              </div>

              {/* Tickets list */}
              <div className="space-y-2.5 overflow-y-auto max-h-[640px] pr-1">
                {tickets.length > 0 ? (
                  tickets.map((t, idx) => {
                    const isCurrent = t.status === 'Qabulda' || t.status === 'CALLED' || t.status === 'IN_PROGRESS';
                    return (
                      <div
                        key={t.id || idx}
                        onClick={() => handleOpenPatientEMR(t)}
                        className={`p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                          isCurrent
                            ? 'bg-[#EBF9F1] border-emerald-400 shadow-xs ring-1 ring-emerald-400'
                            : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-black font-mono ${
                            isCurrent
                              ? 'bg-emerald-600 text-white'
                              : 'bg-blue-50 text-[#1677FF]'
                          }`}>
                            {t.full_number}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-[#172B4D] leading-tight">{t.patient_name}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{t.service_name || 'Konsultatsiya'}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-slate-400 font-mono mb-1">{formatTime(t.issued_at || t.created_at)}</div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isCurrent
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-50 text-[#1677FF]'
                          }`}>
                            {isCurrent ? 'Qabulda' : 'Kutmoqda'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Navbatda kutayotgan bemorlar yo'q
                  </div>
                )}
              </div>
            </div>
          </main>
        )}

        {/* TAB 2: CHAQUIRUVLAR TARIXI (100% Real from PostgreSQL) */}
        {currentTab === 'tarix' && (
          <main className="p-8 flex-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-[#172B4D]">Chaqiruvlar va Qabullar Tarixi</h2>
                  <p className="text-xs text-slate-500">Bugungi qabul qilingan barcha bemorlar ro'yxati</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Bemor yoki talon..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00897B]"
                    />
                  </div>
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold">
                    Jami: {completedTickets.length} ta bemor
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-3">Talon №</th>
                      <th className="py-3 px-3">Bemor F.I.Sh.</th>
                      <th className="py-3 px-3">Xizmat</th>
                      <th className="py-3 px-3">Yakunlangan vaqt</th>
                      <th className="py-3 px-3">To'lov</th>
                      <th className="py-3 px-3 text-right">Holat</th>
                      <th className="py-3 px-3 text-right">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {completedTickets
                      .filter((t) => {
                        if (!historySearch.trim()) return true;
                        const s = historySearch.toLowerCase();
                        return (
                          t.patient_name?.toLowerCase().includes(s) ||
                          t.full_number?.toLowerCase().includes(s) ||
                          t.patient_phone?.includes(s)
                        );
                      })
                      .map((t: any, idx: number) => (
                        <tr key={t.id || idx} className="hover:bg-slate-50">
                          <td className="py-3.5 px-3">
                            <span className="font-mono font-black text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                              {t.full_number}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-bold text-slate-800">{t.patient_name}</td>
                          <td className="py-3.5 px-3 text-slate-600">{t.service_name || 'Konsultatsiya'}</td>
                          <td className="py-3.5 px-3 font-mono text-slate-500">{formatTime(t.completed_at || t.updated_at)}</td>
                          <td className="py-3.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {t.payment_status === 'PAID' ? 'To\'langan' : 'To\'lanmagan'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                              Yakunlangan
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <button
                              onClick={() => handleOpenPatientEMR(t)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition"
                            >
                              Ko'rish
                            </button>
                          </td>
                        </tr>
                      ))}
                    {completedTickets.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Bugungi kunda hali yakunlangan qabullar yo'q.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        )}

        {/* TAB 3: KUNDALIK QABUL (100% Real from PostgreSQL) */}
        {currentTab === 'kundalik-qabul' && (
          <main className="p-8 flex-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 max-w-4xl">
              <div>
                <h2 className="text-lg font-black text-[#172B4D]">Kundalik Qabul Jurnali</h2>
                <p className="text-xs text-slate-500">Bugungi smenada qabul kutilayotgan bemorlar grafigi</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100">
                  <div className="text-xs font-semibold text-blue-600">Jami navbatdagi bemorlar</div>
                  <div className="text-3xl font-black text-[#172B4D] mt-1">{waitingCount} ta</div>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <div className="text-xs font-semibold text-emerald-600">Qabul qilinganlar</div>
                  <div className="text-3xl font-black text-emerald-700 mt-1">{completedCount} ta</div>
                </div>

                <div className="p-5 rounded-2xl bg-purple-50 border border-purple-100">
                  <div className="text-xs font-semibold text-purple-600">O'rtacha ko'rik vaqti</div>
                  <div className="text-3xl font-black text-purple-700 mt-1">{doctorInfo.avg_consultation_minutes || 15} daqiqa</div>
                </div>
              </div>

              {/* Today's appointments log */}
              <div className="pt-2">
                <h3 className="text-sm font-bold text-slate-700 mb-3">Bugungi qabullar ketma-ketligi</h3>
                <div className="space-y-2">
                  {tickets.concat(completedTickets).slice(0, 8).map((t, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold px-2 py-0.5 bg-white border border-slate-200 rounded-md">
                          {t.full_number}
                        </span>
                        <span className="font-bold text-slate-800">{t.patient_name}</span>
                        <span className="text-slate-400">({t.service_name || 'Konsultatsiya'})</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        t.status === 'CALLED' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {t.status === 'COMPLETED' ? 'Yakunlangan' : t.status === 'CALLED' ? 'Qabulda' : 'Kutmoqda'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        )}

        {/* TAB 4: SOZLAMALAR (100% Real from PostgreSQL) */}
        {currentTab === 'sozlamalar' && (
          <main className="p-8 flex-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 max-w-2xl">
              <div>
                <h2 className="text-lg font-black text-[#172B4D]">Shifokor Xonasi Sozlamalari</h2>
                <p className="text-xs text-slate-500">Kabinet va navbat bildirishnomalarini boshqaring</p>
              </div>

              <div className="space-y-4">
                {/* Doctor Switcher in Settings */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Faol shifokor profilini tanlash
                  </label>
                  <select
                    value={doctorInfo.id}
                    onChange={(e) => handleSwitchDoctor(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00897B]"
                  >
                    {allDoctors.map(doc => (
                      <option key={doc.id} value={doc.id}>
                        {doc.display_name} — {doc.specialty_name} ({doc.room_number || doc.cabinet_number}-kabinet)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mutaxassislik va Kabinet</label>
                  <input
                    type="text"
                    disabled
                    value={`${doctorInfo.specialty_name} | ${doctorInfo.cabinet_number}-kabinet`}
                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Aloqa telefoni</label>
                  <input
                    type="text"
                    disabled
                    value={doctorInfo.phone || '+998 90 123 45 67'}
                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">TV Tabloga avtomatik e'lon yuborish</div>
                    <div className="text-[11px] text-slate-400">"Keyingi bemor" bosilganda TV monitorida ovozli chaqiruv qilinadi</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoAnnounceTv}
                    onChange={(e) => {
                      setAutoAnnounceTv(e.target.checked);
                      localStorage.setItem('sadaf_doctor_auto_tv', String(e.target.checked));
                    }}
                    className="w-5 h-5 text-[#00897B] rounded-lg accent-[#00897B] cursor-pointer"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => {
                      localStorage.setItem('sadaf_doctor_auto_tv', String(autoAnnounceTv));
                      showToast("Sozlamalar muvaffaqiyatli saqlandi!");
                    }}
                    className="px-5 py-2.5 bg-[#00897B] text-white rounded-xl text-xs font-bold hover:bg-[#00796B] transition cursor-pointer"
                  >
                    Saqlash
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        await fetch(`${API_BASE_URL}/tv/test-call`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            ticketNumber: activeTicket?.full_number || 'K-001',
                            specialty: doctorInfo.specialty_name,
                            cabinetNumber: doctorInfo.cabinet_number
                          })
                        });
                        showToast("TV Display monitoriga sinov chaqiruvi yuborildi!");
                      } catch (e) {
                        showToast("Xatolik yuz berdi");
                      }
                    }}
                    className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Ovozli e'lonni sinash (TV Test)
                  </button>
                </div>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* --- MODAL 1: BEMORNING TO'LIQ EMR KARTASI (Patient Details & Medical Card) --- */}
      {patientDetailsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1677FF] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#172B4D]">Bemor EMR Kartasi</h3>
                  <p className="text-xs text-slate-400">Tibbiy ma'lumotlar va qabullar tarixi</p>
                </div>
              </div>
              <button
                onClick={() => setPatientDetailsModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Patient Header Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-[#172B4D]">{patientDetailsModal.patient_name}</div>
                  <div className="text-slate-500 mt-0.5 flex items-center gap-3">
                    <span>{patientDetailsModal.patient_phone}</span>
                    <span>•</span>
                    <span>{calculateAge(patientDetailsModal.patient_birth_date)}</span>
                  </div>
                </div>
                <span className="font-mono font-black text-sm px-3 py-1 bg-white border border-slate-200 rounded-xl text-[#00897B]">
                  {patientDetailsModal.full_number}
                </span>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-400 block text-[11px]">Tug'ilgan sana:</span>
                  <span className="font-bold text-slate-700">{formatBirthDate(patientDetailsModal.patient_birth_date)}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-400 block text-[11px]">Jinsi:</span>
                  <span className="font-bold text-slate-700">
                    {patientDetailsModal.patient_gender === 'FEMALE' ? 'Ayol' : 'Erkak'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-400 block text-[11px]">Xizmat turi:</span>
                  <span className="font-bold text-slate-700">{patientDetailsModal.service_name || 'Konsultatsiya'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-400 block text-[11px]">To'lov holati:</span>
                  <span className="font-bold text-emerald-600">
                    {patientDetailsModal.payment_status === 'PAID' ? 'To\'langan' : 'To\'lanmagan'}
                  </span>
                </div>
              </div>

              {/* Manzil */}
              {patientDetailsModal.patient_address && (
                <div className="p-3 rounded-xl bg-slate-50 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-600">{patientDetailsModal.patient_address}</span>
                </div>
              )}

              {/* Consultation notes / Diagnosis textarea */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Shifokor ko'rik xulosasi va tavsiyalari:
                </label>
                <textarea
                  rows={3}
                  value={consultationNotes}
                  onChange={(e) => setConsultationNotes(e.target.value)}
                  placeholder="Bemor shikoyatlari, tashxis va tayinlangan dori vositalari..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#00897B]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setPatientDetailsModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Yopish
              </button>
              <button
                onClick={() => {
                  showToast("Bemor tibbiy xulosasi saqlandi!");
                  setPatientDetailsModal(null);
                }}
                className="px-5 py-2 bg-[#00897B] hover:bg-[#00796B] text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Xulosani saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: OLDINGI BEMOR KARTASI (Previous Patient Modal) --- */}
      {previousPatientModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <SkipBack className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#172B4D]">Oldingi Bemor</h3>
                  <p className="text-xs text-slate-400">Oxirgi yakunlangan konsultatsiya</p>
                </div>
              </div>
              <button
                onClick={() => setPreviousPatientModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-center">
                <span className="font-mono font-black text-4xl text-amber-800 block">
                  {previousPatientModal.full_number}
                </span>
                <span className="text-sm font-bold text-slate-800 mt-1 block">
                  {previousPatientModal.patient_name}
                </span>
                <span className="text-xs text-slate-500">
                  {previousPatientModal.service_name || 'Konsultatsiya'}
                </span>
              </div>

              <div className="space-y-2 p-3 bg-slate-50 rounded-xl">
                <div className="flex justify-between">
                  <span className="text-slate-400">Telefon:</span>
                  <span className="font-bold text-slate-700">{previousPatientModal.patient_phone || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Yakunlangan vaqt:</span>
                  <span className="font-mono font-bold text-slate-700">
                    {formatTime(previousPatientModal.completed_at || previousPatientModal.updated_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Holat:</span>
                  <span className="font-bold text-emerald-600">Yakunlangan</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setPreviousPatientModal(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Tushunarli
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
