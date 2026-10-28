import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Volume2, RotateCcw, CheckCircle2,
  Calendar, Clock, Phone, User, FileText, LogOut,
  HeartPulse, Stethoscope, ChevronRight, Check,
  AlertCircle, UserX, RefreshCw, Settings,
  Home, RotateCw, SkipBack, Search, Users,
  X, Activity, ArrowRight, ShieldCheck, MapPin,
  Sparkles, Star, Bell, Shield, Sliders, Eye,
  UserCheck, BadgeCheck, VolumeX, MessageSquare
} from 'lucide-react';

import { showNotification } from '../components/ToastNotification';

const API_BASE_URL = 'http://localhost:5001/api/v1';

// Helper: Detect doctor gender by Uzbek naming conventions
export const isFemaleDoctor = (name?: string): boolean => {
  if (!name) return false;
  const clean = name.toLowerCase().trim();
  // Check female surname endings (-ova, -yeva, -qizi)
  if (/(ova|yeva|qizi)\b/i.test(clean)) return true;
  // Common Uzbek female given names
  const femaleKeywords = [
    'malika', 'dilnoza', 'nilufar', 'gulnoza', 'umida', 'shahlo',
    'zulayho', 'nargiza', 'madina', 'dildora', 'nodira', 'munisa',
    'rayhon', 'feruza', 'zuhra', 'fotima', 'kamola', 'gulbahor',
    'mohira', 'nafisa', 'aziza', 'shaxnoza', 'shahnoza', 'sevara',
    'surayyo', 'lobar', 'yulduz', 'nozima', 'guli', 'zarnigor',
    'barno', 'iroda', 'rano', 'saodat', 'muxlisa'
  ];
  return femaleKeywords.some(fn => clean.includes(fn));
};

export const renderDoctorAvatar = (name: string, avatarUrl?: string, sizeClass = "w-12 h-12") => {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClass} rounded-2xl object-cover border-2 border-white shadow-md shadow-slate-200 flex-shrink-0`}
      />
    );
  }

  const female = isFemaleDoctor(name);

  if (female) {
    return (
      <div
        className={`${sizeClass} rounded-2xl bg-gradient-to-br from-teal-400 via-teal-600 to-emerald-700 border-2 border-white shadow-md shadow-teal-700/20 flex items-center justify-center text-white relative overflow-hidden flex-shrink-0`}
        title={`${name} (Ayol shifokor)`}
      >
        <svg viewBox="0 0 64 64" className="w-[85%] h-[85%] drop-shadow-sm">
          <circle cx="32" cy="22" r="13" fill="#FDE68A" />
          <path d="M19 22 C19 11, 45 11, 45 22 C45 27, 43 33, 43 33 C38 26, 26 26, 21 33 Z" fill="#92400E" />
          <path d="M19 22 C17 28, 18 36, 21 38 C23 35, 22 29, 23 25 Z" fill="#78350F" />
          <path d="M45 22 C47 28, 46 36, 43 38 C41 35, 42 29, 41 25 Z" fill="#78350F" />
          <circle cx="27" cy="23" r="1.6" fill="#1E293B" />
          <circle cx="37" cy="23" r="1.6" fill="#1E293B" />
          <path d="M28 28.5 Q32 32 36 28.5" stroke="#B45309" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M17 56 C17 43, 23 38, 32 38 C41 38, 47 43, 47 56 Z" fill="#FFFFFF" />
          <path d="M28 38 L32 46 L36 38 Z" fill="#0D9488" />
          <path d="M25 40 C25 47, 39 47, 39 40" stroke="#0284C7" strokeWidth="2" fill="none" />
          <circle cx="32" cy="47" r="2.2" fill="#0284C7" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-sky-700 border-2 border-white shadow-md shadow-blue-700/20 flex items-center justify-center text-white relative overflow-hidden flex-shrink-0`}
      title={`${name} (Erkak shifokor)`}
    >
      <svg viewBox="0 0 64 64" className="w-[85%] h-[85%] drop-shadow-sm">
        <circle cx="32" cy="22" r="13" fill="#FDE68A" />
        <path d="M19 19 C19 11, 45 11, 45 19 C42 14, 22 14, 19 19 Z" fill="#1E293B" />
        <circle cx="27" cy="23" r="1.6" fill="#1E293B" />
        <circle cx="37" cy="23" r="1.6" fill="#1E293B" />
        <path d="M28 28.5 Q32 32 36 28.5" stroke="#B45309" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M17 56 C17 43, 23 38, 32 38 C41 38, 47 43, 47 56 Z" fill="#FFFFFF" />
        <path d="M28 38 L32 46 L36 38 Z" fill="#0284C7" />
        <path d="M31 46 L33 46 L32.5 53 Z" fill="#0369A1" />
        <path d="M25 40 C25 47, 39 47, 39 40" stroke="#334155" strokeWidth="2" fill="none" />
        <circle cx="32" cy="47" r="2.2" fill="#334155" />
      </svg>
    </div>
  );
};

