import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, Calendar, Plus, Trash2, Printer, CreditCard,
  Banknote, Smartphone, Clock, CheckCircle2, User, Phone,
  LogOut, ChevronDown, HeartPulse, UserPlus, FileText, Settings,
  Users, BarChart3, Ticket, AlertCircle, RefreshCw, Check, ArrowRight, ArrowLeft, X,
  ShieldCheck, Volume2, Ban, RotateCcw, MapPin, Building2, Home, Sparkles
} from 'lucide-react';
import { TicketIssuedModal } from '../components/TicketIssuedModal';
import { NewPatientModal } from '../components/NewPatientModal';
import { UzbekistanAddressSelect } from '../components/UzbekistanAddressSelect';
import { showNotification } from '../components/ToastNotification';
import { formatUzbekPhone } from '../utils/phone';

const API_BASE_URL = 'http://localhost:5001/api/v1';

export const CashierView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'yangi-bemor';

  // Clock
  const [time, setTime] = useState('14:25');
  const [dateStr, setDateStr] = useState('10-iyun 2025, Seshanba');

  // Wizard Step: 1 = Bemor ma'lumotlari, 2 = Shifokor tanlash, 3 = To'lov oynasi
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Patient form state
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('1990-01-01');
  const [phone, setPhone] = useState('+998 ');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [address, setAddress] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  // Step 2: Doctor and Specialty selection (100% Real PostgreSQL)
  const [specialtyFilter, setSpecialtyFilter] = useState('Barchasi');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);

  // Step 3: Selected services list
  const [selectedItems, setSelectedItems] = useState<Array<{
    doctorId: string;
    doctorName: string;
    specialtyName: string;
    cabinetNumber: string;
    serviceId: string;
    serviceName: string;
    price: number;
  }>>([]);

  // Step 4: Payment
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'ONLINE'>('CASH');
  const [receivedAmount, setReceivedAmount] = useState<string>('0');

  // Right column: Recent tickets (100% Real from PostgreSQL queue_tickets)
  const [recentTickets, setRecentTickets] = useState<any[]>([]);

  // Other Tabs Data (100% Real from PostgreSQL)
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('ALL');
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL');
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [currentShift, setCurrentShift] = useState<any>(null);

  // Settings
  const [printerPaperSize, setPrinterPaperSize] = useState<'58mm' | '80mm'>('58mm');
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Modals & Menus
  const [isSearchPatientModalOpen, setIsSearchPatientModalOpen] = useState(false);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [patientModalSearch, setPatientModalSearch] = useState('');
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isXReportModalOpen, setIsXReportModalOpen] = useState(false);
  const [issuedResult, setIssuedResult] = useState<any>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load saved settings
    try {
      const saved = localStorage.getItem('sadaf_cashier_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.printerPaperSize) setPrinterPaperSize(parsed.printerPaperSize);
        if (parsed.autoPrintEnabled !== undefined) setAutoPrintEnabled(parsed.autoPrintEnabled);
        if (parsed.soundEnabled !== undefined) setSoundEnabled(parsed.soundEnabled);
      }
    } catch {}

    // Clock update
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }));
      const d = now.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' }).replace(' г.', '');
      const w = now.toLocaleDateString('uz-UZ', { weekday: 'long' });
      const capW = w.charAt(0).toUpperCase() + w.slice(1);
      setDateStr(`${d}, ${capW}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    loadInitialData();
    const refreshInterval = setInterval(loadInitialData, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(refreshInterval);
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const [docRes, srvRes, specRes, tckRes, payRes, patRes, shiftRes] = await Promise.all([
        fetch(`${API_BASE_URL}/doctors`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE_URL}/services`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE_URL}/specialties`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE_URL}/queues/tickets`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE_URL}/payments`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE_URL}/patients`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE_URL}/cash-shifts/current`).then(r => r.json()).catch(() => ({ data: null }))
      ]);

      if (docRes.data) setDoctors(docRes.data);
      if (srvRes.data) setServices(srvRes.data);
      if (specRes.data) setSpecialties(specRes.data);
      if (tckRes.data) {
        setAllTickets(tckRes.data);
        setRecentTickets(tckRes.data.slice(0, 10));
      }
      if (payRes.data) setAllPayments(payRes.data);
      if (patRes.data) setAllPatients(patRes.data);
      if (shiftRes.data) setCurrentShift(shiftRes.data);
    } catch (e) {
      console.warn('loadInitialData error:', e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sadaf_user');
    localStorage.removeItem('sadaf_user_token');
    navigate('/login');
  };

  // Add or toggle doctor in selected list with real database price and service
  const handleAddDoctor = (doc: any) => {
    // Find matching service from PostgreSQL services
    const srv = services.find(s => s.specialty_id === doc.specialty_id) || services[0];
    const price = srv ? Number(srv.price) : 100000;

    const newItem = {
      doctorId: doc.id,
      doctorName: doc.display_name?.replace('Dr. ', '') || 'Shifokor',
      specialtyName: doc.specialty_name || 'Mutaxassis',
      cabinetNumber: doc.room_number || doc.cabinet_number || '1',
      serviceId: srv?.id || 'srv_terapiya_kons',
      serviceName: srv?.name || `${doc.specialty_name || 'Shifokor'} konsultatsiyasi`,
      price
    };

    const exists = selectedItems.some(i => i.doctorId === doc.id);
    let next: typeof selectedItems;
    if (exists) {
      next = selectedItems.filter(i => i.doctorId !== doc.id);
    } else {
      next = [...selectedItems, newItem];
    }
    setSelectedItems(next);
    const sum = next.reduce((acc, c) => acc + c.price, 0);
    setReceivedAmount(sum.toLocaleString());
  };

  const handleRemoveItem = (index: number) => {
    const next = selectedItems.filter((_, idx) => idx !== index);
    setSelectedItems(next);
    const sum = next.reduce((acc, c) => acc + c.price, 0);
    setReceivedAmount(sum.toLocaleString());
  };

  const totalAmount = selectedItems.reduce((acc, curr) => acc + curr.price, 0);
  const cleanReceived = Number(receivedAmount.replace(/\s+/g, '')) || 0;
  const changeAmount = Math.max(0, cleanReceived - totalAmount);

  // Reset form
  const handleResetForm = () => {
    setFullName('');
    setPhone('+998 ');
    setBirthDate('1990-01-01');
    setGender('MALE');
    setAddress('');
    setSelectedPatientId('');
    setSelectedItems([]);
    setReceivedAmount('0');
    setCurrentStep(1);
  };

  // Step navigation validations
  const handleGoToStep2 = () => {
    if (!fullName.trim()) {
      showNotification('Ma\'lumot to\'liq emas', 'Iltimos, bemor F.I.Sh. kiriting!', 'warning');
      return;
    }
    if (phone.replace(/\D/g, '').length < 9) {
      showNotification('Ma\'lumot to\'liq emas', 'Iltimos, to\'g\'ri telefon raqamini kiriting (+998 ...)!', 'warning');
      return;
    }
    setCurrentStep(2);
  };

  const handleGoToStep3 = () => {
    if (selectedItems.length === 0) {
      showNotification('Xizmat tanlanmadi', 'Iltimos, kamida bitta shifokor yoki xizmat tanlang!', 'warning');
      return;
    }
    setReceivedAmount(totalAmount.toLocaleString());
    setCurrentStep(3);
  };

  // Submit and Issue Multi-tickets (100% Real PostgreSQL multi-register)
  const handleIssueTicket = async () => {
    if (!fullName.trim()) {
      showNotification('Ma\'lumot to\'liq emas', 'Iltimos, bemor F.I.Sh. kiriting!', 'warning');
      return;
    }
    if (selectedItems.length === 0) {
      showNotification('Xizmat tanlanmadi', 'Iltimos, kamida bitta shifokor yoki xizmat tanlang!', 'warning');
      return;
    }

    setLoading(true);
    try {
      // 1. Patient resolution
      let patId = selectedPatientId;
      if (!patId) {
        const pRes = await fetch(`${API_BASE_URL}/patients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName,
            phone,
            birthDate: birthDate || undefined,
            gender,
            address: address || undefined
          })
        });
        const pJson = await pRes.json();
        if (!pRes.ok || !pJson.data?.id) {
          throw new Error(pJson.message || "Bemor ma'lumotlarini saqlashda xatolik yuz berdi");
        }
        patId = pJson.data.id;
      }

      // 2. Multi-ticket creation
      const res = await fetch(`${API_BASE_URL}/queues/multi-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patId,
          items: selectedItems.map(i => ({ doctorId: i.doctorId, serviceId: i.serviceId })),
          payment: {
            method: paymentMethod === 'ONLINE' ? 'TRANSFER' : paymentMethod,
            amountPaid: cleanReceived
          }
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      setIssuedResult(json.data);
      setIsTicketModalOpen(true);

      const ticketNumbers = json.data?.tickets?.map((t: any) => t.full_number).join(', ') || 'Yangi talon';
      showNotification(
        'Talon muvaffaqiyatli berildi!',
        `${fullName} uchun ${ticketNumbers} raqamli navbat rasmiylashtirildi.`,
        'success'
      );

      // Play chime if sound enabled
      if (soundEnabled) {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15); // A5
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
          osc.start();
          osc.stop(ctx.currentTime + 0.5);
        } catch {}
      }

      // Reset form
      handleResetForm();
      loadInitialData();
    } catch (e: any) {
      showNotification('Xatolik yuz berdi', e.message || 'Talon rasmiylashtirishda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cancel Ticket
  const handleCancelTicket = async (ticketId: string) => {
    if (!confirm('Ushbu talonni bekor qilmoqchimisiz?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/queues/tickets/${ticketId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (!res.ok) throw new Error('Xatolik');
      showNotification('Talon bekor qilindi', `${ticketId} muvaffaqiyatli bekor qilindi.`, 'success');
      loadInitialData();
    } catch (e) {
      showNotification('Xatolik', 'Talonni bekor qilishda xatolik yuz berdi', 'error');
    }
  };

  // Filtered doctors from PostgreSQL
  const displayDoctors = doctors.filter(d => {
    if (specialtyFilter !== 'Barchasi' && !d.specialty_name?.toLowerCase().includes(specialtyFilter.toLowerCase())) {
      return false;
    }
    if (doctorSearch.trim() && !d.display_name?.toLowerCase().includes(doctorSearch.toLowerCase()) && !d.specialty_name?.toLowerCase().includes(doctorSearch.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Sidebar navigation menu items matching Kassir.png exactly
  const navItems = [
    { id: 'yangi-bemor', label: 'Yangi bemor', icon: User },
    { id: 'talonlar', label: 'Talonlar tarixi', icon: Calendar },
    { id: 'tolovlar', label: "To'lovlar", icon: CreditCard },
    { id: 'bemorlar', label: 'Bemorlar bazasi', icon: Users },
    { id: 'hisobotlar', label: 'Hisobotlar', icon: BarChart3 },
    { id: 'sozlamalar', label: 'Sozlamalar', icon: Settings },
  ];

  const handleSelectPatientForAdmission = (p: any) => {
    setFullName(p.full_name || p.fullName);
    setPhone(p.phone || '');
    setBirthDate(p.birth_date ? p.birth_date.substring(0, 10) : '1990-01-01');
    setGender(p.gender === 'FEMALE' ? 'FEMALE' : 'MALE');
    setAddress(p.address || '');
    setSelectedPatientId(p.id);
    setIsSearchPatientModalOpen(false);
    setSearchParams({}); // Switch to 'yangi-bemor'
    setCurrentStep(1);
    showNotification('Bemor tanlandi', `${p.full_name || p.fullName} anketasi yuklandi.`, 'info');
  };

  const handleSaveSettings = () => {
    try {
      localStorage.setItem('sadaf_cashier_settings', JSON.stringify({
        printerPaperSize,
        autoPrintEnabled,
        soundEnabled
      }));
      showNotification('Sozlamalar saqlandi', 'Kassa va printer sozlamalari muvaffaqiyatli saqlandi!', 'success');
    } catch {
      showNotification('Xatolik', 'Sozlamalarni saqlashda xatolik yuz berdi', 'error');
    }
  };

  // Financial metrics for reports
  const totalRevenue = allPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const cashRevenue = allPayments.filter(p => p.method === 'CASH').reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const cardRevenue = allPayments.filter(p => p.method === 'CARD').reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const onlineRevenue = allPayments.filter(p => p.method === 'TRANSFER' || p.method === 'ONLINE').reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  return (
    <div className="flex min-h-screen bg-[#F0F4F8] select-none font-sans text-[#172B4D]">
      {/* 1. LEFT DARK SIDEBAR (100% 1:1 with Kassir.png, LARGER ICONS & REAL ROUTING) */}
      <aside className="w-64 bg-[#0B1528] text-white flex flex-col justify-between flex-shrink-0 z-20 sticky top-0 h-screen border-r border-[#1E293B]">
        <div>
          {/* Logo Header */}
          <div className="p-6 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0084FF] flex items-center justify-center text-white shadow-md flex-shrink-0">
              <HeartPulse className="w-7 h-7 stroke-[2.4]" />
            </div>
            <div>
              <div className="font-black text-lg tracking-tight leading-tight">Sadaf Klinika</div>
              <div className="text-xs text-slate-400 font-medium">Kassir Qabulxonasi</div>
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
                    if (item.id === 'yangi-bemor') {
                      setSearchParams({});
                    } else {
                      setSearchParams({ tab: item.id });
                    }
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[13px] font-semibold transition text-left ${
                    isActive
                      ? 'bg-[#1677FF] text-white shadow-lg shadow-[#1677FF]/30 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-6 h-6 stroke-[2.2] flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Card with Interactive Menu */}
        <div className="p-4 border-t border-slate-800/80 relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full p-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between hover:bg-white/10 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1677FF] text-white flex items-center justify-center font-black text-xs shadow-sm">
                KA
              </div>
              <div>
                <div className="text-xs font-bold text-white">Kassir</div>
                <div className="text-[11px] text-slate-400">{currentShift ? currentShift.cashier_name || 'Kassir 1' : 'Kassir 1'}</div>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {userMenuOpen && (
            <div className="absolute bottom-16 left-4 right-4 bg-[#111C33] border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-xs">
              <button
                onClick={() => navigate('/manager')}
                className="w-full px-3 py-2 text-left text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition flex items-center gap-2"
              >
                <span>Menejer paneliga o'tish</span>
              </button>
              <button
                onClick={() => navigate('/doctor')}
                className="w-full px-3 py-2 text-left text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition flex items-center gap-2"
              >
                <span>Shifokor paneliga o'tish</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full px-3 py-2 text-left text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition flex items-center gap-2 border-t border-slate-800 mt-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Tizimdan chiqish</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER BAR (100% 1:1 with Kassir.png) */}
        <header className="h-20 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-10 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#1677FF] flex items-center justify-center">
              <User className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#172B4D] tracking-tight">Kassir oynasi</h1>
              <p className="text-xs text-slate-500 font-medium">
                {currentTab === 'yangi-bemor' && "Bemor ma'lumotlarini kiriting va talon bering"}
                {currentTab === 'talonlar' && "Klinikada berilgan barcha talonlar va ularning holati"}
                {currentTab === 'tolovlar' && "Kassa to'lovlari va moliyaviy tranzaksiyalar jurnali"}
                {currentTab === 'bemorlar' && "Bemorlarning elektron tibbiy kartalari va tarixi"}
                {currentTab === 'hisobotlar' && "Kassirning kunlik smena va tushum hisoboti"}
                {currentTab === 'sozlamalar' && "Termal chek printeri va kassa tizimi sozlamalari"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs text-slate-500 font-medium">{dateStr}</div>
              <div className="text-2xl font-black text-[#172B4D] tracking-tight font-mono">{time}</div>
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="w-10 h-10 rounded-full bg-[#1677FF] text-white flex items-center justify-center font-black text-xs shadow-sm">
                KA
              </div>
              <div>
                <span className="text-xs font-bold text-[#172B4D] block">Kassir 1</span>
                <span className="text-[10px] text-emerald-600 font-bold">Smena ochiq</span>
              </div>
              <button
                onClick={handleLogout}
                title="Tizimdan chiqish"
                className="w-9 h-9 rounded-xl hover:bg-red-50 text-red-500 flex items-center justify-center transition ml-2 border border-transparent hover:border-red-200"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* 3. CONTENT AREA ROUTING */}

        {/* TAB 1: YANGI BEMOR (100% 1:1 WITH Kassir.png, 100% REAL POSTGRESQL DATA) */}
        {currentTab === 'yangi-bemor' && (
          <main className="p-8 grid grid-cols-12 gap-6 flex-1">            {/* LEFT 2 COLUMNS (Col 1-8): STEP-BY-STEP SEQUENTIAL WIZARD */}
            <div className="col-span-12 xl:col-span-8 space-y-6">

              {/* STEP PROGRESS NAVIGATION BAR */}
              <div className="bg-white p-3.5 rounded-3xl border border-slate-200/80 shadow-xs">
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {/* Step 1 Pill */}
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className={`p-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer text-left ${
                      currentStep === 1
                        ? 'bg-blue-50/90 border-2 border-[#1677FF] text-[#1677FF] shadow-xs'
                        : currentStep > 1
                        ? 'bg-emerald-50/70 border border-emerald-200 text-emerald-800 hover:bg-emerald-100/60'
                        : 'bg-slate-50 border border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 ${
                      currentStep === 1
                        ? 'bg-[#1677FF] text-white shadow-xs'
                        : currentStep > 1
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      {currentStep > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">1-QADAM</div>
                      <div className="text-xs font-black truncate">Bemor ma'lumotlari</div>
                    </div>
                  </button>

                  {/* Step 2 Pill */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!fullName.trim()) {
                        showNotification('Diqqat', 'Oldin bemor F.I.Sh. kiritilishi kerak', 'warning');
                        return;
                      }
                      setCurrentStep(2);
                    }}
                    className={`p-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer text-left ${
                      currentStep === 2
                        ? 'bg-teal-50/90 border-2 border-[#00B96B] text-[#00B96B] shadow-xs'
                        : currentStep > 2
                        ? 'bg-emerald-50/70 border border-emerald-200 text-emerald-800 hover:bg-emerald-100/60'
                        : 'bg-slate-50 border border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 ${
                      currentStep === 2
                        ? 'bg-[#00B96B] text-white shadow-xs'
                        : currentStep > 2
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      {currentStep > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">2-QADAM</div>
                      <div className="text-xs font-black truncate">Shifokor tanlash</div>
                    </div>
                  </button>

                  {/* Step 3 Pill */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!fullName.trim()) {
                        showNotification('Diqqat', 'Oldin bemor F.I.Sh. kiritilishi kerak', 'warning');
                        return;
                      }
                      if (selectedItems.length === 0) {
                        showNotification('Diqqat', 'Oldin shifokor yoki xizmat tanlang', 'warning');
                        return;
                      }
                      setCurrentStep(3);
                    }}
                    className={`p-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer text-left ${
                      currentStep === 3
                        ? 'bg-amber-50/90 border-2 border-[#FA8C16] text-[#FA8C16] shadow-xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 ${
                      currentStep === 3
                        ? 'bg-[#FA8C16] text-white shadow-xs'
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      3
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">3-QADAM</div>
                      <div className="text-xs font-black truncate">To'lov & Talon</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* ===== STEP 1: BEMOR MA'LUMOTLARI VA MANZILI ===== */}
              {currentStep === 1 && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-2xl bg-[#1677FF] text-white flex items-center justify-center font-black text-xs shadow-xs">
                        1
                      </div>
                      <div>
                        <h2 className="text-base font-black text-[#172B4D]">Bemor shaxsiy ma'lumotlari</h2>
                        <p className="text-xs text-slate-400">Bemor F.I.Sh, telefoni, jinsi va to'liq yashash manzilini kiriting</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedPatientId && (
                        <button
                          type="button"
                          onClick={handleResetForm}
                          className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          Tozalash
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsSearchPatientModalOpen(true)}
                        className="px-4 py-2 bg-[#1677FF] hover:bg-[#0958D9] text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Mavjud bemorni qidirish</span>
                      </button>
                    </div>
                  </div>

                  {/* Asosiy ma'lumotlar formasi */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#172B4D] flex items-center gap-1">
                        <span>F.I.Sh (Familiya Ism Sharif)</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <User className="w-4 h-4 text-[#1677FF]" />
                        </div>
                        <input
                          type="text"
                          value={fullName}
                          onChange={e => setFullName(e.target.value)}
                          placeholder="Familiya Ism Sharif"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#1677FF]/20 focus:border-[#1677FF]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#172B4D] flex items-center gap-1">
                        <span>Telefon raqami</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <Phone className="w-4 h-4 text-[#1677FF]" />
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={e => setPhone(formatUzbekPhone(e.target.value))}
                          onKeyDown={e => {
                            if ((phone === '+998 ' || phone === '+998' || phone.length <= 5) && e.key === 'Backspace') {
                              e.preventDefault();
                              setPhone('+998 ');
                            }
                          }}
                          placeholder="+998 (90) 123-45-67"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#1677FF]/20 focus:border-[#1677FF]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#172B4D]">Tug'ilgan sana</label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <Calendar className="w-4 h-4 text-[#1677FF]" />
                        </div>
                        <input
                          type="date"
                          value={birthDate}
                          onChange={e => setBirthDate(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#1677FF]/20 focus:border-[#1677FF]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#172B4D]">Jinsi</label>
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setGender('MALE')}
                          className={`py-2 px-3 text-xs font-bold rounded-xl border transition flex items-center justify-center gap-2 cursor-pointer ${
                            gender === 'MALE'
                              ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span>👨 Erkak</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setGender('FEMALE')}
                          className={`py-2 px-3 text-xs font-bold rounded-xl border transition flex items-center justify-center gap-2 cursor-pointer ${
                            gender === 'FEMALE'
                              ? 'bg-pink-50 border-pink-500 text-pink-700 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span>👩 Ayol</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Yashash Manzili (Viloyat, Tuman, Mahalla, Ko'cha va uy) */}
                  <div className="pt-2 border-t border-slate-100">
                    <UzbekistanAddressSelect
                      value={address}
                      onChange={setAddress}
                      label="Bemor Yashash Manzili (Viloyat, Tuman, Mahalla va Ko'cha)"
                      showStreetInput={true}
                    />
                  </div>

                  {/* Step 1 Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="text-xs text-slate-400">
                      Bemor ma'lumotlarini to'ldirgach keyingi qadamga o'ting
                    </div>
                    <button
                      type="button"
                      onClick={handleGoToStep2}
                      className="px-6 py-3 rounded-2xl bg-[#1677FF] hover:bg-[#0958D9] text-white text-xs font-black transition flex items-center gap-2 shadow-md shadow-[#1677FF]/20 cursor-pointer"
                    >
                      <span>Keyingisi: Shifokor tanlash</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ===== STEP 2: SHIFOKOR VA XIZMAT TANLASH ===== */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Bemor mini-recap paneli */}
                  <div className="p-4 bg-gradient-to-r from-blue-50/80 via-teal-50/40 to-slate-50 border border-blue-200/70 rounded-3xl flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-[#1677FF] text-white font-black flex items-center justify-center text-sm shadow-xs flex-shrink-0">
                        {fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-[#172B4D]">{fullName}</span>
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                            {gender === 'FEMALE' ? 'Ayol' : 'Erkak'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span className="font-mono">{phone}</span>
                          {address && (
                            <>
                              <span>•</span>
                              <span className="text-teal-700 font-semibold truncate max-w-xs">{address}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs font-bold text-[#1677FF] hover:underline px-3.5 py-1.5 bg-white rounded-xl border border-blue-200 shadow-2xs cursor-pointer"
                    >
                      Bemor ma'lumotlarini o'zgartirish
                    </button>
                  </div>

                  {/* Shifokor tanlash kartasi */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#00B96B] text-white flex items-center justify-center font-black text-xs">
                          2
                        </div>
                        <h2 className="text-base font-black text-[#172B4D]">Shifokor va xizmat tanlash</h2>
                      </div>
                      <span className="text-xs text-slate-400 font-bold">
                        Jami {doctors.length} nafar shifokor faol
                      </span>
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={doctorSearch}
                        onChange={e => setDoctorSearch(e.target.value)}
                        placeholder="Shifokor ismi yoki mutaxassislikni qidirish..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1677FF]/20 focus:border-[#1677FF]"
                      />
                    </div>

                    {/* Specialty chips */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      <button
                        type="button"
                        onClick={() => setSpecialtyFilter('Barchasi')}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                          specialtyFilter === 'Barchasi'
                            ? 'bg-[#1677FF] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                        }`}
                      >
                        Barchasi
                      </button>
                      {specialties.map((spec) => (
                        <button
                          key={spec.id}
                          type="button"
                          onClick={() => setSpecialtyFilter(spec.name)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                            specialtyFilter === spec.name
                              ? 'bg-[#1677FF] text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                          }`}
                        >
                          {spec.name}
                        </button>
                      ))}
                    </div>

                    {/* Doctors List */}
                    <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                      {displayDoctors.length === 0 ? (
                        <div className="text-center py-8 text-xs text-slate-400">
                          Shifokor topilmadi
                        </div>
                      ) : (
                        displayDoctors.map((doc) => {
                          const isSelected = selectedItems.some(i => i.doctorId === doc.id);
                          const matchingService = services.find(s => s.specialty_id === doc.specialty_id) || services[0];
                          const price = matchingService ? Number(matchingService.price) : 100000;
                          const duration = matchingService?.duration_minutes ? `${matchingService.duration_minutes} daqiqa` : '15-20 daqiqa';

                          return (
                            <div
                              key={doc.id}
                              className={`p-3 rounded-2xl border transition flex items-center justify-between ${
                                isSelected
                                  ? 'bg-blue-50/60 border-[#1677FF] shadow-xs'
                                  : 'bg-white border-slate-200/80 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black shadow-xs ${
                                  isSelected ? 'bg-[#1677FF] text-white' : 'bg-blue-100 text-[#1677FF]'
                                }`}>
                                  {doc.specialty_prefix || 'DR'}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-[#172B4D]">{doc.display_name}</div>
                                  <div className="text-[11px] text-slate-500">
                                    {doc.specialty_name} • <span className="font-bold text-[#0084FF]">{doc.room_number || doc.cabinet_number}-xona</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="text-xs font-black text-[#172B4D] font-mono">
                                    {price.toLocaleString()} so‘m
                                  </div>
                                  <div className="text-[10px] text-slate-400">{duration}</div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleAddDoctor(doc)}
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition shadow-xs cursor-pointer ${
                                    isSelected
                                      ? 'bg-rose-500 hover:bg-rose-600 text-white'
                                      : 'bg-[#1677FF] hover:bg-[#0958D9] text-white'
                                  }`}
                                  title={isSelected ? "O'chirish" : "Qo'shish"}
                                >
                                  {isSelected ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Plus className="w-4 h-4 stroke-[2.5]" />}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Tanlangan xizmatlar kartasi */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#722ED1] text-white flex items-center justify-center font-black text-xs">
                          {selectedItems.length}
                        </div>
                        <h2 className="text-base font-black text-[#172B4D]">
                          Tanlangan shifokor va xizmatlar ({selectedItems.length})
                        </h2>
                      </div>
                      {selectedItems.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItems([]);
                            setReceivedAmount('0');
                          }}
                          className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
                        >
                          Barchasini tozalash
                        </button>
                      )}
                    </div>

                    {selectedItems.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
                        Hozircha xizmat yoki shifokor tanlanmadi. Yuqoridagi ro'yxatdan "+" tugmasini bosing.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between"
                          >
                            <div>
                              <div className="text-xs font-bold text-[#172B4D]">
                                {item.doctorName} <span className="text-slate-400 font-normal">({item.cabinetNumber}-xona)</span>
                              </div>
                              <div className="text-[11px] text-slate-500">{item.serviceName}</div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-xs font-black text-[#172B4D] font-mono">
                                {item.price.toLocaleString()} so‘m
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition cursor-pointer"
                                title="O'chirish"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-500">Jami to'lov summasi:</span>
                      <span className="text-xl font-black text-[#172B4D] font-mono">
                        {totalAmount.toLocaleString()} so‘m
                      </span>
                    </div>

                    {/* Step 2 Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition flex items-center gap-2 cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Orqaga: Bemor ma'lumotlari</span>
                      </button>

                      <button
                        type="button"
                        disabled={selectedItems.length === 0}
                        onClick={handleGoToStep3}
                        className="px-6 py-3 rounded-2xl bg-[#00B96B] hover:bg-[#009A59] text-white text-xs font-black transition flex items-center gap-2 shadow-md shadow-[#00B96B]/20 disabled:opacity-50 cursor-pointer"
                      >
                        <span>Keyingisi: To'lovga o'tish ({totalAmount.toLocaleString()} so'm)</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== STEP 3: TO'LOV VA TALON BERISH ===== */}
              {currentStep === 3 && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#FA8C16] text-white flex items-center justify-center font-black text-xs">
                        3
                      </div>
                      <div>
                        <h2 className="text-base font-black text-[#172B4D]">To'lov va talon berish</h2>
                        <p className="text-xs text-slate-400">To'lov turini belgilang va talon chop eting</p>
                      </div>
                    </div>
                    <span className="font-mono font-black text-lg text-[#1677FF] bg-blue-50 px-3.5 py-1 rounded-xl border border-blue-200/60">
                      {totalAmount.toLocaleString()} so'm
                    </span>
                  </div>

                  {/* Buyurtma va bemor qisqacha xulosasi */}
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-slate-800">{fullName}</span>
                        <span className="text-slate-400 font-mono">({phone})</span>
                      </div>
                      <span className="text-teal-700 font-bold">{selectedItems.length} ta yo'nalish</span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {selectedItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-slate-600">
                          <span>{item.doctorName} ({item.specialtyName}, {item.cabinetNumber}-xona)</span>
                          <span className="font-mono font-bold text-slate-800">{item.price.toLocaleString()} so'm</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment methods */}
                  <div>
                    <label className="text-xs font-bold text-[#172B4D] block mb-2">To'lov usuli:</label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('CASH')}
                        className={`p-3.5 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                          paymentMethod === 'CASH'
                            ? 'border-[#00B96B] bg-emerald-50/70 text-[#00B96B] shadow-xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Banknote className="w-4 h-4" />
                        <span>Naqd pul</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('CARD')}
                        className={`p-3.5 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                          paymentMethod === 'CARD'
                            ? 'border-[#1677FF] bg-blue-50/70 text-[#1677FF] shadow-xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Karta (Terminal)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('ONLINE')}
                        className={`p-3.5 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                          paymentMethod === 'ONLINE'
                            ? 'border-[#722ED1] bg-purple-50/70 text-[#722ED1] shadow-xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Onlayn (Click/Payme)</span>
                      </button>
                    </div>
                  </div>

                  {/* Received & Change inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-[#172B4D]">
                          Qabul qilingan summa:
                        </label>
                        <button
                          type="button"
                          onClick={() => setReceivedAmount(totalAmount.toLocaleString())}
                          className="text-[11px] font-bold text-[#1677FF] hover:underline cursor-pointer"
                        >
                          Aniq summa
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={receivedAmount}
                          onChange={e => setReceivedAmount(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-[#172B4D] font-mono pr-12 focus:outline-none focus:ring-2 focus:ring-[#1677FF]/20 focus:border-[#1677FF]"
                        />
                        <span className="absolute right-3.5 top-3 text-xs text-slate-400 font-bold">
                          so‘m
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#172B4D] block mb-1">Qaytim:</label>
                      <div className="relative">
                        <input
                          type="text"
                          readOnly
                          value={changeAmount.toLocaleString()}
                          className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-black text-slate-600 font-mono pr-12"
                        />
                        <span className="absolute right-3.5 top-3 text-xs text-slate-400 font-bold">
                          so‘m
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Big Green CTA Button & Back to Step 2 */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleIssueTicket}
                      className="w-full py-4 bg-[#00B96B] hover:bg-[#009A59] text-white rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-[#00B96B]/25 transition flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
                    >
                      <Printer className="w-5 h-5" />
                      <span>
                        {loading ? 'Rasmiylashtirilmoqda...' : 'Talon berish va chek chiqarish'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Shifokor tanlashga qaytish</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN (Col 9-12): SO'NGGI TALONLAR (100% REAL FROM POSTGRESQL) */}
            <div className="col-span-12 xl:col-span-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#1677FF]" />
                  <h2 className="text-sm font-black text-[#172B4D]">So'nggi talonlar</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchParams({ tab: 'talonlar' })}
                  className="px-2.5 py-1 bg-blue-50 text-[#1677FF] rounded-lg text-[11px] font-bold hover:bg-blue-100 transition"
                >
                  Barchasi ({allTickets.length})
                </button>
              </div>

              {/* Compact Ticket items list with prominent larger numbers */}
              <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
                {recentTickets.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-xl border border-slate-200 text-xs text-slate-400">
                    Bugun hali talon rasmiylashtirilmadi
                  </div>
                ) : (
                  recentTickets.map((t, idx) => (
                    <div
                      key={idx}
                      className="py-2 px-3 bg-white border border-slate-200/90 rounded-xl flex items-center justify-between hover:border-blue-300 hover:shadow-xs transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Larger, prominent, bold ticket number */}
                        <div className="px-3 py-1 rounded-xl font-mono font-black text-[15px] sm:text-base tracking-tight bg-gradient-to-r from-blue-50 to-indigo-50/70 text-[#1677FF] border border-blue-200/80 shadow-2xs min-w-[68px] text-center flex-shrink-0">
                          {t.full_number || `${t.queue_prefix}-${t.queue_number}`}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[12px] font-bold text-[#172B4D] truncate leading-tight">{t.patient_name}</div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {t.specialty_name} • <span className="text-slate-600 font-semibold">{t.cabinet_number}-xona</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[11px] text-slate-400 font-mono">
                          {t.issued_at ? new Date(t.issued_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '14:20'}
                        </span>
                        <button
                          onClick={() => {
                            setIssuedResult({ tickets: [t] });
                            setIsTicketModalOpen(true);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-[#1677FF] hover:bg-blue-50 transition"
                          title="Talonni qayta chop etish"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </main>
        )}

        {/* TAB 2: TALONLAR TARIXI (100% REAL FROM POSTGRESQL queue_tickets) */}
        {currentTab === 'talonlar' && (
          <main className="p-8 flex-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-[#172B4D]">Talonlar Tarixi va Jurnali</h2>
                  <p className="text-xs text-slate-500">Bugungi barcha navbat talonlari va holatlari (PostgreSQL bazasi)</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Talon raqami yoki bemor ismi..."
                      value={ticketSearch}
                      onChange={e => setTicketSearch(e.target.value)}
                      className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium w-64 focus:outline-none focus:ring-2 focus:ring-[#1677FF]/20"
                    />
                  </div>
                  <button
                    onClick={loadInitialData}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 transition"
                    title="Yangilash"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex gap-2 border-b border-slate-100 pb-2">
                {[
                  { id: 'ALL', label: 'Barchasi' },
                  { id: 'WAITING', label: 'Kutilmoqda' },
                  { id: 'IN_PROGRESS', label: 'Qabulda' },
                  { id: 'COMPLETED', label: 'Yakunlangan' },
                  { id: 'CANCELLED', label: 'Bekor qilingan' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setTicketStatusFilter(st.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      ticketStatusFilter === st.id
                        ? 'bg-[#1677FF] text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Tickets Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-3">Talon №</th>
                      <th className="py-3 px-3">Bemor</th>
                      <th className="py-3 px-3">Shifokor</th>
                      <th className="py-3 px-3">Kabinet</th>
                      <th className="py-3 px-3">Berilgan vaqt</th>
                      <th className="py-3 px-3">To'lov</th>
                      <th className="py-3 px-3">Holat</th>
                      <th className="py-3 px-3 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allTickets
                      .filter(t => {
                        if (ticketStatusFilter !== 'ALL' && t.status !== ticketStatusFilter) return false;
                        if (!ticketSearch) return true;
                        const q = ticketSearch.toLowerCase();
                        return (
                          t.full_number?.toLowerCase().includes(q) ||
                          t.patient_name?.toLowerCase().includes(q) ||
                          t.doctor_name?.toLowerCase().includes(q)
                        );
                      })
                      .map((t: any) => (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3">
                            <span className="font-mono font-black text-xs px-2.5 py-1 bg-blue-50 text-[#1677FF] rounded-lg">
                              {t.full_number}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-800">{t.patient_name}</td>
                          <td className="py-3 px-3 text-slate-600">{t.doctor_name || t.specialty_name}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-700">{t.cabinet_number}-kabinet</td>
                          <td className="py-3 px-3 font-mono text-slate-500">
                            {t.issued_at ? new Date(t.issued_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '14:20'}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {t.payment_status === 'PAID' ? "To'langan" : 'Kutilmoqda'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.status === 'COMPLETED' ? 'bg-slate-100 text-slate-700' :
                              t.status === 'IN_PROGRESS' || t.status === 'CALLED' ? 'bg-purple-100 text-purple-700' :
                              t.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {t.status === 'COMPLETED' ? 'Yakunlangan' :
                               t.status === 'IN_PROGRESS' || t.status === 'CALLED' ? 'Qabulda' :
                               t.status === 'CANCELLED' ? 'Bekor qilingan' : 'Kutmoqda'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setIssuedResult({ tickets: [t] });
                                  setIsTicketModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                                title="Chop etish"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Chop etish</span>
                              </button>
                              {t.status !== 'CANCELLED' && t.status !== 'COMPLETED' && (
                                <button
                                  onClick={() => handleCancelTicket(t.id)}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition flex items-center gap-1"
                                  title="Bekor qilish"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Bekor qilish</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        )}

        {/* TAB 3: TO'LOVLAR JURNALI (100% REAL FROM POSTGRESQL payments) */}
        {currentTab === 'tolovlar' && (
          <main className="p-8 flex-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-[#172B4D]">To'lovlar va Kassa Jurnali</h2>
                  <p className="text-xs text-slate-500">PostgreSQL `payments` jadvaliga yozilgan barcha to'lovlar</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-semibold">Jami kassa tushumi</div>
                  <div className="text-2xl font-black text-emerald-600 font-mono">
                    {totalRevenue.toLocaleString()} so‘m
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <div className="text-xs font-semibold text-emerald-700">Naqd pul tushumi</div>
                  <div className="text-xl font-black text-emerald-700 font-mono mt-1">
                    {cashRevenue.toLocaleString()} so'm
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                  <div className="text-xs font-semibold text-blue-700">Karta (Terminal) tushumi</div>
                  <div className="text-xl font-black text-blue-700 font-mono mt-1">
                    {cardRevenue.toLocaleString()} so'm
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100">
                  <div className="text-xs font-semibold text-purple-700">Onlayn (Click/Payme)</div>
                  <div className="text-xl font-black text-purple-700 font-mono mt-1">
                    {onlineRevenue.toLocaleString()} so'm
                  </div>
                </div>
              </div>

              {/* Payments Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-3">Chek №</th>
                      <th className="py-3 px-3">Vaqt</th>
                      <th className="py-3 px-3">Bemor</th>
                      <th className="py-3 px-3">To'lov usuli</th>
                      <th className="py-3 px-3">Summa</th>
                      <th className="py-3 px-3">Holat</th>
                      <th className="py-3 px-3">Izoh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allPayments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono font-bold text-slate-700">{p.receipt_number || p.id}</td>
                        <td className="py-3 px-3 font-mono text-slate-500">
                          {p.created_at ? new Date(p.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '14:22'}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-800">{p.patient_name || 'Bemor'}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.method === 'CASH' ? 'bg-emerald-100 text-emerald-800' :
                            p.method === 'CARD' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {p.method === 'CASH' ? 'Naqd' : p.method === 'CARD' ? 'Karta' : 'Onlayn'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-800 font-mono">
                          {Number(p.amount).toLocaleString()} so‘m
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            To'langan
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">{p.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        )}

        {/* TAB 4: BEMORLAR BAZASI (100% REAL FROM POSTGRESQL patients) */}
        {currentTab === 'bemorlar' && (
          <main className="p-8 flex-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-[#172B4D]">Bemorlar Bazasi (EMR)</h2>
                  <p className="text-xs text-slate-500">Klinika bemorlarining to'liq ro'yxati va elektron kartalari</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Ism yoki telefon bo'yicha qidirish..."
                      value={patientSearch}
                      onChange={e => setPatientSearch(e.target.value)}
                      className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium w-64"
                    />
                  </div>
                  <button
                    onClick={() => setIsNewPatientModalOpen(true)}
                    className="px-4 py-2 bg-[#1677FF] text-white text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-[#0958D9]"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Yangi bemor qo'shish</span>
                  </button>
                </div>
              </div>

              {/* Patients Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-3">Karta №</th>
                      <th className="py-3 px-3">F.I.Sh.</th>
                      <th className="py-3 px-3">Telefon</th>
                      <th className="py-3 px-3">Tug'ilgan sana</th>
                      <th className="py-3 px-3">Jinsi</th>
                      <th className="py-3 px-3">Manzil</th>
                      <th className="py-3 px-3 text-right">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allPatients
                      .filter(p => !patientSearch || p.full_name?.toLowerCase().includes(patientSearch.toLowerCase()) || p.phone?.includes(patientSearch))
                      .map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-mono font-bold text-slate-700">
                            #{p.patient_number || p.id?.substring(0, 6)}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-800">{p.full_name}</td>
                          <td className="py-3 px-3 font-mono text-slate-600">{p.phone}</td>
                          <td className="py-3 px-3 text-slate-500">
                            {p.birth_date ? p.birth_date.substring(0, 10) : '-'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {p.gender === 'FEMALE' ? 'Ayol' : 'Erkak'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-500 max-w-xs truncate">{p.address || '-'}</td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleSelectPatientForAdmission(p)}
                              className="px-3 py-1 bg-[#1677FF] hover:bg-[#0958D9] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 ml-auto"
                            >
                              <span>Qabulga yo'naltirish</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        )}

        {/* TAB 5: HISOBOTLAR (100% REAL FROM POSTGRESQL) */}
        {currentTab === 'hisobotlar' && (
          <main className="p-8 flex-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 max-w-4xl">
              <div>
                <h2 className="text-lg font-black text-[#172B4D]">Kassir Kunlik Smena Hisoboti</h2>
                <p className="text-xs text-slate-500">Bugungi smenadagi moliyaviy aylanma va talonlar yig'indisi</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                  <div className="text-xs font-semibold text-blue-600">Jami talonlar soni</div>
                  <div className="text-3xl font-black text-[#172B4D] mt-1 font-mono">{allTickets.length} ta</div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <div className="text-xs font-semibold text-emerald-600">Jami kassa tushumi</div>
                  <div className="text-3xl font-black text-emerald-700 mt-1 font-mono">
                    {totalRevenue.toLocaleString()} so‘m
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-semibold text-slate-600">Naqd pul tushumi</div>
                  <div className="text-2xl font-black text-slate-800 mt-1 font-mono">
                    {cashRevenue.toLocaleString()} so‘m
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100">
                  <div className="text-xs font-semibold text-purple-600">Karta & Onlayn</div>
                  <div className="text-2xl font-black text-purple-700 mt-1 font-mono">
                    {(cardRevenue + onlineRevenue).toLocaleString()} so‘m
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">Smena hisobotini qog'ozga chop etish (X-hisobot)</div>
                  <div className="text-[11px] text-slate-400">Termal chek printerida kunlik smena yakuniy hisoboti chiqariladi</div>
                </div>
                <button
                  onClick={() => setIsXReportModalOpen(true)}
                  className="px-5 py-2.5 bg-[#1677FF] text-white rounded-xl text-xs font-bold hover:bg-[#0958D9] flex items-center gap-2 shadow-sm transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>X-hisobot chiqarish</span>
                </button>
              </div>
            </div>
          </main>
        )}

        {/* TAB 6: SOZLAMALAR */}
        {currentTab === 'sozlamalar' && (
          <main className="p-8 flex-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 max-w-2xl">
              <div>
                <h2 className="text-lg font-black text-[#172B4D]">Kassa va Chek Printeri Sozlamalari</h2>
                <p className="text-xs text-slate-500">Termal qog'oz o'lchami va kassa avtomatik amallarini sozlang</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">Termal chek kengligi</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPrinterPaperSize('58mm')}
                      className={`p-4 rounded-2xl border text-xs font-bold transition flex items-center justify-between ${
                        printerPaperSize === '58mm'
                          ? 'border-[#1677FF] bg-blue-50 text-[#1677FF]'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>58 mm (Standart termal qog'oz)</span>
                      {printerPaperSize === '58mm' && <Check className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPrinterPaperSize('80mm')}
                      className={`p-4 rounded-2xl border text-xs font-bold transition flex items-center justify-between ${
                        printerPaperSize === '80mm'
                          ? 'border-[#1677FF] bg-blue-50 text-[#1677FF]'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>80 mm (Keng chek printeri)</span>
                      {printerPaperSize === '80mm' && <Check className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Talon berishda avtomatik chop etish</div>
                    <div className="text-[11px] text-slate-400">Talon yaratilganda printer oynasi darhol ochiladi</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoPrintEnabled}
                    onChange={e => setAutoPrintEnabled(e.target.checked)}
                    className="w-5 h-5 text-[#1677FF] rounded-lg"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Ovozli tasdiq (Chime)</div>
                    <div className="text-[11px] text-slate-400">To'lov va talon muvaffaqiyatli chiqqanda ohang chalinadi</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={e => setSoundEnabled(e.target.checked)}
                    className="w-5 h-5 text-[#1677FF] rounded-lg"
                  />
                </div>

                <button
                  onClick={handleSaveSettings}
                  className="px-5 py-2.5 bg-[#00B96B] text-white rounded-xl text-xs font-bold hover:bg-[#009A59] transition"
                >
                  Sozlamalarni saqlash
                </button>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* MODAL 1: TICKET ISSUED / THERMAL PRINT MODAL */}
      <TicketIssuedModal
        isOpen={isTicketModalOpen}
        tickets={issuedResult?.tickets || []}
        payment={issuedResult?.payment}
        onClose={() => setIsTicketModalOpen(false)}
      />

      {/* MODAL 2: SEARCH EXISTING PATIENT MODAL */}
      {isSearchPatientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#172B4D]">Mavjud bemorni qidirish</h3>
                <p className="text-xs text-slate-400">Ism yoki telefon orqali tezkor topish</p>
              </div>
              <button
                onClick={() => setIsSearchPatientModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                autoFocus
                placeholder="F.I.Sh. yoki telefon raqami..."
                value={patientModalSearch}
                onChange={e => setPatientModalSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1677FF]/20"
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {allPatients
                .filter(p => {
                  if (!patientModalSearch) return true;
                  const q = patientModalSearch.toLowerCase();
                  return (
                    p.full_name?.toLowerCase().includes(q) ||
                    p.phone?.includes(q) ||
                    p.patient_number?.includes(q)
                  );
                })
                .slice(0, 10)
                .map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPatientForAdmission(p)}
                    className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-2xl flex items-center justify-between cursor-pointer transition"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800">{p.full_name}</div>
                      <div className="text-[11px] text-slate-500">
                        {p.phone} • {p.birth_date ? p.birth_date.substring(0, 10) : 'Tug‘ilgan sana yo‘q'}
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-[#1677FF] text-white text-[11px] font-bold rounded-xl">
                      Tanlash
                    </span>
                  </div>
                ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">Bemor topilmadimi?</span>
              <button
                type="button"
                onClick={() => {
                  setIsSearchPatientModalOpen(false);
                  setIsNewPatientModalOpen(true);
                }}
                className="px-4 py-2 bg-[#00B96B] hover:bg-[#009A59] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Yangi bemor qo'shish</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: NEW PATIENT REGISTRATION MODAL */}
      <NewPatientModal
        isOpen={isNewPatientModalOpen}
        onClose={() => setIsNewPatientModalOpen(false)}
        onSuccess={(patient) => {
          setIsNewPatientModalOpen(false);
          if (patient) {
            handleSelectPatientForAdmission(patient);
            loadInitialData();
          }
        }}
      />

      {/* MODAL 4: X-REPORT THERMAL PRINT MODAL */}
      {isXReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-dashed border-slate-300 pb-2">
              <span className="font-bold uppercase tracking-wider text-slate-800">KASSA X-HISOBOT</span>
              <button onClick={() => setIsXReportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center space-y-1">
              <div className="font-black text-sm text-slate-900">SADAF KLINIKA</div>
              <div className="text-[10px] text-slate-500 font-sans">Kassir Smena Yakuniy Dalolatnomasi</div>
              <div className="text-[10px] text-slate-400">{dateStr} • {time}</div>
            </div>

            <div className="border-t border-b border-dashed border-slate-300 py-3 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600">Kassir:</span>
                <span className="font-bold text-slate-800">{currentShift?.cashier_name || 'Kassir 1'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Jami talonlar:</span>
                <span className="font-bold text-slate-800">{allTickets.length} ta</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Naqd tushum:</span>
                <span className="font-bold text-emerald-700">{cashRevenue.toLocaleString()} so'm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Karta tushum:</span>
                <span className="font-bold text-blue-700">{cardRevenue.toLocaleString()} so'm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Onlayn tushum:</span>
                <span className="font-bold text-purple-700">{onlineRevenue.toLocaleString()} so'm</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-black text-sm text-slate-900">
                <span>JAMI TUSHUM:</span>
                <span>{totalRevenue.toLocaleString()} so'm</span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-3 bg-[#1677FF] hover:bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Chop etish</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
