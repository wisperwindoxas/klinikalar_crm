import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, Calendar, Plus, Trash2, Printer, CreditCard,
  Banknote, Smartphone, Clock, CheckCircle2, User, Phone,
  LogOut, ChevronDown, HeartPulse, UserPlus, FileText, Settings,
  Users, BarChart3, Ticket, AlertCircle, RefreshCw, Check, ArrowRight, ArrowLeft, X,
  ShieldCheck, Volume2, Ban, RotateCcw, MapPin, Building2, Home, Sparkles, Download,
  Filter, Eye, DollarSign, Wallet, Award, Activity, Copy, Hash, CheckSquare, SlidersHorizontal,
  Stethoscope, Layers, FileSpreadsheet, Tv, Lock, ExternalLink
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { TicketIssuedModal } from '../components/TicketIssuedModal';
import { NewPatientModal } from '../components/NewPatientModal';
import { UzbekistanAddressSelect } from '../components/UzbekistanAddressSelect';
import { ElectronDisplaySelector } from '../components/ElectronDisplaySelector';
import { AppUpdateModal } from '../components/AppUpdateModal';
import { showNotification } from '../components/ToastNotification';
import { formatUzbekPhone } from '../utils/phone';
import { APP_LOGO, APP_VERSION } from '../utils/brand';
import { printThermalTicket } from '../utils/thermalPrinter';

const API_BASE_URL = 'http://localhost:5001/api/v1';
const EMPTY_TICKETS: any[] = [];

const getAuthToken = (): string => {
  return localStorage.getItem('sadaf_user_token') || localStorage.getItem('token') || '';
};