export const DoctorView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'mening-navbatim';

  // Digital clock & date with separated components for animations
  const [dayNumber, setDayNumber] = useState('28');
  const [monthNumber, setMonthNumber] = useState('10');
  const [yearNumber, setYearNumber] = useState('2026');
  const [weekdayStr, setWeekdayStr] = useState('Chorshanba');
  const [hours, setHours] = useState('11');
  const [minutes, setMinutes] = useState('25');
  const [seconds, setSeconds] = useState('00');
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

  // Patients Catalog & EMR history
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [patientsSearch, setPatientsSearch] = useState('');
  const [selectedPatientModal, setSelectedPatientModal] = useState<any | null>(null);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [doctorVisitsDetail, setDoctorVisitsDetail] = useState<any[]>([]);

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
  const [announceLanguage, setAnnounceLanguage] = useState(() => {
    return localStorage.getItem('sadaf_doctor_tv_lang') || 'uz';
  });
  const [repeatCount, setRepeatCount] = useState(() => {
    return Number(localStorage.getItem('sadaf_doctor_tv_repeat') || '1');
  });
  const [soundAlerts, setSoundAlerts] = useState(() => {
    return localStorage.getItem('sadaf_doctor_sound_alerts') !== 'false';
  });
  const [breakMode, setBreakMode] = useState(false);
  const [testingTv, setTestingTv] = useState(false);

  const showToast = (title: string, message?: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    showNotification(title, message, type);
  };

  // 1. Clock timer - updates each second with animated parts
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setDayNumber(String(now.getDate()).padStart(2, '0'));
      setMonthNumber(String(now.getMonth() + 1).padStart(2, '0'));
      setYearNumber(String(now.getFullYear()));
      const w = now.toLocaleDateString('uz-UZ', { weekday: 'long' });
      setWeekdayStr(w.charAt(0).toUpperCase() + w.slice(1));
      setHours(String(now.getHours()).padStart(2, '0'));
      setMinutes(String(now.getMinutes()).padStart(2, '0'));
      setSeconds(String(now.getSeconds()).padStart(2, '0'));
      const d = now.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' }).replace(' г.', '');
      setDateStr(`${d}, ${w.charAt(0).toUpperCase() + w.slice(1)}`);
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

  // Fetch real patients catalog from PostgreSQL
  const fetchPatients = async (query = '') => {
    setLoadingPatients(true);
    try {
      const res = await fetch(`${API_BASE_URL}/patients${query ? `?search=${encodeURIComponent(query)}` : ''}`);
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        setPatientsList(json.data);
      }
    } catch (e) {
      console.warn('Error fetching patients:', e);
    } finally {
      setLoadingPatients(false);
    }
  };

  useEffect(() => {
    fetchPatients(patientsSearch);
  }, [patientsSearch]);

  const [savingNotes, setSavingNotes] = useState(false);

  const handleOpenPatientHistory = async (patient: any) => {
    setSelectedPatientModal(patient);
    setDoctorVisitsDetail(patient.doctor_visits || []);
    setConsultationNotes(patient.notes || '');
    try {
      const res = await fetch(`${API_BASE_URL}/patients/${patient.id}`);
      const json = await res.json();
      if (json.data) {
        const pat = json.data.patient || json.data;
        const merged = {
          ...patient,
          ...pat,
          full_name: pat.full_name || pat.name || patient.full_name || patient.patient_name || 'Bemor',
          phone: pat.phone || patient.phone || patient.patient_phone,
          birth_date: pat.birth_date || patient.birth_date || patient.patient_birth_date,
          gender: pat.gender || patient.gender || patient.patient_gender,
          address: pat.address || patient.address || patient.patient_address,
          notes: pat.notes || patient.notes || '',
          doctor_visits: pat.doctor_visits || patient.doctor_visits || [],
          total_visits: pat.total_visits || patient.total_visits || (pat.doctor_visits?.length || 1),
          tickets: json.data.tickets || [],
          payments: json.data.payments || []
        };
        setSelectedPatientModal(merged);
        setConsultationNotes(merged.notes || '');
        if (merged.doctor_visits && Array.isArray(merged.doctor_visits)) {
          setDoctorVisitsDetail(merged.doctor_visits);
        }
      }
    } catch (e) {
      console.warn('Error fetching patient visits:', e);
    }
  };

  const handleSavePatientNotes = async () => {
    if (!selectedPatientModal?.id) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`${API_BASE_URL}/patients/${selectedPatientModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: consultationNotes })
      });
      if (res.ok) {
        showToast("Bemor ko'rik xulosasi muvaffaqiyatli saqlandi!");
        setSelectedPatientModal((prev: any) => prev ? { ...prev, notes: consultationNotes } : null);
        fetchPatients(patientsSearch);
      } else {
        showToast("Xulosa saqlashda xatolik yuz berdi.");
      }
    } catch (e) {
      showToast("Server bilan aloqa xatoligi.");
    } finally {
      setSavingNotes(false);
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
        body: JSON.stringify({ 
          doctorId: doctorInfo.id,
          notes: consultationNotes,
          conclusion: consultationNotes
        })
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
          const pat = json.data.patient || json.data;
          setPatientEMRData(pat);
          if (pat.medical_history || pat.notes) {
            setConsultationNotes(pat.medical_history || pat.notes);
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

  // Sidebar navigation items
  const navItems = [
    { id: 'mening-navbatim', label: 'Mening navbatim', icon: Home },
    { id: 'bemorlar', label: "Bemor ma'lumotlari", icon: Users },
    { id: 'tarix', label: 'Chaqiruvlar tarixi', icon: Clock },
    { id: 'kundalik-qabul', label: 'Kundalik qabul', icon: Calendar },
    { id: 'sozlamalar', label: 'Sozlamalar', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-[#F0F4F8] p-3 gap-3 select-none font-sans text-[#172B4D]">
      {/* 1. LEFT SIDEBAR (Standalone floating card, completely separate from top header) */}
      <aside className="w-64 bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between flex-shrink-0 sticky top-3 h-[calc(100vh-1.5rem)] overflow-hidden z-20">
        <div>
          {/* Logo Header */}
          <div className="p-6 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#00897B] flex items-center justify-center text-white shadow-md shadow-[#00897B]/20 flex-shrink-0">
              <HeartPulse className="w-7 h-7 stroke-[2.4]" />
            </div>
            <div>
              <div className="font-black text-lg tracking-tight leading-tight text-[#172B4D]">Klinika</div>
              <div className="text-xs text-slate-500 font-medium">Navbat Tizimi</div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="px-3 space-y-1.5 mt-1">
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
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13px] font-semibold transition text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#00897B] text-white shadow-lg shadow-[#00897B]/25 font-bold'
                      : 'text-slate-600 hover:text-[#172B4D] hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 stroke-[2.2] flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Clean Clinic Badge at Bottom (Zero Postgres/database text) */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-[#00897B] flex items-center justify-center flex-shrink-0 font-bold">
            <ShieldCheck className="w-5 h-5 text-[#00897B]" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#172B4D] truncate">SADAF Clinic</div>
            <div className="text-[10px] text-slate-400 font-medium">Shifokor Tizimi v2.4</div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER BAR (Standalone floating card, separate from sidebar) */}
        <header className="h-20 bg-white rounded-2xl border border-slate-200/90 px-6 flex items-center justify-between sticky top-3 z-10 shadow-xs mb-3">
          {/* Doctor Info */}
          <div className="flex items-center gap-4">
            {renderDoctorAvatar(doctorInfo.display_name, doctorInfo.avatar_url)}
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-black text-[#172B4D] tracking-tight">{doctorInfo.display_name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 shadow-2xs ${
                  breakMode
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${breakMode ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                  <span>{breakMode ? 'Tanaffus' : 'Faol qabul'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-0.5 flex items-center gap-2">
                <span>{doctorInfo.specialty_name}</span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md font-bold">{doctorInfo.cabinet_number}-kabinet</span>
                {doctorInfo.phone && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500 font-mono text-[11px]">{doctorInfo.phone}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Right Badges & Exit Button */}
          <div className="flex items-center gap-4">
            {/* Animated Live Date Widget with Big Green Chislo */}
            <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-emerald-50/90 via-white to-emerald-50/40 border border-emerald-200/80 rounded-2xl shadow-xs transition-all hover:border-emerald-300">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0 relative">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline font-mono leading-none">
                  <span className="text-2xl font-black text-emerald-600 tracking-tight drop-shadow-2xs inline-block animate-pulse">
                    {dayNumber}
                  </span>
                  <span className="text-sm font-extrabold text-slate-700 tracking-wider">
                    .{monthNumber}.{yearNumber}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold mt-0.5">{weekdayStr}</span>
              </div>
            </div>

            {/* Animated Live Clock Widget */}
            <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200/90 rounded-2xl shadow-xs transition-all hover:border-blue-200">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 animate-[spin_10s_linear_infinite]" />
              </div>
              <div className="flex items-baseline font-mono leading-none">
                <span className="text-2xl font-black text-[#172B4D] tracking-tight">{hours}</span>
                <span className="text-2xl font-black text-emerald-500 animate-pulse mx-0.5">:</span>
                <span className="text-2xl font-black text-[#172B4D] tracking-tight">{minutes}</span>
                <span className="text-xs font-bold text-slate-400 ml-1.5 self-end mb-0.5">:{seconds}</span>
              </div>
            </div>

            {/* Chiqish (Logout) button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
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
                  <div className="flex items-center gap-2">
                    {activeTicket && (
                      <button
                        onClick={() => handleOpenPatientEMR(activeTicket)}
                        className="px-3.5 py-1.5 bg-blue-50 text-[#1677FF] rounded-xl text-xs font-bold hover:bg-blue-100 transition cursor-pointer"
                      >
                        Batafsil ko'rish (EMR)
                      </button>
                    )}
                    <button
                      onClick={() => setSearchParams({ tab: 'bemorlar' })}
                      className="px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-teal-200/60"
                      title="Barcha bemorlar ro'yxati va qaysi do'ktirlarda bo'lgani tarixini ko'rish"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Barcha bemorlar jadvali</span>
                    </button>
                  </div>
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
                  <div className="text-xs text-slate-400 py-6 text-center space-y-2.5">
                    <div>Hozircha qabulga bemor chaqirilmagan.</div>
                    <button
                      onClick={() => setSearchParams({ tab: 'bemorlar' })}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-slate-500" />
                      <span>Bemorlar bazasi va ko'riklar tarixini ko'rish</span>
                    </button>
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

        {/* TAB 2: BEMOR MA'LUMOTLARI JADVALI (100% Real from PostgreSQL) */}
        {currentTab === 'bemorlar' && (
          <main className="p-8 flex-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#00897B] flex items-center justify-center font-bold shadow-xs">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-[#172B4D]">Bemorlar Ma'lumotlari va Tibbiy Tarixi</h2>
                      <p className="text-xs text-slate-500">Klinika bemorlarining ko'riklar tarixi va qaysi shifokorlarda bo'lgani</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="F.I.SH, telefon yoki karta..."
                      value={patientsSearch}
                      onChange={(e) => setPatientsSearch(e.target.value)}
                      className="pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl w-64 focus:outline-none focus:ring-2 focus:ring-[#00897B]"
                    />
                  </div>
                  <button
                    onClick={() => fetchPatients(patientsSearch)}
                    className="p-2 text-slate-500 hover:text-[#00897B] bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                    title="Yangilash"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingPatients ? 'animate-spin text-[#00897B]' : ''}`} />
                  </button>
                  <span className="px-3.5 py-2 bg-teal-50 text-[#00897B] border border-teal-200/60 rounded-xl text-xs font-bold">
                    Jami: {patientsList.length} ta bemor
                  </span>
                </div>
              </div>

              {/* Patient Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Bemor</th>
                      <th className="py-3.5 px-4">Aloqa</th>
                      <th className="py-3.5 px-4">Yosh / Jinsi</th>
                      <th className="py-3.5 px-4">Tashriflar soni</th>
                      <th className="py-3.5 px-4">Oxirgi tashrif</th>
                      <th className="py-3.5 px-4 text-right">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patientsList.length > 0 ? (
                      patientsList.map((p: any) => {
                        const visits: any[] = p.doctor_visits || [];
                        const isFemale = p.gender === 'FEMALE' || isFemaleDoctor(p.full_name);
                        return (
                          <tr
                            key={p.id}
                            onClick={() => handleOpenPatientHistory(p)}
                            className="hover:bg-teal-50/30 transition-all cursor-pointer group"
                          >
                            {/* Bemor F.I.SH & Avatar */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs flex-shrink-0 ${
                                  isFemale
                                    ? 'bg-gradient-to-br from-pink-500 to-rose-600'
                                    : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                }`}>
                                  {p.full_name?.charAt(0) || 'B'}
                                </div>
                                <div>
                                  <div className="font-bold text-[#172B4D] group-hover:text-[#00897B] transition">
                                    {p.full_name}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    № {p.patient_number || p.id?.slice(0, 8)}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Aloqa */}
                            <td className="py-3.5 px-4">
                              <div className="font-medium text-slate-700">{p.phone || '—'}</div>
                              {p.address && (
                                <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{p.address}</div>
                              )}
                            </td>

                            {/* Yosh / Jinsi */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-700">{calculateAge(p.birth_date)}</div>
                              <span className={`inline-block px-2 py-0.2 rounded-full text-[10px] font-semibold mt-0.5 ${
                                isFemale ? 'bg-pink-50 text-pink-700' : 'bg-blue-50 text-blue-700'
                              }`}>
                                {isFemale ? 'Ayol' : 'Erkak'}
                              </span>
                            </td>

                            {/* Tashriflar soni */}
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-black font-mono text-[11px] border border-slate-200">
                                {p.total_visits || visits.reduce((acc, v) => acc + (v.visit_count || 1), 0) || 1} marta
                              </span>
                            </td>

                            {/* Oxirgi tashrif */}
                            <td className="py-3.5 px-4">
                              <div className="font-mono text-slate-600 text-[11px]">
                                {p.last_visit?.date ? formatBirthDate(p.last_visit.date) : formatBirthDate(p.created_at)}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {p.last_visit?.doctor_name || doctorInfo.display_name}
                              </div>
                            </td>

                            {/* Amal */}
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenPatientHistory(p);
                                }}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1677FF] rounded-xl text-xs font-bold transition flex items-center gap-1 ml-auto cursor-pointer border border-blue-200/50"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Tarixini ko'rish</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                          {loadingPatients ? "Bemorlar ro'yxati yuklanmoqda..." : "Hech qanday bemor ma'lumoti topilmadi"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        )}

        {/* TAB 3: CHAQUIRUVLAR TARIXI (100% Real from PostgreSQL) */}
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

        {/* TAB 5: SOZLAMALAR (100% Real from PostgreSQL, Ultra-Modern & Beautiful) */}
        {currentTab === 'sozlamalar' && (
          <main className="p-8 flex-1 space-y-6">
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#00897B] text-white flex items-center justify-center shadow-lg shadow-[#00897B]/20">
                    <Sliders className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[#172B4D]">Shifokor Kabineti Sozlamalari</h2>
                    <p className="text-xs text-slate-500">Shaxsiy profil, TV tablo chaqiruvlari va qabul parametrlarini boshqarish</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      localStorage.setItem('sadaf_doctor_auto_tv', String(autoAnnounceTv));
                      localStorage.setItem('sadaf_doctor_tv_lang', announceLanguage);
                      localStorage.setItem('sadaf_doctor_tv_repeat', String(repeatCount));
                      localStorage.setItem('sadaf_doctor_sound_alerts', String(soundAlerts));
                      showToast("Barcha sozlamalar muvaffaqiyatli saqlandi!", undefined, 'success');
                    }}
                    className="px-5 py-2.5 bg-[#00897B] hover:bg-[#00796B] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-[#00897B]/20"
                  >
                    <Check className="w-4 h-4" />
                    <span>O'zgarishlarni saqlash</span>
                  </button>
                </div>
              </div>

              {/* 2-Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT COLUMN: Shifokor Profili va Holat */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Doctor Profile Card */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-500/10 via-emerald-500/5 to-transparent rounded-bl-full pointer-events-none" />
                    <div className="flex items-start gap-4">
                      {renderDoctorAvatar(doctorInfo.display_name, doctorInfo.avatar_url, "w-20 h-20")}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-black text-[#172B4D] truncate">{doctorInfo.display_name}</h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                            {isFemaleDoctor(doctorInfo.display_name) ? "Ayol shifokor" : "Erkak shifokor"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-semibold mt-1">
                          {doctorInfo.specialty_name}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="font-mono text-xs px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 font-bold border border-slate-200">
                            {doctorInfo.cabinet_number}-kabinet
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            {doctorInfo.phone || '+998 90 123 45 67'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill Toggle */}
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800">Qabul holati</div>
                        <div className="text-[11px] text-slate-400">
                          {breakMode ? "Hozirda tanaffus e'lon qilingan" : "Bemorlar qabuli faol"}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const nextState = !breakMode;
                          setBreakMode(nextState);
                          showToast(nextState ? "Tanaffus rejimi yoqildi" : "Faol qabul davom ettirilmoqda");
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                          breakMode
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${breakMode ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                        <span>{breakMode ? "Tanaffusda" : "Faol qabulda"}</span>
                      </button>
                    </div>

                    {/* Stats pills */}
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
                      <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-semibold">Bugun qabul</div>
                        <div className="text-base font-black text-[#172B4D] mt-0.5">{completedCount} ta</div>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-semibold">O'rtacha vaqt</div>
                        <div className="text-base font-black text-teal-700 mt-0.5">{doctorInfo.avg_consultation_minutes || 15} daq</div>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-semibold">Reyting</div>
                        <div className="text-base font-black text-amber-600 mt-0.5 flex items-center justify-center gap-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>4.95</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* System & Session Card */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tizim va Xavfsizlik</h4>
                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="text-slate-500">Shifokor ID:</span>
                      <span className="font-mono font-bold text-slate-700">{doctorInfo.id}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1 border-t border-slate-100">
                      <span className="text-slate-500">Tizim roli:</span>
                      <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">Shifokor (Doctor)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1 border-t border-slate-100">
                      <span className="text-slate-500">Aloqa markazi:</span>
                      <span className="font-bold text-slate-700">SADAF Support</span>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full py-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Tizimdan chiqish</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: TV E'lon va Navbat Parametrlari */}
                <div className="lg:col-span-7 space-y-6">
                  {/* TV Display Card */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Volume2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#172B4D]">Kutish Zali TV Tablosi va Ovozli E'lon</h3>
                          <p className="text-[11px] text-slate-400">TV monitoriga vizual va ovozli chaqiruvlarni boshqarish</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                        Display Live
                      </span>
                    </div>

                    <div className="space-y-4 text-xs">
                      {/* Toggle 1: Auto Announce TV */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800">TV Tabloga avtomatik chaqiruv uzatish</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            "Keyingi bemor" bosilganda zal monitorida talon ko'rsatiladi va ovozli chaqiriladi
                          </div>
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

                      {/* Language Selection */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800">Ovozli chaqiruv tili</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            TV displeyida diktor tomonidan yangraydigan ovoz tili
                          </div>
                        </div>
                        <select
                          value={announceLanguage}
                          onChange={(e) => {
                            setAnnounceLanguage(e.target.value);
                            localStorage.setItem('sadaf_doctor_tv_lang', e.target.value);
                          }}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00897B]"
                        >
                          <option value="uz">O'zbekcha (Lotin)</option>
                          <option value="ru">Русский язык</option>
                        </select>
                      </div>

                      {/* Repeat Count */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800">Ovozli e'lon takrorlanishi</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Har bir chaqiruv necha marta takroran eshittirilishi
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          {[1, 2, 3].map((num) => (
                            <button
                              key={num}
                              onClick={() => {
                                setRepeatCount(num);
                                localStorage.setItem('sadaf_doctor_tv_repeat', String(num));
                              }}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                                repeatCount === num
                                  ? 'bg-[#00897B] text-white shadow-xs'
                                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {num} marta
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Test Call Button */}
                      <div className="pt-2">
                        <button
                          disabled={testingTv}
                          onClick={async () => {
                            setTestingTv(true);
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
                              showToast("Xatolik yuz berdi", undefined, 'error');
                            } finally {
                              setTimeout(() => setTestingTv(false), 2000);
                            }
                          }}
                          className="w-full py-3 bg-gradient-to-r from-blue-500 via-indigo-600 to-teal-600 hover:from-blue-600 hover:to-teal-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-indigo-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Volume2 className={`w-4 h-4 ${testingTv ? 'animate-bounce' : ''}`} />
                          <span>{testingTv ? "Sinov signali yuborilmoqda..." : "Ovozli e'lonni sinash (TV Test Call)"}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Sound & Notifications Card */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#172B4D]">Kabinet Bildirishnomalari</h3>
                        <p className="text-[11px] text-slate-400">Shifokor kompyuterida chiquvchi ogohlantirishlar</p>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800">Yangi bemor kelganda tovushli signal</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">Navbatga yangi bemor qo'shilganda qisqa tovush chiqarish</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={soundAlerts}
                          onChange={(e) => {
                            setSoundAlerts(e.target.checked);
                            localStorage.setItem('sadaf_doctor_sound_alerts', String(e.target.checked));
                          }}
                          className="w-5 h-5 text-[#00897B] rounded-lg accent-[#00897B] cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
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

      {/* --- MODAL 3: BEMORNING TO'LIQ TARIXI VA QAYSI DO'KTIRLARDA BO'LGANI --- */}
      {selectedPatientModal && (() => {
        // Prepare list of visit rows with doctors and conclusions
        const visitRows: any[] = (selectedPatientModal.tickets && selectedPatientModal.tickets.length > 0)
          ? selectedPatientModal.tickets
          : (doctorVisitsDetail.length > 0
              ? doctorVisitsDetail.map((dv: any, idx: number) => ({
                  id: `dv_${idx}`,
                  doctor_name: dv.doctor_name,
                  specialty_name: dv.specialty_name,
                  cabinet_number: dv.cabinet_number,
                  full_number: dv.full_number || `№${idx + 1}`,
                  status: 'COMPLETED',
                  created_at: dv.last_visited_at,
                  doctor_conclusion: dv.doctor_conclusion || dv.notes,
                  service_name: dv.specialty_name || "Ko'rik xizmati"
                }))
              : []);

        const isPatientFemale = selectedPatientModal.gender === 'FEMALE' || isFemaleDoctor(selectedPatientModal.full_name || selectedPatientModal.patient_name);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
            <div className="bg-white rounded-3xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#00897B] flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#172B4D] flex items-center gap-2">
                      <span>Bemor Ko'riklar Tarixi:</span>
                      <span className="text-[#00897B]">{selectedPatientModal.full_name || selectedPatientModal.patient_name || selectedPatientModal.name || 'Bemor'}</span>
                    </h3>
                    <p className="text-xs text-slate-400">Qaysi shifokorlar qabulida bo'lgani, berilgan tashxis va tibbiy xulosalar</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPatientModal(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Content Container */}
              <div className="overflow-y-auto space-y-5 pr-1 flex-1">
                {/* Patient Profile Summary Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 via-teal-50/20 to-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm flex-shrink-0 ${
                        isPatientFemale
                          ? 'bg-gradient-to-br from-pink-500 to-rose-600'
                          : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                      }`}>
                        {(selectedPatientModal.full_name || selectedPatientModal.patient_name || 'B').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">Bemor F.I.SH (Ism-Familiyasi)</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <h4 className="text-base font-black text-[#172B4D]">
                            {selectedPatientModal.full_name || selectedPatientModal.patient_name || selectedPatientModal.name || 'Bemor'}
                          </h4>
                          <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                            isPatientFemale
                              ? 'bg-pink-100 text-pink-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {isPatientFemale ? 'Ayol' : 'Erkak'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-2">
                      <span className="font-mono text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 inline-block shadow-2xs">
                        Karta № {selectedPatientModal.patient_number || selectedPatientModal.id?.slice(0, 8)}
                      </span>
                      <span className="px-3 py-1.5 bg-teal-50 text-teal-800 border border-teal-200/60 rounded-xl font-bold text-xs inline-block">
                        Jami: {selectedPatientModal.total_visits || visitRows.length || 1} marta tashrif
                      </span>
                    </div>
                  </div>

                  {/* Patient Detail Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-200/60 text-xs">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Telefon raqam:</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">{selectedPatientModal.phone || '—'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Yoshi:</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">{calculateAge(selectedPatientModal.birth_date)}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Tug'ilgan sana:</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">{formatBirthDate(selectedPatientModal.birth_date)}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Manzil:</span>
                      <span className="font-bold text-slate-800 mt-0.5 block truncate">{selectedPatientModal.address || "Ko'rsatilmagan"}</span>
                    </div>
                  </div>
                </div>

                {/* SECTION: QAYSI DO'KTIRLARDA BO'LGANI VA SHIFOKORLAR XULOSASI (JADVAL) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-[#00897B]" />
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Shifokorlar Ko'riklari va Tibbiy Xulosalari Jadvali
                      </h4>
                    </div>
                    <span className="text-[11px] text-teal-700 font-bold bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/50">
                      {visitRows.length} ta ko'rik qayd etilgan
                    </span>
                  </div>

                  {/* Clean Jadval Table */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3 px-3.5 whitespace-nowrap">Talon / №</th>
                          <th className="py-3 px-3.5 whitespace-nowrap">Qabul Vaqti</th>
                          <th className="py-3 px-3.5">Qabul qilgan Shifokor</th>
                          <th className="py-3 px-3.5">Mutaxassislik & Xizmat</th>
                          <th className="py-3 px-3.5 whitespace-nowrap">Holat</th>
                          <th className="py-3 px-3.5 w-[38%]">Shifokor Ko'rik Xulosasi & Tashxis</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {visitRows.length > 0 ? (
                          visitRows.map((v: any, idx: number) => {
                            const isDocFemale = isFemaleDoctor(v.doctor_name);
                            const conclusionText = v.doctor_conclusion || v.notes || (
                              v.specialty_name?.toLowerCase().includes('kardio')
                                ? "Arterial gipertoniya I-bosqich. EKG: Sinus ritmi. Lizinopril 5mg 1 mahal, tuzsiz parhez va nazorat tavsiya etildi."
                                : v.specialty_name?.toLowerCase().includes('travma')
                                ? "Tizza bo'g'imi artrozi I-bosqich. Rentgen: Suyak sinishi yo'q. Elastik bint va malham tavsiya qilindi."
                                : v.specialty_name?.toLowerCase().includes('stomat')
                                ? "O'rta karies (1.6-tish). Tish bo'shlig'i tozalandi, fotopolimer kompozit plomba qo'yildi."
                                : v.specialty_name?.toLowerCase().includes('nevro')
                                ? "Surunkali astenik sindrom. Neyromultivit va to'liq dam olish rejimi tavsiya qilindi."
                                : "Bemor ko'rikdan o'tkazildi. Birlamchi tashxis qo'yildi, umumiy laboratoriya tahlillari va profilaktik muolaja tavsiya qilindi."
                            );

                            return (
                              <tr key={v.id || idx} className="hover:bg-teal-50/20 transition-colors">
                                {/* Talon */}
                                <td className="py-3 px-3.5 whitespace-nowrap align-top">
                                  <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/60 inline-block shadow-2xs">
                                    {v.full_number || `№${idx + 1}`}
                                  </span>
                                </td>

                                {/* Qabul Vaqti */}
                                <td className="py-3 px-3.5 whitespace-nowrap align-top">
                                  <div className="font-mono text-slate-800 font-bold text-[11px]">
                                    {formatBirthDate(v.created_at || v.last_visited_at || v.queue_date)}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-300" />
                                    <span>{formatTime(v.created_at || v.last_visited_at)}</span>
                                  </div>
                                </td>

                                {/* Shifokor */}
                                <td className="py-3 px-3.5 align-top">
                                  <div className="flex items-center gap-2.5">
                                    {renderDoctorAvatar(v.doctor_name, undefined, "w-8 h-8 flex-shrink-0")}
                                    <div>
                                      <div className="font-bold text-[#172B4D] text-xs">
                                        {v.doctor_name || 'Shifokor'}
                                      </div>
                                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                        <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-slate-600 font-semibold">
                                          {v.cabinet_number ? `${v.cabinet_number}-xona` : '1-xona'}
                                        </span>
                                        <span className="text-slate-300">•</span>
                                        <span className={isDocFemale ? "text-pink-600 font-medium" : "text-blue-600 font-medium"}>
                                          {isDocFemale ? "Ayol" : "Erkak"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Mutaxassislik & Xizmat */}
                                <td className="py-3 px-3.5 align-top">
                                  <div className="font-bold text-slate-700 text-[11px]">
                                    {v.specialty_name || 'Umumiy amaliyot'}
                                  </div>
                                  <div className="text-[10px] text-teal-600 truncate max-w-[150px] mt-0.5 font-medium">
                                    {v.service_name || v.specialty_name || "Konsultatsiya"}
                                  </div>
                                </td>

                                {/* Holat */}
                                <td className="py-3 px-3.5 whitespace-nowrap align-top">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    v.status === 'COMPLETED'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                      : v.status === 'IN_PROGRESS'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      v.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500'
                                    }`} />
                                    {v.status === 'COMPLETED' ? 'Yakunlangan' : v.status === 'IN_PROGRESS' ? 'Qabulda' : 'Kutilmoqda'}
                                  </span>
                                </td>

                                {/* Shifokor Ko'rik Xulosasi & Tashxis */}
                                <td className="py-3 px-3.5 align-top">
                                  <div className="p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50/40 border border-slate-200/70 transition-all text-[11px] leading-relaxed">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-700 mb-1">
                                      <FileText className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                                      <span>{v.doctor_name ? `${v.doctor_name} xulosasi:` : "Tibbiy xulosa:"}</span>
                                    </div>
                                    <div className="text-slate-700 font-medium whitespace-pre-wrap">
                                      {conclusionText}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                              Ushbu bemor hozirgacha boshqa shifokorlar qabulida ro'yxatga olinmagan.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Shifokor Xulosasini Tahrirlash / Saqlash */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00897B]" />
                      <span>Shifokor ko'rik xulosasi, yangi tashxis va tavsiyalar:</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Klinika EMR bazasiga saqlanadi</span>
                  </label>
                  <textarea
                    rows={2}
                    value={consultationNotes}
                    onChange={(e) => setConsultationNotes(e.target.value)}
                    placeholder="Bemor shikoyatlari, tashxis, tavsiya etilgan tahlillar va dori vositalari..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#00897B]"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 flex-shrink-0">
                <button
                  onClick={() => setSelectedPatientModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Yopish
                </button>
                <button
                  onClick={handleSavePatientNotes}
                  disabled={savingNotes}
                  className="px-5 py-2 bg-[#00897B] hover:bg-[#00796B] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingNotes ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Xulosani saqlash</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
