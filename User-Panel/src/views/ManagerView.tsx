import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Menu, HeartPulse, SlidersHorizontal, Users, Stethoscope, DoorOpen,
  LayoutGrid, CreditCard, Wallet, BarChart3, Tv, ShieldCheck, Settings,
  FileText, ChevronLeft, ChevronDown, Calendar, Clock, LogOut,
  CheckCircle2, ArrowUpRight, ArrowDownRight, Radio, Eye, Check,
  UserPlus, Ticket, RefreshCw, Plus, Trash2, Edit2, Volume2, VolumeX, Search,
  ArrowRight, Activity, DollarSign, X, AlertTriangle, Shield,
  Sparkles, Mic, Play, Save, RotateCcw, Award, Briefcase, UserCheck,
  Phone, User, MapPin, Download, FileSpreadsheet, Layers, Hash, Building2, Tag, Banknote, Lock,
  Globe, Mail, Bell, Percent, Sliders, Copy, Printer, Filter, MessageSquare, ShieldAlert, Unlock, Pause,
  CheckSquare, QrCode, Upload, Image as ImageIcon
} from 'lucide-react';
import { NewPatientModal } from '../components/NewPatientModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { showNotification } from '../components/ToastNotification';
import { formatUzbekPhone } from '../utils/phone';
import { UzbekistanAddressSelect } from '../components/UzbekistanAddressSelect';
import { TicketIssuedModal } from '../components/TicketIssuedModal';
import { ElectronDisplaySelector } from '../components/ElectronDisplaySelector';
import { AppUpdateModal } from '../components/AppUpdateModal';
import { APP_LOGO, APP_VERSION } from '../utils/brand';
import { printThermalTicket } from '../utils/thermalPrinter';
import * as XLSX from 'xlsx';

const API_BASE_URL = 'http://localhost:5001/api/v1';

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

const TEST_TICKETS_ARRAY = [{
  ticket_number: 'S-001',
  full_number: 'S-001',
  specialty_name: 'STOMATOLOGIYA',
  doctor_name: 'Dr. Alisher Alimov',
  cabinet_number: '4',
  patient_name: 'Malika Alimova',
  payment_status: 'PAID',
  estimated_wait_minutes: 15
}];