const getAuthHeaders = (extra: Record<string, string> = {}): Record<string, string> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const CashierView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'yangi-bemor';

  // Authenticated Current User & Clinic Settings
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const raw = localStorage.getItem('sadaf_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [clinicSettings, setClinicSettings] = useState<any>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

  const getUserInitials = (name?: string) => {
    if (!name) return 'KA';
    const clean = name.trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

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
  const [visibleRecentCount, setVisibleRecentCount] = useState(15);
  const [visibleAllTicketsCount, setVisibleAllTicketsCount] = useState(15);
  const [visiblePaymentsCount, setVisiblePaymentsCount] = useState(15);
  const [visibleSearchPatientCount, setVisibleSearchPatientCount] = useState(15);
  const [visiblePatientsTabCount, setVisiblePatientsTabCount] = useState(15);

  // Tab 1: Talonlar extra filters
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('ALL');
  const [ticketPaymentFilter, setTicketPaymentFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [ticketDoctorFilter, setTicketDoctorFilter] = useState<string>('ALL');

  // Tab 2: To'lovlar extra filters & receipt modal
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<any>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Tab 3: Bemorlar extra filters & detail modal
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientGenderFilter, setPatientGenderFilter] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [selectedPatientDetail, setSelectedPatientDetail] = useState<any>(null);
  const [isPatientDetailModalOpen, setIsPatientDetailModalOpen] = useState(false);
  const [patientDetailLoading, setPatientDetailLoading] = useState(false);

  // Tab 4: Current shift
  const [currentShift, setCurrentShift] = useState<any>(null);

  // Tab 5: Settings State
  const [printerPaperSize, setPrinterPaperSize] = useState<'58mm' | '80mm'>('80mm');
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [printerCopies, setPrinterCopies] = useState<number>(1);
  const [clinicCustomName, setClinicCustomName] = useState<string>('');
  const [clinicCustomPhone, setClinicCustomPhone] = useState<string>('');
  const [clinicCustomAddress, setClinicCustomAddress] = useState<string>('');
  const [footerCustomNote, setFooterCustomNote] = useState<string>("Tashrifingiz uchun rahmat! Salomat bo'ling!");

  // TV Tablo sound testing & Cashier profile password states
  const [tvTestText, setTvTestText] = useState<string>("Ovoz chiqishi test qilindi");
  const [isTvTesting, setIsTvTesting] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);

  // Modals & Menus
  const [isSearchPatientModalOpen, setIsSearchPatientModalOpen] = useState(false);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [patientModalSearch, setPatientModalSearch] = useState('');
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const handleCloseTicketModal = useCallback(() => {
    setIsTicketModalOpen(false);
  }, []);
  const handlePaperSizeChange = useCallback((size: '58mm' | '80mm') => {
    setPrinterPaperSize(size);
  }, []);
  const [isXReportModalOpen, setIsXReportModalOpen] = useState(false);
  const [issuedResult, setIssuedResult] = useState<any>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [settingsSubTab, setSettingsSubTab] = useState<'all' | 'display' | 'update' | 'profile'>('all');
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
        if (parsed.printerCopies) setPrinterCopies(parsed.printerCopies);
        if (parsed.clinicCustomName) setClinicCustomName(parsed.clinicCustomName);
        if (parsed.clinicCustomPhone) setClinicCustomPhone(parsed.clinicCustomPhone);
        if (parsed.clinicCustomAddress) setClinicCustomAddress(parsed.clinicCustomAddress);
        if (parsed.footerCustomNote) setFooterCustomNote(parsed.footerCustomNote);
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
      const authHeaders = getAuthHeaders();
      const [docRes, srvRes, specRes, tckRes, payRes, patRes, shiftRes, setRes] = await Promise.all([
        fetch(`${API_BASE_URL}/doctors`, { headers: authHeaders }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE_URL}/services`, { headers: authHeaders }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE_URL}/specialties`, { headers: authHeaders }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE_URL}/queues/tickets`, { headers: authHeaders }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE_URL}/payments`, { headers: authHeaders }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE_URL}/patients`, { headers: authHeaders }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE_URL}/cash-shifts/current`, { headers: authHeaders }).then(r => r.json()).catch(() => ({ data: null })),
        fetch(`${API_BASE_URL}/clinic/settings`, { headers: authHeaders }).then(r => r.json()).catch(() => ({ data: null }))
      ]);

      if (docRes.data) setDoctors(docRes.data);
      if (srvRes.data) setServices(srvRes.data);
      if (specRes.data) setSpecialties(specRes.data);
      if (tckRes.data) {
        setAllTickets(tckRes.data);
        setRecentTickets(tckRes.data);
      }
      if (payRes.data) setAllPayments(payRes.data);
      if (patRes.data) setAllPatients(patRes.data);
      if (shiftRes.data) setCurrentShift(shiftRes.data);
      if (setRes.data) {
        setClinicSettings(setRes.data);
        if (!clinicCustomName) setClinicCustomName(setRes.data.clinic_name || '');
        if (!clinicCustomPhone) setClinicCustomPhone(setRes.data.phone || '');
        if (!clinicCustomAddress) setClinicCustomAddress(setRes.data.address || '');
      }
    } catch (e) {
      console.warn('loadInitialData error:', e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sadaf_user');
    localStorage.removeItem('sadaf_user_token');
    localStorage.removeItem('token');
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
          headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
    if (!confirm('Ushbu navbat talonini bekor qilishni tasdiqlaysizmi?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/queues/tickets/${ticketId}/cancel`, {
        method: 'POST',
        headers: getAuthHeaders(),
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
    setIsPatientDetailModalOpen(false);
    setSearchParams({}); // Switch to 'yangi-bemor'
    setCurrentStep(1);
    showNotification('Bemor tanlandi', `${p.full_name || p.fullName} anketasi yuklandi.`, 'info');
  };

  const handleOpenPatientDetail = async (patient: any) => {
    setSelectedPatientDetail(patient);
    setIsPatientDetailModalOpen(true);
    setPatientDetailLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/patients/${patient.id}`, { headers: getAuthHeaders() }).then(r => r.json());
      if (res.success && res.data) {
        setSelectedPatientDetail((prev: any) => ({
          ...prev,
          ...res.data.patient,
          tickets: res.data.tickets || [],
          payments: res.data.payments || []
        }));
      }
    } catch (err) {
      console.warn('Patient detail fetch err:', err);
    } finally {
      setPatientDetailLoading(false);
    }
  };

  const exportPaymentsToExcel = () => {
    try {
      const dataToExport = allPayments.map((p, idx) => ({
        '№': idx + 1,
        'Chek №': p.receipt_number || p.id,
        'Sana va Vaqt': p.created_at ? new Date(p.created_at).toLocaleString('uz-UZ') : '',
        'Bemor': p.patient_name || 'Bemor',
        'To\'lov usuli': p.method === 'CASH' ? 'Naqd' : p.method === 'CARD' ? 'Karta' : 'Onlayn',
        'Summa (so\'m)': Number(p.amount) || 0,
        'Holat': 'To\'langan',
        'Izoh': p.notes || ''
      }));
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Tolovlar');
      XLSX.writeFile(wb, `Kassa_Tolovlar_${new Date().toISOString().split('T')[0]}.xlsx`);
      showNotification('Excel yuklandi', 'To\'lovlar jurnali muvaffaqiyatli yuklab olindi.', 'success');
    } catch (e) {
      showNotification('Xatolik', 'Excelga eksport qilishda xatolik', 'error');
    }
  };

  const exportPatientsToExcel = () => {
    try {
      const dataToExport = allPatients.map((p, idx) => ({
        '№': idx + 1,
        'Karta №': p.patient_number || p.id,
        'F.I.Sh.': p.full_name,
        'Telefon': p.phone || '',
        'Tug\'ilgan sana': p.birth_date ? p.birth_date.substring(0, 10) : '',
        'Jinsi': p.gender === 'FEMALE' ? 'Ayol' : 'Erkak',
        'Manzil': p.address || '',
        'Qaydlar': p.notes || ''
      }));
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Bemorlar');
      XLSX.writeFile(wb, `Kassa_Bemorlar_${new Date().toISOString().split('T')[0]}.xlsx`);
      showNotification('Excel yuklandi', 'Bemorlar ro\'yxati muvaffaqiyatli yuklab olindi.', 'success');
    } catch (e) {
      showNotification('Xatolik', 'Excelga eksport qilishda xatolik', 'error');
    }
  };

  const handleTestPrint = () => {
    setIssuedResult({
      tickets: [
        {
          id: 'tck_test_sample',
          full_number: 'A001',
          patient_name: 'Sinov Bemori (Test)',
          doctor_name: 'Dr. Karimova Malika',
          specialty_name: 'Kardiologiya',
          cabinet_number: '3',
          price: 150000,
          payment_status: 'PAID',
          issued_at: new Date().toISOString()
        }
      ],
      payment: {
        receiptNumber: 'CH-SINOV-01',
        amount: 150000,
        method: 'CASH',
        createdAt: new Date().toISOString()
      }
    });
    setIsTicketModalOpen(true);
  };

  const handlePrintReceipt = (payment: any) => {
    setSelectedPaymentForReceipt(payment);
    setIsReceiptModalOpen(true);
  };

  const handleSaveSettings = () => {
    try {
      localStorage.setItem('sadaf_cashier_settings', JSON.stringify({
        printerPaperSize,
        autoPrintEnabled,
        soundEnabled,
        printerCopies,
        clinicCustomName,
        clinicCustomPhone,
        clinicCustomAddress,
        footerCustomNote
      }));
      showNotification('Sozlamalar saqlandi', 'Kassa sozlamalari muvaffaqiyatli saqlandi!', 'success');
    } catch {
      showNotification('Xatolik', 'Sozlamalarni saqlashda xatolik yuz berdi', 'error');
    }
  };

  const handleTestTvSound = async () => {
    setIsTvTesting(true);
    const phrase = tvTestText.trim() || "Ovoz chiqishi test qilindi";
    try {
      // 1. Send test call event to TV Tablo via backend WebSocket
      const res = await fetch(`${API_BASE_URL}/tv/test-call`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          voiceText: phrase,
          full_number: 'TEST-01',
          specialty_name: 'Test Xonasi',
          doctor_name: currentUser?.full_name || 'Kassir',
          cabinet_number: '1'
        })
      });

      if (!res.ok) {
        throw new Error("Serverdan xatolik qaytdi");
      }

      // 2. Play voice preview locally in cashier browser as well
      try {
        const audioUrl = `${API_BASE_URL}/voice/speak?text=${encodeURIComponent(phrase)}&voice=uz-UZ-MadinaNeural`;
        const audio = new Audio(audioUrl);
        audio.play().catch(() => {});
      } catch {}

      showNotification(
        "TV Tabloga ovoz yuborildi!",
        `«${phrase}» ovozli xabari TV Tabloda muvaffaqiyatli yangradi.`,
        "success"
      );
    } catch (err: any) {
      showNotification("Xatolik", err.message || "TV ga ovoz yuborishda xatolik yuz berdi", "error");
    } finally {
      setIsTvTesting(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      showNotification("Diqqat", "Yangi parol kamida 4 ta belgidan iborat bo'lishi kerak", "warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification("Diqqat", "Kiritilgan yangi parollar bir-biriga mos kelmadi", "warning");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const userId = currentUser?.id || 'usr_cashier_01';
      const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          password: newPassword,
          raw_password: newPassword
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Xatolik yuz berdi");

      showNotification("Parol yangilandi!", "Kassir hisobi paroli muvaffaqiyatli o'zgartirildi.", "success");
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showNotification("Xatolik", err.message || "Parolni o'zgartirishda xatolik", "error");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Financial metrics for reports
  const totalRevenue = allPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const cashRevenue = allPayments.filter(p => p.method === 'CASH').reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const cardRevenue = allPayments.filter(p => p.method === 'CARD').reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const onlineRevenue = allPayments.filter(p => p.method === 'TRANSFER' || p.method === 'ONLINE').reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  // Doctor revenue breakdown for reports
  const doctorRevenueStats = React.useMemo(() => {
    const stats: Record<string, { doctorName: string; specialtyName: string; cabinetNumber: string; ticketCount: number; revenue: number }> = {};
    allTickets.forEach(t => {
      const key = t.doctor_name || t.doctor_id || 'Boshqa';
      if (!stats[key]) {
        stats[key] = {
          doctorName: t.doctor_name || 'Shifokor',
          specialtyName: t.specialty_name || 'Umumiy',
          cabinetNumber: t.cabinet_number || '-',
          ticketCount: 0,
          revenue: 0
        };
      }
      stats[key].ticketCount += 1;
      if (t.payment_status === 'PAID') {
        stats[key].revenue += Number(t.price || 0);
      }
    });
    return Object.values(stats);
  }, [allTickets]);

  return (
    <div className="flex min-h-screen bg-[#F0F4F8] select-none font-sans text-[#172B4D]">
      {/* 1. LEFT DARK SIDEBAR (100% 1:1 with Kassir.png, LARGER ICONS & REAL ROUTING) */}
      <aside className="w-64 bg-[#0B1528] text-white flex flex-col justify-between flex-shrink-0 z-20 sticky top-0 h-screen border-r border-[#1E293B]">
        <div>
          {/* Logo Header */}
          <div className="p-6 flex items-center gap-3">
            <div className="w-12 h-12 bg-transparent flex items-center justify-center flex-shrink-0 filter drop-shadow-md overflow-hidden">
              <img
                src={clinicSettings?.logo_url || APP_LOGO}
                alt={clinicSettings?.clinic_name || 'Klinika-admin'}
                className="w-full h-full object-contain bg-transparent rounded-lg"
              />
            </div>
            <div className="min-w-0">
              <div className="font-black text-lg tracking-tight leading-tight truncate">
                {clinicSettings?.clinic_name || 'Klinika-admin'}
              </div>
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
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[13px] font-semibold transition text-left cursor-pointer ${
                    isActive
                      ? 'bg-medical-blue text-white shadow-lg shadow-medical-blue/30 font-bold'
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
              <h1 className="text-xl font-black text-[#172B4D] tracking-tight">
                {clinicSettings?.clinic_name || 'Klinika-admin'}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {currentTab === 'yangi-bemor' && "Bemor ma'lumotlarini kiriting va talon bering"}
                {currentTab === 'talonlar' && "Klinikada berilgan barcha talonlar va ularning holati"}
                {currentTab === 'tolovlar' && "Kassa to'lovlari va moliyaviy tranzaksiyalar jurnali"}
                {currentTab === 'bemorlar' && "Bemorlarning elektron tibbiy kartalari va tarixi"}
                {currentTab === 'hisobotlar' && "Kassirning kunlik smena va tushum hisoboti"}
                {currentTab === 'sozlamalar' && "Kassir profili va TV Tablo ovoz tizimi sozlamalari"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs text-slate-500 font-medium">{dateStr}</div>
              <div className="text-2xl font-black text-[#172B4D] tracking-tight font-mono">{time}</div>
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                {getUserInitials(currentUser?.fullName || currentUser?.name || 'Kassir')}
              </div>
              <div>
                <span className="text-xs font-bold text-[#172B4D] block truncate max-w-[150px]">
                  {currentUser?.fullName || currentUser?.name || 'Kassir'}
                </span>
                <span className={`text-[10px] font-bold ${currentShift ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {currentShift ? 'Smena ochiq' : 'Smena yopiq'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="Tizimdan chiqish"
                className="w-9 h-9 rounded-xl hover:bg-red-50 text-red-500 flex items-center justify-center transition ml-2 border border-transparent hover:border-red-200 cursor-pointer"
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

              {/* Compact Ticket items list with 15-item scroll pagination */}
              <div 
                className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1 scroll-smooth"
                onScroll={(e) => {
                  const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                  if (scrollHeight - scrollTop - clientHeight < 60 && visibleRecentCount < recentTickets.length) {
                    setVisibleRecentCount(prev => prev + 15);
                  }
                }}
              >
                {recentTickets.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-xl border border-slate-200 text-xs text-slate-400">
                    Bugun hali talon rasmiylashtirilmadi
                  </div>
                ) : (
                  recentTickets.slice(0, visibleRecentCount).map((t, idx) => (
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
                {visibleRecentCount < recentTickets.length && (
                  <div className="text-center pt-1">
                    <button
                      onClick={() => setVisibleRecentCount(prev => prev + 15)}
                      className="w-full py-1.5 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition cursor-pointer"
                    >
                      Yana 15 ta talon yuklash ({visibleRecentCount}/{recentTickets.length}) ↓
                    </button>
                  </div>
                )}
              </div>
            </div>
          </main>
        )}

        {/* TAB 2: TALONLAR TARIXI (100% REAL FROM POSTGRESQL queue_tickets) */}
        {currentTab === 'talonlar' && (
          <main className="p-8 flex-1 space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500">Jami talonlar</div>
                  <div className="text-2xl font-black text-slate-800 font-mono mt-1">{allTickets.length} ta</div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Ticket className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-blue-600">Kutilmoqda</div>
                  <div className="text-2xl font-black text-blue-600 font-mono mt-1">
                    {allTickets.filter(t => t.status === 'WAITING').length} ta
                  </div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-purple-600">Qabulda</div>
                  <div className="text-2xl font-black text-purple-600 font-mono mt-1">
                    {allTickets.filter(t => t.status === 'IN_PROGRESS' || t.status === 'CALLED').length} ta
                  </div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-emerald-600">Yakunlangan</div>
                  <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
                    {allTickets.filter(t => t.status === 'COMPLETED').length} ta
                  </div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-rose-500">Bekor qilingan</div>
                  <div className="text-2xl font-black text-rose-600 font-mono mt-1">
                    {allTickets.filter(t => t.status === 'CANCELLED').length} ta
                  </div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
                  <Ban className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-[#172B4D] flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-[#1677FF]" />
                    <span>Talonlar Tarixi va Jurnali</span>
                  </h2>
                  <p className="text-xs text-slate-500">Bugungi barcha navbat talonlari, shifokorlar va to'lov holati (PostgreSQL)</p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Talon №, bemor yoki shifokor..."
                      value={ticketSearch}
                      onChange={e => setTicketSearch(e.target.value)}
                      className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium w-64 focus:outline-none focus:ring-2 focus:ring-[#1677FF]/20"
                    />
                  </div>

                  {/* Doctor filter dropdown */}
                  <select
                    value={ticketDoctorFilter}
                    onChange={e => setTicketDoctorFilter(e.target.value)}
                    className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1677FF]/20"
                  >
                    <option value="ALL">Barcha shifokorlar</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.display_name}>{d.display_name} ({d.specialty_name})</option>
                    ))}
                  </select>

                  {/* Payment filter dropdown */}
                  <select
                    value={ticketPaymentFilter}
                    onChange={e => setTicketPaymentFilter(e.target.value as any)}
                    className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1677FF]/20"
                  >
                    <option value="ALL">Barcha to'lovlar</option>
                    <option value="PAID">Faqat to'langan</option>
                    <option value="UNPAID">Faqat to'lanmagan</option>
                  </select>

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
              <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
                {[
                  { id: 'ALL', label: 'Barchasi', count: allTickets.length },
                  { id: 'WAITING', label: 'Kutilmoqda', count: allTickets.filter(t => t.status === 'WAITING').length },
                  { id: 'IN_PROGRESS', label: 'Qabulda', count: allTickets.filter(t => t.status === 'IN_PROGRESS' || t.status === 'CALLED').length },
                  { id: 'COMPLETED', label: 'Yakunlangan', count: allTickets.filter(t => t.status === 'COMPLETED').length },
                  { id: 'CANCELLED', label: 'Bekor qilingan', count: allTickets.filter(t => t.status === 'CANCELLED').length },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setTicketStatusFilter(st.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      ticketStatusFilter === st.id
                        ? 'bg-[#1677FF] text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                    }`}
                  >
                    <span>{st.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      ticketStatusFilter === st.id ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                    }`}>
                      {st.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Tickets Table */}
              {(() => {
                const filteredTickets = allTickets.filter(t => {
                  if (ticketStatusFilter !== 'ALL' && t.status !== ticketStatusFilter) return false;
                  if (ticketPaymentFilter === 'PAID' && t.payment_status !== 'PAID') return false;
                  if (ticketPaymentFilter === 'UNPAID' && t.payment_status === 'PAID') return false;
                  if (ticketDoctorFilter !== 'ALL' && !t.doctor_name?.toLowerCase().includes(ticketDoctorFilter.toLowerCase())) return false;
                  if (!ticketSearch) return true;
                  const q = ticketSearch.toLowerCase();
                  return (
                    t.full_number?.toLowerCase().includes(q) ||
                    t.patient_name?.toLowerCase().includes(q) ||
                    t.doctor_name?.toLowerCase().includes(q) ||
                    t.specialty_name?.toLowerCase().includes(q)
                  );
                });

                if (filteredTickets.length === 0) {
                  return (
                    <div className="py-16 text-center space-y-3">
                      <div className="w-14 h-14 mx-auto rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300">
                        <Ticket className="w-7 h-7" />
                      </div>
                      <div className="text-sm font-bold text-slate-700">Talonlar topilmadi</div>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Tanlangan filtrlarga mos keluvchi talonlar mavjud emas yoki hali berilmagan.
                      </p>
                    </div>
                  );
                }

                return (
                  <div
                    className="overflow-x-auto max-h-[600px] overflow-y-auto scroll-smooth rounded-2xl border border-slate-200/80 shadow-2xs"
                    onScroll={(e) => {
                      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                      if (scrollHeight - scrollTop - clientHeight < 60 && visibleAllTicketsCount < filteredTickets.length) {
                        setVisibleAllTicketsCount(prev => prev + 15);
                      }
                    }}
                  >
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4 bg-slate-50">Talon №</th>
                          <th className="py-3 px-4 bg-slate-50">Bemor</th>
                          <th className="py-3 px-4 bg-slate-50">Shifokor & Mutaxassislik</th>
                          <th className="py-3 px-4 bg-slate-50">Xona</th>
                          <th className="py-3 px-4 bg-slate-50">Berilgan vaqt</th>
                          <th className="py-3 px-4 bg-slate-50">To'lov</th>
                          <th className="py-3 px-4 bg-slate-50">Holat</th>
                          <th className="py-3 px-4 text-right bg-slate-50">Amallar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTickets.slice(0, visibleAllTicketsCount).map((t: any) => (
                          <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4">
                              <span className="font-mono font-black text-xs px-2.5 py-1 bg-blue-50 text-[#1677FF] border border-blue-200/60 rounded-xl">
                                {t.full_number}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-800">
                              <div>{t.patient_name || "Noma'lum"}</div>
                              {t.patient_phone && (
                                <div className="text-[11px] font-normal text-slate-400 font-mono">{t.patient_phone}</div>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-700">{t.doctor_name || 'Umumiy navbat'}</div>
                              <div className="text-[11px] text-slate-400">{t.specialty_name || '-'}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-mono font-bold text-[11px]">
                                {t.cabinet_number ? `${t.cabinet_number}-xona` : '-'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-500">
                              {t.issued_at ? new Date(t.issued_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                t.payment_status === 'PAID'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${t.payment_status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                {t.payment_status === 'PAID' ? "To'langan" : 'Kutilmoqda'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                t.status === 'COMPLETED' ? 'bg-slate-100 text-slate-700' :
                                t.status === 'IN_PROGRESS' || t.status === 'CALLED' ? 'bg-purple-100 text-purple-700' :
                                t.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {t.status === 'COMPLETED' ? 'Yakunlangan' :
                                 t.status === 'IN_PROGRESS' || t.status === 'CALLED' ? 'Qabulda' :
                                 t.status === 'CANCELLED' ? 'Bekor qilingan' : 'Kutilmoqda'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setIssuedResult({ tickets: [t] });
                                    setIsTicketModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-blue-200/60"
                                  title="Chop etish"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Chop etish</span>
                                </button>
                                {t.status !== 'CANCELLED' && t.status !== 'COMPLETED' && (
                                  <button
                                    onClick={() => handleCancelTicket(t.id)}
                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-rose-200/60"
                                    title="Bekor qilish"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                    <span>Bekor</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {visibleAllTicketsCount < filteredTickets.length && (
                      <div className="p-3 text-center border-t border-slate-100 bg-slate-50">
                        <button
                          onClick={() => setVisibleAllTicketsCount(prev => prev + 15)}
                          className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 transition shadow-xs cursor-pointer"
                        >
                          Qolgan talonlarni yuklash ({visibleAllTicketsCount} / {filteredTickets.length})
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </main>
        )}

        {/* TAB 3: TO'LOVLAR JURNALI (100% REAL FROM POSTGRESQL payments) */}
        {currentTab === 'tolovlar' && (
          <main className="p-8 flex-1 space-y-6">
            {/* Top Revenue Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500">Jami kassa tushumi</div>
                  <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
                    {totalRevenue.toLocaleString()} <span className="text-sm font-sans font-medium text-slate-400">so'm</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{allPayments.length} ta to'lov asosida</div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-emerald-700">Naqd pul tushumi</div>
                  <div className="text-xl font-black text-emerald-700 font-mono mt-1">
                    {cashRevenue.toLocaleString()} <span className="text-xs font-sans font-medium text-emerald-600/70">so'm</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {totalRevenue > 0 ? Math.round((cashRevenue / totalRevenue) * 100) : 0}% umumiy tushumdan
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Banknote className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-blue-700">Karta (Terminal)</div>
                  <div className="text-xl font-black text-blue-700 font-mono mt-1">
                    {cardRevenue.toLocaleString()} <span className="text-xs font-sans font-medium text-blue-600/70">so'm</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {totalRevenue > 0 ? Math.round((cardRevenue / totalRevenue) * 100) : 0}% umumiy tushumdan
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <CreditCard className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-purple-700">Onlayn (Click/Payme)</div>
                  <div className="text-xl font-black text-purple-700 font-mono mt-1">
                    {onlineRevenue.toLocaleString()} <span className="text-xs font-sans font-medium text-purple-600/70">so'm</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {totalRevenue > 0 ? Math.round((onlineRevenue / totalRevenue) * 100) : 0}% umumiy tushumdan
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Smartphone className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Payments Table Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-[#172B4D] flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#1677FF]" />
                    <span>To'lovlar va Kassa Jurnali</span>
                  </h2>
                  <p className="text-xs text-slate-500">PostgreSQL `payments` jadvaliga qayd etilgan barcha to'lovlar va cheklar</p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Chek №, bemor ismi, izoh..."
                      value={paymentSearch}
                      onChange={e => setPaymentSearch(e.target.value)}
                      className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium w-64 focus:outline-none focus:ring-2 focus:ring-[#1677FF]/20"
                    />
                  </div>

                  <button
                    onClick={exportPaymentsToExcel}
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Excelga eksport</span>
                  </button>

                  <button
                    onClick={loadInitialData}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 transition"
                    title="Yangilash"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Payment Method Filter Tabs */}
              <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
                {[
                  { id: 'ALL', label: 'Barchasi', count: allPayments.length },
                  { id: 'CASH', label: 'Naqd pul', count: allPayments.filter(p => p.method === 'CASH').length },
                  { id: 'CARD', label: 'Karta (Terminal)', count: allPayments.filter(p => p.method === 'CARD').length },
                  { id: 'ONLINE', label: 'Onlayn (Click/Payme)', count: allPayments.filter(p => p.method === 'TRANSFER' || p.method === 'ONLINE').length },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethodFilter(m.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      paymentMethodFilter === m.id
                        ? 'bg-[#1677FF] text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                    }`}
                  >
                    <span>{m.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      paymentMethodFilter === m.id ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                    }`}>
                      {m.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Table */}
              {(() => {
                const filteredPayments = allPayments.filter(p => {
                  if (paymentMethodFilter === 'CASH' && p.method !== 'CASH') return false;
                  if (paymentMethodFilter === 'CARD' && p.method !== 'CARD') return false;
                  if (paymentMethodFilter === 'ONLINE' && p.method !== 'TRANSFER' && p.method !== 'ONLINE') return false;
                  if (!paymentSearch) return true;
                  const q = paymentSearch.toLowerCase();
                  return (
                    p.receipt_number?.toLowerCase().includes(q) ||
                    p.id?.toLowerCase().includes(q) ||
                    p.patient_name?.toLowerCase().includes(q) ||
                    p.notes?.toLowerCase().includes(q)
                  );
                });

                if (filteredPayments.length === 0) {
                  return (
                    <div className="py-16 text-center space-y-3">
                      <div className="w-14 h-14 mx-auto rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300">
                        <CreditCard className="w-7 h-7" />
                      </div>
                      <div className="text-sm font-bold text-slate-700">To'lovlar topilmadi</div>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Qidiruv yoki filtr bo'yicha hech qanday to'lov qaydi topilmadi.
                      </p>
                    </div>
                  );
                }

                return (
                  <div
                    className="overflow-x-auto max-h-[580px] overflow-y-auto scroll-smooth rounded-2xl border border-slate-200/80 shadow-2xs"
                    onScroll={(e) => {
                      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                      if (scrollHeight - scrollTop - clientHeight < 60 && visiblePaymentsCount < filteredPayments.length) {
                        setVisiblePaymentsCount(prev => prev + 15);
                      }
                    }}
                  >
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4 bg-slate-50">Chek №</th>
                          <th className="py-3 px-4 bg-slate-50">Vaqt</th>
                          <th className="py-3 px-4 bg-slate-50">Bemor</th>
                          <th className="py-3 px-4 bg-slate-50">To'lov usuli</th>
                          <th className="py-3 px-4 bg-slate-50">Summa</th>
                          <th className="py-3 px-4 bg-slate-50">Holat</th>
                          <th className="py-3 px-4 bg-slate-50">Izoh</th>
                          <th className="py-3 px-4 text-right bg-slate-50">Chek</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredPayments.slice(0, visiblePaymentsCount).map((p: any) => (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                              <span className="px-2 py-0.5 bg-slate-100 rounded-md">
                                {p.receipt_number || p.id?.substring(0, 8)}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-500">
                              {p.created_at ? new Date(p.created_at).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-800">{p.patient_name || 'Bemor'}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                p.method === 'CASH' ? 'bg-emerald-100 text-emerald-800' :
                                p.method === 'CARD' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                              }`}>
                                {p.method === 'CASH' ? 'Naqd pul' : p.method === 'CARD' ? 'Karta (Terminal)' : 'Onlayn'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-black text-slate-900 font-mono text-sm">
                              {Number(p.amount).toLocaleString()} so‘m
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                To'langan
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{p.notes || '-'}</td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handlePrintReceipt(p)}
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
                                title="Chekni ko'rish va chop etish"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Chek</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {visiblePaymentsCount < filteredPayments.length && (
                      <div className="p-3 text-center border-t border-slate-100 bg-slate-50">
                        <button
                          onClick={() => setVisiblePaymentsCount(prev => prev + 15)}
                          className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 transition shadow-xs cursor-pointer"
                        >
                          Qolgan to'lovlarni yuklash ({visiblePaymentsCount} / {filteredPayments.length})
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </main>
        )}

        {/* TAB 4: BEMORLAR BAZASI (100% REAL FROM POSTGRESQL patients) */}
        {currentTab === 'bemorlar' && (
          <main className="p-8 flex-1 space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500">Jami bemorlar</div>
                  <div className="text-2xl font-black text-[#172B4D] font-mono mt-1">{allPatients.length} nafar</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Ro'yxatdan o'tgan barcha fuqarolar</div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-blue-600">Erkak bemorlar</div>
                  <div className="text-xl font-black text-blue-700 font-mono mt-1">
                    {allPatients.filter(p => p.gender === 'MALE').length} nafar
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {allPatients.length > 0 ? Math.round((allPatients.filter(p => p.gender === 'MALE').length / allPatients.length) * 100) : 0}% umumiy bazadan
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-rose-600">Ayol bemorlar</div>
                  <div className="text-xl font-black text-rose-700 font-mono mt-1">
                    {allPatients.filter(p => p.gender === 'FEMALE').length} nafar
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {allPatients.length > 0 ? Math.round((allPatients.filter(p => p.gender === 'FEMALE').length / allPatients.length) * 100) : 0}% umumiy bazadan
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <HeartPulse className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-emerald-600">Faol qabullar</div>
                  <div className="text-xl font-black text-emerald-700 font-mono mt-1">
                    {allTickets.filter(t => t.status === 'WAITING' || t.status === 'IN_PROGRESS').length} nafar
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Ayni paytda klinikada navbatda</div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Patients Table Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-[#172B4D] flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#1677FF]" />
                    <span>Bemorlar Bazasi (EMR)</span>
                  </h2>
                  <p className="text-xs text-slate-500">Klinika bemorlarining to'liq ro'yxati, aloqa ma'lumotlari va elektron tibbiy kartalari</p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="F.I.Sh., telefon yoki karta raqami..."
                      value={patientSearch}
                      onChange={e => setPatientSearch(e.target.value)}
                      className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium w-64 focus:outline-none focus:ring-2 focus:ring-[#1677FF]/20"
                    />
                  </div>

                  <button
                    onClick={exportPatientsToExcel}
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Excel</span>
                  </button>

                  <button
                    onClick={() => setIsNewPatientModalOpen(true)}
                    className="px-4 py-2 bg-[#1677FF] hover:bg-[#0958D9] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Yangi bemor</span>
                  </button>

                  <button
                    onClick={loadInitialData}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                    title="Yangilash"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Gender Filter Tabs */}
              <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
                {[
                  { id: 'ALL', label: 'Barcha bemorlar', count: allPatients.length },
                  { id: 'MALE', label: 'Erkaklar', count: allPatients.filter(p => p.gender === 'MALE').length },
                  { id: 'FEMALE', label: 'Ayollar', count: allPatients.filter(p => p.gender === 'FEMALE').length },
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setPatientGenderFilter(g.id as any)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      patientGenderFilter === g.id
                        ? 'bg-[#1677FF] text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                    }`}
                  >
                    <span>{g.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      patientGenderFilter === g.id ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                    }`}>
                      {g.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Patients Table */}
              {(() => {
                const filteredPatients = allPatients.filter(p => {
                  if (patientGenderFilter !== 'ALL' && p.gender !== patientGenderFilter) return false;
                  if (!patientSearch) return true;
                  const q = patientSearch.toLowerCase();
                  return (
                    p.full_name?.toLowerCase().includes(q) ||
                    p.phone?.includes(q) ||
                    p.patient_number?.toLowerCase().includes(q) ||
                    p.address?.toLowerCase().includes(q)
                  );
                });

                if (filteredPatients.length === 0) {
                  return (
                    <div className="py-16 text-center space-y-3">
                      <div className="w-14 h-14 mx-auto rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300">
                        <Users className="w-7 h-7" />
                      </div>
                      <div className="text-sm font-bold text-slate-700">Bemorlar topilmadi</div>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Qidiruv so'rovi bo'yicha hech qanday bemor ma'lumotlari topilmadi.
                      </p>
                    </div>
                  );
                }

                return (
                  <div
                    className="overflow-x-auto max-h-[580px] overflow-y-auto scroll-smooth rounded-2xl border border-slate-200/80 shadow-2xs"
                    onScroll={(e) => {
                      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                      if (scrollHeight - scrollTop - clientHeight < 60 && visiblePatientsTabCount < filteredPatients.length) {
                        setVisiblePatientsTabCount(prev => prev + 15);
                      }
                    }}
                  >
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4 bg-slate-50">Karta №</th>
                          <th className="py-3 px-4 bg-slate-50">F.I.Sh.</th>
                          <th className="py-3 px-4 bg-slate-50">Telefon</th>
                          <th className="py-3 px-4 bg-slate-50">Tug'ilgan sana / Yoshi</th>
                          <th className="py-3 px-4 bg-slate-50">Jinsi</th>
                          <th className="py-3 px-4 bg-slate-50">Manzil</th>
                          <th className="py-3 px-4 text-right bg-slate-50">Amallar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredPatients.slice(0, visiblePatientsTabCount).map((p: any) => {
                          const age = p.birth_date ? Math.floor((new Date().getTime() - new Date(p.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                                <span className="px-2.5 py-1 bg-slate-100 border border-slate-200/70 rounded-lg">
                                  #{p.patient_number || p.id?.substring(0, 6)}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-bold text-slate-800">
                                <div className="text-slate-900 font-semibold">{p.full_name}</div>
                              </td>
                              <td className="py-3.5 px-4 font-mono text-slate-600 font-medium">
                                {p.phone || '-'}
                              </td>
                              <td className="py-3.5 px-4 text-slate-600">
                                {p.birth_date ? (
                                  <div>
                                    <span className="font-mono">{p.birth_date.substring(0, 10)}</span>
                                    {age !== null && !isNaN(age) && (
                                      <span className="text-[11px] text-slate-400 ml-1.5">({age} yosh)</span>
                                    )}
                                  </div>
                                ) : '-'}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  p.gender === 'FEMALE' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}>
                                  {p.gender === 'FEMALE' ? 'Ayol' : 'Erkak'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{p.address || '-'}</td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleOpenPatientDetail(p)}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                    title="Tafsilotlar va EMR tarixi"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Tafsilot</span>
                                  </button>
                                  <button
                                    onClick={() => handleSelectPatientForAdmission(p)}
                                    className="px-3 py-1 bg-[#1677FF] hover:bg-[#0958D9] text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                                    title="Ushbu bemorga navbat olish"
                                  >
                                    <span>Qabulga</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {visiblePatientsTabCount < filteredPatients.length && (
                      <div className="p-3 text-center border-t border-slate-100 bg-slate-50">
                        <button
                          onClick={() => setVisiblePatientsTabCount(prev => prev + 15)}
                          className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 transition shadow-xs cursor-pointer"
                        >
                          Qolgan bemorlarni yuklash ({visiblePatientsTabCount} / {filteredPatients.length})
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </main>
        )}

        {/* TAB 5: HISOBOTLAR (100% REAL FROM POSTGRESQL) */}
        {currentTab === 'hisobotlar' && (
          <main className="p-8 flex-1 space-y-6">
            {/* Shift Status Banner */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>SMENA FAOL VA OCHIQ</span>
                  </div>
                  <h2 className="text-xl font-black mt-1">Kassir Kunlik Smena Hisoboti</h2>
                  <p className="text-xs text-blue-100">
                    Mas'ul kassir: <span className="font-bold text-white">{currentUser?.full_name || currentShift?.cashier_name || 'Kassir'}</span> • Sana: {dateStr}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => setIsXReportModalOpen(true)}
                    className="px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>X-Hisobot chop etish</span>
                  </button>
                  <button
                    onClick={exportPaymentsToExcel}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Excel hisoboti</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Jami talonlar soni</span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Ticket className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-[#172B4D] mt-2 font-mono">{allTickets.length} <span className="text-sm font-sans font-semibold text-slate-400">ta</span></div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Yakunlangan: {allTickets.filter(t => t.status === 'COMPLETED').length} ta
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-600">Jami kassa tushumi</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-emerald-700 mt-2 font-mono">
                  {totalRevenue.toLocaleString()} <span className="text-sm font-sans font-semibold">so‘m</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{allPayments.length} ta chek asosida</div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Naqd pul tushumi</span>
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Banknote className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-800 mt-2 font-mono">
                  {cashRevenue.toLocaleString()} <span className="text-xs font-sans font-semibold">so‘m</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Boshlang'ich qoldiq: {(Number(currentShift?.opening_balance) || 0).toLocaleString()} so'm
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-600">Karta va Onlayn</span>
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-purple-700 mt-2 font-mono">
                  {(cardRevenue + onlineRevenue).toLocaleString()} <span className="text-xs font-sans font-semibold">so‘m</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Terminal + Click/Payme</div>
              </div>
            </div>

            {/* Doctor Breakdown Table */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-[#172B4D] flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-[#1677FF]" />
                    <span>Shifokorlar Bo'yicha Tushum va Talonlar Taqsimoti</span>
                  </h3>
                  <p className="text-xs text-slate-500">Bugungi smenada qaysi mutaxassisga nechta bemor yo'naltirildi va tushum miqdori</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">№</th>
                      <th className="py-3 px-4">Shifokor</th>
                      <th className="py-3 px-4">Mutaxassislik</th>
                      <th className="py-3 px-4">Kabinet</th>
                      <th className="py-3 px-4 text-center">Talonlar soni</th>
                      <th className="py-3 px-4 text-right">Jami xizmat summasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.values(doctorRevenueStats).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                          Bugungi kunda hali shifokorlarga talon berilmagan
                        </td>
                      </tr>
                    ) : (
                      Object.values(doctorRevenueStats).map((doc: any, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-3 px-4 font-bold text-slate-800">{doc.doctorName}</td>
                          <td className="py-3 px-4 text-slate-600">{doc.specialtyName || '-'}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-700">
                            {doc.cabinetNumber ? `${doc.cabinetNumber}-kabinet` : '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold font-mono">
                              {doc.ticketCount} ta
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-black text-slate-900 font-mono text-sm">
                            {doc.revenue.toLocaleString()} so‘m
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {Object.values(doctorRevenueStats).length > 0 && (
                    <tfoot className="bg-slate-50 font-bold text-xs border-t border-slate-200">
                      <tr>
                        <td colSpan={4} className="py-3 px-4 text-slate-800 uppercase tracking-wider">JAMI:</td>
                        <td className="py-3 px-4 text-center font-mono text-blue-700">
                          {Object.values(doctorRevenueStats).reduce((acc: number, d: any) => acc + d.ticketCount, 0)} ta
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-700 font-black text-sm">
                          {Object.values(doctorRevenueStats).reduce((acc: number, d: any) => acc + d.revenue, 0).toLocaleString()} so'm
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </main>
        )}

        {/* TAB 6: SOZLAMALAR - TV TABLO TESTI VA KASSIR PROFILI */}
        {currentTab === 'sozlamalar' && (
          <main className="p-8 flex-1 space-y-6">
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* Centered Sozlamalar Navigation Menu */}
              <div className="flex flex-col items-center justify-center space-y-3 text-center">
                <div className="inline-flex items-center gap-1.5 p-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
                  <button
                    type="button"
                    onClick={() => setSettingsSubTab('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      settingsSubTab === 'all'
                        ? 'bg-medical-blue text-white shadow-md shadow-medical-blue/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Barchasi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettingsSubTab('display')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      settingsSubTab === 'display'
                        ? 'bg-medical-blue text-white shadow-md shadow-medical-blue/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>TV Tablo & Ekran</span>
                  </button>

                  {isElectron && (
                    <button
                      type="button"
                      onClick={() => setSettingsSubTab('update')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                        settingsSubTab === 'update'
                          ? 'bg-medical-blue text-white shadow-md shadow-medical-blue/20'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Dastur Yangilanishi</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSettingsSubTab('profile')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      settingsSubTab === 'profile'
                        ? 'bg-medical-blue text-white shadow-md shadow-medical-blue/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Kassir Profili & Parol</span>
                  </button>
                </div>
              </div>

              {/* BLOCK 0: ELECTRON DISPLAY & HDMI TV CHOOSER */}
              {(settingsSubTab === 'all' || settingsSubTab === 'display') && (
                <ElectronDisplaySelector onNotification={showNotification} />
              )}

              {/* BLOCK 0.5: DASTUR YANGILANISHI (FAQAT ELECTRON JS DASTURIDA) */}
              {isElectron && (settingsSubTab === 'all' || settingsSubTab === 'update') && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-medical-blue to-teal-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-medical-blue/20">
                        <Sparkles className="w-5 h-5 text-yellow-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-black text-[#172B4D]">Dastur Yangilanishi</h2>
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#1677FF] border border-blue-200 text-[10px] font-black">
                            v{APP_VERSION}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Dasturning yangi versiyasini tekshirish va avtomatik yangilash
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsUpdateModalOpen(true)}
                      className="px-5 py-2.5 bg-gradient-to-r from-medical-blue to-teal-600 hover:opacity-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-medical-blue/20 active:scale-95 cursor-pointer self-start sm:self-auto"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Yangilanishlarni tekshirish</span>
                    </button>
                  </div>
                </div>
              )}

              {/* BLOCK 1: TV TABLONI TEST QILISH (OVOZLI TEST: "Ovoz chiqishi test qilindi") */}
              {(settingsSubTab === 'all' || settingsSubTab === 'display') && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black text-[#172B4D] flex items-center gap-2">
                        <Tv className="w-5 h-5 text-[#1677FF]" />
                        <span>TV Tablo va Ovoz Tizimini Sinash</span>
                      </h2>
                      <p className="text-xs text-slate-500">
                        Katta ekrandagi TV Tabloga ovozli test xabari yuborish va dinamiklar ishlashini tekshirish
                      </p>
                    </div>

                    <a
                      href="http://localhost:3002"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
                    >
                      <span>TV Tablo (3002)</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Status banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#1677FF] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Volume2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          Ovozli xabar: <span className="text-[#1677FF] font-black">"{tvTestText || "Ovoz chiqishi test qilindi"}"</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Tabiiy sun'iy intellekt suxandoni (Microsoft Azure Neural Uzbek Voice) orqali e'lon qilinadi
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-emerald-800">TV Tablo Aloqasi Faol</span>
                    </div>
                  </div>

                  {/* Input for custom test text & action */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 block">
                      TV Tabloga yuboriladigan test so'zi:
                    </label>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <input
                        type="text"
                        value={tvTestText}
                        onChange={e => setTvTestText(e.target.value)}
                        placeholder="Ovoz chiqishi test qilindi"
                        className="w-full sm:flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1677FF]/20"
                      />

                      <button
                        type="button"
                        onClick={handleTestTvSound}
                        disabled={isTvTesting}
                        className="w-full sm:w-auto px-6 py-3 bg-[#1677FF] hover:bg-[#0958D9] disabled:bg-blue-300 text-white rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
                      >
                        <Volume2 className={`w-4 h-4 ${isTvTesting ? 'animate-bounce' : ''}`} />
                        <span>{isTvTesting ? 'Ovoz yuborilmoqda...' : 'TV Tabloda Ovozni Test Qilish'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Tugmani bosganingizda TV Tabloga real vaqt rejimida «Ovoz chiqishi test qilindi» ovozi va ekranda chaqiruv xabari yuboriladi.
                    </p>
                  </div>
                </div>
              )}

              {/* BLOCK 2: KASSIR PROFIL MA'LUMOTLARI */}
              {(settingsSubTab === 'all' || settingsSubTab === 'profile') && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg font-black text-[#172B4D] flex items-center gap-2">
                    <User className="w-5 h-5 text-[#1677FF]" />
                    <span>Kassir Profil Ma'lumotlari</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Tizimda faoliyat yuritayotgan mas'ul kassirning shaxsiy kabineti va kassa huquqlari
                  </p>
                </div>

                {/* Profile Card Header */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-sm">
                      {(currentUser?.full_name || currentUser?.fullName || 'KS').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-base font-black text-slate-900">
                        {currentUser?.full_name || currentUser?.fullName || currentShift?.cashier_name || 'Kassir'}
                      </div>
                      <div className="text-xs font-mono text-slate-500">
                        Login: @{currentUser?.username || 'kassir'} • ID: #{currentUser?.id || 'usr_cashier_01'}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#1677FF]">
                          Kassir (Qabulxona mas'uli)
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Faol xodim
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-[11px] text-slate-400 font-semibold">Biriktirilgan klinika</div>
                    <div className="text-sm font-black text-slate-800">{clinicSettings?.clinic_name || 'Klinika'}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Smena: {currentShift?.id ? 'Ochiq' : 'Faol'}</div>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl border border-slate-200/70 bg-white">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">F.I.Sh.</div>
                    <div className="text-xs font-bold text-slate-800 mt-1">
                      {currentUser?.full_name || currentUser?.fullName || currentShift?.cashier_name || '-'}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200/70 bg-white">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Telefon raqam</div>
                    <div className="text-xs font-bold text-slate-800 font-mono mt-1">{currentUser?.phone || '-'}</div>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200/70 bg-white">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tizimdagi roli</div>
                    <div className="text-xs font-bold text-[#1677FF] mt-1">{currentUser?.role || 'CASHIER'}</div>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200/70 bg-white">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Klinika manzili</div>
                    <div className="text-xs font-bold text-slate-800 mt-1 truncate">{clinicSettings?.address || '-'}</div>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200/70 bg-white">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Klinika aloqa telefoni</div>
                    <div className="text-xs font-bold text-slate-800 font-mono mt-1">{clinicSettings?.phone || '-'}</div>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200/70 bg-white">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Bugungi kassa aylanmasi</div>
                    <div className="text-xs font-bold text-emerald-700 font-mono mt-1">{totalRevenue.toLocaleString()} so'm</div>
                  </div>
                </div>

                {/* Password Change Form */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="w-4 h-4 text-slate-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Parolni o'zgartirish</h3>
                  </div>

                  <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">Yangi parol</label>
                        <input
                          type="password"
                          placeholder="Kamida 4 ta belgi"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1677FF]/20"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">Yangi parolni tasdiqlang</label>
                        <input
                          type="password"
                          placeholder="Parolni qayta kiriting"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1677FF]/20"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isUpdatingPassword ? 'Saqlanmoqda...' : 'Parolni yangilash'}</span>
                    </button>
                  </form>
                </div>
              </div>
              )}

            </div>
          </main>
        )}
      </div>

      {/* MODAL 1: TICKET ISSUED / THERMAL PRINT MODAL */}
      <TicketIssuedModal
        isOpen={isTicketModalOpen}
        tickets={issuedResult?.tickets || EMPTY_TICKETS}
        payment={issuedResult?.payment}
        initialPaperSize={printerPaperSize}
        onPaperSizeChange={handlePaperSizeChange}
        onClose={handleCloseTicketModal}
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

            <div 
              className="max-h-72 overflow-y-auto space-y-2 pr-1"
              onScroll={(e) => {
                const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                if (scrollHeight - scrollTop - clientHeight < 50 && visibleSearchPatientCount < allPatients.length) {
                  setVisibleSearchPatientCount(prev => prev + 15);
                }
              }}
            >
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
                .slice(0, visibleSearchPatientCount)
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
                className="px-4 py-2 bg-[#00B96B] hover:bg-[#009A59] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
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
              <button onClick={() => setIsXReportModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center space-y-1">
              <div className="font-black text-sm text-slate-900 uppercase">
                {clinicCustomName || clinicSettings?.clinic_name || 'KLINIKA'}
              </div>
              <div className="text-[10px] text-slate-500 font-sans">Kassir Smena Yakuniy Dalolatnomasi</div>
              <div className="text-[10px] text-slate-400">{dateStr} • {time}</div>
            </div>

            <div className="border-t border-b border-dashed border-slate-300 py-3 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600">Mas'ul Kassir:</span>
                <span className="font-bold text-slate-800">{currentUser?.full_name || currentShift?.cashier_name || 'Kassir'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Jami talonlar:</span>
                <span className="font-bold text-slate-800">{allTickets.length} ta</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Boshlang'ich kassa:</span>
                <span className="font-bold text-slate-700">{(Number(currentShift?.opening_balance) || 0).toLocaleString()} so'm</span>
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
              <div className="flex justify-between pt-2 border-t border-slate-200 font-black text-sm text-slate-900">
                <span>JAMI TUSHUM:</span>
                <span className="text-emerald-700">{totalRevenue.toLocaleString()} so'm</span>
              </div>
              <div className="flex justify-between font-black text-sm text-slate-900">
                <span>KASSADAGI NAQD PUL:</span>
                <span className="text-slate-900">{((Number(currentShift?.opening_balance) || 0) + cashRevenue).toLocaleString()} so'm</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => window.print()}
                className="w-full py-3 bg-[#1677FF] hover:bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Chop etish</span>
              </button>
              <button
                onClick={() => setIsXReportModalOpen(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-center cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: PAYMENT RECEIPT REPRINT MODAL */}
      {isReceiptModalOpen && selectedPaymentForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-dashed border-slate-300 pb-2">
              <span className="font-bold uppercase tracking-wider text-slate-800">TO'LOV CHEKI / KVITANSIYA</span>
              <button onClick={() => setIsReceiptModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center space-y-1">
              <div className="font-black text-sm text-slate-900 uppercase">
                {clinicCustomName || clinicSettings?.clinic_name || 'Sadaf Tibbiyot Klinikasi'}
              </div>
              <div className="text-[10px] text-slate-500 font-sans">
                {clinicCustomAddress || clinicSettings?.address || 'Toshkent shahri'}
              </div>
              <div className="text-[10px] text-slate-500 font-sans">
                Tel: {clinicCustomPhone || clinicSettings?.phone || '+998 71 200 00 00'}
              </div>
            </div>

            <div className="border-t border-b border-dashed border-slate-300 py-3 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600">Chek raqami:</span>
                <span className="font-bold text-slate-800">{selectedPaymentForReceipt.receipt_number || selectedPaymentForReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Sana va vaqt:</span>
                <span className="font-bold text-slate-800">
                  {selectedPaymentForReceipt.created_at ? new Date(selectedPaymentForReceipt.created_at).toLocaleString('uz-UZ') : dateStr}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Bemor:</span>
                <span className="font-bold text-slate-800">{selectedPaymentForReceipt.patient_name || 'Bemor'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">To'lov turi:</span>
                <span className="font-bold text-slate-800">
                  {selectedPaymentForReceipt.method === 'CASH' ? 'Naqd pul' :
                   selectedPaymentForReceipt.method === 'CARD' ? 'Plastik karta (Terminal)' : 'Onlayn (Click/Payme)'}
                </span>
              </div>
              {selectedPaymentForReceipt.notes && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Izoh:</span>
                  <span className="text-slate-800 font-sans text-[11px]">{selectedPaymentForReceipt.notes}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200 font-black text-sm text-slate-900">
                <span>TO'LANGAN SUMMA:</span>
                <span className="text-emerald-700">{Number(selectedPaymentForReceipt.amount).toLocaleString()} so'm</span>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-500 font-sans">
              {footerCustomNote || "Tashrifingiz uchun rahmat! Salomat bo'ling!"}
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  printThermalTicket({
                    tickets: [{
                      patient_name: selectedPaymentForReceipt.patient_name,
                      specialty_name: selectedPaymentForReceipt.notes || 'Tibbiy xizmat',
                      service_price: selectedPaymentForReceipt.amount
                    }],
                    config: {
                      clinicName: clinicCustomName || clinicSettings?.clinic_name || 'KLINIKA-ADMIN',
                      address: clinicCustomAddress || clinicSettings?.address || '',
                      phone: clinicCustomPhone || clinicSettings?.phone || '',
                      footerText: footerCustomNote || "Tashrifingiz uchun rahmat! Salomat bo'ling!"
                    },
                    mode: 'RECEIPT',
                    payment: selectedPaymentForReceipt,
                    paperSize: printerPaperSize === '58mm' ? '58mm' : '80mm'
                  });
                }}
                className="w-full py-3 bg-[#1677FF] hover:bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Chekni chop etish</span>
              </button>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-center cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: PATIENT EMR DETAIL MODAL */}
      {isPatientDetailModalOpen && selectedPatientDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-base">
                  {selectedPatientDetail.full_name?.substring(0, 2).toUpperCase() || 'EM'}
                </div>
                <div>
                  <h3 className="text-base font-black text-[#172B4D]">{selectedPatientDetail.full_name}</h3>
                  <p className="text-xs text-slate-400">
                    Elektron tibbiy karta №: #{selectedPatientDetail.patient_number || selectedPatientDetail.id?.substring(0, 8)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPatientDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
                <div className="text-[11px] text-slate-500 font-semibold">Telefon</div>
                <div className="text-xs font-bold text-slate-800 font-mono mt-0.5">{selectedPatientDetail.phone || '-'}</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
                <div className="text-[11px] text-slate-500 font-semibold">Tug'ilgan sana</div>
                <div className="text-xs font-bold text-slate-800 font-mono mt-0.5">
                  {selectedPatientDetail.birth_date ? selectedPatientDetail.birth_date.substring(0, 10) : '-'}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
                <div className="text-[11px] text-slate-500 font-semibold">Jinsi</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">
                  {selectedPatientDetail.gender === 'FEMALE' ? 'Ayol' : 'Erkak'}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
                <div className="text-[11px] text-slate-500 font-semibold">Tashriflar soni</div>
                <div className="text-xs font-bold text-blue-600 font-mono mt-0.5">
                  {selectedPatientDetail.tickets?.length || allTickets.filter(t => t.patient_id === selectedPatientDetail.id).length} ta
                </div>
              </div>
            </div>

            {/* Address */}
            {selectedPatientDetail.address && (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Manzil: </span>
                  {selectedPatientDetail.address}
                </div>
              </div>
            )}

            {/* Patient Visit / Ticket History */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-[#1677FF]" />
                <span>Klinikaga Tashriflar va Talonlar Tarixi</span>
              </h4>

              {patientDetailLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">Ma'lumotlar yuklanmoqda...</div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {(() => {
                    const patientTickets = selectedPatientDetail.tickets?.length > 0
                      ? selectedPatientDetail.tickets
                      : allTickets.filter(t => t.patient_id === selectedPatientDetail.id || t.patient_name === selectedPatientDetail.full_name);

                    if (!patientTickets || patientTickets.length === 0) {
                      return (
                        <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                          Ushbu bemorda hali navbat talonlari qayd etilmagan
                        </div>
                      );
                    }

                    return patientTickets.map((t: any) => (
                      <div key={t.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-xs px-2.5 py-1 bg-blue-50 text-[#1677FF] rounded-lg">
                            {t.full_number || t.ticket_number}
                          </span>
                          <div>
                            <div className="font-bold text-slate-800">{t.doctor_name || 'Umumiy shifokor'}</div>
                            <div className="text-[11px] text-slate-400">{t.specialty_name || '-'} • {t.cabinet_number ? `${t.cabinet_number}-kabinet` : ''}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                            t.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {t.status === 'COMPLETED' ? 'Yakunlangan' : t.status === 'CANCELLED' ? 'Bekor qilingan' : 'Kutilmoqda'}
                          </span>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {t.issued_at ? new Date(t.issued_at).toLocaleDateString('uz-UZ') : ''}
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsPatientDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Yopish
              </button>

              <button
                type="button"
                onClick={() => handleSelectPatientForAdmission(selectedPatientDetail)}
                className="px-5 py-2.5 bg-[#1677FF] hover:bg-[#0958D9] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Yangi talon berish (Qabulga)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* App Update Modal */}
      <AppUpdateModal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} />
    </div>
  );
};