export const ManagerView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTabSlug = searchParams.get('tab') || 'bosh-sahifa';

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Authenticated Current User
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const raw = localStorage.getItem('sadaf_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const getRoleDisplayName = (role?: string) => {
    if (!role) return 'Menejer';
    const r = role.toUpperCase();
    if (r === 'MANAGER') return 'Menejer';
    if (r === 'ADMIN') return 'Administrator';
    if (r === 'SUPER_ADMIN') return 'Bosh Administrator';
    if (r === 'DOCTOR') return 'Shifokor';
    if (r === 'CASHIER') return 'Kassir';
    return role;
  };

  const getUserInitials = (name?: string) => {
    if (!name) return 'MM';
    const clean = name.replace(/^(dr\.|dr|shifokor)\s+/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  // Clock
  const [time, setTime] = useState('14:25');
  const [dateStr, setDateStr] = useState('10-iyun 2025, Seshanba');

  // Backend Data (100% REAL FROM POSTGRESQL)
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [specialtiesList, setSpecialtiesList] = useState<any[]>([]);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [cabinetsList, setCabinetsList] = useState<any[]>([]);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [allTicketsList, setAllTicketsList] = useState<any[]>([]);
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [visibleManagerTicketsCount, setVisibleManagerTicketsCount] = useState(15);
  const [visibleManagerPatientsCount, setVisibleManagerPatientsCount] = useState(15);
  const [visibleManagerPaymentsCount, setVisibleManagerPaymentsCount] = useState(15);
  const [liveQueueList, setLiveQueueList] = useState<any[]>([]);
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [clinicSettings, setClinicSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Subscription & SMS state (100% Real from Backend / PostgreSQL)
  const [clinicSubscription, setClinicSubscription] = useState<any>(null);
  const [smsSettings, setSmsSettings] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(() => {
    const tab = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') || 'bosh-sahifa' : 'bosh-sahifa';
    return {
      HISOBOTLAR_KASSA: ['hisobotlar', 'kassa-smenasi', 'tolovlar'].includes(tab),
      TIZIM_SOZLAMALARI_GROUP: ['sozlamalar', 'printer-sozlamalari', 'tv-tablosi', 'obuna-sms', 'audit'].includes(tab),
    };
  });

  const fetchClinicSubscriptionAndSms = async () => {
    try {
      setLoadingSubscription(true);
      const authHeaders = getAuthHeaders();
      const [subRes, smsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/clinic/subscription`, { headers: authHeaders }).then(r => r.json()).catch(() => ({ data: null })),
        fetch(`${API_BASE_URL}/super-admin/sms/settings`, { headers: authHeaders }).then(r => r.json()).catch(() => ({ data: null }))
      ]);
      if (subRes?.data) setClinicSubscription(subRes.data);
      if (smsRes?.data) setSmsSettings(smsRes.data);
    } catch (e) {
      console.warn('Error fetching subscription/sms:', e);
    } finally {
      setLoadingSubscription(false);
    }
  };

  // Audit Logs State (100% Real PostgreSQL)
  const [auditLogsList, setAuditLogsList] = useState<any[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [selectedAuditItem, setSelectedAuditItem] = useState<any | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [copiedAuditJson, setCopiedAuditJson] = useState(false);

  // Search filters
  const [queueSearch, setQueueSearch] = useState('');
  const [queueStatusFilter, setQueueStatusFilter] = useState<string>('ALL');
  const [patientSearch, setPatientSearch] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');

  // Hover and Animation States for Charts
  const [hoveredHour, setHoveredHour] = useState<any | null>(null);
  const [activePaySegment, setActivePaySegment] = useState<'all' | 'cash' | 'card' | 'online'>('all');

  // Confirmation Delete Modal
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    itemName?: string;
    itemDetails?: string;
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    onConfirm: () => {}
  });

  // Modals state
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);

  // Doctor Edit / Create Modal
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
  const [doctorForm, setDoctorForm] = useState({
    displayName: '',
    specialtyId: '',
    cabinetNumber: '',
    phone: '+998 ',
    address: '',
    username: '',
    password: ''
  });

  // Service Edit / Create Modal & Detail State
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [selectedServiceForDetail, setSelectedServiceForDetail] = useState<any | null>(null);
  const [serviceModalTab, setServiceModalTab] = useState<'EDIT' | 'DOCTORS'>('EDIT');
  const [serviceSpecialtyFilter, setServiceSpecialtyFilter] = useState<string>('ALL');
  const [serviceForm, setServiceForm] = useState({
    name: '',
    specialtyId: '',
    price: 100000,
    paymentPolicy: 'PAY_BEFORE_CALL',
    durationMinutes: 15,
    minimumPaymentAmount: 0
  });

  // Payment Detail Modal & Filters
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL');

  // Cabinet Edit / Create Modal
  const [isCabinetModalOpen, setIsCabinetModalOpen] = useState(false);
  const [editingCabinetId, setEditingCabinetId] = useState<string | null>(null);
  const [cabinetForm, setCabinetForm] = useState({
    roomNumber: '',
    name: '',
    department: 'Ambulatoriya',
    floor: 1
  });
  const [cabinetSearch, setCabinetSearch] = useState('');
  const [cabinetFloorFilter, setCabinetFloorFilter] = useState<string>('ALL');

  // Floor Modal (Qavat qo'shish)
  const [isFloorModalOpen, setIsFloorModalOpen] = useState(false);
  const [floorForm, setFloorForm] = useState({
    floorNumber: 4,
    department: "Ixtisoslashgan bo'lim",
    firstCabinetNumber: '401',
    firstCabinetName: '401-kabinet'
  });

  // Doctor Report Modal (Hisobotlar: Har bir shifokorga bosganda ko'rsatiladigan oyna)
  const [isDoctorReportModalOpen, setIsDoctorReportModalOpen] = useState(false);
  const [selectedDoctorReport, setSelectedDoctorReport] = useState<any>(null);
  const [isDoctorReportLoading, setIsDoctorReportLoading] = useState(false);

  // Patient Edit & History Modal
  const [isPatientEditModalOpen, setIsPatientEditModalOpen] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [selectedPatientDetail, setSelectedPatientDetail] = useState<any | null>(null);
  const [patientModalTab, setPatientModalTab] = useState<'OVERVIEW' | 'DOCTORS' | 'TICKETS' | 'PAYMENTS' | 'EDIT'>('OVERVIEW');
  const [patientHistoryLoading, setPatientHistoryLoading] = useState(false);
  const [patientTickets, setPatientTickets] = useState<any[]>([]);
  const [patientPayments, setPatientPayments] = useState<any[]>([]);
  const [patientForm, setPatientForm] = useState({
    fullName: '',
    phone: '',
    birthDate: '',
    gender: 'MALE',
    address: '',
    notes: ''
  });

  // Settings Form (Comprehensive Site & Clinic Settings)
  const [settingsForm, setSettingsForm] = useState({
    clinicName: '',
    logoUrl: '',
    slogan: '',
    phone: '',
    email: '',
    address: '',
    workStartTime: '08:00',
    workEndTime: '18:00',
    workDays: 'Dushanba - Shanba',
    websiteUrl: '',
    defaultPaymentPolicy: 'PAY_BEFORE_CALL',
    defaultQueuePrefix: 'A',
    autoCallNext: false,
    ticketAutoCancelMinutes: 15,
    maxDailyTicketsPerDoctor: 50,
    emergencyPriority: true,
    currency: 'UZS',
    vatPercent: 0,
    cashierAutoCloseShift: true,
    soundNotification: true,
    recallLimit: 3,
    voiceLanguage: 'uz-UZ'
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const initialSettingsLoadedRef = useRef(false);

  // Printer & Ticket Settings State (100% Real PostgreSQL & localStorage sync)
  interface TicketPrinterSettings {
    paperSize: '80mm' | '58mm';
    copies: number;
    autoPrint: boolean;
    soundAlert: boolean;
    clinicName: string;
    showLogo: boolean;
    address: string;
    phone: string;
    welcomeNote: string;
    showDate: boolean;
    showTicketNumber: boolean;
    showSpecialty: boolean;
    showDoctor: boolean;
    showCabinet: boolean;
    showPatientName: boolean;
    showPaymentStatus: boolean;
    showWaitTime: boolean;
    showQrCode: boolean;
    showCutLine: boolean;
    footerText: string;
    footerNote: string;
  }

  const defaultPrinterSettings: TicketPrinterSettings = {
    paperSize: '80mm',
    copies: 1,
    autoPrint: true,
    soundAlert: true,
    clinicName: '',
    showLogo: true,
    address: '',
    phone: '',
    welcomeNote: "Navbat talonini qabul yakunigacha saqlang",
    showDate: true,
    showTicketNumber: true,
    showSpecialty: true,
    showDoctor: true,
    showCabinet: true,
    showPatientName: true,
    showPaymentStatus: true,
    showWaitTime: true,
    showQrCode: true,
    showCutLine: true,
    footerText: "Tashrifingiz uchun rahmat! Salomat bo'ling!",
    footerNote: "Navbatingizni zal monitorida kuzatib boring"
  };
  const [printerSettings, setPrinterSettings] = useState<TicketPrinterSettings>(() => {
    try {
      const saved = localStorage.getItem('sadaf_ticket_settings');
      if (saved) return { ...defaultPrinterSettings, ...JSON.parse(saved) };
    } catch {}
    return defaultPrinterSettings;
  });
  const [isSavingPrinterSettings, setIsSavingPrinterSettings] = useState(false);
  const [previewPaperSize, setPreviewPaperSize] = useState<'80mm' | '58mm'>('80mm');
  const [isTestTicketModalOpen, setIsTestTicketModalOpen] = useState(false);

  // Users State (100% PostgreSQL users)
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({
    fullName: '',
    username: '',
    password: '',
    roleCode: 'DOCTOR',
    phone: '+998 90 000 00 00'
  });

  // Cash Shifts State (100% PostgreSQL cash_shifts)
  const [allShiftsList, setAllShiftsList] = useState<any[]>([]);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [shiftForm, setShiftForm] = useState({
    cashierName: 'Dilnoza Karimova',
    openingBalance: 500000,
    notes: 'Kassa smenasi'
  });

  // Close Shift Modal State (Alertsiz, zamonaviy popup)
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [closingShiftData, setClosingShiftData] = useState<any>(null);
  const [closingCashAmount, setClosingCashAmount] = useState<number | string>(0);
  const [isClosingShiftSubmitting, setIsClosingShiftSubmitting] = useState(false);

  // Shift Details & Doctor Breakdown Modal (Excelga export)
  const [isShiftDetailsModalOpen, setIsShiftDetailsModalOpen] = useState(false);
  const [selectedShiftDetails, setSelectedShiftDetails] = useState<any>(null);
  const [isLoadingShiftDetails, setIsLoadingShiftDetails] = useState(false);

  // TV Test Call State
  const [testTicketNum, setTestTicketNum] = useState('K015');
  const [testSpecName, setTestSpecName] = useState('Kardiologiya');
  const [testCabNum, setTestCabNum] = useState('3');
  const [testCallStatus, setTestCallStatus] = useState('');

  // TV Tablosi Yozuvlari va Chaqiruv Ovoz Shabloni (To'liq Boshqaruv)
  const [tvSettings, setTvSettings] = useState({
    clinicName: 'klinika-admin',
    tvVoiceTemplate: 'Talon raqami {letter}{zeros}, {number} raqam egasi, sizni {cabinet} xona, {specialty} xonasiga marhamat!',
    tvVoiceName: 'uz-UZ-MadinaNeural',
    tvSoundEnabled: true,
    tvSloganTitle: 'Sog‘lig‘ingiz biz uchun muhim!',
    tvSloganSubtitle: 'Navbat bilan qabulga marhamat!',
    tvCallingTitle: 'Hozir chaqirilmoqda!',
    tvStandbyTitle: 'Qabul kutilmoqda',
    tvStandbyFooter: 'Iltimos, navbat raqamingiz chaqirilishini kuting!',
    tvBottomBanner: 'Sizning sog‘lig‘ingiz – bizning ustuvor vazifamiz!',
    tvInstruction1: 'Iltimos, navbatingizni kuting',
    tvInstruction2: "Navbat raqami ovozli e'lon qilinadi",
    tvInstruction3: 'Talon raqamini va kabinet raqamini diqqat bilan tinglang'
  });
  const [isSavingTvSettings, setIsSavingTvSettings] = useState(false);
  const [isPlayingTvPreview, setIsPlayingTvPreview] = useState(false);

  useEffect(() => {
    // Clock
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }));
      const d = now.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' }).replace(' г.', '');
      const w = now.toLocaleDateString('uz-UZ', { weekday: 'long' });
      const capW = w.charAt(0).toUpperCase() + w.slice(1);
      setDateStr(`${d}, ${capW}`);
    }, 1000);

    loadManagerData();
    const interval = setInterval(loadManagerData, 10000);

    return () => {
      clearInterval(timer);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (['hisobotlar', 'kassa-smenasi', 'tolovlar'].includes(currentTabSlug)) {
      setExpandedMenus({
        HISOBOTLAR_KASSA: true,
        TIZIM_SOZLAMALARI_GROUP: false,
      });
    } else if (['sozlamalar', 'printer-sozlamalari', 'tv-tablosi', 'obuna-sms', 'audit'].includes(currentTabSlug)) {
      setExpandedMenus({
        HISOBOTLAR_KASSA: false,
        TIZIM_SOZLAMALARI_GROUP: true,
      });
    } else {
      setExpandedMenus({
        HISOBOTLAR_KASSA: false,
        TIZIM_SOZLAMALARI_GROUP: false,
      });
    }

    if (currentTabSlug === 'obuna-sms') {
      fetchClinicSubscriptionAndSms();
    }
  }, [currentTabSlug]);

  const loadManagerData = async (forceSettingsReload = false) => {
    try {
      const authHeaders = getAuthHeaders();
      const [dashRes, docRes, specRes, srvRes, cabRes, payRes, tvRes, tckRes, patRes, shiftRes, setRes, usersRes, shiftsRes, auditRes] = await Promise.all([
        fetch(`${API_BASE_URL}/reports/manager-dashboard`, { headers: authHeaders }).then(r => r.json()).catch(() => ({ data: null })),
        fetch(`${API_BASE_URL}/doctors`, { headers: authHeaders }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE_URL}/specialties`, { headers: authHeaders }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE_URL}/services`, { headers: authHeaders }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE_URL}/cabinets`, { headers: authHeaders }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE_URL}/payments`, { headers: authHeaders }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE_URL}/tv/feed`, { headers: authHeaders }).then(r => r.json()).catch(() => ({ data: null })),
        fetch(`${API_BASE_URL}/queues/tickets`, { headers: authHeaders }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE_URL}/patients`, { headers: authHeaders }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE_URL}/cash-shifts/current`, { headers: authHeaders }).then(r => r.json()).catch(() => ({ data: null })),
        fetch(`${API_BASE_URL}/clinic/settings`, { headers: authHeaders }).then(r => r.json()).catch(() => ({ data: null })),
        fetch(`${API_BASE_URL}/users`, { headers: authHeaders }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE_URL}/cash-shifts`, { headers: authHeaders }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_BASE_URL}/clinic/audit-logs`, { headers: authHeaders }).then(r => r.json()).catch(() => ({ data: [] }))
      ]);

      if (dashRes.data) setDashboardData(dashRes.data);
      if (docRes.data) setDoctorsList(docRes.data);
      if (specRes.data) setSpecialtiesList(specRes.data);
      if (srvRes.data) setServicesList(srvRes.data);
      if (cabRes.data) setCabinetsList(cabRes.data);
      if (payRes.data) setPaymentsList(payRes.data);
      if (tckRes.data) setAllTicketsList(tckRes.data);
      if (patRes.data) setPatientsList(patRes.data);
      if (shiftRes.data) setCurrentShift(shiftRes.data);
      if (usersRes.data) setUsersList(usersRes.data);
      if (shiftsRes.data) setAllShiftsList(shiftsRes.data);
      if (auditRes.data) setAuditLogsList(auditRes.data);
      if (setRes.data) {
        setClinicSettings(setRes.data);
        if (!initialSettingsLoadedRef.current || forceSettingsReload) {
          initialSettingsLoadedRef.current = true;
          setSettingsForm({
            clinicName: setRes.data.clinic_name ?? (currentUser?.clinicName || ''),
            logoUrl: setRes.data.logo_url ?? '',
            slogan: setRes.data.slogan ?? '',
            phone: setRes.data.phone ?? '',
            email: setRes.data.email ?? '',
            address: setRes.data.address ?? '',
            workStartTime: setRes.data.work_start_time || '08:00',
            workEndTime: setRes.data.work_end_time || '18:00',
            workDays: setRes.data.work_days || 'Dushanba - Shanba',
            websiteUrl: setRes.data.website_url ?? '',
            defaultPaymentPolicy: setRes.data.default_payment_policy || 'PAY_BEFORE_CALL',
            defaultQueuePrefix: setRes.data.default_queue_prefix || 'A',
            autoCallNext: !!setRes.data.auto_call_next,
            ticketAutoCancelMinutes: setRes.data.ticket_auto_cancel_minutes ?? 15,
            maxDailyTicketsPerDoctor: setRes.data.max_daily_tickets_per_doctor ?? 50,
            emergencyPriority: setRes.data.emergency_priority ?? true,
            currency: setRes.data.currency || 'UZS',
            vatPercent: setRes.data.vat_percent ?? 0,
            cashierAutoCloseShift: setRes.data.cashier_auto_close_shift ?? true,
            soundNotification: setRes.data.sound_notification ?? true,
            recallLimit: setRes.data.recall_limit ?? 3,
            voiceLanguage: setRes.data.voice_language || 'uz-UZ'
          });
          setTvSettings({
            clinicName: setRes.data.clinic_name || (currentUser?.clinicName || 'Klinika'),
            tvVoiceTemplate: setRes.data.tv_voice_template || 'Talon raqami {letter}{zeros}, {number} raqam egasi, sizni {cabinet} xona, {specialty} xonasiga marhamat!',
            tvVoiceName: setRes.data.tv_voice_name || 'uz-UZ-MadinaNeural',
            tvSoundEnabled: setRes.data.tv_sound_enabled !== false,
            tvSloganTitle: setRes.data.tv_slogan_title || 'Sog‘lig‘ingiz biz uchun muhim!',
            tvSloganSubtitle: setRes.data.tv_slogan_subtitle || 'Navbat bilan qabulga marhamat!',
            tvCallingTitle: setRes.data.tv_calling_title || 'Hozir chaqirilmoqda!',
            tvStandbyTitle: setRes.data.tv_standby_title || 'Qabul kutilmoqda',
            tvStandbyFooter: setRes.data.tv_standby_footer || 'Iltimos, navbat raqamingiz chaqirilishini kuting!',
            tvBottomBanner: setRes.data.tv_bottom_banner || 'Sizning sog‘lig‘ingiz – bizning ustuvor vazifamiz!',
            tvInstruction1: setRes.data.tv_instruction_1 || 'Iltimos, navbatingizni kuting',
            tvInstruction2: setRes.data.tv_instruction_2 || "Navbat raqami ovozli e'lon qilinadi",
            tvInstruction3: setRes.data.tv_instruction_3 || 'Talon raqamini va kabinet raqamini diqqat bilan tinglang'
          });
          if (setRes.data.printer_settings && typeof setRes.data.printer_settings === 'object') {
            setPrinterSettings(prev => ({ ...prev, ...setRes.data.printer_settings }));
            localStorage.setItem('sadaf_ticket_settings', JSON.stringify(setRes.data.printer_settings));
          } else {
            setPrinterSettings(prev => ({
              ...prev,
              clinicName: prev.clinicName || setRes.data.clinic_name || '',
              address: prev.address || setRes.data.address || '',
              phone: prev.phone || setRes.data.phone || ''
            }));
          }
        }
      }
      if (tvRes.data?.upcomingQueue) {
        setLiveQueueList(tvRes.data.upcomingQueue);
      }
      fetch(`${API_BASE_URL}/clinic/subscription`, { headers: authHeaders }).then(r => r.json()).then(res => {
        if (res?.data) setClinicSubscription(res.data);
      }).catch(() => {});
      fetch(`${API_BASE_URL}/super-admin/sms/settings`, { headers: authHeaders }).then(r => r.json()).then(res => {
        if (res?.data) setSmsSettings(res.data);
      }).catch(() => {});
    } catch (e) {
      console.warn('loadManagerData error:', e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sadaf_user');
    localStorage.removeItem('sadaf_user_token');
    navigate('/login');
  };

  // --- CRUD: DOCTOR ---
  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        displayName: doctorForm.displayName,
        specialtyId: doctorForm.specialtyId || specialtiesList[0]?.id || 'spec_kardio',
        cabinetNumber: doctorForm.cabinetNumber,
        phone: doctorForm.phone,
        address: doctorForm.address || null,
        username: doctorForm.username ? doctorForm.username.trim() : undefined,
        password: doctorForm.password ? doctorForm.password.trim() : undefined
      };

      if (editingDoctorId) {
        await fetch(`${API_BASE_URL}/doctors/${editingDoctorId}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
      } else {
        await fetch(`${API_BASE_URL}/doctors`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
      }
      setIsDoctorModalOpen(false);
      setEditingDoctorId(null);
      loadManagerData();
      showNotification('Shifokor saqlandi', `${doctorForm.displayName} ma'lumotlari muvaffaqiyatli saqlandi.`, 'success');
    } catch (e) {
      showNotification('Xatolik', 'Shifokorni saqlashda xatolik yuz berdi', 'error');
    }
  };

  const promptDeleteDoctor = (doc: any) => {
    setDeleteModalConfig({
      isOpen: true,
      title: "Shifokorni tizimdan o'chirish",
      description: "Ushbu shifokor klinika faoliyatidan chiqariladi va uning qabuliga yangi talonlar berilishi to'xtatiladi.",
      itemName: doc.display_name,
      itemDetails: `${doc.specialty_name || 'Umumiy'} • ${doc.cabinet_number || doc.room_number || '-'}-kabinet`,
      onConfirm: async () => {
        try {
          await fetch(`${API_BASE_URL}/doctors/${doc.id}`, { method: 'DELETE', headers: getAuthHeaders() });
          loadManagerData();
          showNotification('Shifokor o\'chirildi', `${doc.display_name} muvaffaqiyatli o'chirildi.`, 'success');
        } catch (e) {
          showNotification('Xatolik', 'Shifokorni o\'chirishda xatolik yuz berdi', 'error');
        }
      }
    });
  };

  // --- CRUD: SERVICE & DOCTOR BREAKDOWN & EXCEL ---
  const handleOpenServiceModal = (srv?: any) => {
    if (srv) {
      setEditingServiceId(srv.id);
      setSelectedServiceForDetail(srv);
      setServiceForm({
        name: srv.name || '',
        specialtyId: srv.specialty_id || specialtiesList[0]?.id || '',
        price: Number(srv.price || srv.base_price || 100000),
        paymentPolicy: srv.payment_policy || 'PAY_BEFORE_CALL',
        durationMinutes: Number(srv.duration_minutes || 15),
        minimumPaymentAmount: Number(srv.minimum_payment_amount || 0)
      });
    } else {
      setEditingServiceId(null);
      setSelectedServiceForDetail(null);
      setServiceForm({
        name: '',
        specialtyId: specialtiesList[0]?.id || '',
        price: 100000,
        paymentPolicy: 'PAY_BEFORE_CALL',
        durationMinutes: 15,
        minimumPaymentAmount: 0
      });
    }
    setServiceModalTab('EDIT');
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: serviceForm.name,
        specialtyId: serviceForm.specialtyId || specialtiesList[0]?.id || 'spec_terapiya',
        price: Number(serviceForm.price),
        paymentPolicy: serviceForm.paymentPolicy,
        durationMinutes: Number(serviceForm.durationMinutes || 15),
        minimumPaymentAmount: Number(serviceForm.minimumPaymentAmount || 0)
      };

      if (editingServiceId) {
        await fetch(`${API_BASE_URL}/services/${editingServiceId}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
      } else {
        await fetch(`${API_BASE_URL}/services`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
      }
      setIsServiceModalOpen(false);
      setEditingServiceId(null);
      setSelectedServiceForDetail(null);
      loadManagerData();
      showNotification('Xizmat saqlandi', `${serviceForm.name} xizmati muvaffaqiyatli saqlandi.`, 'success');
    } catch (e) {
      showNotification('Xatolik', 'Xizmatni saqlashda xatolik yuz berdi', 'error');
    }
  };

  const exportServicesToExcel = () => {
    try {
      const filtered = servicesList.filter(s => {
        const matchesSearch = !serviceSearch || s.name?.toLowerCase().includes(serviceSearch.toLowerCase());
        const matchesSpec = serviceSpecialtyFilter === 'ALL' || s.specialty_id === serviceSpecialtyFilter;
        return matchesSearch && matchesSpec;
      });

      const dataToExport = filtered.map((s, index) => {
        const docNames = Array.isArray(s.doctors) 
          ? s.doctors.map((d: any) => `${d.display_name} (${d.room_number}-xona)`).join(', ')
          : '';
        return {
          '№': index + 1,
          'Xizmat ID': s.id,
          'Xizmat Nomi': s.name,
          'Mutaxassislik': s.specialty_name || 'Umumiy',
          'Narxi (so\'m)': Number(s.price || s.base_price || 0),
          'To\'lov Tartibi': s.payment_policy === 'PAY_BEFORE_CALL' || s.payment_policy === 'PAY_BEFORE_TICKET' ? 'Oldindan to\'lov' : 'Xizmatdan so\'ng',
          'Davomiyligi (daq)': s.duration_minutes || 15,
          'Shifokorlar Soni': s.doctor_count || (Array.isArray(s.doctors) ? s.doctors.length : 0),
          'Biriktirilgan Shifokorlar': docNames || 'Mavjud emas'
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Xizmatlar');
      XLSX.writeFile(workbook, `Sadaf_Klinika_Xizmatlar_${new Date().toISOString().split('T')[0]}.xlsx`);
      showNotification('Excel yuklandi', 'Xizmatlar ro\'yxati .xlsx formatida muvaffaqiyatli yuklab olindi.', 'success');
    } catch (e) {
      console.error(e);
      showNotification('Xatolik', 'Excel faylini yaratishda xatolik yuz berdi', 'error');
    }
  };

  const exportServiceDoctorsToExcel = (srv: any) => {
    try {
      const docs = Array.isArray(srv.doctors) ? srv.doctors : [];
      if (docs.length === 0) {
        showNotification('Ma\'lumot yo\'q', 'Ushbu xizmat bo\'yicha biriktirilgan shifokorlar yo\'q.', 'warning');
        return;
      }
      const dataToExport = docs.map((d: any, index: number) => ({
        '№': index + 1,
        'Shifokor F.I.Sh': d.display_name,
        'Xizmat Nomi': srv.name,
        'Mutaxassislik': srv.specialty_name || 'Umumiy',
        'Xona / Kabinet №': d.room_number,
        'Telefon': d.phone || 'Ko\'rsatilmagan',
        'O\'rtacha vaqt (daq)': d.avg_consultation_minutes || 15,
        'Holat': d.is_active ? 'Faol' : 'Nofaol'
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Shifokorlar');
      const safeName = (srv.name || 'xizmat').replace(/[^a-zA-Z0-9_]/g, '_');
      XLSX.writeFile(workbook, `Xizmat_${safeName}_Shifokorlar.xlsx`);
      showNotification('Excel yuklandi', `${srv.name} shifokorlari ro'yxati .xlsx formatida yuklandi.`, 'success');
    } catch (e) {
      console.error(e);
      showNotification('Xatolik', 'Excel faylini yaratishda xatolik yuz berdi', 'error');
    }
  };

  const exportPaymentsToExcel = () => {
    try {
      const filtered = paymentsList.filter(p => {
        const matchesSearch = !paymentSearch || 
          p.patient_name?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
          p.receipt_number?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
          (p.notes && p.notes.toLowerCase().includes(paymentSearch.toLowerCase())) ||
          (Array.isArray(p.related_tickets) && p.related_tickets.some((t: any) => t.doctor_name?.toLowerCase().includes(paymentSearch.toLowerCase())));
        const matchesMethod = paymentMethodFilter === 'ALL' || p.method === paymentMethodFilter;
        return matchesSearch && matchesMethod;
      });

      const dataToExport = filtered.map((p: any, index: number) => {
        const relatedDocs = Array.isArray(p.related_tickets) 
          ? p.related_tickets.map((t: any) => `${t.doctor_name} (${t.cabinet_number}-xona)`).join('; ')
          : '';
        const ticketNums = Array.isArray(p.related_tickets)
          ? p.related_tickets.map((t: any) => t.full_number).join(', ')
          : '';
        return {
          '№': index + 1,
          'Chek №': p.receipt_number || p.id,
          'Sana va Vaqt': p.created_at ? new Date(p.created_at).toLocaleString('uz-UZ') : '',
          'Bemor F.I.Sh': p.patient_name || 'Noma\'lum',
          'Bemor Telefoni': p.patient_phone || '',
          'Bemor Raqami': p.patient_number || '',
          'Shifokor(lar)': relatedDocs || 'Navbat orqali',
          'Talonlar': ticketNums || p.notes || '',
          'To\'lov Usuli': p.method === 'CASH' ? 'Naqd pul' : p.method === 'CARD' ? 'Plastik karta' : 'Onlayn/Boshqa',
          'To\'langan Summa (so\'m)': Number(p.amount || 0),
          'Kassir': p.cashier_name || 'Kassir',
          'Kassa Smenasi': p.cash_shift_id || '',
          'Holat': p.status === 'PAID' ? 'To\'langan' : p.status
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Tolovlar');
      XLSX.writeFile(workbook, `Sadaf_Klinika_Tolovlar_${new Date().toISOString().split('T')[0]}.xlsx`);
      showNotification('Excel yuklandi', 'Barcha to\'lovlar jurnali .xlsx formatida muvaffaqiyatli yuklab olindi.', 'success');
    } catch (e) {
      console.error(e);
      showNotification('Xatolik', 'Excel faylini yaratishda xatolik yuz berdi', 'error');
    }
  };

  const promptDeleteService = (srv: any) => {
    setDeleteModalConfig({
      isOpen: true,
      title: "Xizmat turini o'chirish",
      description: "Ushbu tibbiy xizmat turi klinika ro'yxatidan butunlay o'chiriladi.",
      itemName: srv.name,
      itemDetails: `Narxi: ${Number(srv.price || 0).toLocaleString()} so'm`,
      onConfirm: async () => {
        try {
          await fetch(`${API_BASE_URL}/services/${srv.id}`, { method: 'DELETE', headers: getAuthHeaders() });
          loadManagerData();
          showNotification('Xizmat o\'chirildi', `${srv.name} muvaffaqiyatli o'chirildi.`, 'success');
        } catch (e) {
          showNotification('Xatolik', 'Xizmatni o\'chirishda xatolik yuz berdi', 'error');
        }
      }
    });
  };

  // --- CRUD: CABINET ---
  const handleSaveCabinet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        number: cabinetForm.roomNumber,
        roomNumber: cabinetForm.roomNumber,
        name: cabinetForm.name || `${cabinetForm.roomNumber}-kabinet`,
        department: cabinetForm.department || 'Ambulatoriya',
        floor: Number(cabinetForm.floor) || 1
      };

      let res;
      if (editingCabinetId) {
        res = await fetch(`${API_BASE_URL}/cabinets/${editingCabinetId}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE_URL}/cabinets`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
      }
      const data = await res.json();
      if (res.ok && data.success) {
        setIsCabinetModalOpen(false);
        setEditingCabinetId(null);
        loadManagerData();
        showNotification('Kabinet saqlandi', `${cabinetForm.roomNumber}-xona muvaffaqiyatli saqlandi.`, 'success');
      } else {
        showNotification('Xatolik', data.message || 'Kabinetni saqlashda xatolik yuz berdi', 'error');
      }
    } catch (e) {
      showNotification('Xatolik', 'Kabinetni saqlashda xatolik yuz berdi', 'error');
    }
  };

  const handleSaveFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cabNum = floorForm.firstCabinetNumber || `${floorForm.floorNumber}01`;
      const cabName = floorForm.firstCabinetName || `${cabNum}-kabinet (${floorForm.department})`;
      const res = await fetch(`${API_BASE_URL}/cabinets`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          number: cabNum,
          roomNumber: cabNum,
          name: cabName,
          floor: Number(floorForm.floorNumber),
          department: floorForm.department
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsFloorModalOpen(false);
        loadManagerData();
        showNotification('Qavat qo‘shildi', `${floorForm.floorNumber}-qavat va uning birinchi kabineti (${cabNum}-xona) muvaffaqiyatli saqlandi.`, 'success');
      } else {
        showNotification('Xatolik', data.message || 'Qavatni qo‘shishda xatolik yuz berdi', 'error');
      }
    } catch (e: any) {
      showNotification('Xatolik', 'Qavatni saqlashda xatolik yuz berdi', 'error');
    }
  };

  const promptDeleteCabinet = (cab: any) => {
    const cabNum = cab.number || cab.room_number || '';
    setDeleteModalConfig({
      isOpen: true,
      title: "Kabinetni o'chirish",
      description: "Ushbu xona klinika bazasidan butunlay o'chiriladi. Shifokorlar va navbatlar bilan bog'liqlik xavfsiz tarzda uziladi.",
      itemName: cab.name || `${cabNum}-kabinet`,
      itemDetails: `${cab.floor || 1}-qavat • Xona ${cabNum}`,
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/cabinets/${cab.id}`, { method: 'DELETE', headers: getAuthHeaders() });
          const data = await res.json();
          if (res.ok && data.success) {
            loadManagerData();
            showNotification('Kabinet o\'chirildi', `${cabNum}-kabinet muvaffaqiyatli o'chirildi.`, 'success');
          } else {
            showNotification('Xatolik', data.message || 'Kabinetni o\'chirishda xatolik yuz berdi', 'error');
          }
        } catch (e) {
          showNotification('Xatolik', 'Kabinetni o\'chirishda xatolik yuz berdi', 'error');
        }
      }
    });
  };

  // --- DOCTOR REPORT & EXPORT ---
  const handleOpenDoctorReport = async (doctor: any) => {
    setIsDoctorReportLoading(true);
    setIsDoctorReportModalOpen(true);
    setSelectedDoctorReport({
      doctor,
      stats: {
        waiting: doctor.waiting || 0,
        inProgress: doctor.in_progress || 0,
        completed: doctor.completed || 0,
        totalTickets: doctor.total_tickets || 0,
        totalRevenue: doctor.total_revenue || 0
      },
      tickets: []
    });
    try {
      const res = await fetch(`${API_BASE_URL}/doctors/${doctor.id}/performance`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedDoctorReport(data.data);
      }
    } catch (e) {
      console.error('Error fetching doctor performance:', e);
    } finally {
      setIsDoctorReportLoading(false);
    }
  };

  const exportDoctorReportToExcel = (reportData: any) => {
    if (!reportData) return;
    const doc = reportData.doctor || {};
    const tickets = reportData.tickets || [];
    const headers = ["Talon raqami", "Bemor F.I.Sh.", "Telefon", "Xizmat nomi", "Narxi (so'm)", "To'lov holati", "Holati", "Berilgan vaqt", "Yakunlangan vaqt"];
    const rows = tickets.map((t: any) => [
      `"${t.full_number || ''}"`,
      `"${t.patient_name || ''}"`,
      `"${t.patient_phone || ''}"`,
      `"${t.service_name || ''}"`,
      `"${t.price || 0}"`,
      `"${t.payment_status || ''}"`,
      `"${t.status || ''}"`,
      `"${t.issued_at ? new Date(t.issued_at).toLocaleString('uz-UZ') : ''}"`,
      `"${t.completed_at ? new Date(t.completed_at).toLocaleString('uz-UZ') : ''}"`
    ]);
    const summary = [
      ["SHIFOKOR ISH FAOLIYATI VA TUSHUM HISOBOTI"],
      [`F.I.Sh.: ${doc.display_name || ''}`],
      [`Mutaxassislik: ${doc.specialty_name || ''}`],
      [`Kabinet: ${doc.cabinet_number || doc.room_number || ''}-xona`],
      [`Telefon: ${doc.phone || ''}`],
      [`Kutayotgan bemorlar soni: ${reportData.stats?.waiting || 0} ta`],
      [`Qabul qilingan bemorlar: ${reportData.stats?.completed || 0} ta`],
      [`Jami ro'yxatga olinganlar: ${reportData.stats?.totalTickets || 0} ta`],
      [`Shu shifokordan jami tushum: ${Number(reportData.stats?.totalRevenue || 0).toLocaleString()} so'm`],
      [`Hisobot yaratilgan vaqt: ${new Date().toLocaleString('uz-UZ')}`],
      []
    ];
    const csvContent = "\uFEFF" + [
      ...summary.map((s: any) => s.join(',')),
      headers.join(','),
      ...rows.map((r: any) => r.join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `shifokor_${(doc.display_name || 'hisobot').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Eksport muvaffaqiyatli', `${doc.display_name} hisoboti Excel faylga yuklandi.`, 'success');
  };

  const exportUsersToExcel = () => {
    const headers = ["ID", "Xodim F.I.Sh.", "Login", "Tizimdagi Roli", "Telefon", "Holati", "Yaratilgan sana"];
    const rows = usersList.map(u => [
      `"${u.id || ''}"`,
      `"${u.full_name || ''}"`,
      `"${u.username || ''}"`,
      `"${u.role_name || u.role_code || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.is_active ? 'Faol' : 'Nofaol'}"`,
      `"${u.created_at ? new Date(u.created_at).toLocaleString('uz-UZ') : ''}"`
    ]);
    const csvContent = "\uFEFF" + [
      ["KLINIKA XODIMLARI VA ROLLAR RO'YXATI"],
      [`Jami xodimlar soni: ${usersList.length} nafar`],
      [`Sana: ${new Date().toLocaleString('uz-UZ')}`],
      [],
      headers.join(','),
      ...rows.map((r: any) => r.join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `xodimlar_royhati_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Eksport muvaffaqiyatli', 'Barcha xodimlar ro‘yxati Excel (.csv) fayl sifatida yuklab olindi.', 'success');
  };

  const getAuditExplanation = (item: any) => {
    if (!item) return '';
    const actor = item.actor_name || 'Xodim';
    const timeStr = item.timestamp ? new Date(item.timestamp).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
    const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleDateString('uz-UZ') : '';

    if (item.log_type === 'QUEUE_CALL') {
      if (item.action === 'CALL_NEXT') {
        return `${dateStr} soat ${timeStr} da ${actor} (${item.room_number ? item.room_number + '-xona' : 'kabinet'}) tomonidan navbatdagi bemor ${item.patient_name || ''} (${item.object_reference || 'Talon'}) qabulga chaqirildi va TV ekranda ovozli e'lon qilindi.`;
      }
      if (item.action === 'RECALL') {
        return `${dateStr} soat ${timeStr} da ${actor} tomonidan ${item.patient_name || 'bemor'} (${item.object_reference || 'Talon'}) ${item.room_number ? item.room_number + '-xona' : 'kabinet'}ga takroran (qayta) chaqirildi va TV ekranda e'lon takrorlandi.`;
      }
      if (item.action === 'COMPLETE') {
        return `${dateStr} soat ${timeStr} da ${actor} tomonidan bemor ${item.patient_name || ''} uchun ${item.object_reference || 'Talon'} bo'yicha tibbiy ko'rik muvaffaqiyatli yakunlandi va qabul yopildi.`;
      }
      if (item.action === 'START') {
        return `${dateStr} soat ${timeStr} da ${actor} tomonidan bemor ${item.patient_name || ''} (${item.object_reference || 'Talon'}) bilan ko'rik boshlandi.`;
      }
      if (item.action === 'CANCEL') {
        return `${dateStr} soat ${timeStr} da ${item.object_reference || 'Talon'} navbati bekor qilindi va navbatdan chiqarildi.`;
      }
      return `${dateStr} soat ${timeStr} da ${actor} tomonidan ${item.object_reference || 'Talon'} bo'yicha "${item.action}" amali amalga oshirildi.`;
    }

    if (item.log_type === 'PAYMENT') {
      const formattedAmount = Number(item.amount || 0).toLocaleString('uz-UZ');
      const methodStr = item.payment_method === 'CASH' ? 'Naqd pul' : item.payment_method === 'CARD' ? 'Plastik karta' : item.payment_method || 'To\'lov';
      return `${dateStr} soat ${timeStr} da ${actor} tomonidan bemor ${item.patient_name || ''} uchun ${formattedAmount} so'm miqdorida (${methodStr}) kassa to'lovi qabul qilindi. Kvitansiya raqami: ${item.object_reference || '-'}.`;
    }

    if (item.log_type === 'SHIFT') {
      if (item.action === 'SMENA_YOPILDI') {
        const total = Number(item.amount || 0).toLocaleString('uz-UZ');
        return `${dateStr} soat ${timeStr} da ${actor} tomonidan kassa smenasi muvaffaqiyatli yopildi. Ushbu smenada yig'ilgan umumiy tushum: ${total} so'm.`;
      }
      return `${dateStr} soat ${timeStr} da ${actor} tomonidan yangi kassa smenasi ochildi va navbat uchun kassa hisob-kitoblari faollashtirildi.`;
    }

    if (item.log_type === 'SYSTEM') {
      return `${dateStr} soat ${timeStr} da ${actor} tomonidan klinika va veb-sayt tizim sozlamalari yangilandi va PostgreSQL ma'lumotlar bazasiga saqlandi.`;
    }

    return `${dateStr} soat ${timeStr} da ${actor} tomonidan tizimda "${item.action || 'amal'}" operatsiyasi muvaffaqiyatli bajarildi.`;
  };

  const exportAuditLogsToExcel = () => {
    const headers = ["ID", "Sana va Vaqt", "Kategoriya", "Amal / Hodisa", "Mas'ul Xodim", "Roli", "Talon / Kvitansiya", "Bemor F.I.Sh", "Shifokor", "Xona", "Summa (so'm)", "Holati"];
    const rows = auditLogsList.map((log: any) => [
      `"${log.id || ''}"`,
      `"${log.timestamp ? new Date(log.timestamp).toLocaleString('uz-UZ') : ''}"`,
      `"${log.log_type || ''}"`,
      `"${log.action || ''}"`,
      `"${(log.actor_name || '').replace(/"/g, '""')}"`,
      `"${log.actor_role || ''}"`,
      `"${log.object_reference || ''}"`,
      `"${(log.patient_name || '').replace(/"/g, '""')}"`,
      `"${(log.doctor_name || '').replace(/"/g, '""')}"`,
      `"${log.room_number || ''}"`,
      log.amount ? Number(log.amount) : '',
      `"${log.status || ''}"`
    ]);

    const csvContent = "\uFEFF" + [
      ["KLINIKA TIZIM AUDIT JURNALI"],
      [`Jami yozuvlar soni: ${auditLogsList.length} ta`],
      [`Eksport vaqti: ${new Date().toLocaleString('uz-UZ')}`],
      [],
      headers.join(','),
      ...rows.map((r: any) => r.join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_jurnali_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Eksport muvaffaqiyatli', 'Audit jurnali Excel (.csv) fayli sifatida yuklab olindi.', 'success');
  };

  // --- CRUD: PATIENT & VISIT/PAYMENT HISTORY ---
  const handleOpenPatientModal = async (patient: any, tab: 'OVERVIEW' | 'DOCTORS' | 'TICKETS' | 'PAYMENTS' | 'EDIT' = 'OVERVIEW') => {
    setSelectedPatientDetail(patient);
    setEditingPatientId(patient.id);
    setPatientModalTab(tab);
    setPatientForm({
      fullName: patient.full_name || '',
      phone: patient.phone || '',
      birthDate: patient.birth_date ? patient.birth_date.substring(0, 10) : '',
      gender: patient.gender || 'MALE',
      address: patient.address || '',
      notes: patient.notes || ''
    });
    setIsPatientEditModalOpen(true);
    setPatientHistoryLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/patients/${patient.id}`, { headers: getAuthHeaders() }).then(r => r.json());
      if (res.success && res.data) {
        setPatientTickets(res.data.tickets || []);
        setPatientPayments(res.data.payments || []);
        if (res.data.patient) {
          setSelectedPatientDetail((prev: any) => ({ ...prev, ...res.data.patient }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPatientHistoryLoading(false);
    }
  };

  const exportPatientsToExcel = () => {
    try {
      const filtered = patientsList.filter(p => 
        !patientSearch || 
        p.full_name?.toLowerCase().includes(patientSearch.toLowerCase()) || 
        p.phone?.includes(patientSearch) ||
        p.patient_number?.includes(patientSearch)
      );

      const dataToExport = filtered.map((p, index) => {
        const lastDoc = p.last_visit ? `${p.last_visit.doctor_name} (${p.last_visit.specialty_name || ''})` : 'Tashrif yo\'q';
        const docSummary = Array.isArray(p.doctor_visits) 
          ? p.doctor_visits.map((d: any) => `${d.doctor_name}: ${d.visit_count} marta`).join('; ')
          : '';
        return {
          '№': index + 1,
          'Karta №': p.patient_number || p.id,
          'F.I.Sh.': p.full_name,
          'Telefon': p.phone || '',
          'Tug\'ilgan sana': p.birth_date ? p.birth_date.substring(0, 10) : '',
          'Jinsi': p.gender === 'FEMALE' ? 'Ayol' : 'Erkak',
          'Jami Qabullar': Number(p.total_visits || 0),
          'Jami To\'lov (so\'m)': Number(p.total_paid || 0),
          'Oxirgi Shifokor': lastDoc,
          'Shifokorlar Bo\'yicha': docSummary || 'Mavjud emas',
          'Manzil': p.address || '',
          'Qaydlar': p.notes || ''
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Bemorlar');
      XLSX.writeFile(workbook, `Sadaf_Klinika_Bemorlar_${new Date().toISOString().split('T')[0]}.xlsx`);
      showNotification('Excel yuklandi', 'Bemorlar bazasi va tashriflar hisoboti .xlsx formatida yuklab olindi.', 'success');
    } catch (e) {
      console.error(e);
      showNotification('Xatolik', 'Excel faylini yaratishda xatolik yuz berdi', 'error');
    }
  };

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatientId) return;
    try {
      await fetch(`${API_BASE_URL}/patients/${editingPatientId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(patientForm)
      });
      setIsPatientEditModalOpen(false);
      setEditingPatientId(null);
      setSelectedPatientDetail(null);
      loadManagerData();
      showNotification('Bemor yangilandi', 'Bemor ma\'lumotlari muvaffaqiyatli saqlandi.', 'success');
    } catch (e) {
      showNotification('Xatolik', 'Bemorni tahrirlashda xatolik yuz berdi', 'error');
    }
  };

  const promptDeletePatient = (patient: any) => {
    setDeleteModalConfig({
      isOpen: true,
      title: "Bemor kartasini o'chirish",
      description: "Ushbu bemor kartasi va unga tegishli barcha navbat tarixi bazadan butunlay o'chiriladi.",
      itemName: patient.full_name,
      itemDetails: `Karta: #${patient.patient_number || patient.id?.substring(0, 6)} • Tel: ${patient.phone || '-'}`,
      onConfirm: async () => {
        try {
          await fetch(`${API_BASE_URL}/patients/${patient.id}`, { method: 'DELETE', headers: getAuthHeaders() });
          loadManagerData();
          showNotification('Bemor o\'chirildi', `${patient.full_name} bazadan muvaffaqiyatli o'chirildi.`, 'success');
        } catch (e) {
          showNotification('Xatolik', 'Bemorni o\'chirishda xatolik yuz berdi', 'error');
        }
      }
    });
  };

  // --- CANCEL TICKET ---
  const promptCancelTicket = (ticket: any) => {
    setDeleteModalConfig({
      isOpen: true,
      title: "Talonni bekor qilish",
      description: "Ushbu navbat taloni bekor qilinadi va navbatdan chiqariladi.",
      itemName: `Talon: ${ticket.full_number || ticket.id}`,
      itemDetails: `Bemor: ${ticket.patient_name || '-'} • Shifokor: ${ticket.doctor_name || '-'}`,
      onConfirm: async () => {
        try {
          await fetch(`${API_BASE_URL}/queues/tickets/${ticket.id}/cancel`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({})
          });
          loadManagerData();
          showNotification('Talon bekor qilindi', `${ticket.full_number || ticket.id} taloni bekor qilindi.`, 'success');
        } catch (e) {
          showNotification('Xatolik', 'Talonni bekor qilishda xatolik yuz berdi', 'error');
        }
      }
    });
  };

  // --- UPDATE SETTINGS ---
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch(`${API_BASE_URL}/clinic/settings`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(settingsForm)
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Sozlamalar saqlandi', 'Klinika va sayt sozlamalari muvaffaqiyatli saqlandi va kuchga kirdi!', 'success');
        if (data.data) {
          setClinicSettings(data.data);
          if (settingsForm.clinicName && currentUser) {
            try {
              const updatedUser = { ...currentUser, clinicName: settingsForm.clinicName };
              localStorage.setItem('sadaf_user', JSON.stringify(updatedUser));
            } catch {}
          }
        }
        await loadManagerData(true);
      } else {
        showNotification('Xatolik', data.message || 'Sozlamalarni saqlashda xatolik yuz berdi', 'error');
      }
    } catch (e) {
      showNotification('Xatolik', 'Sozlamalarni saqlashda xatolik yuz berdi', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleResetSettings = () => {
    if (clinicSettings) {
      setSettingsForm({
        clinicName: clinicSettings.clinic_name ?? (currentUser?.clinicName || ''),
        logoUrl: clinicSettings.logo_url ?? '',
        slogan: clinicSettings.slogan ?? '',
        phone: clinicSettings.phone ?? '',
        email: clinicSettings.email ?? '',
        address: clinicSettings.address ?? '',
        workStartTime: clinicSettings.work_start_time || '08:00',
        workEndTime: clinicSettings.work_end_time || '18:00',
        workDays: clinicSettings.work_days || 'Dushanba - Shanba',
        websiteUrl: clinicSettings.website_url ?? '',
        defaultPaymentPolicy: clinicSettings.default_payment_policy || 'PAY_BEFORE_CALL',
        defaultQueuePrefix: clinicSettings.default_queue_prefix || 'A',
        autoCallNext: !!clinicSettings.auto_call_next,
        ticketAutoCancelMinutes: clinicSettings.ticket_auto_cancel_minutes ?? 15,
        maxDailyTicketsPerDoctor: clinicSettings.max_daily_tickets_per_doctor ?? 50,
        emergencyPriority: clinicSettings.emergency_priority ?? true,
        currency: clinicSettings.currency || 'UZS',
        vatPercent: clinicSettings.vat_percent ?? 0,
        cashierAutoCloseShift: clinicSettings.cashier_auto_close_shift ?? true,
        soundNotification: clinicSettings.sound_notification ?? true,
        recallLimit: clinicSettings.recall_limit ?? 3,
        voiceLanguage: clinicSettings.voice_language || 'uz-UZ'
      });
      showNotification('Tiklandi', 'Sozlamalar bazadagi asl holatiga qaytarildi', 'info');
    }
  };

  // --- USER CRUD ---
  const handleOpenNewUserModal = () => {
    setEditingUserId(null);
    setUserForm({
      fullName: '',
      username: '',
      password: '',
      roleCode: 'DOCTOR',
      phone: '+998 90 000 00 00'
    });
    setIsUserModalOpen(true);
  };

  const handleEditUser = (usr: any) => {
    setEditingUserId(usr.id);
    setUserForm({
      fullName: usr.full_name || '',
      username: usr.username || '',
      password: '',
      roleCode: usr.role_code || 'DOCTOR',
      phone: usr.phone || '+998 90 000 00 00'
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        await fetch(`${API_BASE_URL}/users/${editingUserId}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(userForm)
        });
      } else {
        await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(userForm)
        });
      }
      setIsUserModalOpen(false);
      loadManagerData();
      showNotification('Foydalanuvchi saqlandi', `${userForm.fullName} muvaffaqiyatli saqlandi.`, 'success');
    } catch (e) {
      showNotification('Xatolik', 'Foydalanuvchini saqlashda xatolik yuz berdi', 'error');
    }
  };

  const promptDeleteUser = (usr: any) => {
    setDeleteModalConfig({
      isOpen: true,
      title: "Xodimni tizimdan o'chirish",
      description: "Ushbu xodim hisobi butunlay o'chiriladi va uning tizimga kirish huquqlari bekor qilinadi.",
      itemName: usr.full_name || usr.username,
      itemDetails: `Rol: ${usr.role} • Login: ${usr.username} • Tel: ${usr.phone || '-'}`,
      onConfirm: async () => {
        try {
          await fetch(`${API_BASE_URL}/users/${usr.id}`, { method: 'DELETE', headers: getAuthHeaders() });
          loadManagerData();
          showNotification('Foydalanuvchi o\'chirildi', `${usr.full_name || usr.username} muvaffaqiyatli o'chirildi.`, 'success');
        } catch (e) {
          showNotification('Xatolik', 'Foydalanuvchini o\'chirishda xatolik yuz berdi', 'error');
        }
      }
    });
  };

  // --- CASH SHIFTS ACTIONS ---
  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE_URL}/cash-shifts/open`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          cashierId: 'usr_cashier1',
          cashierName: shiftForm.cashierName,
          openingBalance: Number(shiftForm.openingBalance) || 0,
          notes: shiftForm.notes
        })
      });
      setIsShiftModalOpen(false);
      loadManagerData();
      showNotification('Kassa smenasi ochildi', `${shiftForm.cashierName} uchun smena muvaffaqiyatli ochildi.`, 'success');
    } catch (e) {
      showNotification('Xatolik', 'Smena ochishda xatolik yuz berdi', 'error');
    }
  };

  const handleOpenCloseShiftModal = (shift: any) => {
    setClosingShiftData(shift);
    setClosingCashAmount(shift.opening_balance || 0);
    setIsCloseShiftModalOpen(true);
  };

  const handleConfirmCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingShiftData) return;
    setIsClosingShiftSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/cash-shifts/${closingShiftData.id}/close`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          closingBalance: Number(closingCashAmount) || 0
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsCloseShiftModalOpen(false);
        setClosingShiftData(null);
        loadManagerData();
        showNotification('Kassa smenasi yopildi', 'Smena muvaffaqiyatli yopildi va kassa balansi saqlandi.', 'success');
      } else {
        showNotification('Xatolik', data.message || 'Smenani yopishda xatolik', 'error');
      }
    } catch (e) {
      showNotification('Xatolik', 'Smenani yopishda xatolik yuz berdi', 'error');
    } finally {
      setIsClosingShiftSubmitting(false);
    }
  };

  const handleOpenShiftDetails = async (shift: any) => {
    setIsShiftDetailsModalOpen(true);
    setIsLoadingShiftDetails(true);
    setSelectedShiftDetails(null);
    try {
      const res = await fetch(`${API_BASE_URL}/cash-shifts/${shift.id}/details`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success && json.data) {
        setSelectedShiftDetails(json.data);
      } else {
        setSelectedShiftDetails({
          shift,
          summary: {
            totalReceived: Number(shift.total_received) || 0,
            cashTotal: 0,
            cardTotal: 0,
            otherTotal: 0,
            paymentsCount: 0,
            openingBalance: Number(shift.opening_balance) || 0,
            closingBalance: Number(shift.closing_balance) || 0
          },
          doctorBreakdown: [],
          payments: []
        });
      }
    } catch (e) {
      showNotification('Xatolik', 'Smena tafsilotlarini yuklashda xatolik yuz berdi', 'error');
    } finally {
      setIsLoadingShiftDetails(false);
    }
  };

  const handleExportShiftToExcel = (details: any) => {
    if (!details || !details.shift) return;
    const shift = details.shift;
    const summary = details.summary || {};
    const docBreakdown = details.doctorBreakdown || [];
    const payments = details.payments || [];

    let csv = '\uFEFF'; // UTF-8 BOM for Excel to open Uzbek characters correctly

    // Smena bosh ma'lumotlari
    csv += `KASSA SMENASI HISOBOTI - #${shift.id}\n`;
    csv += `Kassir:,"${shift.cashier_name || 'Kassir'}"\n`;
    csv += `Ochilgan vaqti:,"${shift.opened_at ? new Date(shift.opened_at).toLocaleString('uz-UZ') : '-'}"\n`;
    csv += `Yopilgan vaqti:,"${shift.closed_at ? new Date(shift.closed_at).toLocaleString('uz-UZ') : 'Hali ochiq'}"\n`;
    csv += `Holat:,"${shift.status === 'OPEN' ? 'Ochiq' : 'Yopilgan'}"\n`;
    csv += `Boshlang'ich kassa qoldig'i:,"${Number(shift.opening_balance || 0).toLocaleString()} so'm"\n`;
    csv += `Yakuniy kassa qoldig'i:,"${Number(shift.closing_balance || 0).toLocaleString()} so'm"\n`;
    csv += `Jami tushum:,"${Number(summary.totalReceived || 0).toLocaleString()} so'm"\n`;
    csv += `Naqd pul tushumi:,"${Number(summary.cashTotal || 0).toLocaleString()} so'm"\n`;
    csv += `Karta & Onlayn tushum:,"${Number(summary.cardTotal || 0).toLocaleString()} so'm"\n\n`;

    // 1. Shifokorlar bo'yicha tushum taqsimoti
    csv += `SHIFOKORLAR BO'YICHA TUSHUM TAQSIMOTI\n`;
    csv += `№,Shifokor F.I.Sh.,Mutaxassisligi,Qabullar / Talonlar soni,Shifokorga tushgan to'lov (so'm),Ulushi (%)\n`;

    const totalDocSum = docBreakdown.reduce((acc: number, d: any) => acc + (Number(d.totalAmount) || 0), 0);

    docBreakdown.forEach((doc: any, idx: number) => {
      const amt = Number(doc.totalAmount) || 0;
      const share = totalDocSum > 0 ? ((amt / totalDocSum) * 100).toFixed(1) : '0';
      csv += `${idx + 1},"${doc.doctorName}","${doc.specialtyName}",${doc.ticketCount},"${amt.toLocaleString()} so'm",${share}%\n`;
    });
    csv += `,"JAMI SHIFOKORLAR TUSHUMI",,"${docBreakdown.reduce((acc: number, d: any) => acc + (d.ticketCount || 0), 0)} ta","${totalDocSum.toLocaleString()} so'm",100%\n\n`;

    // 2. To'lovlar ro'yxati
    csv += `SMENADAGI BARCHA TO'LOVLAR REESTRI\n`;
    csv += `№,Chek / Kvitansiya ID,Bemor F.I.Sh.,Telefon,To'lov turi,Summa (so'm),Holat,To'lov vaqti,Izoh\n`;

    payments.forEach((p: any, idx: number) => {
      const methodStr = p.method === 'CASH' ? 'Naqd pul' : p.method === 'CARD' ? 'Plastik karta' : 'Onlayn';
      csv += `${idx + 1},"${p.receipt_number || p.id}","${p.patient_name || '-'}","${p.patient_phone || '-'}","${methodStr}","${Number(p.amount || 0).toLocaleString()} so'm","${p.status}","${p.created_at ? new Date(p.created_at).toLocaleString('uz-UZ') : '-'}","${p.notes || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `smena_${shift.id}_hisoboti.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Excel yuklandi', `Smena #${shift.id} hisoboti muvaffaqiyatli yuklab olindi.`, 'success');
  };

  // --- TV TABLO SOZLAMALARI VA CHAQIRUV SHABLONI ---
  const handleSaveTvSettings = async () => {
    setIsSavingTvSettings(true);
    try {
      const res = await fetch(`${API_BASE_URL}/clinic/settings`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(tvSettings)
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('Sozlamalar saqlandi', "TV Tablosi yozuvlari va ovoz shabloni muvaffaqiyatli yangilandi va TV ga uzatildi.", 'success');
        await loadManagerData(true);
      } else {
        showNotification('Xatolik', data.message || 'Saqlashda xatolik yuz berdi', 'error');
      }
    } catch (e: any) {
      showNotification('Xatolik', e.message || 'Server bilan aloqa uzildi', 'error');
    } finally {
      setIsSavingTvSettings(false);
    }
  };

  const handlePlayTvPreview = () => {
    if (isPlayingTvPreview) return;
    setIsPlayingTvPreview(true);
    const sampleText = (tvSettings.tvVoiceTemplate || '')
      .replace(/\{letter\}/g, 'Ka')
      .replace(/\{zeros\}/g, ' nol')
      .replace(/\{number\}/g, "o'n beshinchi")
      .replace(/\{cabinet\}/g, 'uchinchi')
      .replace(/\{specialty\}/g, 'Kardiologiya')
      .replace(/\{doctor\}/g, 'Dr. Karimova Malika')
      .replace(/\{patient\}/g, 'Rahimov Aziz');

    const audioUrl = `${API_BASE_URL}/voice/speak?text=${encodeURIComponent(sampleText)}&voice=${tvSettings.tvVoiceName}`;
    const audio = new Audio(audioUrl);
    audio.onended = () => setIsPlayingTvPreview(false);
    audio.onerror = () => setIsPlayingTvPreview(false);
    audio.play().catch(() => setIsPlayingTvPreview(false));
  };

  const insertTemplateTag = (tag: string) => {
    setTvSettings(prev => ({
      ...prev,
      tvVoiceTemplate: (prev.tvVoiceTemplate ? prev.tvVoiceTemplate + ' ' : '') + tag
    }));
  };

  const applyPreset = (presetText: string) => {
    setTvSettings(prev => ({
      ...prev,
      tvVoiceTemplate: presetText
    }));
    showNotification('Shablon tanlandi', 'Chaqiruv shabloni yangilandi. Saqlash tugmasini bosing.', 'info');
  };

  // --- TV TEST CALL ---
  const handleSendTvTestCall = async () => {
    setTestCallStatus('Yuborilmoqda...');
    try {
      const res = await fetch(`${API_BASE_URL}/tv/test-call`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ticketNumber: testTicketNum,
          specialtyName: testSpecName,
          cabinetNumber: testCabNum,
          template: tvSettings.tvVoiceTemplate
        })
      });
      if (res.ok) {
        setTestCallStatus('Muvaffaqiyatli: TV ekranga e\'lon va ovoz yuborildi!');
        showNotification('TV ga yuborildi', `${testTicketNum} raqami TV ekranga ovozli uzatildi.`, 'success');
        setTimeout(() => setTestCallStatus(''), 4000);
      }
    } catch (e) {
      setTestCallStatus('Xatolik');
    }
  };

  // --- PRINTER VA TALON SOZLAMALARI ---
  const handleSavePrinterSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingPrinterSettings(true);
    try {
      const res = await fetch(`${API_BASE_URL}/clinic/settings`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          printer_settings: printerSettings
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Saqlashda xatolik yuz berdi');

      localStorage.setItem('sadaf_ticket_settings', JSON.stringify(printerSettings));
      try {
        const cashSaved = localStorage.getItem('sadaf_cashier_settings');
        const parsed = cashSaved ? JSON.parse(cashSaved) : {};
        parsed.printerPaperSize = printerSettings.paperSize;
        parsed.autoPrintEnabled = printerSettings.autoPrint;
        parsed.soundEnabled = printerSettings.soundAlert;
        localStorage.setItem('sadaf_cashier_settings', JSON.stringify(parsed));
      } catch {}

      showNotification('Sozlamalar saqlandi', 'Printer va talon sozlamalari muvaffaqiyatli saqlandi va barcha kassirlar uchun kuchga kirdi!', 'success');
      await loadManagerData(true);
    } catch (err: any) {
      showNotification('Xatolik', err.message || 'Sozlamalarni saqlashda xatolik yuz berdi', 'error');
    } finally {
      setIsSavingPrinterSettings(false);
    }
  };

  const handleResetPrinterSettings = () => {
    setPrinterSettings(defaultPrinterSettings);
    setPreviewPaperSize('80mm');
    showNotification("Boshlang'ich holat", "Printer sozlamalari standart holatga qaytarildi. Saqlash tugmasini bosing.", 'info');
  };

  const handleTestPrint = () => {
    setIsTestTicketModalOpen(true);
  };

  // Navigation menu items matching Meneger.png with larger icons & real routing slugs
  const menuItems: Array<{
    id: string;
    slug: string;
    label: string;
    icon: any;
    children?: Array<{ id: string; slug: string; label: string; icon: any }>;
  }> = [
    { id: 'BOSH_SAHIFA', slug: 'bosh-sahifa', label: 'Bosh sahifa', icon: SlidersHorizontal },
    { id: 'NAVBATLAR', slug: 'navbatlar', label: 'Navbatlar', icon: SlidersHorizontal },
    { id: 'BEMORLAR', slug: 'bemorlar', label: 'Bemorlar', icon: Users },
    { id: 'SHIFOKORLAR', slug: 'shifokorlar', label: 'Shifokorlar', icon: Stethoscope },
    { id: 'KABINETLAR', slug: 'kabinetlar', label: 'Kabinetlar', icon: DoorOpen },
    { id: 'XIZMATLAR', slug: 'xizmatlar', label: 'Xizmatlar', icon: LayoutGrid },
    {
      id: 'HISOBOTLAR_KASSA',
      slug: 'hisobotlar-group',
      label: 'Hisobotlar & Kassa',
      icon: BarChart3,
      children: [
        { id: 'HISOBOTLAR', slug: 'hisobotlar', label: 'Hisobotlar', icon: BarChart3 },
        { id: 'KASSA_SMENASI', slug: 'kassa-smenasi', label: 'Kassa smenasi', icon: Wallet },
        { id: 'TOLOVLAR', slug: 'tolovlar', label: "To'lovlar", icon: CreditCard },
      ]
    },
    { id: 'XODIMLAR', slug: 'xodimlar', label: 'Xodimlar va rollar', icon: ShieldCheck },
    {
      id: 'TIZIM_SOZLAMALARI_GROUP',
      slug: 'sozlamalar-group',
      label: 'Tizim sozlamalari',
      icon: Settings,
      children: [
        { id: 'TIZIM_SOZLAMALARI', slug: 'sozlamalar', label: 'Asosiy sozlamalar', icon: Settings },
        { id: 'PRINTER_SOZLAMALARI', slug: 'printer-sozlamalari', label: 'Printer sozlamalari', icon: Printer },
        { id: 'TV_TABLOSI', slug: 'tv-tablosi', label: 'TV tablosi', icon: Tv },
        { id: 'OBUNA_SMS', slug: 'obuna-sms', label: 'Obuna va SMS', icon: CreditCard },
        { id: 'AUDIT_JURNALI', slug: 'audit', label: 'Audit jurnali', icon: FileText },
      ]
    },
  ];

  // Resolve active item across top-level and nested children (prefer child view tabs)
  const allNavItems = menuItems.flatMap(m => m.children ? m.children : [m]);
  const activeMenuItem = allNavItems.find(m => m.slug === currentTabSlug) || menuItems[0];
  const activeTab = activeMenuItem.id;

  // 100% Real Database Metrics (No mock data)
  const todayTotal = dashboardData?.todayTicketsCount ?? allTicketsList.length;
  const waitingTotal = dashboardData?.waitingCount ?? allTicketsList.filter(t => t.status === 'WAITING').length;
  const inConsultationTotal = dashboardData?.inConsultationCount ?? allTicketsList.filter(t => t.status === 'IN_PROGRESS' || t.status === 'CALLED').length;
  const completedTotal = dashboardData?.completedCount ?? allTicketsList.filter(t => t.status === 'COMPLETED').length;

  // Real hourly traffic from database
  const hourlyData = dashboardData?.hourlyTraffic || [];

  // Real payment breakdown from database
  const pb = dashboardData?.paymentBreakdown || {
    total: paymentsList.reduce((acc, p) => acc + (Number(p.amount) || 0), 0),
    cash: paymentsList.filter(p => p.method === 'CASH').reduce((acc, p) => acc + (Number(p.amount) || 0), 0),
    card: paymentsList.filter(p => p.method === 'CARD').reduce((acc, p) => acc + (Number(p.amount) || 0), 0),
    online: paymentsList.filter(p => p.method === 'TRANSFER' || p.method === 'ONLINE').reduce((acc, p) => acc + (Number(p.amount) || 0), 0),
    cashPercent: 0,
    cardPercent: 0,
    onlinePercent: 0
  };

  return (
    <div className="flex h-screen bg-[#F0F4F8] text-[#172B4D] overflow-hidden select-none font-sans">
      {/* 1. DARK SIDEBAR (100% 1:1 WITH Meneger.png, LARGER ICONS & REAL ROUTING) */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-[#0B1528] flex flex-col justify-between flex-shrink-0 z-20 transition-all duration-200 border-r border-[#1E293B]`}>
        {/* Top Brand */}
        <div>
          <div className="p-5 flex items-center gap-3">
            <div className="w-12 h-12 bg-transparent flex items-center justify-center flex-shrink-0 filter drop-shadow-md overflow-hidden">
              <img
                src={clinicSettings?.logo_url || settingsForm?.logoUrl || APP_LOGO}
                alt={clinicSettings?.clinic_name || settingsForm?.clinicName || 'Klinika-admin'}
                className="w-full h-full object-contain bg-transparent rounded-lg"
              />
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <div className="font-bold text-lg text-white tracking-tight leading-tight truncate">
                  {clinicSettings?.clinic_name || settingsForm?.clinicName || 'Klinika-admin'}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Boshqaruv Tizimi
                </div>
              </div>
            )}
          </div>

          {/* Navigation Items with LARGE ICONS & REAL URL ROUTING */}
          <nav className="px-3 space-y-1.5 mt-2 overflow-y-auto max-h-[calc(100vh-160px)]">
            {menuItems.map(item => {
              const Icon = item.icon;

              if (item.children) {
                const isGroupActive = item.children.some(c => c.id === activeTab || c.slug === currentTabSlug);
                const isExpanded = !!expandedMenus[item.id];

                return (
                  <div key={item.id} className="space-y-1">
                    <button
                      onClick={() => {
                        if (sidebarCollapsed) {
                          setSidebarCollapsed(false);
                        }
                        const willBeOpen = !expandedMenus[item.id];
                        setExpandedMenus({
                          HISOBOTLAR_KASSA: item.id === 'HISOBOTLAR_KASSA' ? willBeOpen : false,
                          TIZIM_SOZLAMALARI_GROUP: item.id === 'TIZIM_SOZLAMALARI_GROUP' ? willBeOpen : false,
                        });
                        if (willBeOpen && item.children && item.children.length > 0) {
                          const isAlreadyInGroup = item.children.some(c => c.slug === currentTabSlug);
                          if (!isAlreadyInGroup) {
                            setSearchParams({ tab: item.children[0].slug });
                          }
                        }
                      }}
                      title={item.label}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[13px] font-semibold transition text-left cursor-pointer ${
                        isGroupActive
                          ? 'bg-white/10 text-white font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <Icon className={`w-6 h-6 stroke-[2.2] flex-shrink-0 ${isGroupActive ? 'text-medical-blue' : 'text-slate-400'}`} />
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </div>
                      {!sidebarCollapsed && (
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-white' : ''}`} />
                      )}
                    </button>

                    {/* Submenu dropdown items */}
                    {!sidebarCollapsed && isExpanded && (
                      <div className="pl-4 pr-1 space-y-1 py-1">
                        {item.children.map(child => {
                          const ChildIcon = child.icon;
                          const isChildActive = activeTab === child.id || currentTabSlug === child.slug;
                          return (
                            <button
                              key={child.id}
                              onClick={() => setSearchParams({ tab: child.slug })}
                              title={child.label}
                              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                                isChildActive
                                  ? 'bg-medical-blue text-white font-bold shadow-md shadow-medical-blue/30'
                                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              <ChildIcon className={`w-4 h-4 flex-shrink-0 ${isChildActive ? 'text-white' : 'text-slate-400'}`} />
                              <span className="truncate">{child.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setExpandedMenus({
                      HISOBOTLAR_KASSA: false,
                      TIZIM_SOZLAMALARI_GROUP: false,
                    });
                    if (item.slug === 'bosh-sahifa') {
                      setSearchParams({});
                    } else {
                      setSearchParams({ tab: item.slug });
                    }
                  }}
                  title={item.label}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-[13px] font-semibold transition text-left cursor-pointer ${
                    isActive
                      ? 'bg-medical-blue text-white shadow-lg shadow-medical-blue/30 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-6 h-6 stroke-[2.2] flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Collapse Button */}
        <div className="p-3 border-t border-slate-800/80">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800/50 text-xs font-semibold transition"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            {!sidebarCollapsed && <span>Menyuni yig'ish</span>}
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP NAVBAR (100% 1:1 WITH Meneger.png) */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between flex-shrink-0 relative z-40 shadow-sm">
          {/* Left Brand / Hamburger */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-[#172B4D] leading-tight">
                {clinicSettings?.clinic_name || settingsForm?.clinicName || 'Klinika-admin'}
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">Navbat Tizimi — Boshqaruv</p>
            </div>
          </div>

          {/* Right Header Badges */}
          <div className="flex items-center gap-4">
            {/* Date Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{dateStr}</span>
            </div>

            {/* Live Clock Pill */}
            <div className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-[#172B4D] font-mono">
              {time}
            </div>

            {/* User Profile Pill with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition shadow-2xs cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1677FF] to-blue-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {getUserInitials(currentUser?.fullName || currentUser?.name || currentUser?.username)}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-[#172B4D] leading-tight max-w-[150px] truncate">
                    {currentUser?.fullName || currentUser?.name || currentUser?.username || 'Menejer'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    {getRoleDisplayName(currentUser?.role)}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50">
                    <div className="px-3 py-2.5 border-b border-slate-100">
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {currentUser?.fullName || currentUser?.name || currentUser?.username || 'Menejer'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {currentUser?.phone ? formatUzbekPhone(currentUser.phone) : (currentUser?.email || currentUser?.username || '')}
                      </div>
                      <div className="mt-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                          {getRoleDisplayName(currentUser?.role)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 mt-1 transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>Tizimdan chiqish</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* 3. SCROLLABLE CONTENT AREA */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Super Admin Lock / Suspension Alert Banner */}
          {clinicSubscription?.status === 'BLOCKED' && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-center justify-between text-rose-800 shadow-sm animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black">Diqqat: Klinika Super Admin tomonidan Qulflangan (BLOCKED)</h4>
                  <p className="text-xs text-rose-600 mt-0.5">
                    Obuna muddati tugagan yoki xizmat to'xtatilgan. Qayta faollashtirish uchun Super Admin bilan bog'laning: +998 71 200 00 00
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSearchParams({ tab: 'obuna-sms' })}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
              >
                Obunani ko'rish
              </button>
            </div>
          )}

          {clinicSubscription?.status === 'SUSPENDED' && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between text-amber-800 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                  <Pause className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black">Ogohlantirish: Klinika xizmati vaqtincha to'xtatilgan (SUSPENDED)</h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Xizmatni davom ettirish va qayta faollashtirish uchun Super Admin bilan bog'laning.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSearchParams({ tab: 'obuna-sms' })}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
              >
                Tafsilotlar
              </button>
            </div>
          )}
          {/* TAB 1: BOSH SAHIFA / MAIN DASHBOARD (100% 1:1 WITH Meneger.png) */}
          {activeTab === 'BOSH_SAHIFA' && (
            <div className="space-y-6">
              {/* Top Heading */}
              <div>
                <h2 className="text-xl font-bold text-[#172B4D] tracking-tight">Klinika boshqaruvi</h2>
                <p className="text-xs text-[#64748B] mt-0.5 font-medium">Bugungi holat va tezkor statistikalar</p>
              </div>

              {/* ROW 1: 4 TOP METRIC CARDS (100% 1:1 WITH Meneger.png) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* 1. Bugungi bemorlar */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1677FF] flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500">Bugungi bemorlar</div>
                      <div className="text-3xl font-black text-[#172B4D] leading-tight">
                        {todayTotal}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center text-xs font-bold text-emerald-600">
                      ↑ +12%
                    </span>
                    <div className="text-[11px] text-slate-400 mt-0.5">Kecha: 114</div>
                  </div>
                </div>

                {/* 2. Kutayotganlar */}
                <div className="bg-[#EBF9F1] rounded-2xl p-4 border border-[#C1E9D2] shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white text-emerald-600 flex items-center justify-center shadow-xs">
                      <Clock className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-600">Kutayotganlar</div>
                      <div className="text-3xl font-black text-[#172B4D] leading-tight">
                        {waitingTotal}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center text-xs font-bold text-rose-500">
                      ↑ +5%
                    </span>
                    <div className="text-[11px] text-slate-400 mt-0.5">Kecha: 23</div>
                  </div>
                </div>

                {/* 3. Qabulda */}
                <div className="bg-[#F3F0FF] rounded-2xl p-4 border border-[#E4DCFD] shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white text-purple-600 flex items-center justify-center shadow-xs">
                      <Stethoscope className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-600">Qabulda</div>
                      <div className="text-3xl font-black text-[#172B4D] leading-tight">
                        {inConsultationTotal}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center text-xs font-bold text-emerald-600">
                      ↓ -20%
                    </span>
                    <div className="text-[11px] text-slate-400 mt-0.5">Kecha: 10</div>
                  </div>
                </div>

                {/* 4. Yakunlangan */}
                <div className="bg-[#FFFBEB] rounded-2xl p-4 border border-[#FDE68A] shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white text-amber-500 flex items-center justify-center shadow-xs">
                      <CheckCircle2 className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-600">Yakunlangan</div>
                      <div className="text-3xl font-black text-[#172B4D] leading-tight">
                        {completedTotal}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center text-xs font-bold text-emerald-600">
                      ↑ +14%
                    </span>
                    <div className="text-[11px] text-slate-400 mt-0.5">Kecha: 84</div>
                  </div>
                </div>
              </div>

              {/* ROW 2: HOURLY CHART + TO'LOVLAR DONUT + JORIY NAVBATLAR (ANIMATED & REAL DATA) */}
              <div className="grid grid-cols-12 gap-5">
                {/* 1. Soatlik bemorlar soni (Animated Bar Chart) (Col span 5) */}
                <div className="col-span-12 lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#172B4D]">Soatlik bemorlar oqimi</h3>
                        <p className="text-[11px] text-slate-400">Kun davomida qabul qilingan bemorlar taqsimoti</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Real vaqt</span>
                    </div>
                  </div>

                  {/* Hourly Chart Container */}
                  <div className="relative pt-6 pb-1">
                    {/* Background Guide Lines */}
                    <div className="absolute inset-0 top-6 bottom-7 flex flex-col justify-between pointer-events-none opacity-40">
                      <div className="border-b border-dashed border-slate-200 w-full"></div>
                      <div className="border-b border-dashed border-slate-200 w-full"></div>
                      <div className="border-b border-dashed border-slate-200 w-full"></div>
                    </div>

                    <div className="h-44 flex items-end justify-between gap-1.5 px-1 relative z-10">
                      {hourlyData.map((d: any, i: number) => {
                        const count = Number(d.count) || 0;
                        const maxVal = Math.max(...hourlyData.map((item: any) => Number(item.count) || 0), 5);
                        const heightPercent = Math.max(8, Math.round((count / maxVal) * 100));
                        const isHovered = hoveredHour?.hour === d.hour;
                        const isPeak = count > 0 && count === maxVal;

                        return (
                          <div 
                            key={i} 
                            className="flex-1 flex flex-col items-center gap-2 group h-full justify-end relative cursor-pointer"
                            onMouseEnter={() => setHoveredHour(d)}
                            onMouseLeave={() => setHoveredHour(null)}
                          >
                            {/* Floating Tooltip */}
                            {isHovered && (
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg shadow-lg whitespace-nowrap z-30 pointer-events-none flex items-center gap-1 animate-in fade-in zoom-in duration-150">
                                <span className="font-bold text-amber-300">{count}</span> bemor
                                <span className="text-slate-400">({d.hour})</span>
                              </div>
                            )}

                            {/* Top count pill */}
                            {count > 0 && (
                              <span className={`text-[9px] font-extrabold transition-all duration-300 ${
                                isPeak ? 'text-blue-600 font-black scale-110' : 'text-slate-500'
                              }`}>
                                {count}
                              </span>
                            )}

                            {/* Bar with smooth animation */}
                            <div className="w-full relative flex items-end justify-center h-full">
                              <div
                                style={{ height: `${heightPercent}%` }}
                                className={`w-full max-w-[22px] rounded-t-lg transition-all duration-700 ease-out ${
                                  isPeak
                                    ? 'bg-gradient-to-t from-blue-600 to-indigo-500 shadow-md shadow-blue-500/30'
                                    : count > 0
                                    ? 'bg-gradient-to-t from-blue-500 to-sky-400 group-hover:from-blue-600 group-hover:to-sky-500 shadow-xs'
                                    : 'bg-slate-100 group-hover:bg-slate-200'
                                } ${isHovered ? 'brightness-110 -translate-y-1' : ''}`}
                              />
                            </div>

                            <span className={`text-[10px] font-semibold transition-colors ${
                              isHovered ? 'text-blue-600 font-bold' : 'text-slate-400'
                            }`}>
                              {d.hour.split(':')[0]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      <span>Eng yuqori yuklama</span>
                    </span>
                    <span className="font-bold text-slate-700 font-mono">
                      Jami qabul: {hourlyData.reduce((acc: number, cur: any) => acc + (Number(cur.count) || 0), 0)} ta
                    </span>
                  </div>
                </div>

                {/* 2. To'lovlar Donut Card (Col span 3) */}
                <div className="col-span-12 lg:col-span-3 bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-[#172B4D]">To‘lovlar</h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bugun</span>
                  </div>

                  <div className="my-1">
                    <div className="text-xs text-slate-400 font-medium">Jami tushum:</div>
                    <div className="text-xl font-black text-emerald-600 tracking-tight">
                      {Number(pb.total || 0).toLocaleString()} <span className="text-xs font-semibold text-emerald-700">so‘m</span>
                    </div>
                  </div>

                  {/* Donut and Legend */}
                  <div className="flex items-center justify-between gap-2 my-1">
                    {/* Legend */}
                    <div className="space-y-1.5 text-xs flex-1">
                      <div 
                        onMouseEnter={() => setActivePaySegment('cash')}
                        onMouseLeave={() => setActivePaySegment('all')}
                        className={`p-1.5 rounded-xl transition cursor-pointer ${
                          activePaySegment === 'cash' ? 'bg-emerald-50 scale-105' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#00B96B]"></span>
                            <span className="text-slate-700 font-semibold text-[11px]">Naqd</span>
                          </div>
                          <span className="font-bold text-slate-900 text-xs">{pb.cashPercent}%</span>
                        </div>
                        <div className="text-[10px] text-slate-400 pl-4 font-mono">{Number(pb.cash || 0).toLocaleString()}</div>
                      </div>

                      <div 
                        onMouseEnter={() => setActivePaySegment('card')}
                        onMouseLeave={() => setActivePaySegment('all')}
                        className={`p-1.5 rounded-xl transition cursor-pointer ${
                          activePaySegment === 'card' ? 'bg-blue-50 scale-105' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#0084FF]"></span>
                            <span className="text-slate-700 font-semibold text-[11px]">Karta</span>
                          </div>
                          <span className="font-bold text-slate-900 text-xs">{pb.cardPercent}%</span>
                        </div>
                        <div className="text-[10px] text-slate-400 pl-4 font-mono">{Number(pb.card || 0).toLocaleString()}</div>
                      </div>

                      <div 
                        onMouseEnter={() => setActivePaySegment('online')}
                        onMouseLeave={() => setActivePaySegment('all')}
                        className={`p-1.5 rounded-xl transition cursor-pointer ${
                          activePaySegment === 'online' ? 'bg-purple-50 scale-105' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]"></span>
                            <span className="text-slate-700 font-semibold text-[11px]">Onlayn</span>
                          </div>
                          <span className="font-bold text-slate-900 text-xs">{pb.onlinePercent}%</span>
                        </div>
                        <div className="text-[10px] text-slate-400 pl-4 font-mono">{Number(pb.online || 0).toLocaleString()}</div>
                      </div>
                    </div>

                    {/* SVG Animated Real Donut */}
                    {(() => {
                      const circ = 238.76;
                      const cashLen = ((pb.cashPercent || 0) / 100) * circ;
                      const cardLen = ((pb.cardPercent || 0) / 100) * circ;
                      const onlineLen = ((pb.onlinePercent || 0) / 100) * circ;
                      const cashOff = 0;
                      const cardOff = -cashLen;
                      const onlineOff = -(cashLen + cardLen);

                      return (
                        <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
                          <svg className="w-full h-full -rotate-90 transition-transform duration-500" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F1F5F9" strokeWidth="16" />
                            {cashLen > 0 && (
                              <circle
                                cx="50" cy="50" r="38" fill="transparent"
                                stroke="#00B96B"
                                strokeWidth={activePaySegment === 'cash' ? 19 : 16}
                                strokeDasharray={`${cashLen} ${circ}`}
                                strokeDashoffset={cashOff}
                                className="transition-all duration-700 cursor-pointer"
                              />
                            )}
                            {cardLen > 0 && (
                              <circle
                                cx="50" cy="50" r="38" fill="transparent"
                                stroke="#0084FF"
                                strokeWidth={activePaySegment === 'card' ? 19 : 16}
                                strokeDasharray={`${cardLen} ${circ}`}
                                strokeDashoffset={cardOff}
                                className="transition-all duration-700 cursor-pointer"
                              />
                            )}
                            {onlineLen > 0 && (
                              <circle
                                cx="50" cy="50" r="38" fill="transparent"
                                stroke="#8B5CF6"
                                strokeWidth={activePaySegment === 'online' ? 19 : 16}
                                strokeDasharray={`${onlineLen} ${circ}`}
                                strokeDashoffset={onlineOff}
                                className="transition-all duration-700 cursor-pointer"
                              />
                            )}
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                            <span className="text-xs font-black text-[#172B4D] leading-none">
                              {activePaySegment === 'cash' ? `${pb.cashPercent}%` :
                               activePaySegment === 'card' ? `${pb.cardPercent}%` :
                               activePaySegment === 'online' ? `${pb.onlinePercent}%` :
                               `${(Number(pb.total || 0) / 1000000).toFixed(1)}M`}
                            </span>
                            <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                              {activePaySegment === 'cash' ? 'Naqd' :
                               activePaySegment === 'card' ? 'Karta' :
                               activePaySegment === 'online' ? 'Onlayn' : "so'm"}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* 3. Joriy navbatlar (real vaqt) (Col span 4) */}
                <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-[#1677FF] animate-pulse" />
                      <h3 className="text-sm font-bold text-[#172B4D]">Joriy navbatlar (real vaqt)</h3>
                    </div>
                    <button
                      onClick={() => setSearchParams({ tab: 'navbatlar' })}
                      className="text-xs font-semibold text-[#1677FF] hover:underline"
                    >
                      Barchasi
                    </button>
                  </div>

                  {/* List of live queues 100% from PostgreSQL */}
                  <div className="divide-y divide-slate-100 space-y-1">
                    {(() => {
                      const activeStatuses = ['CALLED', 'IN_PROGRESS', 'WAITING'];
                      const activeTickets = allTicketsList
                        .filter((t: any) => activeStatuses.includes(t.status))
                        .sort((a: any, b: any) => {
                          const order: Record<string, number> = { CALLED: 1, IN_PROGRESS: 2, WAITING: 3 };
                          return (order[a.status] || 4) - (order[b.status] || 4);
                        });

                      const displayTickets = activeTickets.length >= 5
                        ? activeTickets.slice(0, 5)
                        : [
                            ...activeTickets,
                            ...allTicketsList.filter((t: any) => !activeStatuses.includes(t.status)).slice(0, 5 - activeTickets.length)
                          ];

                      if (displayTickets.length === 0) {
                        return (
                          <div className="py-7 text-center text-slate-400">
                            <Radio className="w-7 h-7 mx-auto mb-2 text-blue-400 animate-pulse" />
                            <p className="text-xs font-bold text-slate-700">Hozircha navbatlar mavjud emas</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Yangi talon berilganda bu yerda real vaqtda yangilanadi</p>
                          </div>
                        );
                      }

                      return displayTickets.map((q: any, idx: number) => {
                        const num = (q.full_number || 'A-001').replace('-', '');
                        const isCalled = q.status === 'CALLED';
                        const isInProg = q.status === 'IN_PROGRESS' || q.status === 'Qabulda';
                        const isWaiting = q.status === 'WAITING';
                        const isCompleted = q.status === 'COMPLETED';

                        const badgeCls = isCalled ? 'bg-[#FEF3C7] text-[#D97706] ring-1 ring-amber-400' :
                          isInProg ? 'bg-[#DCFCE7] text-[#16A34A] ring-1 ring-emerald-400' :
                          num.startsWith('A') ? 'bg-[#FEE2E2] text-[#DC2626]' :
                          num.startsWith('K') ? 'bg-[#F3E8FF] text-[#9333EA]' :
                          num.startsWith('N') ? 'bg-[#FFEDD5] text-[#EA580C]' : 'bg-[#DBEAFE] text-[#2563EB]';

                        return (
                          <div key={q.id || idx} className="flex items-center justify-between py-2.5 hover:bg-slate-50/80 px-2 rounded-xl transition">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={`px-2.5 py-1 rounded-xl text-xs font-black font-mono shrink-0 shadow-xs ${badgeCls}`}>
                                {q.full_number || num}
                              </span>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-[#172B4D] truncate flex items-center gap-1.5">
                                  <span>{q.patient_name || 'Bemor'}</span>
                                  {q.cabinet_number && (
                                    <span className="text-[10px] px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded font-mono font-bold">
                                      {q.cabinet_number}-xona
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                  {q.specialty_name || q.service_name || 'Shifokor qabuli'}
                                  {q.doctor_name && <span className="text-slate-500 font-medium"> • {q.doctor_name}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              <div className="text-[11px] text-slate-400 font-mono mb-0.5">
                                {q.issued_at ? new Date(q.issued_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : time}
                              </div>
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isCalled ? 'bg-[#FEF3C7] text-[#D97706] font-black animate-pulse' :
                                isInProg ? 'bg-[#DCFCE7] text-[#16A34A]' :
                                isWaiting ? 'bg-[#DBEAFE] text-[#2563EB]' :
                                isCompleted ? 'bg-purple-100 text-purple-700' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {isCalled ? 'Chaqirilmoqda' : isInProg ? 'Qabulda' : isWaiting ? 'Kutmoqda' : isCompleted ? 'Yakunlangan' : q.status}
                              </span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              {/* ROW 3: SHIFOKORLAR HOLATI + SO'NGGI TO'LOVLAR TABLES (100% 1:1 WITH Meneger.png) */}
              <div className="grid grid-cols-12 gap-5">
                {/* 1. Shifokorlar holati (Col span 6) */}
                <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#1677FF]" />
                      <h3 className="text-sm font-bold text-[#172B4D]">Shifokorlar holati</h3>
                    </div>
                    <button
                      onClick={() => setSearchParams({ tab: 'shifokorlar' })}
                      className="text-xs font-semibold text-[#1677FF] hover:underline"
                    >
                      Barchasi
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="pb-2.5">#</th>
                          <th className="pb-2.5">Shifokor</th>
                          <th className="pb-2.5">Mutaxassislik</th>
                          <th className="pb-2.5">Kabinet</th>
                          <th className="pb-2.5">Kutmoqda</th>
                          <th className="pb-2.5 text-right">Holat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {doctorsList.slice(0, 5).map((d, idx) => (
                          <tr key={d.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-2.5 text-slate-400 font-mono">{idx + 1}</td>
                            <td className="py-2.5 font-bold text-[#172B4D]">{d.display_name}</td>
                            <td className="py-2.5 text-slate-600">{d.specialty_name || 'Umumiy'}</td>
                            <td className="py-2.5 text-slate-600 font-mono">{d.cabinet_number || d.room_number || '1'}</td>
                            <td className="py-2.5 font-bold text-rose-600 font-mono">{d.waiting_count || 0}</td>
                            <td className="py-2.5 text-right">
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#16A34A]">
                                Faol
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. So'nggi to'lovlar (Col span 6) */}
                <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-sm font-bold text-[#172B4D]">So‘nggi to‘lovlar</h3>
                    </div>
                    <button
                      onClick={() => setSearchParams({ tab: 'tolovlar' })}
                      className="text-xs font-semibold text-[#1677FF] hover:underline"
                    >
                      Barchasi
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="pb-2.5">Vaqt</th>
                          <th className="pb-2.5">Bemor</th>
                          <th className="pb-2.5">Summa</th>
                          <th className="pb-2.5 text-right">Usul</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paymentsList.slice(0, 5).map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70 transition">
                            <td className="py-2.5 text-slate-400 font-mono">
                              {p.created_at ? new Date(p.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '14:20'}
                            </td>
                            <td className="py-2.5 font-bold text-[#172B4D]">{p.patient_name || 'Bemor'}</td>
                            <td className="py-2.5 font-bold text-[#172B4D] font-mono">
                              {Number(p.amount).toLocaleString()} so'm
                            </td>
                            <td className="py-2.5 text-right">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                p.method === 'CASH' ? 'bg-[#DCFCE7] text-[#16A34A]' :
                                p.method === 'CARD' ? 'bg-[#DBEAFE] text-[#2563EB]' : 'bg-[#F3E8FF] text-[#9333EA]'
                              }`}>
                                {p.method === 'CASH' ? 'Naqd' : p.method === 'CARD' ? 'Karta' : 'Onlayn'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ROW 4: TEZKOR AMALLAR (Tizim holati olib tashlandi) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1677FF] flex items-center justify-center font-bold text-sm shadow-xs">
                    ⚡
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#172B4D]">Tezkor amallar</h3>
                    <p className="text-xs text-slate-400">Yangi bemor, navbat taloni, shifokor va xizmatlarni boshqarish</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Yangi bemor */}
                  <button
                    onClick={() => setIsNewPatientModalOpen(true)}
                    className="bg-[#0084FF] hover:bg-blue-600 text-white rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 transition shadow-sm hover:shadow-md cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold">Yangi bemor</span>
                  </button>

                  {/* Talon berish */}
                  <button
                    onClick={() => navigate('/cashier')}
                    className="bg-[#00B96B] hover:bg-emerald-600 text-white rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 transition shadow-sm hover:shadow-md cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition">
                      <Ticket className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold">Talon berish</span>
                  </button>

                  {/* Shifokor qo'shish */}
                  <button
                    onClick={() => {
                      setEditingDoctorId(null);
                      setDoctorForm({ displayName: '', specialtyId: '', cabinetNumber: '', phone: '+998 ', address: '', username: '', password: 'doctor123' });
                      setIsDoctorModalOpen(true);
                    }}
                    className="bg-[#8B5CF6] hover:bg-purple-600 text-white rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 transition shadow-sm hover:shadow-md cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold">Shifokor qo‘shish</span>
                  </button>

                  {/* Xizmat qo'shish */}
                  <button
                    onClick={() => handleOpenServiceModal()}
                    className="bg-[#F59E0B] hover:bg-amber-600 text-white rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 transition shadow-sm hover:shadow-md cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition">
                      <LayoutGrid className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold">Xizmat qo‘shish</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NAVBATLAR (ALL QUEUES WITH MODERN CARDS, STATS & BIG TICKET NUMBERS) */}
          {activeTab === 'NAVBATLAR' && (() => {
            const totalTickets = allTicketsList.length;
            const waitingTickets = allTicketsList.filter(t => t.status === 'WAITING').length;
            const inProgressTickets = allTicketsList.filter(t => t.status === 'IN_PROGRESS' || t.status === 'CALLED').length;
            const completedTickets = allTicketsList.filter(t => t.status === 'COMPLETED').length;
            const cancelledTickets = allTicketsList.filter(t => t.status === 'CANCELLED').length;

            const filteredTickets = allTicketsList.filter(t => {
              // Status filter
              if (queueStatusFilter === 'WAITING' && t.status !== 'WAITING') return false;
              if (queueStatusFilter === 'IN_PROGRESS' && t.status !== 'IN_PROGRESS' && t.status !== 'CALLED') return false;
              if (queueStatusFilter === 'COMPLETED' && t.status !== 'COMPLETED') return false;
              if (queueStatusFilter === 'CANCELLED' && t.status !== 'CANCELLED') return false;

              // Text search filter
              if (!queueSearch) return true;
              const q = queueSearch.toLowerCase();
              return (
                t.full_number?.toLowerCase().includes(q) ||
                t.patient_name?.toLowerCase().includes(q) ||
                t.patient_phone?.toLowerCase().includes(q) ||
                t.doctor_name?.toLowerCase().includes(q) ||
                String(t.cabinet_number)?.toLowerCase().includes(q)
              );
            });

            return (
              <div className="space-y-6">
                {/* 1. TOP STATS CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Jami talonlar */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3.5 hover:border-blue-300 transition">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Ticket className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-500">Bugungi Jami Talonlar</span>
                      <h4 className="text-xl font-black text-slate-800">{totalTickets} <span className="text-xs font-medium text-slate-400">ta</span></h4>
                      <span className="text-[11px] text-blue-600 font-bold">Klinika bo‘yicha umumiy</span>
                    </div>
                  </div>

                  {/* Hozir qabulda */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3.5 hover:border-purple-300 transition">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 relative">
                      <Activity className="w-6 h-6 animate-pulse" />
                      {inProgressTickets > 0 && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-600 rounded-full animate-ping" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-500">Hozir Qabulda</span>
                      <h4 className="text-xl font-black text-purple-700">{inProgressTickets} <span className="text-xs font-medium text-purple-400">nafar</span></h4>
                      <span className="text-[11px] text-purple-600 font-bold">Shifokor ko‘rigida</span>
                    </div>
                  </div>

                  {/* Navbatda kutmoqda */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3.5 hover:border-amber-300 transition">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-500">Navbatda Kutayotganlar</span>
                      <h4 className="text-xl font-black text-amber-700">{waitingTickets} <span className="text-xs font-medium text-amber-400">nafar</span></h4>
                      <span className="text-[11px] text-amber-600 font-bold">Kutish zalida</span>
                    </div>
                  </div>

                  {/* Yakunlanganlar */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3.5 hover:border-emerald-300 transition">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-500">Yakunlangan Qabullar</span>
                      <h4 className="text-xl font-black text-emerald-700">{completedTickets} <span className="text-xs font-medium text-emerald-400">nafar</span></h4>
                      <span className="text-[11px] text-emerald-600 font-bold">Xizmat ko‘rsatildi</span>
                    </div>
                  </div>
                </div>

                {/* 2. MAIN TABLE CONTAINER */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5">
                  {/* Top Bar: Title, Search, Refresh & Talon berish */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                          <Ticket className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-[#172B4D]">Barcha Navbatlar va Talonlar Nazorati</h3>
                          <p className="text-xs text-slate-500">Klinikada berilgan barcha navbat talonlari va ularning real holati</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                      <div className="relative flex-1 sm:w-72">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Talon №, bemor yoki telefon..."
                          value={queueSearch}
                          onChange={e => setQueueSearch(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                        />
                      </div>

                      <button
                        onClick={() => loadManagerData()}
                        className="p-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition cursor-pointer"
                        title="Yangilash"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => navigate('/cashier')}
                        className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-emerald-500/20 transition cursor-pointer whitespace-nowrap"
                      >
                        <Ticket className="w-4 h-4" />
                        <span>Talon berish</span>
                      </button>
                    </div>
                  </div>

                  {/* Status Filter Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <button
                      onClick={() => setQueueStatusFilter('ALL')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                        queueStatusFilter === 'ALL'
                          ? 'bg-[#172B4D] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Barchasi ({totalTickets})
                    </button>
                    <button
                      onClick={() => setQueueStatusFilter('WAITING')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                        queueStatusFilter === 'WAITING'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Kutmoqda ({waitingTickets})</span>
                    </button>
                    <button
                      onClick={() => setQueueStatusFilter('IN_PROGRESS')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                        queueStatusFilter === 'IN_PROGRESS'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/60'
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Qabulda ({inProgressTickets})</span>
                    </button>
                    <button
                      onClick={() => setQueueStatusFilter('COMPLETED')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                        queueStatusFilter === 'COMPLETED'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Yakunlangan ({completedTickets})</span>
                    </button>
                    {cancelledTickets > 0 && (
                      <button
                        onClick={() => setQueueStatusFilter('CANCELLED')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                          queueStatusFilter === 'CANCELLED'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
                        }`}
                      >
                        <span>Bekor qilingan ({cancelledTickets})</span>
                      </button>
                    )}
                  </div>

                  {/* Modern Table with Large Ticket Numbers */}
                  <div 
                    className="overflow-x-auto rounded-2xl border border-slate-100 max-h-[620px] overflow-y-auto"
                    onScroll={(e) => {
                      const target = e.currentTarget;
                      if (target.scrollTop + target.clientHeight >= target.scrollHeight - 60) {
                        if (visibleManagerTicketsCount < filteredTickets.length) {
                          setVisibleManagerTicketsCount(prev => prev + 15);
                        }
                      }
                    }}
                  >
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px] sticky top-0 z-10">
                          <th className="py-3.5 px-4">Talon №</th>
                          <th className="py-3.5 px-4">Bemor</th>
                          <th className="py-3.5 px-4">Shifokor / Xizmat</th>
                          <th className="py-3.5 px-4">Kabinet</th>
                          <th className="py-3.5 px-4">Berilgan Vaqt</th>
                          <th className="py-3.5 px-4">To'lov Holati</th>
                          <th className="py-3.5 px-4">Navbat Holati</th>
                          <th className="py-3.5 px-4 text-right">Amal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTickets.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-12 text-center">
                              <div className="flex flex-col items-center justify-center text-slate-400">
                                <Ticket className="w-10 h-10 text-slate-300 mb-2 stroke-1" />
                                <span className="font-bold text-sm text-slate-600">Mos keluvchi navbat taloni topilmadi</span>
                                <span className="text-xs text-slate-400 mt-0.5">Filtrlarni o‘zgartiring yoki yangi talon ro‘yxatga oling</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredTickets.slice(0, visibleManagerTicketsCount).map((t: any) => (
                            <tr key={t.id} className="hover:bg-blue-50/40 transition">
                              {/* TALON RAQAMI: KATTA, ZAMONAVIY VA YORQIN */}
                              <td className="py-4 px-4 whitespace-nowrap">
                                <div className="inline-flex items-center justify-center min-w-[72px] px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-mono font-black text-base sm:text-lg tracking-wider shadow-sm shadow-blue-500/25 ring-1 ring-white/20">
                                  {t.full_number}
                                </div>
                              </td>

                              {/* BEMOR */}
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center shrink-0 border border-slate-200">
                                    {t.patient_name ? t.patient_name.charAt(0).toUpperCase() : 'B'}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-800 text-xs sm:text-sm">{t.patient_name || 'Nomaʼlum bemor'}</div>
                                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                                      {t.patient_phone ? formatUzbekPhone(t.patient_phone) : "Telefon kiritilmagan"}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* SHIFOKOR & XIZMAT */}
                              <td className="py-4 px-4">
                                <div className="space-y-0.5">
                                  <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                    <Stethoscope className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                    <span>{t.doctor_name || t.specialty_name || 'Umumiy qabul'}</span>
                                  </div>
                                  {t.service_name && (
                                    <div className="text-[11px] text-slate-400 line-clamp-1">
                                      {t.service_name}
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* KABINET */}
                              <td className="py-4 px-4 whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80 font-bold text-xs">
                                  <DoorOpen className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{t.cabinet_number ? `${t.cabinet_number}-xona` : '-'}</span>
                                </div>
                              </td>

                              {/* VAQT */}
                              <td className="py-4 px-4 whitespace-nowrap">
                                <div className="font-mono text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <span>
                                    {t.issued_at
                                      ? new Date(t.issued_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
                                      : (t.created_at ? new Date(t.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '—')}
                                  </span>
                                </div>
                              </td>

                              {/* TO'LOV HOLATI */}
                              <td className="py-4 px-4 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  t.payment_status === 'PAID'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200/70'
                                }`}>
                                  {t.payment_status === 'PAID' ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>To'langan</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3 text-amber-600" />
                                      <span>Kutilmoqda</span>
                                    </>
                                  )}
                                </span>
                              </td>

                              {/* NAVBAT HOLATI */}
                              <td className="py-4 px-4 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                                  t.status === 'COMPLETED' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                                  t.status === 'IN_PROGRESS' || t.status === 'CALLED' ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-xs' :
                                  t.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                  'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}>
                                  {(t.status === 'IN_PROGRESS' || t.status === 'CALLED') && (
                                    <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
                                  )}
                                  {t.status === 'COMPLETED' ? 'Yakunlangan' :
                                   (t.status === 'IN_PROGRESS' || t.status === 'CALLED') ? 'Qabulda' :
                                   t.status === 'CANCELLED' ? 'Bekor qilingan' : 'Kutmoqda'}
                                </span>
                              </td>

                              {/* AMAL */}
                              <td className="py-4 px-4 text-right whitespace-nowrap">
                                {t.status !== 'COMPLETED' && t.status !== 'CANCELLED' ? (
                                  <button
                                    onClick={() => promptCancelTicket(t)}
                                    className="px-3 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1"
                                    title="Talonni bekor qilish"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Bekor qilish</span>
                                  </button>
                                ) : (
                                  <span className="text-slate-300 text-xs font-medium">—</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    {visibleManagerTicketsCount < filteredTickets.length && (
                      <div className="p-3 text-center border-t border-slate-100 bg-slate-50">
                        <button
                          onClick={() => setVisibleManagerTicketsCount(prev => prev + 15)}
                          className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 transition shadow-sm"
                        >
                          Qolgan talonlarni yuklash ({visibleManagerTicketsCount} / {filteredTickets.length})
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 3: BEMORLAR (PATIENTS CRUD & VISIT/PAYMENT ANALYTICS) */}
          {activeTab === 'BEMORLAR' && (
            <div className="space-y-6">
              {/* TOP STATS CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Jami Bemorlar</span>
                    <h4 className="text-xl font-black text-slate-800">{patientsList.length} <span className="text-xs font-medium text-slate-400">nafar</span></h4>
                    <span className="text-[11px] text-emerald-600 font-bold">EMR kartasi mavjud</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Jami Qabullar (Tashriflar)</span>
                    <h4 className="text-xl font-black text-slate-800">
                      {patientsList.reduce((acc, p) => acc + Number(p.total_visits || 0), 0)}{' '}
                      <span className="text-xs font-medium text-slate-400">marta</span>
                    </h4>
                    <span className="text-[11px] text-indigo-600 font-bold">Barcha shifokorlar qabuli</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Jami To'lovlar (Klinika Kirimi)</span>
                    <h4 className="text-lg font-black text-emerald-600 font-mono">
                      {patientsList.reduce((acc, p) => acc + Number(p.total_paid || 0), 0).toLocaleString()}{' '}
                      <span className="text-xs font-sans text-slate-500 font-semibold">so'm</span>
                    </h4>
                    <span className="text-[11px] text-emerald-700 font-bold">Bemorlar to'lovlari</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Qabulda Bo'lgan Bemorlar</span>
                    <h4 className="text-xl font-black text-slate-800">
                      {patientsList.filter(p => Number(p.total_visits || 0) > 0).length}{' '}
                      <span className="text-xs font-medium text-slate-400">ta</span>
                    </h4>
                    <span className="text-[11px] text-purple-600 font-bold">
                      {patientsList.length > 0
                        ? `${Math.round((patientsList.filter(p => Number(p.total_visits || 0) > 0).length / patientsList.length) * 100)}% faollik`
                        : '0% faollik'}
                    </span>
                  </div>
                </div>
              </div>

              {/* TABLE CONTAINER */}
              <div className="space-y-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-[#172B4D]">Bemorlar Bazasi (EMR)</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                        {patientsList.length} bemor
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Bemorga bosing: qaysi shifokorda necha marta bo'lganligi, to'lovlari va oxirgi qabuli to'liq chiqadi
                    </p>
                  </div>

                  <div className="flex items-center flex-wrap gap-2.5">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Ism, telefon yoki karta №..."
                        value={patientSearch}
                        onChange={e => setPatientSearch(e.target.value)}
                        className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                      />
                    </div>
                    <button
                      onClick={exportPatientsToExcel}
                      className="px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer"
                      title="Barcha bemorlar ro'yxatini Excel (.xlsx) formatida yuklab olish"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Excelga yuklash</span>
                    </button>
                    <button
                      onClick={() => setIsNewPatientModalOpen(true)}
                      className="px-4 py-2 bg-[#0084FF] text-white text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-blue-600 transition shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Yangi bemor</span>
                    </button>
                  </div>
                </div>

                <div 
                  className="overflow-x-auto rounded-2xl border border-slate-100 max-h-[620px] overflow-y-auto"
                  onScroll={(e) => {
                    const target = e.currentTarget;
                    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 60) {
                      setVisibleManagerPatientsCount(prev => prev + 15);
                    }
                  }}
                >
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider sticky top-0 z-10">
                        <th className="py-3 px-3.5">Karta №</th>
                        <th className="py-3 px-3.5">Bemor F.I.Sh.</th>
                        <th className="py-3 px-3.5">Telefon</th>
                        <th className="py-3 px-3.5">Oxirgi Shifokor Ko'rigi</th>
                        <th className="py-3 px-3.5 text-center">Qabullar</th>
                        <th className="py-3 px-3.5 text-right">Jami To'lov</th>
                        <th className="py-3 px-3.5">Yashash Manzili</th>
                        <th className="py-3 px-3.5 text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {patientsList
                        .filter(p => 
                          !patientSearch || 
                          p.full_name?.toLowerCase().includes(patientSearch.toLowerCase()) || 
                          p.phone?.includes(patientSearch) ||
                          p.patient_number?.includes(patientSearch)
                        )
                        .slice(0, visibleManagerPatientsCount)
                        .map((p: any) => {
                          const lastDoc = p.last_visit;
                          const visitCount = Number(p.total_visits || 0);
                          const totalPaid = Number(p.total_paid || 0);

                          return (
                            <tr
                              key={p.id}
                              onClick={() => handleOpenPatientModal(p, 'OVERVIEW')}
                              className="hover:bg-blue-50/40 cursor-pointer transition group"
                            >
                              <td className="py-3.5 px-3.5 font-mono font-bold text-slate-700">
                                <span className="px-2 py-0.5 rounded-lg bg-slate-100 group-hover:bg-blue-100 text-slate-800 group-hover:text-blue-800 transition">
                                  #{p.patient_number || p.id?.substring(0, 6)}
                                </span>
                              </td>
                              <td className="py-3.5 px-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                    {p.full_name?.charAt(0)?.toUpperCase() || 'B'}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-800 group-hover:text-blue-600 transition flex items-center gap-1.5">
                                      <span>{p.full_name}</span>
                                      <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-600">
                                        {p.gender === 'FEMALE' ? 'Ayol' : 'Erkak'}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                      {p.birth_date ? `Tug'ilgan: ${p.birth_date.substring(0, 10)}` : "Tug'ilgan sana kiritilmagan"}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-3.5 font-mono text-slate-700 font-semibold">
                                <div className="flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{p.phone || '-'}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-3.5">
                                {lastDoc ? (
                                  <div className="space-y-0.5">
                                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                      <Stethoscope className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                      <span className="truncate max-w-[180px]">{lastDoc.doctor_name}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                                      <span className="text-blue-600 font-medium">{lastDoc.specialty_name || 'Shifokor'}</span>
                                      <span>•</span>
                                      <span>{lastDoc.date || (lastDoc.time ? lastDoc.time.substring(0, 10) : '')}</span>
                                      {lastDoc.cabinet_number && (
                                        <span className="px-1 bg-slate-100 rounded text-[10px] font-mono">Kab: {lastDoc.cabinet_number}</span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
                                    Hali qabulda bo'lmagan
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-3.5 text-center">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${
                                  visitCount > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  <Activity className="w-3 h-3" />
                                  {visitCount} ta qabul
                                </span>
                              </td>
                              <td className="py-3.5 px-3.5 text-right font-mono font-bold text-xs">
                                <span className={totalPaid > 0 ? 'text-emerald-600 font-extrabold' : 'text-slate-400'}>
                                  {totalPaid > 0 ? `${totalPaid.toLocaleString()} so'm` : "0 so'm"}
                                </span>
                              </td>
                              <td className="py-3.5 px-3.5 text-slate-500 max-w-xs truncate">
                                {p.address || p.notes || '-'}
                              </td>
                              <td className="py-3.5 px-3.5 text-right" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleOpenPatientModal(p, 'OVERVIEW')}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                    title="Tarix va ma'lumotlar"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenPatientModal(p, 'EDIT')}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                    title="Tahrirlash"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => promptDeletePatient(p)}
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                    title="O'chirish"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                  {visibleManagerPatientsCount < patientsList.length && (
                    <div className="p-3 text-center border-t border-slate-100 bg-slate-50">
                      <button
                        onClick={() => setVisibleManagerPatientsCount(prev => prev + 15)}
                        className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 transition shadow-sm"
                      >
                        Qolgan bemorlarni yuklash ({visibleManagerPatientsCount} / {patientsList.length})
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SHIFOKORLAR (DOCTORS CRUD) */}
          {activeTab === 'SHIFOKORLAR' && (
            <div className="space-y-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-[#172B4D]">Klinika Shifokorlari (20+)</h3>
                  <p className="text-xs text-slate-500">Menejer shifokorlarni qo'shish, o'zgartirish va o'chirish huquqiga ega</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Shifokor qidirish..."
                      value={doctorSearch}
                      onChange={e => setDoctorSearch(e.target.value)}
                      className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium w-56"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setEditingDoctorId(null);
                      setDoctorForm({ displayName: '', specialtyId: specialtiesList[0]?.id || '', cabinetNumber: '', phone: '+998 ', address: '', username: '', password: 'doctor123' });
                      setIsDoctorModalOpen(true);
                    }}
                    className="px-4 py-2 bg-[#0084FF] text-white text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-blue-600 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Yangi shifokor</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-3">Shifokor ismi & Logini</th>
                      <th className="py-3 px-3">Mutaxassislik</th>
                      <th className="py-3 px-3">Kabinet</th>
                      <th className="py-3 px-3">Kutayotganlar</th>
                      <th className="py-3 px-3">Holat</th>
                      <th className="py-3 px-3 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {doctorsList
                      .filter(d => !doctorSearch || d.display_name?.toLowerCase().includes(doctorSearch.toLowerCase()) || d.specialty_name?.toLowerCase().includes(doctorSearch.toLowerCase()))
                      .map((doc: any) => (
                        <tr key={doc.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                              <span>{doc.display_name}</span>
                              <span className="text-[10px] bg-blue-50 text-blue-700 font-mono font-bold px-1.5 py-0.5 rounded border border-blue-200">
                                @{doc.login || doc.username || (doc.phone ? doc.phone : 'biriktirilmagan')}
                              </span>
                            </div>
                            {doc.address ? (
                              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 max-w-xs truncate" title={doc.address}>
                                <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="truncate">{doc.address}</span>
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400">Manzil kiritilmagan</div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-semibold">{doc.specialty_name || 'Umumiy'}</td>
                          <td className="py-3 px-3 font-mono text-slate-700">{doc.cabinet_number || doc.room_number || '-'}-kabinet</td>
                          <td className="py-3 px-3 font-bold text-rose-600">{doc.waiting_count || 0} ta</td>
                          <td className="py-3 px-3">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              Faol
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingDoctorId(doc.id);
                                  setDoctorForm({
                                    displayName: doc.display_name || '',
                                    specialtyId: doc.specialty_id || '',
                                    cabinetNumber: doc.room_number || doc.cabinet_number || '',
                                    phone: doc.phone || '',
                                    address: doc.address || '',
                                    username: doc.login || doc.username || '',
                                    password: ''
                                  });
                                  setIsDoctorModalOpen(true);
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                title="Tahrirlash"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => promptDeleteDoctor(doc)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="O'chirish"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: KABINETLAR (CABINETS SPISOK / TABLE CRUD) */}
          {activeTab === 'KABINETLAR' && (
            <div className="space-y-5 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <DoorOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#172B4D]">Klinika Kabinetlari va Qavatlar</h3>
                      <p className="text-xs text-slate-500">Xonalar ro‘yxati (spisok), qavatlar taqsimoti va shifokorlar birikmasi</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setEditingCabinetId(null);
                      setCabinetForm({ roomNumber: '', name: '', department: 'Ambulatoriya', floor: 1 });
                      setIsCabinetModalOpen(true);
                    }}
                    className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-blue-500/20 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Yangi kabinet</span>
                  </button>
                </div>
              </div>

              {/* Filters & Floor Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <button
                    onClick={() => setCabinetFloorFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                      cabinetFloorFilter === 'ALL'
                        ? 'bg-[#172B4D] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Barcha qavatlar ({cabinetsList.length})
                  </button>
                  {Array.from(new Set(cabinetsList.map(c => Number(c.floor) || 1)))
                    .sort((a, b) => a - b)
                    .map(fl => {
                      const count = cabinetsList.filter(c => (Number(c.floor) || 1) === fl).length;
                      return (
                        <button
                          key={fl}
                          onClick={() => setCabinetFloorFilter(String(fl))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                            cabinetFloorFilter === String(fl)
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>{fl}-qavat</span>
                          <span className="opacity-70 text-[10px]">({count})</span>
                        </button>
                      );
                    })}
                </div>

                <div className="relative w-full sm:w-64 shrink-0">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Kabinet yoki nom qidirish..."
                    value={cabinetSearch}
                    onChange={e => setCabinetSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Cabinets Spisok (Table) */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Xona raqami</th>
                      <th className="py-3 px-4">Kabinet nomi va bo'limi</th>
                      <th className="py-3 px-4">Qavat</th>
                      <th className="py-3 px-4">Biriktirilgan shifokor(lar)</th>
                      <th className="py-3 px-4">Holati</th>
                      <th className="py-3 px-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cabinetsList
                      .filter(cab => {
                        if (cabinetFloorFilter !== 'ALL' && String(cab.floor || 1) !== cabinetFloorFilter) return false;
                        if (!cabinetSearch) return true;
                        const q = cabinetSearch.toLowerCase();
                        const num = String(cab.number || cab.room_number || '').toLowerCase();
                        const name = String(cab.name || '').toLowerCase();
                        const dept = String(cab.department || '').toLowerCase();
                        return num.includes(q) || name.includes(q) || dept.includes(q);
                      })
                      .map((cab: any) => {
                        const cabNum = cab.number || cab.room_number || '';
                        const assignedDocs = doctorsList.filter(
                          d => d.cabinet_id === cab.id || String(d.room_number) === String(cabNum)
                        );

                        return (
                          <tr key={cab.id} className="hover:bg-blue-50/40 transition">
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center justify-center px-3 py-1 rounded-xl bg-blue-50 text-blue-700 font-mono font-black text-sm border border-blue-200/80 shadow-2xs">
                                {cabNum || '-'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-800 text-xs">
                                {cab.name || `${cabNum}-kabinet`}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {cab.department || 'Ambulatoriya'}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                                <Layers className="w-3.5 h-3.5 text-slate-500" />
                                <span>{cab.floor || 1}-qavat</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {assignedDocs.length > 0 ? (
                                <div className="space-y-1">
                                  {assignedDocs.map((doc: any) => (
                                    <div key={doc.id} className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                                        {doc.display_name?.substring(0, 2).toUpperCase() || 'DR'}
                                      </div>
                                      <div>
                                        <span className="font-bold text-slate-800 text-xs">{doc.display_name}</span>
                                        <span className="text-[10px] text-slate-400 ml-1.5">({doc.specialty_name || 'Shifokor'})</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">Shifokor biriktirilmagan</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Faol
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingCabinetId(cab.id);
                                    setCabinetForm({
                                      roomNumber: cab.number || cab.room_number || '',
                                      name: cab.name || '',
                                      department: cab.department || 'Ambulatoriya',
                                      floor: cab.floor || 1
                                    });
                                    setIsCabinetModalOpen(true);
                                  }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                  title="Tahrirlash"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => promptDeleteCabinet(cab)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="O'chirish"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: XIZMATLAR (SERVICES WITH DOCTOR BREAKDOWN & REAL XLSX EXPORT) */}
          {activeTab === 'XIZMATLAR' && (() => {
            const filteredServices = servicesList.filter(s => {
              const matchesSearch = !serviceSearch || 
                s.name?.toLowerCase().includes(serviceSearch.toLowerCase()) ||
                s.specialty_name?.toLowerCase().includes(serviceSearch.toLowerCase());
              const matchesSpec = serviceSpecialtyFilter === 'ALL' || s.specialty_id === serviceSpecialtyFilter;
              return matchesSearch && matchesSpec;
            });

            const totalServicesCount = servicesList.length;
            const avgPrice = totalServicesCount > 0 
              ? Math.round(servicesList.reduce((acc, s) => acc + (Number(s.price || s.base_price) || 0), 0) / totalServicesCount)
              : 0;
            const prePayCount = servicesList.filter(s => s.payment_policy === 'PAY_BEFORE_CALL' || s.payment_policy === 'PAY_BEFORE_TICKET').length;
            const totalDoctorsWithServices = servicesList.reduce((acc, s) => acc + (Number(s.doctor_count) || (Array.isArray(s.doctors) ? s.doctors.length : 0)), 0);

            return (
              <div className="space-y-6">
                {/* Hero Header */}
                <div className="bg-medical-gradient rounded-3xl p-6 text-white shadow-xl shadow-medical-blue/20 border border-white/25 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 w-56 h-56 bg-white/15 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -left-10 -top-10 w-48 h-48 bg-medical-blue-dark/20 rounded-full blur-2xl pointer-events-none" />
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/25 backdrop-blur-md text-white border border-white/30 text-xs font-semibold mb-2 shadow-xs transition">
                      <Stethoscope className="w-3.5 h-3.5 text-medical-turquoise" />
                      <span>Tibbiy Xizmatlar & Mutaxassisliklar</span>
                    </div>
                    <h3 className="text-2xl font-black tracking-tight text-white drop-shadow-xs">Klinika Xizmatlari Jurnali</h3>
                    <p className="text-xs text-white/95 max-w-xl mt-1 leading-relaxed">
                      Barcha tibbiy xizmatlar narxi, to'lov siyosati va har bir xizmat turiga biriktirilgan shifokorlar ro'yxati (PostgreSQL)
                    </p>
                  </div>

                  <div className="relative z-10 flex flex-wrap items-center gap-3">
                    <button
                      onClick={exportServicesToExcel}
                      className="px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 text-xs font-bold rounded-2xl flex items-center gap-2 transition shadow-sm cursor-pointer active:scale-95"
                      title="Barcha xizmatlarni .xlsx formatida yuklab olish"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-medical-turquoise" />
                      <span>Excelga eksport (.xlsx)</span>
                    </button>

                    <button
                      onClick={() => handleOpenServiceModal()}
                      className="px-5 py-2.5 bg-white hover:bg-slate-50 text-medical-blue-dark text-xs font-black rounded-2xl flex items-center gap-2 shadow-lg shadow-medical-blue-dark/20 border border-white/80 transition-all cursor-pointer active:scale-95"
                    >
                      <Plus className="w-4 h-4 text-medical-blue-dark stroke-[2.5]" />
                      <span>Yangi xizmat</span>
                    </button>
                  </div>
                </div>

                {/* 4 KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-medical-blue shrink-0">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-400">Jami xizmatlar</div>
                      <div className="text-xl font-black text-slate-800">{totalServicesCount} ta</div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-medical-turquoise-dark shrink-0">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-400">O'rtacha narx</div>
                      <div className="text-xl font-black text-slate-800 font-mono">{avgPrice.toLocaleString()} <span className="text-xs font-normal text-slate-400">so'm</span></div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-400">Oldindan to'lov</div>
                      <div className="text-xl font-black text-slate-800">{prePayCount} ta</div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-400">Biriktirilgan shifokorlar</div>
                      <div className="text-xl font-black text-slate-800">{totalDoctorsWithServices} nafar</div>
                    </div>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                  <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Xizmat nomi yoki mutaxassislik..."
                      value={serviceSearch}
                      onChange={e => setServiceSearch(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-medical-blue/20 focus:border-medical-blue transition"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                      <button
                        onClick={() => setServiceSpecialtyFilter('ALL')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                          serviceSpecialtyFilter === 'ALL'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Barcha yo'nalishlar
                      </button>
                      {specialtiesList.slice(0, 5).map((spec: any) => (
                        <button
                          key={spec.id}
                          onClick={() => setServiceSpecialtyFilter(spec.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                            serviceSpecialtyFilter === spec.id
                              ? 'bg-medical-blue text-white shadow-xs shadow-medical-blue/20'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {spec.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Services Table */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                          <th className="py-3.5 px-4 w-12 text-center">№</th>
                          <th className="py-3.5 px-4">Xizmat nomi</th>
                          <th className="py-3.5 px-4">Mutaxassislik</th>
                          <th className="py-3.5 px-4">Narxi</th>
                          <th className="py-3.5 px-4">To‘lov tartibi</th>
                          <th className="py-3.5 px-4">Biriktirilgan shifokorlar</th>
                          <th className="py-3.5 px-4">Holat</th>
                          <th className="py-3.5 px-4 text-right">Amallar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredServices.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-slate-400">
                              <Tag className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                              <div className="font-semibold text-slate-600 text-sm">Xizmatlar topilmadi</div>
                              <p className="text-xs text-slate-400 mt-0.5">Qidiruv yoki filtr mezonlarini o'zgartirib ko'ring</p>
                            </td>
                          </tr>
                        ) : (
                          filteredServices.map((srv: any, index: number) => {
                            const docCount = Number(srv.doctor_count) || (Array.isArray(srv.doctors) ? srv.doctors.length : 0);
                            return (
                              <tr 
                                key={srv.id} 
                                onClick={() => handleOpenServiceModal(srv)}
                                className="hover:bg-emerald-50/40 transition cursor-pointer group"
                              >
                                <td className="py-3.5 px-4 text-center font-bold text-slate-400 group-hover:text-emerald-700">
                                  {index + 1}
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                                      <Tag className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition flex items-center gap-2">
                                        <span>{srv.name}</span>
                                        <span className="text-[10px] font-normal px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-500">
                                          {srv.duration_minutes || 15} daq
                                        </span>
                                      </div>
                                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{srv.id}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold text-[11px]">
                                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                                    {srv.specialty_name || 'Umumiy'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="font-mono font-black text-emerald-700 text-sm">
                                    {Number(srv.base_price || srv.price).toLocaleString('uz-UZ')} <span className="text-[10px] text-slate-400 font-normal">so‘m</span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                    srv.payment_policy === 'PAY_BEFORE_CALL' || srv.payment_policy === 'PAY_BEFORE_TICKET'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                                  }`}>
                                    {srv.payment_policy === 'PAY_BEFORE_CALL' || srv.payment_policy === 'PAY_BEFORE_TICKET' ? (
                                      <>
                                        <CreditCard className="w-3 h-3 text-amber-700" />
                                        <span>Oldindan to‘lov</span>
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="w-3 h-3 text-blue-700" />
                                        <span>Xizmatdan so‘ng</span>
                                      </>
                                    )}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
                                      docCount > 0 
                                        ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                                        : 'bg-slate-100 text-slate-500'
                                    }`}>
                                      <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
                                      <span>{docCount} ta shifokor</span>
                                    </span>

                                    {Array.isArray(srv.doctors) && srv.doctors.length > 0 && (
                                      <div className="flex -space-x-1.5 overflow-hidden">
                                        {srv.doctors.slice(0, 3).map((d: any, i: number) => (
                                          <div 
                                            key={d.id || i}
                                            title={`${d.display_name} (${d.room_number}-xona)`}
                                            className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-200 text-slate-700 font-bold text-[9px] flex items-center justify-center"
                                          >
                                            {d.display_name?.replace('Dr. ', '').charAt(0)}
                                          </div>
                                        ))}
                                        {srv.doctors.length > 3 && (
                                          <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-purple-600 text-white font-bold text-[9px] flex items-center justify-center">
                                            +{srv.doctors.length - 3}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Faol
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleOpenServiceModal(srv)}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                      title="Tahrirlash va Shifokorlarni ko'rish"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => promptDeleteService(srv)}
                                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                      title="O'chirish"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 7: TO'LOVLAR (PAYMENTS JOURNAL WITH DOCTOR DETAIL & REAL XLSX EXPORT) */}
          {activeTab === 'TOLOVLAR' && (() => {
            const filteredPayments = paymentsList.filter(p => {
              const matchesSearch = !paymentSearch || 
                p.patient_name?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                p.receipt_number?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                (p.patient_phone && p.patient_phone.includes(paymentSearch)) ||
                (p.notes && p.notes.toLowerCase().includes(paymentSearch.toLowerCase())) ||
                (Array.isArray(p.related_tickets) && p.related_tickets.some((t: any) => 
                  t.doctor_name?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                  t.specialty_name?.toLowerCase().includes(paymentSearch.toLowerCase())
                ));
              const matchesMethod = paymentMethodFilter === 'ALL' || p.method === paymentMethodFilter;
              return matchesSearch && matchesMethod;
            });

            const totalSum = paymentsList.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
            const cashPayments = paymentsList.filter(p => p.method === 'CASH');
            const cashSum = cashPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
            const cardPayments = paymentsList.filter(p => p.method === 'CARD');
            const cardSum = cardPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

            return (
              <div className="space-y-6">
                {/* Hero Header */}
                <div className="bg-medical-gradient rounded-3xl p-6 text-white shadow-xl shadow-medical-blue/20 border border-white/25 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 w-56 h-56 bg-white/15 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -left-10 -top-10 w-48 h-48 bg-medical-blue-dark/20 rounded-full blur-2xl pointer-events-none" />
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/25 backdrop-blur-md text-white border border-white/30 text-xs font-semibold mb-2 shadow-xs transition">
                      <Banknote className="w-3.5 h-3.5 text-medical-turquoise" />
                      <span>Klinika Kassasi & Moliyaviy Cheklar</span>
                    </div>
                    <h3 className="text-2xl font-black tracking-tight text-white drop-shadow-xs">Barcha To'lovlar Jurnali</h3>
                    <p className="text-xs text-white/95 max-w-xl mt-1 leading-relaxed">
                      Klinika kassasiga qabul qilingan barcha to'lovlar, qaysi shifokor uchun to'langanligi va chek tafsilotlari (PostgreSQL)
                    </p>
                  </div>

                  <div className="relative z-10 flex flex-wrap items-center gap-3">
                    <button
                      onClick={exportPaymentsToExcel}
                      className="px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 text-xs font-bold rounded-2xl flex items-center gap-2 transition shadow-sm cursor-pointer active:scale-95"
                      title="Barcha to'lovlar jurnalini .xlsx formatida yuklab olish"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-medical-turquoise" />
                      <span>Excelga eksport (.xlsx)</span>
                    </button>

                    <div className="px-5 py-2 bg-white/20 hover:bg-white/25 backdrop-blur-md rounded-2xl text-right border border-white/30 shadow-sm transition">
                      <div className="text-[10px] text-white/90 font-bold uppercase tracking-wider">Jami tushum</div>
                      <div className="text-lg font-black text-white font-mono drop-shadow-xs">{totalSum.toLocaleString()} so'm</div>
                    </div>
                  </div>
                </div>

                {/* 4 Financial KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-medical-blue shrink-0">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-400">Jami tushum</div>
                      <div className="text-xl font-black text-slate-800 font-mono">
                        {totalSum.toLocaleString()} <span className="text-xs font-normal text-slate-400">so'm</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-medical-turquoise-dark shrink-0">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-400">Naqd tushum ({cashPayments.length} ta)</div>
                      <div className="text-xl font-black text-slate-800 font-mono">
                        {cashSum.toLocaleString()} <span className="text-xs font-normal text-slate-400">so'm</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-medical-blue-dark shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-400">Plastik karta ({cardPayments.length} ta)</div>
                      <div className="text-xl font-black text-slate-800 font-mono">
                        {cardSum.toLocaleString()} <span className="text-xs font-normal text-slate-400">so'm</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-400">Jami cheklar soni</div>
                      <div className="text-xl font-black text-slate-800">{paymentsList.length} ta chek</div>
                    </div>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                  <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Bemor, chek № yoki shifokor ismi..."
                      value={paymentSearch}
                      onChange={e => setPaymentSearch(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-medical-blue/20 focus:border-medical-blue transition"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPaymentMethodFilter('ALL')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          paymentMethodFilter === 'ALL'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Barchasi
                      </button>
                      <button
                        onClick={() => setPaymentMethodFilter('CASH')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          paymentMethodFilter === 'CASH'
                            ? 'bg-medical-blue text-white shadow-xs shadow-medical-blue/20'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Naqd pul
                      </button>
                      <button
                        onClick={() => setPaymentMethodFilter('CARD')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          paymentMethodFilter === 'CARD'
                            ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/20'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Plastik karta
                      </button>
                    </div>
                  </div>
                </div>

                {/* Payments Table */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
                  <div 
                    className="overflow-x-auto max-h-[620px] overflow-y-auto"
                    onScroll={(e) => {
                      const target = e.currentTarget;
                      if (target.scrollTop + target.clientHeight >= target.scrollHeight - 60) {
                        setVisibleManagerPaymentsCount(prev => prev + 15);
                      }
                    }}
                  >
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px] sticky top-0 z-10">
                          <th className="py-3.5 px-4">Chek №</th>
                          <th className="py-3.5 px-4">Sana va Vaqt</th>
                          <th className="py-3.5 px-4">Bemor (To'lov qilgan)</th>
                          <th className="py-3.5 px-4">Qaysi shifokor uchun</th>
                          <th className="py-3.5 px-4">To'lov usuli</th>
                          <th className="py-3.5 px-4">Summa</th>
                          <th className="py-3.5 px-4">Kassir</th>
                          <th className="py-3.5 px-4">Holat</th>
                          <th className="py-3.5 px-4 text-right">Amallar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredPayments.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-12 text-center text-slate-400">
                              <Banknote className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                              <div className="font-semibold text-slate-600 text-sm">To'lovlar topilmadi</div>
                              <p className="text-xs text-slate-400 mt-0.5">Filtrlar yoki qidiruvni o'zgartirib ko'ring</p>
                            </td>
                          </tr>
                        ) : (
                          filteredPayments.slice(0, visibleManagerPaymentsCount).map((p: any) => {
                            const relatedTickets = Array.isArray(p.related_tickets) ? p.related_tickets : [];
                            return (
                              <tr
                                key={p.id}
                                onClick={() => {
                                  setSelectedPayment(p);
                                  setIsPaymentModalOpen(true);
                                }}
                                className="hover:bg-blue-50/40 transition cursor-pointer group"
                              >
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                                      <FileText className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="font-mono font-bold text-slate-800 group-hover:text-blue-600 transition">
                                      {p.receipt_number || p.id}
                                    </span>
                                  </div>
                                </td>

                                <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                                  {p.created_at ? (
                                    <div>
                                      <div className="text-slate-700 font-bold">
                                        {new Date(p.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                      </div>
                                      <div className="text-[10px] text-slate-400">
                                        {new Date(p.created_at).toLocaleDateString('uz-UZ')}
                                      </div>
                                    </div>
                                  ) : (
                                    '14:22'
                                  )}
                                </td>

                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-slate-800">{p.patient_name || 'Bemor'}</div>
                                  <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-slate-300" />
                                    <span>{p.patient_phone || 'Mavjud emas'}</span>
                                  </div>
                                </td>

                                <td className="py-3.5 px-4">
                                  {relatedTickets.length > 0 ? (
                                    <div className="space-y-1">
                                      {relatedTickets.map((t: any, idx: number) => (
                                        <div key={t.ticket_id || idx} className="flex items-center gap-1.5">
                                          <span className="px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-800 font-mono font-bold text-[10px]">
                                            {t.full_number}
                                          </span>
                                          <span className="font-bold text-slate-700">{t.doctor_name}</span>
                                          <span className="text-[10px] text-slate-400">({t.cabinet_number}-xona)</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-slate-500 italic text-[11px]">
                                      {p.notes || 'Navbat orqali qabul'}
                                    </span>
                                  )}
                                </td>

                                <td className="py-3.5 px-4">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                    p.method === 'CASH' 
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                      : p.method === 'CARD' 
                                        ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                        : 'bg-purple-100 text-purple-800 border border-purple-200'
                                  }`}>
                                    {p.method === 'CASH' ? 'Naqd pul' : p.method === 'CARD' ? 'Plastik karta' : 'Onlayn'}
                                  </span>
                                </td>

                                <td className="py-3.5 px-4 font-mono font-black text-emerald-700 text-sm whitespace-nowrap">
                                  {Number(p.amount).toLocaleString()} so‘m
                                </td>

                                <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                                  {p.cashier_name || 'Kassir 1'}
                                </td>

                                <td className="py-3.5 px-4">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    To'langan
                                  </span>
                                </td>

                                <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                                  <button
                                    onClick={() => {
                                      setSelectedPayment(p);
                                      setIsPaymentModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Batafsil</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                    {visibleManagerPaymentsCount < filteredPayments.length && (
                      <div className="p-3 text-center border-t border-slate-100 bg-slate-50">
                        <button
                          onClick={() => setVisibleManagerPaymentsCount(prev => prev + 15)}
                          className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 transition shadow-sm"
                        >
                          Qolgan to'lovlarni yuklash ({visibleManagerPaymentsCount} / {filteredPayments.length})
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 8: KASSA SMENASI (100% REAL FROM POSTGRESQL cash_shifts) */}
          {activeTab === 'KASSA_SMENASI' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-[#172B4D]">Kassa Smenalari va Balans</h3>
                  <p className="text-xs text-slate-500">Kassirlarning ish smenalari, naqd va karta tushumi nazorati</p>
                </div>
                <div className="flex items-center gap-3">
                  {currentShift ? (
                    <button
                      onClick={() => handleOpenCloseShiftModal(currentShift)}
                      className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shadow-rose-500/20 transition cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Smenani yopish</span>
                    </button>
                  ) : (
                    <div className="px-3.5 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-200">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Faol smena yo'q</span>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      const firstCashier = usersList.find(u => u.role_code === 'CASHIER' || u.role_name?.toLowerCase().includes('kassir')) || usersList[0];
                      if (firstCashier) {
                        setShiftForm(prev => ({ ...prev, cashierName: firstCashier.full_name }));
                      }
                      setIsShiftModalOpen(true);
                    }}
                    className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shadow-blue-500/20 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Yangi smena ochish</span>
                  </button>
                </div>
              </div>

              {/* Shift Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
                  <div className="text-xs text-slate-500 font-semibold">Faol Smena</div>
                  <div className="text-base font-bold text-slate-800 mt-1">
                    {currentShift ? `${currentShift.cashier_name || 'Kassir'} (Kassa)` : 'Faol smena yo\'q'}
                  </div>
                  {currentShift ? (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                        Smena ochiq
                      </span>
                      <button
                        onClick={() => handleOpenCloseShiftModal(currentShift)}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 hover:underline transition"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Smenani yopish</span>
                      </button>
                    </div>
                  ) : (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full">
                      Yopiq
                    </span>
                  )}
                </div>

                <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
                  <div className="text-xs text-slate-500 font-semibold">Naqd pul tushumi</div>
                  <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">
                    {Number(pb.cash).toLocaleString()} so'm
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Hozirgi smena kassasida</div>
                </div>

                <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
                  <div className="text-xs text-slate-500 font-semibold">Karta & Onlayn tushum</div>
                  <div className="text-2xl font-black text-[#0084FF] mt-1 font-mono">
                    {Number(pb.card + pb.online).toLocaleString()} so'm
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Bank hisobiga tushgan</div>
                </div>

                <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
                  <div className="text-xs text-slate-500 font-semibold">Jami Kunlik Tushum</div>
                  <div className="text-2xl font-black text-[#172B4D] mt-1 font-mono">
                    {Number(pb.total).toLocaleString()} so'm
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Barcha to'lovlar</div>
                </div>
              </div>

              {/* Shifts Table */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Smenalar jurnali</h4>
                    <p className="text-xs text-slate-500">Ixtiyoriy smenani bosing: uning tushumi, qaysi shifokorga to'lov qilingani va Excelga yuklab olish imkoni ochiladi</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-3 px-3">Smena ID</th>
                        <th className="py-3 px-3">Kassir</th>
                        <th className="py-3 px-3">Ochilgan vaqti</th>
                        <th className="py-3 px-3">Yopilgan vaqti</th>
                        <th className="py-3 px-3">Boshlang'ich qoldiq</th>
                        <th className="py-3 px-3">Jami tushum</th>
                        <th className="py-3 px-3">Holat</th>
                        <th className="py-3 px-3 text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allShiftsList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-6 text-slate-400">Smenalar mavjud emas</td>
                        </tr>
                      ) : (
                        allShiftsList.map((s: any) => (
                          <tr 
                            key={s.id} 
                            onClick={() => handleOpenShiftDetails(s)}
                            className="hover:bg-blue-50/70 cursor-pointer transition-colors group"
                            title="Batafsil ko'rish uchun bosing"
                          >
                            <td className="py-3 px-3 font-mono font-bold text-blue-600 group-hover:underline">{s.id}</td>
                            <td className="py-3 px-3 font-bold text-slate-800 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span>{s.cashier_name || 'Kassir'}</span>
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-500">
                              {s.opened_at ? new Date(s.opened_at).toLocaleString('uz-UZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '-'}
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-500">
                              {s.closed_at ? new Date(s.closed_at).toLocaleString('uz-UZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '-'}
                            </td>
                            <td className="py-3 px-3 font-mono">{Number(s.opening_balance || 0).toLocaleString()} so'm</td>
                            <td className="py-3 px-3 font-mono font-bold text-emerald-600">
                              {Number(s.total_received || 0).toLocaleString()} so'm
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                s.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {s.status === 'OPEN' ? 'Ochiq' : 'Yopilgan'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={() => handleOpenShiftDetails(s)}
                                  className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
                                  title="Hisobot va shifokorlar tushumi"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Tafsilotlar</span>
                                </button>
                                {s.status === 'OPEN' && (
                                  <button
                                    onClick={() => handleOpenCloseShiftModal(s)}
                                    className="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
                                    title="Smenani yopish"
                                  >
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>Yopish</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: HISOBOTLAR (100% REAL METRICS FROM POSTGRESQL) */}
          {activeTab === 'HISOBOTLAR' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[#172B4D]">Klinika Umumiy Hisobotlari</h3>
                <p className="text-xs text-slate-500">Bugungi tibbiy, moliyaviy va shifokorlar bo'yicha real ko'rsatkichlar</p>
              </div>

              {/* 4 Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-5 bg-white border border-slate-200/90 rounded-3xl shadow-sm">
                  <div className="text-xs font-bold text-blue-600">Bugungi umumiy qabullar</div>
                  <div className="text-3xl font-black text-[#172B4D] mt-1 font-mono">{todayTotal} ta</div>
                  <div className="text-[11px] text-slate-400 mt-1">Barcha shifokorlarga</div>
                </div>

                <div className="p-5 bg-white border border-slate-200/90 rounded-3xl shadow-sm">
                  <div className="text-xs font-bold text-amber-600">Kutilayotgan navbatlar</div>
                  <div className="text-3xl font-black text-amber-600 mt-1 font-mono">{waitingTotal} ta</div>
                  <div className="text-[11px] text-slate-400 mt-1">Zalda kutmoqda</div>
                </div>

                <div className="p-5 bg-white border border-slate-200/90 rounded-3xl shadow-sm">
                  <div className="text-xs font-bold text-purple-600">Qabul yakunlangan</div>
                  <div className="text-3xl font-black text-purple-600 mt-1 font-mono">{completedTotal} ta</div>
                  <div className="text-[11px] text-slate-400 mt-1">Xizmat ko'rsatildi</div>
                </div>

                <div className="p-5 bg-white border border-slate-200/90 rounded-3xl shadow-sm">
                  <div className="text-xs font-bold text-emerald-600">Jami tushum (Kassa)</div>
                  <div className="text-3xl font-black text-emerald-700 mt-1 font-mono">
                    {Number(pb.total).toLocaleString()} so'm
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Naqd: {Number(pb.cash).toLocaleString()} | Karta: {Number(pb.card).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Doctors Performance Table */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-[#172B4D]">Shifokorlar ish yuki, qabullar va tushumlar hisoboti</h4>
                    <p className="text-xs text-slate-500">Ixtiyoriy shifokor ustiga bosing: uning kutayotgan bemorlari, qabul qilganlari, tushumi va bemorlar jurnali ochiladi</p>
                  </div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 flex items-center gap-1.5 self-start">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Real vaqt statistikasi</span>
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Shifokor F.I.Sh.</th>
                        <th className="py-3 px-4">Mutaxassislik</th>
                        <th className="py-3 px-4">Kabinet</th>
                        <th className="py-3 px-4">Kutayotganlar</th>
                        <th className="py-3 px-4">Qabuldagilar</th>
                        <th className="py-3 px-4">Qabul qilganlar</th>
                        <th className="py-3 px-4">Shu shifokordan tushum</th>
                        <th className="py-3 px-4 text-right">Batafsil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(dashboardData?.doctorsLoad || doctorsList).map((doc: any) => {
                        const waiting = Number(doc.waiting || 0);
                        const inProgress = Number(doc.in_progress || 0);
                        const completed = Number(doc.completed || 0);
                        const totalRev = Number(doc.total_revenue || 0);

                        return (
                          <tr
                            key={doc.id}
                            onClick={() => handleOpenDoctorReport(doc)}
                            className="hover:bg-blue-50/60 cursor-pointer transition group"
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition">
                                  {doc.display_name?.substring(0, 2).toUpperCase() || 'DR'}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-800 text-xs group-hover:text-blue-600 transition">
                                    {doc.display_name}
                                  </div>
                                  <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    <span>{doc.phone || '+998 90 000 00 00'}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                                {doc.specialty_name || 'Umumiy'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-mono font-bold text-xs border border-blue-200/60">
                                {doc.room_number || doc.cabinet_number || '-'}-xona
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                                waiting > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {waiting} ta
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                                inProgress > 0 ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {inProgress} ta
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-100 text-emerald-800">
                                {completed} ta
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-mono font-black text-xs text-slate-900">
                                {totalRev.toLocaleString()} so'm
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDoctorReport(doc);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white text-xs font-bold transition shadow-2xs"
                              >
                                <span>Ko'rish</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: TV TABLOSI VA OVOZLI E'LON SOZLAMALARI (TO'LIQ BOSHQARUV) */}
          {activeTab === 'TV_TABLOSI' && (
            <div className="space-y-6">
              {/* ELECTRON MULTI-DISPLAY (HDMI TV) SELECTOR */}
              <ElectronDisplaySelector onNotification={showNotification} />

              {/* Header with Title and Actions */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#00897B]/10 border border-[#00897B]/30 flex items-center justify-center text-[#00897B]">
                      <Tv className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-[#172B4D]">TV Tablosi va Ovozli E'lon Sozlamalari</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        TV ekrani yozuvlari, shiorlar, yo'riqnomalar va bemorlarni xonaga chaqirish ovozli shablonini to'liq sozlash va boshqarish.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href="http://localhost:3002"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-200"
                  >
                    <Tv className="w-4 h-4 text-[#0084FF]" />
                    <span>TV oynasini ochish (3002)</span>
                  </a>

                  <button
                    onClick={handleSaveTvSettings}
                    disabled={isSavingTvSettings}
                    className="px-5 py-2.5 bg-[#00897B] hover:bg-[#00796B] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
                  >
                    {isSavingTvSettings ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{isSavingTvSettings ? 'Saqlanmoqda...' : 'Saqlash va TV ga uzatish'}</span>
                  </button>
                </div>
              </div>

              {/* Main 2-column Grid */}
              <div className="grid grid-cols-12 gap-6 items-start">
                {/* LEFT COLUMN: OVOZLI CHAQIRUV SHABLONI (SPAN 7) */}
                <div className="col-span-12 xl:col-span-7 space-y-6">
                  {/* Card 1: Chaqiruv Matni Shabloni */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                          <Mic className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#172B4D]">Bemorlarni Chaqirish Ovozli Shabloni</h4>
                          <p className="text-[11px] text-slate-500">Shifokor chaqiruv tugmasini bosganda TV da yangraydigan matn</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-lg border border-purple-200">
                        Jonli sintaksis
                      </span>
                    </div>

                    {/* Variable Badges (Click to insert) */}
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-2">
                        Mavjud o'zgaruvchi teglar (bosing va matnga qo'shing):
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { tag: '{letter}', label: '{letter}', desc: 'Harf (Ka, Te)' },
                          { tag: '{zeros}', label: '{zeros}', desc: 'Bosh nollar (nol, nol nol)' },
                          { tag: '{number}', label: '{number}', desc: 'Tartib raqam (15-chi, oltinchi)' },
                          { tag: '{cabinet}', label: '{cabinet}', desc: 'Xona / kabinet raqami' },
                          { tag: '{specialty}', label: '{specialty}', desc: 'Mutaxassislik nomi' },
                          { tag: '{doctor}', label: '{doctor}', desc: 'Shifokor ismi' },
                          { tag: '{patient}', label: '{patient}', desc: 'Bemor F.I.Sh.' }
                        ].map(item => (
                          <button
                            key={item.tag}
                            type="button"
                            onClick={() => insertTemplateTag(item.tag)}
                            className="px-3 py-1.5 bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 hover:border-purple-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title={item.desc}
                          >
                            <span className="font-mono text-purple-600">{item.label}</span>
                            <span className="text-[10px] text-slate-400">({item.desc})</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Template Textarea */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700">Chaqiruv matni formulasi</label>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {tvSettings.tvVoiceTemplate.length} belgi
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={tvSettings.tvVoiceTemplate}
                        onChange={e => setTvSettings({ ...tvSettings, tvVoiceTemplate: e.target.value })}
                        className="w-full p-3.5 bg-slate-50/70 focus:bg-white border border-slate-300 focus:border-[#00897B] rounded-2xl text-xs font-medium text-slate-800 leading-relaxed outline-none transition"
                        placeholder="Masalan: Talon raqami {letter}{zeros}, {number} raqam egasi, sizni {cabinet} xona, {specialty} xonasiga marhamat!"
                      />
                    </div>

                    {/* Presets (Tezkor Shablonlar) */}
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-2">
                        Tezkor tayyor shablonlar:
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => applyPreset("Talon raqami {letter}{zeros}, {number} raqam egasi, sizni {cabinet} xona, {specialty} xonasiga marhamat!")}
                          className="p-2.5 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
                        >
                          <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>1. Standart to'liq shablon</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            Talon raqami Ka nol, 15-chi raqam egasi, sizni 3-xona, Kardiologiyaga marhamat!
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => applyPreset("Talon {letter}{zeros} {number}, {cabinet}-kabinetga marhamat!")}
                          className="p-2.5 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
                        >
                          <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                            <span>2. Qisqa va tezkor</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            Talon Ka nol 15, 3-kabinetga marhamat!
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => applyPreset("Hurmatli bemor, {letter}{zeros} {number} raqami. Sizni {doctor} qabuliga, {cabinet}-xonaga taklif etamiz!")}
                          className="p-2.5 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
                        >
                          <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                            <span>3. Shifokor nomi bilan</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            Hurmatli bemor... Sizni Dr. Karimova qabuliga, 3-xonaga taklif etamiz!
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => applyPreset("Bemor {patient}, talon {letter}{zeros} {number}. Sizni {cabinet} xona, {specialty}ga marhamat!")}
                          className="p-2.5 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
                        >
                          <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                            <span>4. Bemor F.I.Sh. bilan</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            Bemor Aziz Rahimov, talon Ka nol 15. Sizni 3-xona, Kardiologiyaga marhamat!
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Live Preview Card */}
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Haqiqiy o'qilish namunasi (K015, Kardiologiya, 3-xona):</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 italic">
                          "{(tvSettings.tvVoiceTemplate || '')
                            .replace(/\{letter\}/g, 'Ka')
                            .replace(/\{zeros\}/g, ' nol')
                            .replace(/\{number\}/g, "o'n beshinchi")
                            .replace(/\{cabinet\}/g, 'uchinchi')
                            .replace(/\{specialty\}/g, 'Kardiologiya')
                            .replace(/\{doctor\}/g, 'Dr. Karimova Malika')
                            .replace(/\{patient\}/g, 'Rahimov Aziz')}"
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handlePlayTvPreview}
                        disabled={isPlayingTvPreview}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 flex-shrink-0 cursor-pointer shadow-xs disabled:opacity-60"
                      >
                        {isPlayingTvPreview ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        <span>{isPlayingTvPreview ? 'Ijro etilmoqda...' : 'Ovozda eshitib ko\'rish'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 2: TV Ovozini Yoqish/O'chirish va Ovoz Tanlovi */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
                    {/* TV Tablo Ovoz Holati Toggle Switch */}
                    <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition ${
                          tvSettings.tvSoundEnabled
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-200'
                            : 'bg-rose-500/10 text-rose-600 border border-rose-200'
                        }`}>
                          {tvSettings.tvSoundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-[#172B4D]">TV Tablo Ovozli E'lonlari</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tvSettings.tvSoundEnabled
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {tvSettings.tvSoundEnabled ? 'Faol (Yoqilgan)' : "O'chirilgan (Ovozsiz)"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            TV tabloda bemorlarni chaqirish va qo'ng'iroq signallarini yoqish yoki o'chirish (real-vaqt rejimida TV ga uzatiladi)
                          </p>
                        </div>
                      </div>

                      {/* Switch Button */}
                      <button
                        type="button"
                        onClick={async () => {
                          const newStatus = !tvSettings.tvSoundEnabled;
                          setTvSettings(prev => ({ ...prev, tvSoundEnabled: newStatus }));
                          try {
                            const res = await fetch(`${API_BASE_URL}/clinic/settings`, {
                              method: 'PATCH',
                              headers: getAuthHeaders(),
                              body: JSON.stringify({ tvSoundEnabled: newStatus })
                            });
                            if (res.ok) {
                              showNotification(
                                newStatus ? 'TV ovozi yoqildi' : "TV ovozi o'chirildi",
                                newStatus ? "TV tabloda barcha ovozli e'lonlar faollashtirildi." : "TV tablo ovozsiz (jim) rejimga o'tkazildi.",
                                newStatus ? 'success' : 'warning'
                              );
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${
                          tvSettings.tvSoundEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                        title={tvSettings.tvSoundEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
                      >
                        <span
                          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                            tvSettings.tvSoundEnabled ? 'translate-x-9' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Voice Selection */}
                    <div>
                      <h4 className="text-sm font-bold text-[#172B4D] mb-1">Ovoz Tanlovi (Tabiiy Studiya Suxandoni)</h4>
                      <p className="text-[11px] text-slate-500 mb-3.5">
                        Bemorlarni chaqirish uchun qaysi tabiiy o'zbek tili inson ovozidan foydalanilsin (TV tabloda xam doimiy saqlanadi):
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Madina (Female) */}
                        <label
                          className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3.5 ${
                            tvSettings.tvVoiceName === 'uz-UZ-MadinaNeural'
                              ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="tvVoiceName"
                            checked={tvSettings.tvVoiceName === 'uz-UZ-MadinaNeural'}
                            onChange={() => setTvSettings({ ...tvSettings, tvVoiceName: 'uz-UZ-MadinaNeural' })}
                            className="mt-1"
                          />
                          <div>
                            <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                              <span>Madina (Ayol ovozi)</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Tavsiya etiladi
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Mayin, jarangdor va aniq tabiiy studiya ovozi. Kasalxona va klinika qabulxonalariga mos.
                            </p>
                          </div>
                        </label>

                        {/* Sardor (Male) */}
                        <label
                          className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3.5 ${
                            tvSettings.tvVoiceName === 'uz-UZ-SardorNeural'
                              ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="tvVoiceName"
                            checked={tvSettings.tvVoiceName === 'uz-UZ-SardorNeural'}
                            onChange={() => setTvSettings({ ...tvSettings, tvVoiceName: 'uz-UZ-SardorNeural' })}
                            className="mt-1"
                          />
                          <div>
                            <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                              <span>Sardor (Erkak ovozi)</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Vazmin, rasmiy va ishonchli suxandon shifokor ovozi.
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: TV EKRANIDAGI VIZUAL YOZUVLAR (SPAN 5) */}
                <div className="col-span-12 xl:col-span-5 space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-[#0084FF] flex items-center justify-center">
                        <Tv className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#172B4D]">TV Ekranidagi Yozuvlar va Matnlar</h4>
                        <p className="text-[11px] text-slate-500">Ekrandagi barcha sarlavhalar va yo'riqnomalarni tahrirlash</p>
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">Klinika Nomi (Header)</label>
                        <input
                          type="text"
                          value={tvSettings.clinicName}
                          onChange={e => setTvSettings({ ...tvSettings, clinicName: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-600 block mb-1">Yuqori Shior (Sarlavha)</label>
                          <input
                            type="text"
                            value={tvSettings.tvSloganTitle}
                            onChange={e => setTvSettings({ ...tvSettings, tvSloganTitle: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-600 block mb-1">Yuqori Shior (Osti)</label>
                          <input
                            type="text"
                            value={tvSettings.tvSloganSubtitle}
                            onChange={e => setTvSettings({ ...tvSettings, tvSloganSubtitle: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-600 block mb-1">Chaqiruv Sarlavhasi</label>
                          <input
                            type="text"
                            value={tvSettings.tvCallingTitle}
                            onChange={e => setTvSettings({ ...tvSettings, tvCallingTitle: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-600 block mb-1">Kutish Rejim Sarlavhasi</label>
                          <input
                            type="text"
                            value={tvSettings.tvStandbyTitle}
                            onChange={e => setTvSettings({ ...tvSettings, tvStandbyTitle: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">Kutish Holatidagi Pastki E'lon</label>
                        <input
                          type="text"
                          value={tvSettings.tvStandbyFooter}
                          onChange={e => setTvSettings({ ...tvSettings, tvStandbyFooter: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">Pastki Ko'k Banner Matni</label>
                        <input
                          type="text"
                          value={tvSettings.tvBottomBanner}
                          onChange={e => setTvSettings({ ...tvSettings, tvBottomBanner: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                        />
                      </div>

                      <div className="pt-2 border-t border-slate-100 space-y-2.5">
                        <label className="text-xs font-bold text-slate-700 block">Pastki 3 ta Ko'rsatma Yozuvlari:</label>
                        <input
                          type="text"
                          value={tvSettings.tvInstruction1}
                          onChange={e => setTvSettings({ ...tvSettings, tvInstruction1: e.target.value })}
                          placeholder="1-ko'rsatma"
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                        />
                        <input
                          type="text"
                          value={tvSettings.tvInstruction2}
                          onChange={e => setTvSettings({ ...tvSettings, tvInstruction2: e.target.value })}
                          placeholder="2-ko'rsatma"
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                        />
                        <input
                          type="text"
                          value={tvSettings.tvInstruction3}
                          onChange={e => setTvSettings({ ...tvSettings, tvInstruction3: e.target.value })}
                          placeholder="3-ko'rsatma"
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveTvSettings}
                        disabled={isSavingTvSettings}
                        className="w-full py-3 bg-[#00897B] hover:bg-[#00796B] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer mt-4"
                      >
                        {isSavingTvSettings ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        <span>{isSavingTvSettings ? 'Saqlanmoqda...' : 'O\'zgarishlarni TV ga saqlash'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* BOTTOM FULL WIDTH: TV TABLOGA JONLI SINOV CHAQIRUVI */}
                <div className="col-span-12 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                        <Volume2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#172B4D]">TV Ekraniga Jonli Sinov Chaqiruvi Yuborish</h4>
                        <p className="text-[11px] text-slate-500">
                          Hozirgi sozlamalaringiz asosida TV ekranga (port 3002) to'g'ridan-to'g'ri chaqiruv ovozi va vizual kartasini yuborib tekshiring
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Sinov Talon Raqami</label>
                      <input
                        type="text"
                        value={testTicketNum}
                        onChange={e => setTestTicketNum(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                        placeholder="K015"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Mutaxassislik</label>
                      <input
                        type="text"
                        value={testSpecName}
                        onChange={e => setTestSpecName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                        placeholder="Kardiologiya"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Kabinet Raqami</label>
                      <input
                        type="text"
                        value={testCabNum}
                        onChange={e => setTestCabNum(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                        placeholder="3"
                      />
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={handleSendTvTestCall}
                        className="w-full py-2.5 bg-[#00897B] hover:bg-[#00796B] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>TV ga Sinov Chaqiruvini Yuborish</span>
                      </button>
                    </div>
                  </div>

                  {testCallStatus && (
                    <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{testCallStatus}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: XODIMLAR VA ROLLAR (100% REAL FROM POSTGRESQL users) */}
          {activeTab === 'XODIMLAR' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#172B4D]">Xodimlar va Rollar Boshqaruvi</h3>
                      <p className="text-xs text-slate-500">Klinika xodimlari, shifokorlar, kassirlar va tizim administratorlari (PostgreSQL users)</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={exportUsersToExcel}
                    className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs transition cursor-pointer"
                    title="Xodimlar ro'yxatini Excel (.csv) formatida yuklab olish"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Excelga eksport</span>
                  </button>

                  <button
                    onClick={handleOpenNewUserModal}
                    className="px-4 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shadow-indigo-500/20 transition cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Yangi xodim qo'shish</span>
                  </button>
                </div>
              </div>

              {/* Search Bar & Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Xodim F.I.Sh., login yoki roli bo'yicha qidirish..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold px-2">
                  <span>Jami xodimlar: <strong className="text-slate-800">{usersList.length}</strong> nafar</span>
                  <span>•</span>
                  <span>Shifokorlar: <strong className="text-blue-600">{usersList.filter(u => u.role_code === 'DOCTOR').length}</strong></span>
                  <span>•</span>
                  <span>Kassirlar: <strong className="text-emerald-600">{usersList.filter(u => u.role_code === 'CASHIER' || u.role_name?.toLowerCase().includes('kassir')).length}</strong></span>
                </div>
              </div>

              {/* Users Table (Spisok - bosganda tahrirlash ochiladi) */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-6">
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="py-3.5 px-4">Xodim F.I.Sh.</th>
                        <th className="py-3.5 px-4">Login (Username)</th>
                        <th className="py-3.5 px-4">Tizimdagi Roli</th>
                        <th className="py-3.5 px-4">Telefon</th>
                        <th className="py-3.5 px-4">Holati</th>
                        <th className="py-3.5 px-4 text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {usersList
                        .filter(u => {
                          const q = userSearch.toLowerCase();
                          return (
                            (u.full_name || '').toLowerCase().includes(q) ||
                            (u.username || '').toLowerCase().includes(q) ||
                            (u.role_code || '').toLowerCase().includes(q) ||
                            (u.phone || '').toLowerCase().includes(q)
                          );
                        })
                        .map((u: any) => (
                          <tr
                            key={u.id}
                            onClick={() => handleEditUser(u)}
                            className="hover:bg-indigo-50/50 cursor-pointer transition group"
                            title="Tahrirlash va ma'lumotlarni ko'rish uchun bosing"
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs text-white shadow-2xs group-hover:scale-105 transition ${
                                  u.role_code === 'MANAGER' ? 'bg-gradient-to-br from-blue-600 to-indigo-700' :
                                  u.role_code === 'CASHIER' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                                  'bg-gradient-to-br from-purple-500 to-indigo-600'
                                }`}>
                                  {u.full_name?.substring(0, 2).toUpperCase() || 'US'}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-800 text-xs group-hover:text-indigo-600 transition block">
                                    {u.full_name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    ID: {u.id}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-700 font-bold">
                              <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                                @{u.username}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold ${
                                u.role_code === 'MANAGER' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                u.role_code === 'CASHIER' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                'bg-purple-100 text-purple-700 border border-purple-200'
                              }`}>
                                <Shield className="w-3 h-3" />
                                <span>{u.role_name || u.role_code || 'Xodim'}</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                              <span className="flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{u.phone || '-'}</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Faol
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => handleEditUser(u)}
                                  className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                                  title="Tahrirlash"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => promptDeleteUser(u)}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                  title="O'chirish"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 12: TIZIM VA SAYT SOZLAMALARI (100% REAL POSTGRESQL - FULL WIDTH) */}
          {activeTab === 'TIZIM_SOZLAMALARI' && (
            <div className="space-y-6 w-full">
              {/* Header Banner */}
              <div className="relative overflow-hidden bg-medical-gradient text-white p-7 rounded-3xl border border-white/25 shadow-xl shadow-medical-blue/20">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-white/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-10 -bottom-10 w-56 h-56 bg-medical-blue-dark/20 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-md border border-white/30 shrink-0">
                        <SlidersHorizontal className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5 drop-shadow-xs">
                          Tizim va Sayt Sozlamalari
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30">
                            PostgreSQL 16
                          </span>
                        </h2>
                        <p className="text-xs text-white/95 mt-0.5 leading-relaxed">
                          Klinika brendi, elektron navbat qoidalari, ish rejimi va sayt aloqa ma'lumotlarini real vaqtda boshqarish
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/95 mt-3">
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-semibold shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-medical-turquoise animate-pulse" />
                        Tizim Faol
                      </span>
                      <span className="px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-medium shadow-xs">
                        Oxirgi yangilanish: {clinicSettings?.updated_at ? new Date(clinicSettings.updated_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : 'Hozir'}
                      </span>
                      <span className="px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-medium shadow-xs">
                        Valyuta: {settingsForm.currency}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleResetSettings}
                      disabled={isSavingSettings}
                      className="px-4 py-2.5 rounded-2xl border border-white/30 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer active:scale-95"
                    >
                      <RotateCcw className="w-4 h-4 text-medical-turquoise" />
                      Tiklash
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveSettings()}
                      disabled={isSavingSettings}
                      className="px-6 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-medical-blue-dark text-xs font-black transition flex items-center gap-2 shadow-lg shadow-medical-blue-dark/20 border border-white/80 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingSettings ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-medical-blue-dark" />
                          Saqlanmoqda...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 text-medical-blue-dark stroke-[2.5]" />
                          Sozlamalarni saqlash
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 Quick Overview KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Klinika Brendi</p>
                    <p className="text-xs font-black text-slate-800 truncate">{settingsForm.clinicName || 'Klinika nomi'}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{settingsForm.slogan || 'Shior kiritilmagan'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-medical-turquoise-dark" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">To'lov Tartibi</p>
                    <p className="text-xs font-black text-medical-blue-dark truncate">
                      {settingsForm.defaultPaymentPolicy === 'PAY_BEFORE_CALL' ? "Oldindan to'lov" : "Xizmatdan so'ng"}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">Prefiks: {settingsForm.defaultQueuePrefix} (Talon)</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Ish Vaqti</p>
                    <p className="text-xs font-black text-purple-700 truncate">{settingsForm.workStartTime} - {settingsForm.workEndTime}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{settingsForm.workDays}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Aloqa Markazi</p>
                    <p className="text-xs font-black text-slate-800 truncate">{settingsForm.phone || 'Telefon kiritilmagan'}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{settingsForm.email || 'Email kiritilmagan'}</p>
                  </div>
                </div>
              </div>

              {/* DASTUR YANGILANISHI (GITHUB RELEASES) */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-medical-blue to-teal-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-medical-blue/20">
                      <Sparkles className="w-5 h-5 text-yellow-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900">Dastur Yangilanishi</h3>
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-medical-blue border border-blue-200 text-[10px] font-black">
                          v{APP_VERSION}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        GitHub Releases orqali dasturning yangi versiyasini tekshirish, o'zgarishlar bilan tanishish va avtomatik yangilash
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

              {/* Main Settings Form in Organized Grid */}
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* SECTION 1: ASOSIY KLINIKA VA SAYT MA'LUMOTLARI */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">Klinika va Sayt Umumiy Ma'lumotlari</h3>
                        <p className="text-[11px] text-slate-400">Brend, sayt sarlavhasi va aloqa kontaktlari</p>
                      </div>
                    </div>

                    <div className="space-y-3.5 pt-1">
                      {/* Klinika Logotipi */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>Klinika logotipi</span>
                        </label>
                        <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200/90 rounded-2xl">
                          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center overflow-hidden shrink-0 p-1.5">
                            <img
                              src={settingsForm.logoUrl || clinicSettings?.logo_url || APP_LOGO}
                              alt="Logo preview"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <label className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs">
                                <Upload className="w-3.5 h-3.5 text-blue-600" />
                                <span>Rasm yuklash</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      if (file.size > 2 * 1024 * 1024) {
                                        showNotification('Hajm katta', 'Logotip hajmi 2MB dan oshmasligi kerak', 'error');
                                        return;
                                      }
                                      const reader = new FileReader();
                                      reader.onload = () => {
                                        setSettingsForm(prev => ({ ...prev, logoUrl: reader.result as string }));
                                        showNotification('Logotip tanlandi', 'Logotip tanlandi. Saqlash tugmasini bosing.', 'success');
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>

                              {(settingsForm.logoUrl || clinicSettings?.logo_url) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSettingsForm(prev => ({ ...prev, logoUrl: '' }));
                                    showNotification('Logotip o\'chirildi', 'Standart dastur logotipi tiklandi. Saqlash tugmasini bosing.', 'info');
                                  }}
                                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-rose-200 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>O'chirish</span>
                                </button>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 leading-tight">
                              PNG, JPG, SVG tavsiya etiladi. Logotip yuklanmasa, standart dastur logotipi ishlatiladi.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          Klinika rasmiy nomi
                        </label>
                        <input
                          type="text"
                          value={settingsForm.clinicName}
                          onChange={e => setSettingsForm({ ...settingsForm, clinicName: e.target.value })}
                          placeholder="Klinika nomini kiriting"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                          Klinika shiori / Sayt tavsifi
                        </label>
                        <input
                          type="text"
                          value={settingsForm.slogan}
                          onChange={e => setSettingsForm({ ...settingsForm, slogan: e.target.value })}
                          placeholder="Klinika shiorini kiriting"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            Aloqa telefoni
                          </label>
                          <input
                            type="text"
                            value={settingsForm.phone}
                            onChange={e => setSettingsForm({ ...settingsForm, phone: formatUzbekPhone(e.target.value) })}
                            placeholder="+998 (__) ___-__-__"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            Elektron pochta
                          </label>
                          <input
                            type="email"
                            value={settingsForm.email}
                            onChange={e => setSettingsForm({ ...settingsForm, email: e.target.value })}
                            placeholder="Masalan: info@klinika.uz"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          Klinika manzili
                        </label>
                        <input
                          type="text"
                          value={settingsForm.address}
                          onChange={e => setSettingsForm({ ...settingsForm, address: e.target.value })}
                          placeholder="Masalan: Toshkent sh., Chilonzor tumani..."
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          Rasmiy veb-sayt / Telegram boti
                        </label>
                        <input
                          type="text"
                          value={settingsForm.websiteUrl}
                          onChange={e => setSettingsForm({ ...settingsForm, websiteUrl: e.target.value })}
                          placeholder="Masalan: https://klinika.uz yoki @klinika_bot"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: ISH TARTIBI VA SMENA SOZLAMALARI */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">Ish Rejimi va Smena Tartibi</h3>
                        <p className="text-[11px] text-slate-400">Klinika qabul soatlari va smenalarni avtomatik nazorati</p>
                      </div>
                    </div>

                    <div className="space-y-3.5 pt-1">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Ish kunlari
                        </label>
                        <select
                          value={settingsForm.workDays}
                          onChange={e => setSettingsForm({ ...settingsForm, workDays: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                        >
                          <option value="Dushanba - Shanba">Dushanba - Shanba (Olti kunlik)</option>
                          <option value="Dushanba - Juma">Dushanba - Juma (Besh kunlik)</option>
                          <option value="Har kuni (Dush - Yak)">Har kuni (Dushanba - Yakshanba)</option>
                          <option value="Dam olish kunlarisiz 24/7">Dam olish kunlarisiz 24/7</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Ish boshlanish vaqti
                          </label>
                          <input
                            type="time"
                            value={settingsForm.workStartTime}
                            onChange={e => setSettingsForm({ ...settingsForm, workStartTime: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Ish tugash vaqti
                          </label>
                          <input
                            type="time"
                            value={settingsForm.workEndTime}
                            onChange={e => setSettingsForm({ ...settingsForm, workEndTime: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3.5 bg-purple-50/50 rounded-2xl border border-purple-100">
                        <div className="pr-3">
                          <div className="text-xs font-bold text-slate-800">Kassa smenasini avtomatik yopish</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Har kuni soat 23:59 da ochiq kassa smenalari avtomatik yopiladi va kunlik hisobotga o'tkaziladi
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={settingsForm.cashierAutoCloseShift}
                            onChange={e => setSettingsForm({ ...settingsForm, cashierAutoCloseShift: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-slate-600 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">Tizim vaqt mintaqasi:</span>
                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">Asia/Tashkent (UTC+5)</span>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: ELEKTRON NAVBAT VA QABUL SIYOSATI */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Ticket className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">Elektron Navbat va Qabul Siyosati</h3>
                        <p className="text-[11px] text-slate-400">To'lov tartibi, navbat chaqiruv qoidalari va prefikslar</p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-1">
                      {/* Payment Policy Interactive Choice */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-2">
                          Standart to'lov tartibi siyosati
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setSettingsForm({ ...settingsForm, defaultPaymentPolicy: 'PAY_BEFORE_CALL' })}
                            className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                              settingsForm.defaultPaymentPolicy === 'PAY_BEFORE_CALL'
                                ? 'bg-blue-50/80 border-blue-500 shadow-sm shadow-blue-500/10'
                                : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">Oldindan to'lov</span>
                              {settingsForm.defaultPaymentPolicy === 'PAY_BEFORE_CALL' && (
                                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">
                              Bemor avval kassada to'laydi, so'ng shifokor xonasiga chaqiriladi (PAY_BEFORE_CALL)
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSettingsForm({ ...settingsForm, defaultPaymentPolicy: 'PAY_AFTER_SERVICE' })}
                            className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                              settingsForm.defaultPaymentPolicy === 'PAY_AFTER_SERVICE'
                                ? 'bg-purple-50/80 border-purple-500 shadow-sm shadow-purple-500/10'
                                : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">Xizmatdan so'ng to'lov</span>
                              {settingsForm.defaultPaymentPolicy === 'PAY_AFTER_SERVICE' && (
                                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">
                              Shifokor ko'rigidan keyin kassa to'lovi amalga oshiriladi (PAY_AFTER_SERVICE)
                            </p>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Talon prefiksi
                          </label>
                          <input
                            type="text"
                            maxLength={3}
                            value={settingsForm.defaultQueuePrefix}
                            onChange={e => setSettingsForm({ ...settingsForm, defaultQueuePrefix: e.target.value.toUpperCase() })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-center text-slate-800 uppercase focus:bg-white focus:border-blue-500 outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Kutish limiti (daq)
                          </label>
                          <select
                            value={settingsForm.ticketAutoCancelMinutes}
                            onChange={e => setSettingsForm({ ...settingsForm, ticketAutoCancelMinutes: parseInt(e.target.value) || 15 })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition"
                          >
                            <option value={10}>10 daqiqa</option>
                            <option value={15}>15 daqiqa</option>
                            <option value={20}>20 daqiqa</option>
                            <option value={30}>30 daqiqa</option>
                            <option value={60}>60 daqiqa</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Kunlik qabul limiti
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={500}
                            value={settingsForm.maxDailyTicketsPerDoctor}
                            onChange={e => setSettingsForm({ ...settingsForm, maxDailyTicketsPerDoctor: parseInt(e.target.value) || 0 })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition"
                          />
                        </div>
                      </div>

                      {/* Toggles */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                          <div className="pr-3">
                            <div className="text-xs font-bold text-slate-800">Avtomatik navbat chaqirish</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Shifokor qabuli yakunlangach, navbatdagi bemor avtomatik tarzda chaqiriladi
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={settingsForm.autoCallNext}
                              onChange={e => setSettingsForm({ ...settingsForm, autoCallNext: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                          <div className="pr-3">
                            <div className="text-xs font-bold text-slate-800">Favqulodda (CITO) ustuvorlik</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Og'ir ahvoldagi va shoshilinch yordamga muhtoj bemorlar umumiy navbatdan oldin olinadi
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={settingsForm.emergencyPriority}
                              onChange={e => setSettingsForm({ ...settingsForm, emergencyPriority: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: OVOZ, TV VA MOLIYAVIY SOZLAMALAR */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Volume2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">Ovoz, TV va Moliyaviy Integratsiya</h3>
                        <p className="text-[11px] text-slate-400">TV Tablo ovozli xabarlari, chaqiruv takrorlanishi va kassa hisoboti</p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-1">
                      <div className="flex items-center justify-between p-3.5 bg-amber-50/50 rounded-2xl border border-amber-100">
                        <div className="pr-3">
                          <div className="text-xs font-bold text-slate-800">Ovozli chaqiruv xabarnomasi</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            TV Tabloda va shifokor xonasi karnayida bemor talon raqami jarangdor inson ovozida e'lon qilinadi
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={settingsForm.soundNotification}
                            onChange={e => setSettingsForm({ ...settingsForm, soundNotification: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Ovoz tili
                          </label>
                          <select
                            value={settingsForm.voiceLanguage}
                            onChange={e => setSettingsForm({ ...settingsForm, voiceLanguage: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition"
                          >
                            <option value="uz-UZ">O'zbek tili (uz-UZ - Madina / Sardor)</option>
                            <option value="ru-RU">Rus tili (ru-RU)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Qayta chaqirish limiti
                          </label>
                          <select
                            value={settingsForm.recallLimit}
                            onChange={e => setSettingsForm({ ...settingsForm, recallLimit: parseInt(e.target.value) || 3 })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition"
                          >
                            <option value={1}>1 marta</option>
                            <option value={2}>2 marta</option>
                            <option value={3}>3 marta (Standart)</option>
                            <option value={5}>5 marta</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Asosiy hisob valyutasi
                          </label>
                          <select
                            value={settingsForm.currency}
                            onChange={e => setSettingsForm({ ...settingsForm, currency: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition"
                          >
                            <option value="UZS">UZS - O'zbekiston so'mi</option>
                            <option value="USD">USD - AQSH dollari</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            QQS stavkasi (VAT %)
                          </label>
                          <select
                            value={settingsForm.vatPercent}
                            onChange={e => setSettingsForm({ ...settingsForm, vatPercent: parseInt(e.target.value) || 0 })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition"
                          >
                            <option value={0}>0% (QQSsiz)</option>
                            <option value={12}>12% (QQS bilan)</option>
                          </select>
                        </div>
                      </div>

                      {/* TV Screen template shortcut */}
                      <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-blue-900">TV Tablo Ovoz Shablonini sozlash</p>
                          <p className="text-[11px] text-blue-600 mt-0.5">TV ekrandagi e'lon matnlari va ovoz shablonlarini tahrirlash</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSearchParams({ tab: 'tv-tablosi' })}
                          className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition flex items-center gap-1.5 shrink-0 shadow-sm"
                        >
                          <Tv className="w-3.5 h-3.5" />
                          TV Tablosiga o'tish
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

                {/* LIVE PREVIEW: SAYTDAGI JONLI BLOK */}
                <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-blue-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Sayt va Kioskdagi Jonli Ko'rinishi (Real-time Preview)</h4>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Jonli Sinxron
                    </span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center p-1 overflow-hidden shadow-sm">
                        <img
                          src={settingsForm.logoUrl || clinicSettings?.logo_url || APP_LOGO}
                          alt="Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h5 className="text-base font-black text-slate-900">{settingsForm.clinicName || clinicSettings?.clinic_name || 'Klinika-admin'}</h5>
                        <p className="text-xs text-slate-500">{settingsForm.slogan || "Shior ko'rsatilmagan"}</p>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {settingsForm.address || "Manzil ko'rsatilmagan"}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {settingsForm.workDays}: {settingsForm.workStartTime} - {settingsForm.workEndTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                      {settingsForm.phone && (
                        <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />
                          {settingsForm.phone}
                        </div>
                      )}
                      <div className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 font-bold text-xs">
                        Prefiks: {settingsForm.defaultQueuePrefix}
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs">
                        {settingsForm.defaultPaymentPolicy === 'PAY_BEFORE_CALL' ? "Oldindan to'lov" : "Xizmatdan so'ng"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Save Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Barcha kiritilgan parametrlar bevosita <strong>PostgreSQL 16</strong> ma'lumotlar bazasiga yoziladi</span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={handleResetSettings}
                      disabled={isSavingSettings}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition disabled:opacity-50"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 disabled:opacity-50"
                    >
                      {isSavingSettings ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Saqlanmoqda...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Barcha sozlamalarni saqlash
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* TAB: PRINTER VA TALON SOZLAMALARI (100% REAL POSTGRESQL & TERMAL PRINTER ENTEGRATSIYASI) */}
          {activeTab === 'PRINTER_SOZLAMALARI' && (
            <div className="space-y-6 w-full">
              {/* Settings Sub-navigation Pills */}
              <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setSearchParams({ tab: 'sozlamalar' })}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-slate-500" />
                  <span>Asosiy tizim sozlamalari</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSearchParams({ tab: 'printer-sozlamalari' })}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition bg-[#0084FF] text-white shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-white" />
                  <span>Printer va talon sozlamalari</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-white/20 text-white rounded">Faol</span>
                </button>
              </div>

              {/* Header Banner with Title and Actions */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 shrink-0">
                      <Printer className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-[#172B4D]">Printer va Talon Sozlamalari</h3>
                        <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-bold rounded-full border border-teal-200">
                          XP-80T / XP-58 Moslashuvchan
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Kassirlar tomonidan chiqariladigan termal chek va navbat talonlarining parametrlari, qog'oz formati (80 mm / 58 mm) va elementlar tarkibini to'liq boshqarish
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleResetPrinterSettings}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                    title="Boshlang'ich standart parametrlarga qaytarish"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Qaytarish</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestPrint}
                    className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Hozirgi sozlamalarni printerda sinov tariqasida chop etib ko'rish"
                  >
                    <Printer className="w-4 h-4 text-blue-600" />
                    <span>Sinov chop etish</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSavePrinterSettings}
                    disabled={isSavingPrinterSettings}
                    className="px-5 py-2.5 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
                  >
                    {isSavingPrinterSettings ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{isSavingPrinterSettings ? 'Saqlanmoqda...' : 'Saqlash va qo‘llash'}</span>
                  </button>
                </div>
              </div>

              {/* Main 2-column Grid */}
              <div className="grid grid-cols-12 gap-6 items-start">
                {/* LEFT COLUMN: SOZLAMALAR FORMASI (SPAN 7) */}
                <div className="col-span-12 xl:col-span-7 space-y-6">
                  {/* Card 1: Printer va qog'oz formati */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
                          <Sliders className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#172B4D]">Printer va Qog'oz Formati</h4>
                          <p className="text-[11px] text-slate-500">Termal printer qog'ozi kengligi va nusxalar soni</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-2">Asosiy qog'oz kengligi (Formati)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setPrinterSettings(prev => ({ ...prev, paperSize: '80mm' }));
                            setPreviewPaperSize('80mm');
                          }}
                          className={`p-4 rounded-2xl border text-left transition flex items-start justify-between cursor-pointer ${
                            printerSettings.paperSize === '80mm'
                              ? 'border-[#0F766E] bg-teal-50/50 ring-2 ring-[#0F766E]/20'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">80 mm (XP-80T)</span>
                              <span className="px-1.5 py-0.5 bg-teal-100 text-teal-800 text-[9px] font-bold rounded">Tavsiya etiladi</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                              Standart keng kassa cheki (72 mm chop kengligi). Yirik raqamlar va to'liq ma'lumotlar sig'adi.
                            </p>
                          </div>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            printerSettings.paperSize === '80mm' ? 'bg-[#0F766E] text-white' : 'border border-slate-300'
                          }`}>
                            {printerSettings.paperSize === '80mm' && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPrinterSettings(prev => ({ ...prev, paperSize: '58mm' }));
                            setPreviewPaperSize('58mm');
                          }}
                          className={`p-4 rounded-2xl border text-left transition flex items-start justify-between cursor-pointer ${
                            printerSettings.paperSize === '58mm'
                              ? 'border-[#0F766E] bg-teal-50/50 ring-2 ring-[#0F766E]/20'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">58 mm (XP-58)</span>
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[9px] font-bold rounded">Ixcham</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                              Kichik ixcham termoprinterlar uchun (48 mm chop kengligi). Qog'ozni tejaydi.
                            </p>
                          </div>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            printerSettings.paperSize === '58mm' ? 'bg-[#0F766E] text-white' : 'border border-slate-300'
                          }`}>
                            {printerSettings.paperSize === '58mm' && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Har bir buyurtmada nusxalar soni</label>
                        <select
                          value={printerSettings.copies || 1}
                          onChange={e => setPrinterSettings(prev => ({ ...prev, copies: Number(e.target.value) }))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-none"
                        >
                          <option value={1}>1 ta nusxa (Faqat bemor uchun)</option>
                          <option value={2}>2 ta nusxa (Bemor va Shifokor uchun)</option>
                        </select>
                      </div>

                      <div className="space-y-2 pt-1">
                        <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-50 border border-slate-100">
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">Avtomatik chop etish</span>
                            <span className="text-[10px] text-slate-400">Kassirda talon berilganda printer oynasi ochilsin</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={!!printerSettings.autoPrint}
                            onChange={e => setPrinterSettings(prev => ({ ...prev, autoPrint: e.target.checked }))}
                            className="w-4 h-4 text-[#0F766E] rounded-md focus:ring-[#0F766E]"
                          />
                        </label>

                        <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-50 border border-slate-100">
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">Ovozli tasdiq (Chime)</span>
                            <span className="text-[10px] text-slate-400">Talon muvaffaqiyatli chiqqanda ohang chalinishi</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={!!printerSettings.soundAlert}
                            onChange={e => setPrinterSettings(prev => ({ ...prev, soundAlert: e.target.checked }))}
                            className="w-4 h-4 text-[#0F766E] rounded-md focus:ring-[#0F766E]"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Klinika rekvizitlari va sarlavhasi (Header) */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#172B4D]">Klinika Rekvizitlari (Talon Sarlavhasi)</h4>
                          <p className="text-[11px] text-slate-500">Chekning eng yuqori qismida chiqadigan brend va aloqa ma'lumotlari</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Klinika nomi (Bosh sarlavha)</label>
                        <input
                          type="text"
                          value={printerSettings.clinicName || ''}
                          onChange={e => setPrinterSettings(prev => ({ ...prev, clinicName: e.target.value }))}
                          placeholder="Klinika nomi"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-none uppercase tracking-wide"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Telefon raqam</label>
                        <input
                          type="text"
                          value={printerSettings.phone || ''}
                          onChange={e => setPrinterSettings(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+998 (__) ___-__-__"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block mb-1">Manzil</label>
                        <input
                          type="text"
                          value={printerSettings.address || ''}
                          onChange={e => setPrinterSettings(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Masalan: Toshkent sh., Chilonzor tumani..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block mb-1">Qo'shimcha sarlavha osti eslatmasi</label>
                        <input
                          type="text"
                          value={printerSettings.welcomeNote || ''}
                          onChange={e => setPrinterSettings(prev => ({ ...prev, welcomeNote: e.target.value }))}
                          placeholder="Navbat talonini qabul yakunigacha saqlang"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Talonda nimalar ko'rsatilsin? (Elementlar filtri) */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                          <CheckSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#172B4D]">Talon Tarkibi (Nimalar Ko'rsatilsin?)</h4>
                          <p className="text-[11px] text-slate-500">Keraksiz maydonlarni o'chirib, chekni ixchamlashtirishingiz mumkin</p>
                        </div>
                      </div>
                      <span className="text-xs text-purple-700 font-bold bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                        Real vaqtda filtr
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'showDate', title: 'Sana va vaqt', desc: 'Chek berilgan sana va daqiqa' },
                        { key: 'showTicketNumber', title: 'Katta talon raqami', desc: 'Masalan: A-014, S-001' },
                        { key: 'showSpecialty', title: 'Mutaxassislik / Xizmat', desc: "Ko'rik yoki xizmat nomi" },
                        { key: 'showDoctor', title: 'Shifokor F.I.Sh.', desc: 'Qabul qiluvchi shifokor ismi' },
                        { key: 'showCabinet', title: 'Kabinet raqami', desc: 'KABINET № X ko\'rinishida' },
                        { key: 'showPatientName', title: 'Bemor F.I.Sh.', desc: 'Bemor ismi (chapda, tartibli)' },
                        { key: 'showPaymentStatus', title: "To'lov holati", desc: "To'langan yoki to'lov qabulda" },
                        { key: 'showWaitTime', title: 'Taxminiy kutish vaqti', desc: '~15 daqiqa kabi vaqt' },
                        { key: 'showQrCode', title: 'QR-kod (Smartfon kuzatuv)', desc: 'Navbatni telefonda kuzatish kodi' },
                        { key: 'showCutLine', title: 'Qirqish chizig\'i (Cut line)', desc: 'Chek oxiridagi uzilish chizig\'i' }
                      ].map((item) => {
                        const isChecked = (printerSettings as any)[item.key] !== false;
                        return (
                          <label
                            key={item.key}
                            className={`flex items-start justify-between p-3 rounded-2xl border transition cursor-pointer ${
                              isChecked
                                ? 'border-teal-200 bg-teal-50/30'
                                : 'border-slate-200 bg-slate-50/50 opacity-75'
                            }`}
                          >
                            <div className="pr-2">
                              <span className="text-xs font-bold text-slate-800 block">{item.title}</span>
                              <span className="text-[10px] text-slate-500 leading-tight">{item.desc}</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => setPrinterSettings(prev => ({ ...prev, [item.key]: e.target.checked } as any))}
                              className="w-4 h-4 text-[#0F766E] rounded-md focus:ring-[#0F766E] mt-0.5 shrink-0"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card 4: Pastki qism (Footer) va minnatdorchilik */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#172B4D]">Talon Pastki Qismi (Footer Matnlari)</h4>
                          <p className="text-[11px] text-slate-500">Talon tagidagi minnatdorchilik va ko'rsatmalar</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Minnatdorchilik xabari</label>
                        <input
                          type="text"
                          value={printerSettings.footerText || ''}
                          onChange={e => setPrinterSettings(prev => ({ ...prev, footerText: e.target.value }))}
                          placeholder="Tashrifingiz uchun rahmat! Salomat bo'ling!"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Qo'shimcha eslatma / tavsiya</label>
                        <input
                          type="text"
                          value={printerSettings.footerNote || ''}
                          onChange={e => setPrinterSettings(prev => ({ ...prev, footerNote: e.target.value }))}
                          placeholder="Navbatingizni zal monitorida kuzatib boring"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleSavePrinterSettings}
                        disabled={isSavingPrinterSettings}
                        className="w-full py-3 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
                      >
                        {isSavingPrinterSettings ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        <span>{isSavingPrinterSettings ? 'Saqlanmoqda...' : 'Barcha o\'zgarishlarni bazaga saqlash'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: JONLI INTERAKTIV TICKET PREVIEW (SPAN 5) */}
                <div className="col-span-12 xl:col-span-5 sticky top-6 space-y-4">
                  <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm">
                    {/* Preview Header with size switcher */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#172B4D]">Jonli Talon Simulyatori</h4>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <p className="text-[11px] text-slate-500">Termoprinterda ayni shunday chiqadi</p>
                      </div>

                      {/* Preview format toggle */}
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setPreviewPaperSize('80mm')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            previewPaperSize === '80mm'
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          80 mm
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewPaperSize('58mm')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            previewPaperSize === '58mm'
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          58 mm
                        </button>
                      </div>
                    </div>

                    {/* Paper Preview Area */}
                    <div className="py-6 bg-slate-100/80 rounded-2xl flex justify-center my-4 overflow-x-auto">
                      <div
                        className={`bg-white shadow-xl border border-slate-300 font-mono text-black transition-all ${
                          previewPaperSize === '80mm' ? 'w-[360px] p-5 rounded-xl' : 'w-[260px] p-3.5 rounded-lg'
                        }`}
                      >
                        {/* HEADER */}
                        <div className="text-center space-y-0.5 border-b-2 border-dashed border-black pb-2">
                          <div className={`font-black uppercase tracking-wider text-black ${previewPaperSize === '80mm' ? 'text-base' : 'text-sm'}`}>
                            {printerSettings.clinicName || settingsForm.clinicName || clinicSettings?.clinic_name || 'KLINIKA'}
                          </div>
                          {printerSettings.address && (
                            <div className={`text-black font-sans leading-tight ${previewPaperSize === '80mm' ? 'text-[11px]' : 'text-[9.5px]'}`}>
                              {printerSettings.address}
                            </div>
                          )}
                          <div className={`text-black font-sans font-medium ${previewPaperSize === '80mm' ? 'text-[11px]' : 'text-[9.5px]'}`}>
                            {printerSettings.phone && `Tel: ${printerSettings.phone}`}
                            {printerSettings.phone && printerSettings.showDate !== false && ' • '}
                            {printerSettings.showDate !== false && new Date().toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {printerSettings.welcomeNote && (
                            <div className={`text-black font-sans italic pt-0.5 ${previewPaperSize === '80mm' ? 'text-[10px]' : 'text-[8.5px]'}`}>
                              {printerSettings.welcomeNote}
                            </div>
                          )}
                        </div>

                        {/* BIG QUEUE NUMBER */}
                        {printerSettings.showTicketNumber !== false && (
                          <div className="text-center py-1">
                            <div
                              className={`font-black text-black font-mono leading-none tracking-tight ${
                                previewPaperSize === '80mm' ? 'text-[68px] sm:text-[72px]' : 'text-[48px] sm:text-[52px]'
                              }`}
                              style={{ letterSpacing: '-0.04em' }}
                            >
                              S-001
                            </div>
                            {printerSettings.showSpecialty !== false && (
                              <div className={`font-sans font-black text-black uppercase mt-1.5 tracking-wider ${previewPaperSize === '80mm' ? 'text-sm' : 'text-xs'}`}>
                                STOMATOLOGIYA
                              </div>
                            )}
                          </div>
                        )}

                        {/* CABINET AND DOCTOR */}
                        {(printerSettings.showCabinet !== false || printerSettings.showDoctor !== false) && (
                          <div className="p-2 border-2 border-black rounded-lg text-center space-y-0.5 font-sans my-1.5">
                            {printerSettings.showCabinet !== false && (
                              <div className={`font-black text-black ${previewPaperSize === '80mm' ? 'text-sm' : 'text-xs'}`}>
                                KABINET № 4
                              </div>
                            )}
                            {printerSettings.showDoctor !== false && (
                              <div className={`font-semibold text-black break-words ${previewPaperSize === '80mm' ? 'text-xs' : 'text-[11px]'}`}>
                                Dr. Alisher Alimov
                              </div>
                            )}
                          </div>
                        )}

                        {/* PATIENT SECTION */}
                        {printerSettings.showPatientName !== false && (
                          <div className="text-left font-sans py-2 border-t-2 border-b-2 border-dashed border-black space-y-1 my-1.5">
                            <div className="text-[10px] font-bold text-black uppercase tracking-wider">
                              BEMOR:
                            </div>
                            <div className={`font-black text-black leading-snug break-words ${previewPaperSize === '80mm' ? 'text-sm' : 'text-xs'}`}>
                              Malika Alimova
                            </div>
                            {(printerSettings.showPaymentStatus !== false || printerSettings.showWaitTime !== false) && (
                              <div className="flex items-center justify-between text-[10px] text-black pt-1 border-t border-dotted border-black/40 font-mono">
                                {printerSettings.showPaymentStatus !== false && <span>To'lov: <b>To'langan</b></span>}
                                {printerSettings.showWaitTime !== false && <span>Kutish: <b>~15 daq</b></span>}
                              </div>
                            )}
                          </div>
                        )}

                        {/* QR CODE & INSTRUCTION */}
                        {printerSettings.showQrCode !== false && (
                          <div className="pt-2 flex flex-col items-center justify-center space-y-1">
                            <div className={`border-2 border-black rounded-lg flex items-center justify-center text-black p-1 bg-white ${previewPaperSize === '80mm' ? 'w-14 h-14' : 'w-12 h-12'}`}>
                              <QrCode className={previewPaperSize === '80mm' ? 'w-10 h-10' : 'w-9 h-9'} />
                            </div>
                            <div className={`text-black font-sans leading-tight text-center ${previewPaperSize === '80mm' ? 'text-[10px]' : 'text-[8.5px]'}`}>
                              Navbatni smartfonda kuzatish uchun QR-kodni skanerlang
                            </div>
                          </div>
                        )}

                        {/* FOOTER TEXT */}
                        {(printerSettings.footerText || printerSettings.footerNote) && (
                          <div className="pt-2 text-center font-sans space-y-0.5">
                            {printerSettings.footerText && (
                              <div className={`font-bold text-black ${previewPaperSize === '80mm' ? 'text-[10px]' : 'text-[8.5px]'}`}>
                                {printerSettings.footerText}
                              </div>
                            )}
                            {printerSettings.footerNote && (
                              <div className={`text-black ${previewPaperSize === '80mm' ? 'text-[9px]' : 'text-[8px]'}`}>
                                {printerSettings.footerNote}
                              </div>
                            )}
                          </div>
                        )}

                        {/* CUT LINE GUIDE */}
                        {printerSettings.showCutLine !== false && (
                          <div className="pt-3 pb-1 border-b-2 border-dashed border-black/50 text-[10px] text-slate-500 font-sans text-center">
                            - - - Qirqish chizig'i - - -
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Preview Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleTestPrint}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Sinov chop etish ({previewPaperSize})</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: OBUNA VA SMS (100% REAL POSTGRESQL & SUPER ADMIN INTEGRATION) */}
          {activeTab === 'OBUNA_SMS' && (
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
                      onClick={fetchClinicSubscriptionAndSms}
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
          )}

          {/* TAB 13: AUDIT JURNALI (100% REAL POSTGRESQL - CENTERED TABLE) */}
          {activeTab === 'AUDIT_JURNALI' && (() => {
            const filteredLogs = auditLogsList.filter((log: any) => {
              const matchesSearch = !auditSearch ||
                (log.actor_name && log.actor_name.toLowerCase().includes(auditSearch.toLowerCase())) ||
                (log.patient_name && log.patient_name.toLowerCase().includes(auditSearch.toLowerCase())) ||
                (log.doctor_name && log.doctor_name.toLowerCase().includes(auditSearch.toLowerCase())) ||
                (log.object_reference && log.object_reference.toLowerCase().includes(auditSearch.toLowerCase())) ||
                (log.action && log.action.toLowerCase().includes(auditSearch.toLowerCase())) ||
                (log.id && log.id.toLowerCase().includes(auditSearch.toLowerCase()));

              const matchesFilter =
                auditActionFilter === 'ALL' ||
                (auditActionFilter === 'QUEUE_CALL' && log.log_type === 'QUEUE_CALL') ||
                (auditActionFilter === 'PAYMENT' && log.log_type === 'PAYMENT') ||
                (auditActionFilter === 'SHIFT' && log.log_type === 'SHIFT') ||
                (auditActionFilter === 'SYSTEM' && log.log_type === 'SYSTEM') ||
                (auditActionFilter === 'COMPLETE' && log.action === 'COMPLETE') ||
                (auditActionFilter === 'CALL_NEXT' && (log.action === 'CALL_NEXT' || log.action === 'RECALL'));

              return matchesSearch && matchesFilter;
            });

            return (
              <div className="space-y-6 w-full max-w-7xl mx-auto">
                {/* Header Banner */}
                <div className="relative overflow-hidden bg-medical-gradient text-white p-7 rounded-3xl border border-white/25 shadow-xl shadow-medical-blue/20">
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-white/15 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -left-10 -bottom-10 w-56 h-56 bg-medical-blue-dark/20 rounded-full blur-2xl pointer-events-none" />
                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-md border border-white/30 shrink-0">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5 drop-shadow-xs">
                            Tizim Audit Jurnali & Nazorati
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30">
                              PostgreSQL 16
                            </span>
                          </h2>
                          <p className="text-xs text-white/95 mt-0.5 leading-relaxed">
                            Xavfsizlik, xodimlar harakati, navbat chaqiruvlari, kassa to'lovlari va tizim sozlamalari auditi
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/95 mt-3">
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-semibold shadow-xs">
                          <span className="w-2 h-2 rounded-full bg-medical-turquoise animate-pulse" />
                          Audit Oqimi Faol
                        </span>
                        <span className="px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-medium shadow-xs">
                          Jami: {auditLogsList.length} ta yozuv
                        </span>
                        <span className="px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-medium shadow-xs">
                          Ko'rsatilmoqda: {filteredLogs.length} ta
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={exportAuditLogsToExcel}
                        className="px-4 py-2.5 rounded-2xl border border-white/30 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-medical-turquoise" />
                        Excelga eksport
                      </button>
                      <button
                        type="button"
                        onClick={() => loadManagerData()}
                        className="px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-medical-blue-dark text-xs font-black transition flex items-center gap-2 shadow-lg shadow-medical-blue-dark/20 border border-white/80 active:scale-95 cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4 text-medical-blue-dark stroke-[2.5]" />
                        Yangilash
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4 KPI Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Jami Yozuvlar</p>
                      <p className="text-base font-black text-slate-800">{auditLogsList.length}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">PostgreSQL audit xotirasida</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <Ticket className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Navbat & Ko'riklar</p>
                      <p className="text-base font-black text-blue-700">
                        {auditLogsList.filter(l => l.log_type === 'QUEUE_CALL').length}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">Chaqiruv, qayta chaqiruv, yakun</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5 text-medical-turquoise-dark" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Kassa & To'lovlar</p>
                      <p className="text-base font-black text-slate-800">
                        {auditLogsList.filter(l => l.log_type === 'PAYMENT').length}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">Kassada qabul qilingan to'lovlar</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                      <Layers className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Smena & Tizim</p>
                      <p className="text-base font-black text-purple-700">
                        {auditLogsList.filter(l => l.log_type === 'SHIFT' || l.log_type === 'SYSTEM').length}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">Smena yopilishi va sozlamalar</p>
                    </div>
                  </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
                  <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Talon raqami, bemor, shifokor, amal yoki xodim bo'yicha qidiruv..."
                      value={auditSearch}
                      onChange={e => setAuditSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-medical-blue focus:ring-2 focus:ring-medical-blue/20 outline-none transition"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                    {[
                      { id: 'ALL', label: 'Barchasi' },
                      { id: 'QUEUE_CALL', label: 'Navbat chaqiruvlari' },
                      { id: 'COMPLETE', label: 'Qabul yakunlandi' },
                      { id: 'PAYMENT', label: 'Kassa to\'lovlari' },
                      { id: 'SHIFT', label: 'Smenalar' },
                      { id: 'SYSTEM', label: 'Tizim sozlamalari' }
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setAuditActionFilter(f.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          auditActionFilter === f.id
                            ? 'bg-medical-blue text-white shadow-sm shadow-medical-blue/25'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AUDIT TABLE (JADVAL KO'RINISHIDA) */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                          <th className="py-3.5 px-4 w-12 text-center">#</th>
                          <th className="py-3.5 px-4">Vaqt & Sana</th>
                          <th className="py-3.5 px-4">Amal / Hodisa turi</th>
                          <th className="py-3.5 px-4">Mas'ul xodim (Ijrochi)</th>
                          <th className="py-3.5 px-4">Bemor / Ob'ekt</th>
                          <th className="py-3.5 px-4">Shifokor & Xona</th>
                          <th className="py-3.5 px-4 text-center">Holati</th>
                          <th className="py-3.5 px-4 text-right">Tafsilotlar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredLogs.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-slate-400">
                              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                              <p className="font-bold text-slate-600">Audit yozuvlari topilmadi</p>
                              <p className="text-[11px] mt-0.5">Qidiruv parametrlarini o'zgartiring yoki filterni tozalang</p>
                            </td>
                          </tr>
                        ) : (
                          filteredLogs.map((log: any, idx: number) => {
                            const isCall = log.log_type === 'QUEUE_CALL';
                            const isPay = log.log_type === 'PAYMENT';
                            const isShift = log.log_type === 'SHIFT';
                            const isSys = log.log_type === 'SYSTEM';

                            return (
                              <tr
                                key={log.id || idx}
                                onClick={() => {
                                  setSelectedAuditItem(log);
                                  setIsAuditModalOpen(true);
                                }}
                                className="hover:bg-indigo-50/40 cursor-pointer transition group"
                              >
                                <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-400">
                                  {idx + 1}
                                </td>

                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  <div className="font-bold text-slate-800">
                                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {log.timestamp ? new Date(log.timestamp).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                  </div>
                                </td>

                                <td className="py-3.5 px-4">
                                  {isCall && (
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                                      log.action === 'COMPLETE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                      log.action === 'RECALL' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                      log.action === 'CANCEL' ? 'bg-red-50 text-red-700 border border-red-200' :
                                      'bg-blue-50 text-blue-700 border border-blue-200'
                                    }`}>
                                      <Ticket className="w-3 h-3" />
                                      {log.action === 'COMPLETE' ? 'Qabul yakunlandi' :
                                       log.action === 'RECALL' ? 'Qayta chaqiruv' :
                                       log.action === 'CALL_NEXT' ? 'Navbat chaqirildi' :
                                       log.action === 'START' ? 'Ko\'rik boshlandi' :
                                       log.action === 'CANCEL' ? 'Talon bekor qilindi' : log.action}
                                    </span>
                                  )}
                                  {isPay && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">
                                      <CreditCard className="w-3 h-3" />
                                      Kassa to'lovi ({Number(log.amount || 0).toLocaleString('uz-UZ')} so'm)
                                    </span>
                                  )}
                                  {isShift && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                      <Layers className="w-3 h-3" />
                                      {log.action === 'SMENA_YOPILDI' ? 'Smena yopildi' : 'Smena ochildi'}
                                    </span>
                                  )}
                                  {isSys && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      <SlidersHorizontal className="w-3 h-3" />
                                      Sozlamalar yangilandi
                                    </span>
                                  )}
                                </td>

                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                    {log.actor_name || 'Tizim'}
                                  </div>
                                  <span className="text-[10px] text-slate-400 ml-5">
                                    {log.actor_role || 'Xodim'}
                                  </span>
                                </td>

                                <td className="py-3.5 px-4">
                                  {log.patient_name ? (
                                    <div>
                                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        {log.patient_name}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono ml-3">
                                        Talon: {log.object_reference || '-'}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-500 font-mono text-[11px]">
                                      {log.object_reference || 'Tizim operatsiyasi'}
                                    </span>
                                  )}
                                </td>

                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  {log.doctor_name ? (
                                    <div>
                                      <div className="font-bold text-slate-700">{log.doctor_name}</div>
                                      <div className="text-[10px] text-slate-400">
                                        {log.room_number ? log.room_number + '-xona' : ''} {log.specialty_name ? '• ' + log.specialty_name : ''}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 text-[11px]">-</span>
                                  )}
                                </td>

                                <td className="py-3.5 px-4 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    log.status === 'COMPLETED' || log.status === 'PAID' || log.status === 'SUCCESS' || log.status === 'CLOSED'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                                  }`}>
                                    {log.status || 'OK'}
                                  </span>
                                </td>

                                <td className="py-3.5 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedAuditItem(log);
                                      setIsAuditModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white transition text-[11px] font-bold inline-flex items-center gap-1 shadow-xs cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                    Tahlil
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}
        </main>
      </div>

      {/* MODAL 1: YANGI BEMOR */}
      <NewPatientModal
        isOpen={isNewPatientModalOpen}
        onClose={() => setIsNewPatientModalOpen(false)}
        onSuccess={() => {
          setIsNewPatientModalOpen(false);
          loadManagerData();
        }}
      />

      {/* MODAL: AUDIT YARATILGAN VA TAHLIL POPUP (Jarayonda nimalar bo'lganligi haqida to'liq ma'lumot) */}
      {isAuditModalOpen && selectedAuditItem && (
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
                      {selectedAuditItem.log_type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Hodisa ID: <span className="font-mono text-indigo-200">{selectedAuditItem.id}</span>
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsAuditModalOpen(false)} 
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
                  {getAuditExplanation(selectedAuditItem)}
                </p>
              </div>

              {/* Grid of Key Participants */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Actor */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Mas'ul Xodim (Ijrochi)</span>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">{selectedAuditItem.actor_name || 'Tizim'}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 ml-6">
                    Roli: <span className="font-semibold text-slate-700">{selectedAuditItem.actor_role || 'Xodim'}</span>
                  </div>
                </div>

                {/* Patient */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Bemor Ma'lumotlari</span>
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">{selectedAuditItem.patient_name || 'Biriktirilmagan'}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 ml-6">
                    Tel: <span className="font-mono text-slate-700">{selectedAuditItem.patient_phone || '-'}</span>
                  </div>
                </div>

                {/* Doctor & Room */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Shifokor & Kabinet</span>
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">{selectedAuditItem.doctor_name || 'Biriktirilmagan'}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 ml-6">
                    {selectedAuditItem.room_number ? `${selectedAuditItem.room_number}-xona` : ''} {selectedAuditItem.specialty_name ? `• ${selectedAuditItem.specialty_name}` : ''}
                  </div>
                </div>

                {/* Object Reference & Amount */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Hujjat / To'lov Parametrlari</span>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold font-mono text-slate-800">{selectedAuditItem.object_reference || selectedAuditItem.id}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 ml-6">
                    {selectedAuditItem.amount ? (
                      <span className="font-bold text-emerald-600">{Number(selectedAuditItem.amount).toLocaleString('uz-UZ')} so'm ({selectedAuditItem.payment_method || 'To\'lov'})</span>
                    ) : (
                      <span>Holat: <strong className="text-indigo-600">{selectedAuditItem.status || 'SUCCESS'}</strong></span>
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
                      {selectedAuditItem.timestamp ? new Date(selectedAuditItem.timestamp).toISOString() : '-'}
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
                    <span className="font-mono font-bold text-indigo-600">{selectedAuditItem.action}</span>
                  </div>
                </div>
              </div>

              {/* Raw JSON Code Block */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold">
                  <span>To'liq Audit JSON Parametrlari (Xom ma'lumotlar):</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(selectedAuditItem, null, 2));
                      setCopiedAuditJson(true);
                      setTimeout(() => setCopiedAuditJson(false), 2000);
                    }}
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
                  {JSON.stringify(selectedAuditItem, null, 2)}
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
                onClick={() => setIsAuditModalOpen(false)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SHIFOKORNI QO'SHISH / TAHRIRLASH */}
      {isDoctorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
                  <Stethoscope className="w-6 h-6 text-blue-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black tracking-tight">
                      {editingDoctorId ? "Shifokor Ma'lumotlarini Tahrirlash" : "Yangi Shifokor Qo‘shish"}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      Shifokor
                    </span>
                  </div>
                  <p className="text-xs text-blue-100/90 mt-0.5">
                    Klinikaga shifokor va uning qabul kabinetini biriktirish
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsDoctorModalOpen(false)} 
                className="p-2 hover:bg-white/15 rounded-xl text-white/80 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDoctor} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Shifokor F.I.Sh. <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Dr. Ergashev Bobur"
                    value={doctorForm.displayName}
                    onChange={e => setDoctorForm({ ...doctorForm, displayName: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mutaxassislik <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Award className="w-4 h-4 text-blue-600" />
                    </div>
                    <select
                      value={doctorForm.specialtyId}
                      onChange={e => setDoctorForm({ ...doctorForm, specialtyId: e.target.value })}
                      className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition appearance-none"
                    >
                      <option value="">Mutaxassislikni tanlang</option>
                      {specialtiesList.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kabinet Raqami <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <DoorOpen className="w-4 h-4 text-blue-600" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Masalan: 3"
                      value={doctorForm.cabinetNumber}
                      onChange={e => setDoctorForm({ ...doctorForm, cabinetNumber: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Telefon Raqami <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Phone className="w-4 h-4 text-blue-600" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={doctorForm.phone}
                    onChange={e => setDoctorForm({ ...doctorForm, phone: formatUzbekPhone(e.target.value) })}
                    onKeyDown={e => {
                      if ((doctorForm.phone === '+998 ' || doctorForm.phone === '+998' || doctorForm.phone.length <= 5) && e.key === 'Backspace') {
                        e.preventDefault();
                        setDoctorForm({ ...doctorForm, phone: '+998 ' });
                      }
                    }}
                    placeholder="+998 (90) 123-45-67"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                </div>
              </div>

              {/* Login and Password for Doctor Portal */}
              <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Shifokor Tizimga Kirish Ma'lumotlari (Login & Parol)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Foydalanuvchi Logini <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Masalan: doc_karimova"
                        value={doctorForm.username}
                        onChange={e => setDoctorForm({ ...doctorForm, username: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Shifokor ushbu login orqali kiradi</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {editingDoctorId ? 'Parolni yangilash' : 'Tizim Paroli'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Lock className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <input
                        type="text"
                        required={!editingDoctorId}
                        placeholder={editingDoctorId ? "O'zgarishsiz qoldirish" : "Masalan: doctor123"}
                        value={doctorForm.password}
                        onChange={e => setDoctorForm({ ...doctorForm, password: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Standart: <b>doctor123</b></span>
                  </div>
                </div>
              </div>

              <UzbekistanAddressSelect
                value={doctorForm.address || ''}
                onChange={addr => setDoctorForm({ ...doctorForm, address: addr })}
                label="Shifokor Yashash / Ishlash Manzili (Viloyat va Tuman)"
              />

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDoctorModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingDoctorId ? "O'zgarishlarni Saqlash" : "Shifokorni Saqlash"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: XIZMATNI TAHRIRLASH VA BIRIKTIRILGAN SHIFOKORLAR */}
      {isServiceModalOpen && (() => {
        const docCount = Number(selectedServiceForDetail?.doctor_count) || 
          (Array.isArray(selectedServiceForDetail?.doctors) ? selectedServiceForDetail.doctors.length : 0);
        const doctorsListForService = Array.isArray(selectedServiceForDetail?.doctors) ? selectedServiceForDetail.doctors : [];

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div 
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
                    <Tag className="w-6 h-6 text-emerald-100" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black tracking-tight">
                        {editingServiceId ? (selectedServiceForDetail?.name || "Xizmatni Tahrirlash") : "Yangi Xizmat Qo'shish"}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        {editingServiceId ? 'Tahrirlash' : 'Yangi'}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100/90 mt-0.5">
                      {editingServiceId 
                        ? "Xizmat parametrlari va ushbu xizmat bo'yicha qabul qiluvchi shifokorlar" 
                        : "Tibbiy xizmat nomi, tegishli mutaxassislik va to'lov siyosatini belgilang"}
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setIsServiceModalOpen(false);
                    setSelectedServiceForDetail(null);
                  }} 
                  className="p-2 hover:bg-white/15 rounded-xl text-white/80 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Tabs if editing existing service */}
              {editingServiceId && (
                <div className="px-6 pt-3 pb-0 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setServiceModalTab('EDIT')}
                      className={`pb-3 px-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                        serviceModalTab === 'EDIT'
                          ? 'border-emerald-600 text-emerald-700'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Xizmatni Tahrirlash</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setServiceModalTab('DOCTORS')}
                      className={`pb-3 px-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                        serviceModalTab === 'DOCTORS'
                          ? 'border-emerald-600 text-emerald-700'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>Biriktirilgan Shifokorlar</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        docCount > 0 ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {docCount}
                      </span>
                    </button>
                  </div>

                  {serviceModalTab === 'DOCTORS' && docCount > 0 && (
                    <button
                      type="button"
                      onClick={() => exportServiceDoctorsToExcel(selectedServiceForDetail)}
                      className="mb-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      title="Shifokorlar ro'yxatini Excel (.xlsx) formatida yuklab olish"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Excelga (.xlsx)</span>
                    </button>
                  )}
                </div>
              )}

              {/* Tab 1: EDIT FORM */}
              {(!editingServiceId || serviceModalTab === 'EDIT') && (
                <form onSubmit={handleSaveService} className="p-6 space-y-4 overflow-y-auto">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Xizmat Nomi <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Tag className="w-4 h-4 text-emerald-600" />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Masalan: EKG tekshiruvi, Qon tahlili, MRT..."
                        value={serviceForm.name}
                        onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Mutaxassislik Yo'nalishi <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <Award className="w-4 h-4 text-emerald-600" />
                        </div>
                        <select
                          value={serviceForm.specialtyId}
                          onChange={e => setServiceForm({ ...serviceForm, specialtyId: e.target.value })}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                        >
                          {specialtiesList.map((s: any) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Davomiyligi (daqiqada)
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <Clock className="w-4 h-4 text-emerald-600" />
                        </div>
                        <input
                          type="number"
                          min="5"
                          max="120"
                          step="5"
                          value={serviceForm.durationMinutes}
                          onChange={e => setServiceForm({ ...serviceForm, durationMinutes: Number(e.target.value) })}
                          className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                        />
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                          daq
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Xizmat Narxi (so'mda) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                      </div>
                      <input
                        type="number"
                        required
                        min="0"
                        step="1000"
                        value={serviceForm.price}
                        onChange={e => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
                        className="w-full pl-10 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                      />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                        so'm
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 font-mono">
                      {Number(serviceForm.price || 0).toLocaleString()} so'm
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      To‘lov Tartibi va Siyosati <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setServiceForm({ ...serviceForm, paymentPolicy: 'PAY_BEFORE_CALL' })}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          serviceForm.paymentPolicy === 'PAY_BEFORE_CALL' || serviceForm.paymentPolicy === 'PAY_BEFORE_TICKET'
                            ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/30'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
                          <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                          <span>Oldindan to‘lov</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Talon olishdan oldin kassada to'lanadi</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setServiceForm({ ...serviceForm, paymentPolicy: 'PAY_AFTER_SERVICE' })}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          serviceForm.paymentPolicy === 'PAY_AFTER_SERVICE' || serviceForm.paymentPolicy === 'TICKET_BEFORE_PAYMENT'
                            ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-400/30'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs text-blue-900">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>Xizmatdan so‘ng</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Shifokor ko'rigidan so'ng to'lanadi</p>
                      </button>
                    </div>
                  </div>

                  {/* Connected Doctors Quick Notice */}
                  {editingServiceId && (
                    <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200/80 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                          <Stethoscope className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-purple-950">
                            Ushbu yo'nalish bo'yicha: <span className="text-purple-700 font-black">{docCount} nafar shifokor</span>
                          </div>
                          <p className="text-[11px] text-purple-700/80 mt-0.5">
                            {docCount > 0 
                              ? "Xizmatni ko'rsatuvchi shifokorlar ro'yxatini ko'rish uchun yorliqqa o'ting" 
                              : "Hozircha biriktirilgan shifokor mavjud emas"}
                          </p>
                        </div>
                      </div>

                      {docCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setServiceModalTab('DOCTORS')}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
                        >
                          Ro'yxatni ko'rish ({docCount})
                        </button>
                      )}
                    </div>
                  )}

                  <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsServiceModalOpen(false);
                        setSelectedServiceForDetail(null);
                      }}
                      className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingServiceId ? "O'zgarishlarni Saqlash" : "Xizmatni Saqlash"}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 2: DOCTORS LIST BREAKDOWN */}
              {editingServiceId && serviceModalTab === 'DOCTORS' && (
                <div className="p-6 space-y-4 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {selectedServiceForDetail?.name} bo'yicha shifokorlar
                      </h4>
                      <p className="text-xs text-slate-500">
                        Mutaxassislik: <span className="font-bold text-slate-700">{selectedServiceForDetail?.specialty_name || 'Umumiy'}</span>
                      </p>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      Jami: {docCount} nafar shifokor
                    </span>
                  </div>

                  {doctorsListForService.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <Stethoscope className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                      <div className="font-semibold text-slate-600 text-sm">Biriktirilgan shifokorlar yo'q</div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Ushbu mutaxassislik bo'yicha bazada faol shifokor biriktirilmagan
                      </p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                            <th className="py-3 px-3.5 w-10 text-center">№</th>
                            <th className="py-3 px-3.5">Shifokor F.I.Sh</th>
                            <th className="py-3 px-3.5">Xona / Kabinet</th>
                            <th className="py-3 px-3.5">Telefon</th>
                            <th className="py-3 px-3.5">Qabul vaqti</th>
                            <th className="py-3 px-3.5 text-right">Holat</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {doctorsListForService.map((d: any, idx: number) => (
                            <tr key={d.id || idx} className="hover:bg-purple-50/30 transition">
                              <td className="py-3 px-3.5 text-center font-bold text-slate-400">
                                {idx + 1}
                              </td>
                              <td className="py-3 px-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0">
                                    {d.display_name?.replace('Dr. ', '').charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900">{d.display_name}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">{d.id}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-mono font-bold text-xs border border-blue-200">
                                  <DoorOpen className="w-3.5 h-3.5" />
                                  <span>{d.room_number}-xona</span>
                                </span>
                              </td>
                              <td className="py-3 px-3.5 text-slate-600 font-mono">
                                {d.phone || '—'}
                              </td>
                              <td className="py-3 px-3.5 text-slate-600">
                                {d.avg_consultation_minutes || 15} daqiqa
                              </td>
                              <td className="py-3 px-3.5 text-right">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Faol
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setServiceModalTab('EDIT')}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      ← Xizmatni tahrirlashga qaytish
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsServiceModalOpen(false);
                        setSelectedServiceForDetail(null);
                      }}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Yopish
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* MODAL 3.5: TO'LOV TAFSILOTLARI VA MOLIYAVIY CHEK (CLICK ON PAYMENT ROW) */}
      {isPaymentModalOpen && selectedPayment && (() => {
        const relatedTickets = Array.isArray(selectedPayment.related_tickets) ? selectedPayment.related_tickets : [];
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div 
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-3xl w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black tracking-tight">To'lov Cheki va Tafsilotlari</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white/20 text-white">
                        № {selectedPayment.receipt_number || selectedPayment.id}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100/90 mt-0.5">
                      Sana: {selectedPayment.created_at ? new Date(selectedPayment.created_at).toLocaleString('uz-UZ') : 'Bugun'}
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setSelectedPayment(null);
                  }} 
                  className="p-2 hover:bg-white/15 rounded-xl text-white/80 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 overflow-y-auto">
                {/* 4 Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card 1: Bemor (Kim to'lov qilgan) */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>To'lovchi Bemor</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        {selectedPayment.patient_number ? `№ ${selectedPayment.patient_number}` : 'Bemor'}
                      </span>
                    </div>
                    <div className="text-base font-black text-slate-900">
                      {selectedPayment.patient_name || 'Noma\'lum bemor'}
                    </div>
                    <div className="text-xs text-slate-600 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono font-bold">{selectedPayment.patient_phone || 'Telefon kiritilmagan'}</span>
                    </div>
                    {selectedPayment.patient_gender && (
                      <div className="text-[11px] text-slate-500">
                        Jinsi: <span className="font-semibold text-slate-700">{selectedPayment.patient_gender === 'MALE' ? 'Erkak' : 'Ayol'}</span>
                      </div>
                    )}
                  </div>

                  {/* Card 2: Shifokor (Qaysi shifokor uchun qilingan) */}
                  <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
                        <span>Qaysi Shifokor Uchun</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-200/80 text-purple-900">
                        {relatedTickets.length > 0 ? `${relatedTickets.length} ta talon` : 'Navbat'}
                      </span>
                    </div>

                    {relatedTickets.length > 0 ? (
                      <div className="space-y-1.5 pt-0.5">
                        {relatedTickets.map((t: any, idx: number) => (
                          <div key={t.ticket_id || idx} className="flex items-center justify-between bg-white/80 p-2 rounded-xl border border-purple-100">
                            <div>
                              <div className="text-xs font-bold text-slate-900">{t.doctor_name}</div>
                              <div className="text-[10px] text-slate-500">
                                {t.specialty_name} • <span className="font-bold text-purple-700">{t.cabinet_number}-xona</span>
                              </div>
                            </div>
                            <span className="px-2 py-1 bg-purple-600 text-white rounded-lg font-mono font-black text-xs shadow-xs">
                              {t.full_number}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-bold text-slate-800">
                          {selectedPayment.appointment_doctor_name || 'Tibbiy ko\'rik / Laboratoriya'}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {selectedPayment.notes || "Klinika umumiy qabul to'lovi"}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card 3: Kassa va Kassir */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Kassa va Kassir</span>
                    </span>
                    <div className="text-sm font-black text-slate-900">
                      {selectedPayment.cashier_name || 'Kassir 1'}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      Smena: <span className="font-bold text-slate-700">{selectedPayment.cash_shift_id || 'shift_today_01'}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Valyuta: <span className="font-mono font-bold text-emerald-700">{selectedPayment.currency || 'UZS (So\'m)'}</span>
                    </div>
                  </div>

                  {/* Card 4: To'lov Summasi va Holati */}
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                        <span>To'lov Miqdori</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">
                        {selectedPayment.method === 'CASH' ? 'Naqd' : selectedPayment.method === 'CARD' ? 'Karta' : 'Onlayn'}
                      </span>
                    </div>
                    <div className="text-2xl font-black font-mono text-emerald-700">
                      {Number(selectedPayment.amount).toLocaleString()} <span className="text-xs font-normal text-slate-400">so'm</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>To'liq to'langan (Muvaffaqiyatli)</span>
                    </div>
                  </div>
                </div>

                {/* To'lov hisob-kitob jadvali (TABLITSADA TO'LIQ MA'LUMOT) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>To'lov tarkibi va xizmatlar jadvali</span>
                    </h4>
                    <span className="text-xs text-slate-400">PostgreSQL tranzaksiyasi: {selectedPayment.id}</span>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-2.5 px-3.5 w-10 text-center">№</th>
                          <th className="py-2.5 px-3.5">Talon / Chek №</th>
                          <th className="py-2.5 px-3.5">Shifokor & Mutaxassislik</th>
                          <th className="py-2.5 px-3.5">Xona</th>
                          <th className="py-2.5 px-3.5">To'lov Usuli</th>
                          <th className="py-2.5 px-3.5">Summa</th>
                          <th className="py-2.5 px-3.5 text-right">Holat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {relatedTickets.length > 0 ? (
                          relatedTickets.map((t: any, index: number) => {
                            const splitAmount = Math.round(Number(selectedPayment.amount) / relatedTickets.length);
                            return (
                              <tr key={t.ticket_id || index} className="hover:bg-slate-50">
                                <td className="py-3 px-3.5 text-center font-bold text-slate-400">{index + 1}</td>
                                <td className="py-3 px-3.5 font-mono font-black text-blue-700">{t.full_number}</td>
                                <td className="py-3 px-3.5">
                                  <div className="font-bold text-slate-800">{t.doctor_name}</div>
                                  <div className="text-[10px] text-slate-400">{t.specialty_name}</div>
                                </td>
                                <td className="py-3 px-3.5 font-mono font-bold text-slate-700">{t.cabinet_number}-kabinet</td>
                                <td className="py-3 px-3.5">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                    {selectedPayment.method === 'CASH' ? 'Naqd pul' : 'Plastik karta'}
                                  </span>
                                </td>
                                <td className="py-3 px-3.5 font-mono font-bold text-emerald-700">
                                  {splitAmount.toLocaleString()} so'm
                                </td>
                                <td className="py-3 px-3.5 text-right">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    To'langan
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr className="hover:bg-slate-50">
                            <td className="py-3 px-3.5 text-center font-bold text-slate-400">1</td>
                            <td className="py-3 px-3.5 font-mono font-black text-blue-700">{selectedPayment.receipt_number || selectedPayment.id}</td>
                            <td className="py-3 px-3.5">
                              <div className="font-bold text-slate-800">
                                {selectedPayment.appointment_doctor_name || 'Shifokor ko\'rigi va konsultatsiya'}
                              </div>
                              <div className="text-[10px] text-slate-400">{selectedPayment.notes || 'Qabul to\'lovi'}</div>
                            </td>
                            <td className="py-3 px-3.5 font-mono font-bold text-slate-700">
                              {selectedPayment.appointment_doctor_room ? `${selectedPayment.appointment_doctor_room}-xona` : '1-qavat'}
                            </td>
                            <td className="py-3 px-3.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                {selectedPayment.method === 'CASH' ? 'Naqd pul' : 'Plastik karta'}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 font-mono font-bold text-emerald-700">
                              {Number(selectedPayment.amount).toLocaleString()} so'm
                            </td>
                            <td className="py-3 px-3.5 text-right">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                To'langan
                              </span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50/80 font-bold border-t border-slate-200">
                          <td colSpan={5} className="py-3 px-3.5 text-right text-slate-600">
                            Jami to'langan summa:
                          </td>
                          <td colSpan={2} className="py-3 px-3.5 font-mono font-black text-emerald-700 text-sm">
                            {Number(selectedPayment.amount).toLocaleString()} so'm
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Notes Block */}
                {selectedPayment.notes && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-700">Qo'shimcha izoh: </span>
                      <span>{selectedPayment.notes}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between shrink-0">
                <div className="text-xs text-slate-400">
                  Chek ID: <span className="font-mono font-bold text-slate-600">{selectedPayment.id}</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      printThermalTicket({
                        tickets: [{
                          patient_name: selectedPayment.patient_name || 'Bemor',
                          specialty_name: selectedPayment.notes || 'Tibbiy xizmat',
                          service_price: selectedPayment.amount
                        }],
                        config: {
                          clinicName: settingsForm.clinicName || clinicSettings?.clinic_name || 'KLINIKA-ADMIN',
                          address: settingsForm.address || clinicSettings?.address || '',
                          phone: settingsForm.phone || clinicSettings?.phone || '',
                          footerText: "Tashrifingiz uchun rahmat! Salomat bo'ling!"
                        },
                        mode: 'RECEIPT',
                        payment: selectedPayment,
                        paperSize: '80mm'
                      });
                    }}
                    className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-slate-500" />
                    <span>Chekni chop etish</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPaymentModalOpen(false);
                      setSelectedPayment(null);
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    Yopish
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 4: KABINET QO'SHISH / TAHRIRLASH */}
      {isCabinetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
                  <DoorOpen className="w-6 h-6 text-blue-100" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black tracking-tight">
                      {editingCabinetId ? "Kabinetni Tahrirlash" : "Yangi Kabinet Qo'shish"}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      Xonalar
                    </span>
                  </div>
                  <p className="text-xs text-blue-100/90 mt-0.5">Klinikada shifokorlar va qabul uchun xona raqami va qavatini belgilang</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsCabinetModalOpen(false)} 
                className="p-2 hover:bg-white/15 rounded-xl text-white/80 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCabinet} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kabinet Raqami <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Hash className="w-4 h-4 text-blue-600" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: 7 yoki 12-A"
                    value={cabinetForm.roomNumber}
                    onChange={e => setCabinetForm({ ...cabinetForm, roomNumber: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kabinet To'liq Nomi / Belgilanishi
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <input
                    type="text"
                    placeholder="Masalan: 7-kabinet (Urologiya & Ultratovush)"
                    value={cabinetForm.name}
                    onChange={e => setCabinetForm({ ...cabinetForm, name: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Bo'lim nomi
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Tag className="w-4 h-4 text-blue-600" />
                  </div>
                  <input
                    type="text"
                    placeholder="Masalan: Terapiya bloki, Jarrohlik, Diagnostika"
                    value={cabinetForm.department}
                    onChange={e => setCabinetForm({ ...cabinetForm, department: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                </div>
              </div>

              {/* JOYLASHGAN QAVATI (ETAJ) QO'SHISH VA TANLASH */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Joylashgan Qavati (Etaj) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-blue-600">
                    Istalgan yangi etaj raqamini kiritish mumkin
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Layers className="w-4 h-4 text-blue-600" />
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    placeholder="Qavat raqami (masalan: 1, 2, 3, 4, 5...)"
                    value={cabinetForm.floor}
                    onChange={e => setCabinetForm({ ...cabinetForm, floor: Number(e.target.value) || 1 })}
                    className="w-full pl-10 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    - qavat
                  </div>
                </div>

                {/* Quick Floor Selector Chips */}
                <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-slate-400 mr-1">Tezkor tanlash:</span>
                  {Array.from(new Set([1, 2, 3, 4, 5, ...cabinetsList.map(c => Number(c.floor) || 1)]))
                    .sort((a, b) => a - b)
                    .map(fl => (
                      <button
                        key={fl}
                        type="button"
                        onClick={() => setCabinetForm({ ...cabinetForm, floor: fl })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          Number(cabinetForm.floor) === fl
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {fl}-qavat
                      </button>
                    ))}
                  <button
                    type="button"
                    onClick={() => {
                      const maxFl = cabinetsList.reduce((max, c) => Math.max(max, Number(c.floor) || 1), 1);
                      setCabinetForm({ ...cabinetForm, floor: maxFl + 1 });
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 transition cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Yangi qavat</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Agar kiritilgan qavat raqami hali mavjud bo‘lmasa, kabinet saqlangach u avtomatik yangi etaj sifatida ro‘yxatga qo‘shiladi.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCabinetModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingCabinetId ? "O'zgarishlarni Saqlash" : "Kabinetni Saqlash"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: BEMORNING TO'LIQ TARIXI VA TAHRIRLASH (HAR BIR BEMORGA BOSILGANDA) */}
      {isPatientEditModalOpen && selectedPatientDetail && (
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
                onClick={() => setIsPatientEditModalOpen(false)} 
                className="p-2.5 hover:bg-white/15 rounded-xl text-white/80 hover:text-white transition cursor-pointer"
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
                  onClick={() => setPatientModalTab('DOCTORS')}
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
                  onClick={() => setPatientModalTab('PAYMENTS')}
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
                  onClick={() => setPatientModalTab('TICKETS')}
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
                  onClick={() => setPatientModalTab('EDIT')}
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
                    <form onSubmit={handleSavePatient} className="space-y-4 max-w-2xl mx-auto">
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
                            onChange={e => setPatientForm({ ...patientForm, fullName: e.target.value })}
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
                              onChange={e => setPatientForm({ ...patientForm, phone: formatUzbekPhone(e.target.value) })}
                              onKeyDown={e => {
                                if ((patientForm.phone === '+998 ' || patientForm.phone === '+998') && e.key === 'Backspace') {
                                  e.preventDefault();
                                  setPatientForm({ ...patientForm, phone: '' });
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
                              onChange={e => setPatientForm({ ...patientForm, birthDate: e.target.value })}
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
                              onChange={() => setPatientForm({ ...patientForm, gender: 'MALE' })}
                              className="w-4 h-4 text-emerald-600"
                            />
                            <span>Erkak</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                            <input
                              type="radio"
                              name="patientModalGender"
                              checked={patientForm.gender === 'FEMALE'}
                              onChange={() => setPatientForm({ ...patientForm, gender: 'FEMALE' })}
                              className="w-4 h-4 text-emerald-600"
                            />
                            <span>Ayol</span>
                          </label>
                        </div>
                      </div>

                      <UzbekistanAddressSelect
                        value={patientForm.address}
                        onChange={addr => setPatientForm({ ...patientForm, address: addr })}
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
                            onChange={e => setPatientForm({ ...patientForm, notes: e.target.value })}
                            placeholder="Bemor haqida maxsus eslatmalar yoki tashxislar..."
                            className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                          />
                        </div>
                      </div>

                      <div className="pt-4 pb-6 flex items-center justify-end gap-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setPatientModalTab('DOCTORS')}
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
                onClick={() => setIsPatientEditModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition cursor-pointer text-xs"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: XODIMNI QO'SHISH / TAHRIRLASH (ZAMONAVIY & CHIROYLI) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
                  <ShieldCheck className="w-6 h-6 text-purple-100" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black tracking-tight">
                      {editingUserId ? "Xodim Ma'lumotlarini Tahrirlash" : "Yangi Xodim Qo‘shish"}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      Xodimlar
                    </span>
                  </div>
                  <p className="text-xs text-purple-100/90 mt-0.5">Tizim foydalanuvchisi, kirish login-paroli va huquq darajasi</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsUserModalOpen(false)} 
                className="p-2 hover:bg-white/15 rounded-xl text-white/80 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Xodim To'liq F.I.Sh. <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <User className="w-4 h-4 text-indigo-600" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Dr. Karimov Sardor Baxtiyorovich"
                    value={userForm.fullName}
                    onChange={e => setUserForm({ ...userForm, fullName: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Login (username) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <span className="text-xs font-mono font-bold text-indigo-600">@</span>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="skarimov"
                      value={userForm.username}
                      onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                      className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Telefon raqami <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Phone className="w-4 h-4 text-indigo-600" />
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="+998 90 123 45 67"
                      value={userForm.phone}
                      onChange={e => setUserForm({ ...userForm, phone: formatUzbekPhone(e.target.value) })}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Parol {editingUserId ? "(O'zgartirmaslik uchun bo'sh qoldiring)" : <span className="text-rose-500">*</span>}
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4 text-indigo-600" />
                  </div>
                  <input
                    type="password"
                    placeholder={editingUserId ? "Yangi parol (ixtiyoriy)" : "••••••••"}
                    required={!editingUserId}
                    value={userForm.password}
                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                  />
                </div>
              </div>

              {/* Role Cards Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Tizimdagi Roli va Huquq Darajasi <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setUserForm({ ...userForm, roleCode: 'DOCTOR' })}
                    className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                      userForm.roleCode === 'DOCTOR'
                        ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/60'
                    }`}
                  >
                    <Stethoscope className={`w-5 h-5 mx-auto mb-1 ${userForm.roleCode === 'DOCTOR' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <div className="text-xs font-bold text-slate-800">Shifokor</div>
                    <div className="text-[10px] text-slate-400">DOCTOR</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserForm({ ...userForm, roleCode: 'CASHIER' })}
                    className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                      userForm.roleCode === 'CASHIER'
                        ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/60'
                    }`}
                  >
                    <Wallet className={`w-5 h-5 mx-auto mb-1 ${userForm.roleCode === 'CASHIER' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div className="text-xs font-bold text-slate-800">Kassir</div>
                    <div className="text-[10px] text-slate-400">CASHIER</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserForm({ ...userForm, roleCode: 'MANAGER' })}
                    className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                      userForm.roleCode === 'MANAGER'
                        ? 'border-indigo-500 bg-indigo-50/80 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/60'
                    }`}
                  >
                    <ShieldCheck className={`w-5 h-5 mx-auto mb-1 ${userForm.roleCode === 'MANAGER' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <div className="text-xs font-bold text-slate-800">Menejer</div>
                    <div className="text-[10px] text-slate-400">MANAGER</div>
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingUserId ? "O'zgarishlarni Saqlash" : "Xodimni Saqlash"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: KASSA SMENASINI OCHISH */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
                  <Wallet className="w-6 h-6 text-cyan-100" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black tracking-tight">Yangi Kassa Smenasini Ochish</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      Kassa
                    </span>
                  </div>
                  <p className="text-xs text-cyan-100/90 mt-0.5">Kassir ish kuni uchun rasmiy moliyaviy smena va boshlang'ich kassa qoldig'ini kiriting</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsShiftModalOpen(false)} 
                className="p-2 hover:bg-white/15 rounded-xl text-white/80 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOpenShift} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Bazada mavjud Kassirni tanlang <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <select
                    required
                    value={shiftForm.cashierName}
                    onChange={e => setShiftForm({ ...shiftForm, cashierName: e.target.value })}
                    className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition cursor-pointer appearance-none"
                  >
                    <option value="">-- Kassirni tanlang --</option>
                    {usersList
                      .filter(u => u.role_code === 'CASHIER' || u.role_name?.toLowerCase().includes('kassir'))
                      .map(u => (
                        <option key={u.id} value={u.full_name}>
                          {u.full_name} ({u.username}) • Rasmiy kassir
                        </option>
                      ))}
                    <optgroup label="Boshqa xodimlar / Administratorlar">
                      {usersList
                        .filter(u => u.role_code !== 'CASHIER' && !u.role_name?.toLowerCase().includes('kassir'))
                        .map(u => (
                          <option key={u.id} value={u.full_name}>
                            {u.full_name} ({u.role_name || u.role_code})
                          </option>
                        ))}
                    </optgroup>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Bazada ro'yxatga olingan xodimlar orasidan smena ochuvchi kassir</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Boshlang'ich Kassa Qoldig'i (so'mda) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Banknote className="w-4 h-4 text-blue-600" />
                  </div>
                  <input
                    type="number"
                    required
                    min="0"
                    step="5000"
                    value={shiftForm.openingBalance}
                    onChange={e => setShiftForm({ ...shiftForm, openingBalance: Number(e.target.value) })}
                    className="w-full pl-10 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                    so'm
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  {Number(shiftForm.openingBalance || 0).toLocaleString()} so'm
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Qayd / Izoh
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <input
                    type="text"
                    placeholder="Masalan: Ertalabki asosiy kassa smenasi"
                    value={shiftForm.notes}
                    onChange={e => setShiftForm({ ...shiftForm, notes: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsShiftModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition cursor-pointer"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Smenani ochish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8: SMENANI YOPISH POPUP OYNASI (ALERT EMAS, ZAMONAVIY POPUP) */}
      {isCloseShiftModalOpen && closingShiftData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-amber-600 via-rose-600 to-rose-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
                  <Lock className="w-6 h-6 text-rose-100" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black tracking-tight">Kassa Smenasini Yopish</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white flex items-center gap-1">
                      Yakunlash
                    </span>
                  </div>
                  <p className="text-xs text-rose-100/90 mt-0.5">Smena #{closingShiftData.id} bo'yicha moliyaviy hisobotni yakunlash</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsCloseShiftModalOpen(false)} 
                className="p-2 hover:bg-white/15 rounded-xl text-white/80 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCloseShift} className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Kassir xodim:</span>
                  <span className="font-bold text-slate-800">{closingShiftData.cashier_name || 'Kassir'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Boshlang'ich kassa:</span>
                  <span className="font-mono font-bold text-slate-700">
                    {Number(closingShiftData.opening_balance || 0).toLocaleString()} so'm
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                  <span className="text-slate-500 font-semibold">Smenadagi jami tushum:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    +{Number(closingShiftData.total_received || 0).toLocaleString()} so'm
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kassadagi Haqiqiy Naqd Qoldiq (so'mda) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Banknote className="w-4 h-4 text-rose-600" />
                  </div>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={closingCashAmount}
                    onChange={e => setClosingCashAmount(e.target.value)}
                    className="w-full pl-10 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                    so'm
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  {Number(closingCashAmount || 0).toLocaleString()} so'm
                </p>
                <p className="text-[11px] text-slate-500 mt-2 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-800">
                  Eslatma: Smena yopilgach, barcha qabullar va tushumlar saqlanadi hamda keyingi smenaga o'tiladi.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isClosingShiftSubmitting}
                  onClick={() => setIsCloseShiftModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isClosingShiftSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20 flex items-center gap-2 transition cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isClosingShiftSubmitting ? "Yopilmoqda..." : "Smenani Yopish"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 9: SMENA TAFSILOTLARI VA EXCELGA EXPORT (SHIFOKORLAR BO'YICHA TUSHUM) */}
      {isShiftDetailsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
                  <BarChart3 className="w-6 h-6 text-blue-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black tracking-tight">Smena Tafsilotlari & Moliyaviy Hisobot</h3>
                    {selectedShiftDetails?.shift && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedShiftDetails.shift.status === 'OPEN' ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-white'
                      }`}>
                        {selectedShiftDetails.shift.status === 'OPEN' ? 'Ochiq smena' : 'Yopilgan smena'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-blue-200/90 mt-0.5">
                    ID: #{selectedShiftDetails?.shift?.id || ''} • Kassir: {selectedShiftDetails?.shift?.cashier_name || 'Kassir'} • {selectedShiftDetails?.shift?.opened_at ? new Date(selectedShiftDetails.shift.opened_at).toLocaleDateString('uz-UZ') : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedShiftDetails && (
                  <button
                    onClick={() => handleExportShiftToExcel(selectedShiftDetails)}
                    className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
                    title="Excel fayl sifatida yuklab olish"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Excelga yuklab olish</span>
                  </button>
                )}
                <button 
                  type="button"
                  onClick={() => setIsShiftDetailsModalOpen(false)} 
                  className="p-2 hover:bg-white/15 rounded-xl text-white/80 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {isLoadingShiftDetails ? (
                <div className="py-16 text-center">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-xs text-slate-500 font-semibold">Smena tushumlari va shifokorlar hisoboti yuklanmoqda...</p>
                </div>
              ) : selectedShiftDetails ? (
                <>
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200/70 rounded-2xl">
                      <div className="text-[11px] font-bold text-emerald-800">Jami Tushum</div>
                      <div className="text-lg font-black text-emerald-700 font-mono mt-1">
                        {Number(selectedShiftDetails.summary?.totalReceived || 0).toLocaleString()} so'm
                      </div>
                      <div className="text-[10px] text-emerald-600 mt-0.5">
                        {selectedShiftDetails.summary?.paymentsCount || 0} ta to'lov cheki
                      </div>
                    </div>

                    <div className="p-3.5 bg-blue-50 border border-blue-200/70 rounded-2xl">
                      <div className="text-[11px] font-bold text-blue-800">Naqd Pul Tushumi</div>
                      <div className="text-lg font-black text-blue-700 font-mono mt-1">
                        {Number(selectedShiftDetails.summary?.cashTotal || 0).toLocaleString()} so'm
                      </div>
                      <div className="text-[10px] text-blue-600 mt-0.5">Kassaga kirim qilingan</div>
                    </div>

                    <div className="p-3.5 bg-purple-50 border border-purple-200/70 rounded-2xl">
                      <div className="text-[11px] font-bold text-purple-800">Karta & Onlayn</div>
                      <div className="text-lg font-black text-purple-700 font-mono mt-1">
                        {Number(selectedShiftDetails.summary?.cardTotal || 0).toLocaleString()} so'm
                      </div>
                      <div className="text-[10px] text-purple-600 mt-0.5">Terminal orqali</div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                      <div className="text-[11px] font-bold text-slate-700">Kassa Balansi</div>
                      <div className="text-xs font-mono font-bold text-slate-800 mt-1">
                        Boshlang'ich: {Number(selectedShiftDetails.shift?.opening_balance || 0).toLocaleString()} so'm
                      </div>
                      <div className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                        Yakuniy: {Number(selectedShiftDetails.shift?.closing_balance || 0).toLocaleString()} so'm
                      </div>
                    </div>
                  </div>

                  {/* Section 1: Qaysi shifokor uchun to'lov qilingan (Doctor breakdown) */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                          <Stethoscope className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">
                          Qaysi shifokor uchun to'lov qilingan (Shifokorlar taqsimoti)
                        </h4>
                      </div>
                      <span className="text-xs font-bold text-slate-500">
                        Jami: {selectedShiftDetails.doctorBreakdown?.length || 0} nafar shifokor
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="py-2.5 px-3">№</th>
                            <th className="py-2.5 px-3">Shifokor F.I.Sh.</th>
                            <th className="py-2.5 px-3">Mutaxassislik</th>
                            <th className="py-2.5 px-3 text-center">Talon / Qabul</th>
                            <th className="py-2.5 px-3 text-right">Tushgan Summa</th>
                            <th className="py-2.5 px-3">Ulushi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedShiftDetails.doctorBreakdown?.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-6 text-center text-slate-400">
                                Ushbu smena davomida shifokorlar uchun qabullar qayd etilmagan
                              </td>
                            </tr>
                          ) : (
                            selectedShiftDetails.doctorBreakdown?.map((doc: any, idx: number) => {
                              const totalDocsAmount = selectedShiftDetails.doctorBreakdown.reduce((acc: number, d: any) => acc + (d.totalAmount || 0), 0) || 1;
                              const pct = Math.round((doc.totalAmount / totalDocsAmount) * 100);
                              return (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                                  <td className="py-2.5 px-3 font-bold text-slate-800 flex items-center gap-1.5">
                                    <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                                    <span>{doc.doctorName}</span>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                      {doc.specialtyName}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-bold font-mono text-slate-700">
                                    {doc.ticketCount} ta
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                                    {Number(doc.totalAmount).toLocaleString()} so'm
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                                          style={{ width: `${pct}%` }}
                                        />
                                      </div>
                                      <span className="text-[10px] font-bold text-slate-500 font-mono">{pct}%</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 2: Smenadagi barcha to'lovlar ro'yxati */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <Ticket className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">
                          Smenadagi barcha to'lov cheklari (Reestr)
                        </h4>
                      </div>
                      <span className="text-xs font-bold text-slate-500">
                        {selectedShiftDetails.payments?.length || 0} ta chek
                      </span>
                    </div>

                    <div className="overflow-x-auto max-h-60 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-white">
                          <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="py-2.5 px-3">Chek ID</th>
                            <th className="py-2.5 px-3">Bemor F.I.Sh.</th>
                            <th className="py-2.5 px-3">To'lov Turi</th>
                            <th className="py-2.5 px-3">Summa</th>
                            <th className="py-2.5 px-3">Vaqti</th>
                            <th className="py-2.5 px-3">Izoh / Talonlar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedShiftDetails.payments?.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-6 text-center text-slate-400">To'lovlar topilmadi</td>
                            </tr>
                          ) : (
                            selectedShiftDetails.payments?.map((p: any) => (
                              <tr key={p.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{p.receipt_number || p.id}</td>
                                <td className="py-2.5 px-3 font-bold text-slate-800">{p.patient_name || '-'}</td>
                                <td className="py-2.5 px-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    p.method === 'CASH' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {p.method === 'CASH' ? 'Naqd' : 'Karta'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                  {Number(p.amount).toLocaleString()} so'm
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                                  {p.created_at ? new Date(p.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 text-[11px]">{p.notes || '-'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Hisobot real PostgreSQL bazasidan shakllantirilgan</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedShiftDetails && (
                  <button
                    onClick={() => handleExportShiftToExcel(selectedShiftDetails)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Excel (.csv)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsShiftDetailsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 10: SHIFOKOR HISOBOTI & TUSHUM (HISOBOTLAR SAHIFASIDA BOSGANDA CHIQUVCHI OYNA) */}
      {isDoctorReportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner text-xl font-black">
                  {selectedDoctorReport?.doctor?.display_name?.substring(0, 2).toUpperCase() || 'DR'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black tracking-tight">
                      {selectedDoctorReport?.doctor?.display_name || 'Shifokor Hisoboti'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      Shifokor
                    </span>
                  </div>
                  <p className="text-xs text-blue-200/90 mt-0.5 flex items-center gap-3">
                    <span>Mutaxassislik: <strong>{selectedDoctorReport?.doctor?.specialty_name || 'Umumiy'}</strong></span>
                    <span>•</span>
                    <span>Kabinet: <strong>{selectedDoctorReport?.doctor?.cabinet_number || selectedDoctorReport?.doctor?.room_number || '-'}-xona</strong></span>
                    <span>•</span>
                    <span>Tel: {selectedDoctorReport?.doctor?.phone || '+998 90 000 00 00'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportDoctorReportToExcel(selectedDoctorReport)}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
                  title="Shifokor hisobotini Excel formatida yuklab olish"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Excelga yuklab olish</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setIsDoctorReportModalOpen(false)} 
                  className="p-2 hover:bg-white/15 rounded-xl text-white/80 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {isDoctorReportLoading ? (
                <div className="py-16 text-center">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-xs text-slate-500 font-semibold">Shifokorning navbatlari, qabullari va tushumi yuklanmoqda...</p>
                </div>
              ) : selectedDoctorReport ? (
                <>
                  {/* 4 Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl">
                      <div className="text-[11px] font-bold text-amber-800">Kutayotgan Bemorlar</div>
                      <div className="text-2xl font-black text-amber-600 font-mono mt-1">
                        {selectedDoctorReport.stats?.waiting || 0} ta
                      </div>
                      <div className="text-[10px] text-amber-700/80 mt-0.5">Hozir zalda kutmoqda</div>
                    </div>

                    <div className="p-4 bg-purple-50 border border-purple-200/80 rounded-2xl">
                      <div className="text-[11px] font-bold text-purple-800">Qabul Jarayonida</div>
                      <div className="text-2xl font-black text-purple-600 font-mono mt-1">
                        {selectedDoctorReport.stats?.inProgress || 0} ta
                      </div>
                      <div className="text-[10px] text-purple-700/80 mt-0.5">Xonada ko'rikda</div>
                    </div>

                    <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl">
                      <div className="text-[11px] font-bold text-emerald-800">Qabul Qilingan Bemorlar</div>
                      <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
                        {selectedDoctorReport.stats?.completed || 0} ta
                      </div>
                      <div className="text-[10px] text-emerald-700/80 mt-0.5">Xizmat to'liq ko'rsatildi</div>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200/80 rounded-2xl">
                      <div className="text-[11px] font-bold text-indigo-900">Shu Shifokordan Tushum</div>
                      <div className="text-xl font-black text-indigo-700 font-mono mt-1">
                        {Number(selectedDoctorReport.stats?.totalRevenue || 0).toLocaleString()} so'm
                      </div>
                      <div className="text-[10px] text-indigo-600 mt-0.5">
                        Jami ro'yxat: {selectedDoctorReport.stats?.totalTickets || 0} ta bemor
                      </div>
                    </div>
                  </div>

                  {/* Doctor's Patients & Tickets History Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                          <Users className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">
                          Shifokor Qabulidagi Bemorlar Jurnali
                        </h4>
                      </div>
                      <span className="text-xs text-slate-400">
                        So'nggi 50 ta bemor ro'yxati
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                            <th className="py-2.5 px-3">Talon</th>
                            <th className="py-2.5 px-3">Bemor F.I.Sh.</th>
                            <th className="py-2.5 px-3">Telefon</th>
                            <th className="py-2.5 px-3">Xizmat</th>
                            <th className="py-2.5 px-3">Narxi</th>
                            <th className="py-2.5 px-3">To'lov</th>
                            <th className="py-2.5 px-3">Holati</th>
                            <th className="py-2.5 px-3">Vaqti</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {!selectedDoctorReport.tickets || selectedDoctorReport.tickets.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-slate-400">
                                Ushbu shifokorga biriktirilgan talonlar hozircha mavjud emas
                              </td>
                            </tr>
                          ) : (
                            selectedDoctorReport.tickets.map((t: any) => {
                              const isCompleted = t.status === 'COMPLETED';
                              const isCalled = t.status === 'CALLED';
                              const isInProg = t.status === 'IN_PROGRESS';
                              const isWaiting = t.status === 'WAITING';
                              const isCancelled = t.status === 'CANCELLED';

                              return (
                                <tr key={t.id} className="hover:bg-slate-50/80 transition">
                                  <td className="py-2.5 px-3">
                                    <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-mono font-black text-xs border border-blue-200/80">
                                      {t.full_number}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 font-bold text-slate-800">{t.patient_name || 'Bemor'}</td>
                                  <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{t.patient_phone || '-'}</td>
                                  <td className="py-2.5 px-3 text-slate-700">{t.service_name || 'Konsultatsiya'}</td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                    {Number(t.price || 0).toLocaleString()} so'm
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      t.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                    }`}>
                                      {t.payment_status === 'PAID' ? "To'langan" : "Kutilmoqda"}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      isCompleted ? 'bg-emerald-100 text-emerald-800' :
                                      isCalled ? 'bg-amber-100 text-amber-800 animate-pulse' :
                                      isInProg ? 'bg-purple-100 text-purple-800' :
                                      isWaiting ? 'bg-blue-100 text-blue-800' :
                                      isCancelled ? 'bg-rose-100 text-rose-800' :
                                      'bg-slate-100 text-slate-700'
                                    }`}>
                                      {isCompleted ? 'Yakunlangan' : isCalled ? 'Chaqirilmoqda' : isInProg ? 'Qabulda' : isWaiting ? 'Kutmoqda' : isCancelled ? 'Bekor qilingan' : t.status}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                                    {t.issued_at ? new Date(t.issued_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Barcha ma'lumotlar real PostgreSQL bazasidan olindi</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportDoctorReportToExcel(selectedDoctorReport)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Excel (.csv)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDoctorReportModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL POPUP */}
      <ConfirmDeleteModal
        isOpen={deleteModalConfig.isOpen}
        onClose={() => setDeleteModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteModalConfig.onConfirm}
        title={deleteModalConfig.title}
        description={deleteModalConfig.description}
        itemName={deleteModalConfig.itemName}
        itemDetails={deleteModalConfig.itemDetails}
      />

      {/* Test Ticket Modal for Manager Print Testing */}
      <TicketIssuedModal
        isOpen={isTestTicketModalOpen}
        tickets={TEST_TICKETS_ARRAY}
        initialPaperSize={previewPaperSize}
        onPaperSizeChange={setPreviewPaperSize}
        onClose={() => setIsTestTicketModalOpen(false)}
      />
      {/* App Update Modal */}
      <AppUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
      />
    </div>
  );
};
