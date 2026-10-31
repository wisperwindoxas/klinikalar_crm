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
import { AuditDetailModal } from '../components/manager/modals/AuditDetailModal';
import { DoctorEditModal } from '../components/manager/modals/DoctorEditModal';
import { ServiceEditModal } from '../components/manager/modals/ServiceEditModal';
import { PaymentDetailModal } from '../components/manager/modals/PaymentDetailModal';
import { CabinetEditModal } from '../components/manager/modals/CabinetEditModal';
import { PatientHistoryModal } from '../components/manager/modals/PatientHistoryModal';
import { EmployeeEditModal } from '../components/manager/modals/EmployeeEditModal';
import { ShiftOpenModal } from '../components/manager/modals/ShiftOpenModal';
import { ShiftCloseModal } from '../components/manager/modals/ShiftCloseModal';
import { ShiftDetailModal } from '../components/manager/modals/ShiftDetailModal';
import { DoctorPerformanceModal } from '../components/manager/modals/DoctorPerformanceModal';

import { ManagerDashboardTab } from '../components/manager/tabs/ManagerDashboardTab';
import { ManagerQueuesTab } from '../components/manager/tabs/ManagerQueuesTab';
import { ManagerPatientsTab } from '../components/manager/tabs/ManagerPatientsTab';
import { ManagerDoctorsTab } from '../components/manager/tabs/ManagerDoctorsTab';
import { ManagerCabinetsTab } from '../components/manager/tabs/ManagerCabinetsTab';
import { ManagerServicesTab } from '../components/manager/tabs/ManagerServicesTab';
import { ManagerPaymentsTab } from '../components/manager/tabs/ManagerPaymentsTab';
import { ManagerCashShiftsTab } from '../components/manager/tabs/ManagerCashShiftsTab';
import { ManagerReportsTab } from '../components/manager/tabs/ManagerReportsTab';
import { ManagerTvSettingsTab } from '../components/manager/tabs/ManagerTvSettingsTab';
import { ManagerEmployeesTab } from '../components/manager/tabs/ManagerEmployeesTab';
import { ManagerSystemSettingsTab } from '../components/manager/tabs/ManagerSystemSettingsTab';
import { ManagerPrinterSettingsTab } from '../components/manager/tabs/ManagerPrinterSettingsTab';
import { ManagerSubscriptionSmsTab } from '../components/manager/tabs/ManagerSubscriptionSmsTab';
import { ManagerAuditTab } from '../components/manager/tabs/ManagerAuditTab';

import { DateRangeFilter, DatePreset, isDateInRange } from '../components/DateRangeFilter';
import { APP_LOGO, APP_VERSION } from '../utils/brand';
import { printThermalTicket } from '../utils/thermalPrinter';
import * as XLSX from 'xlsx';

const API_BASE_URL = 'http://189.74.99.251:5001/api/v1';

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
  ticket_number: 'A-012',
  full_number: 'A-012',
  specialty_name: 'Kardiologiya',
  doctor_name: 'Dr. Bobur Ergashev',
  cabinet_number: '7',
  patient_name: 'Rustamov O. (+998 90 *** 45)',
  payment_status: 'PAID',
  service_price: 150000,
  waiting_count: 3,
  estimated_wait_minutes: 20
}];

export const ManagerView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTabSlug = searchParams.get('tab') || 'bosh-sahifa';

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

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

  // Helpers for Clock & Date (DD.MM.YYYY format)
  const getFormattedDate = (d: Date = new Date()) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const getFormattedTime = (d: Date = new Date()) => {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Clock
  const [time, setTime] = useState(() => getFormattedTime());
  const [dateStr, setDateStr] = useState(() => getFormattedDate());

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

  // Date Range Filters for Bemorlar, Hisobotlar, and To'lovlar
  const [patientDatePreset, setPatientDatePreset] = useState<DatePreset>('all');
  const [patientStartDate, setPatientStartDate] = useState('');
  const [patientEndDate, setPatientEndDate] = useState('');

  const [reportDatePreset, setReportDatePreset] = useState<DatePreset>('all');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');

  const [paymentDatePreset, setPaymentDatePreset] = useState<DatePreset>('all');
  const [paymentStartDate, setPaymentStartDate] = useState('');
  const [paymentEndDate, setPaymentEndDate] = useState('');

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
    headerTitle?: string;
    headerSubtitle?: string;
    showLogo: boolean;
    logoUrl?: string;
    address: string;
    phone: string;
    welcomeNote: string;
    showDate: boolean;
    showTicketNumber: boolean;
    showSpecialty: boolean;
    showDepartment?: boolean;
    showDoctor: boolean;
    showDoctorName?: boolean;
    showCabinet: boolean;
    showPatientName: boolean;
    showPaymentStatus: boolean;
    showServicePrice?: boolean;
    showWaitTime: boolean;
    showWaitingCount?: boolean;
    showEstimatedTime?: boolean;
    showQrCode: boolean;
    showFooter?: boolean;
    showCutLine: boolean;
    footerText: string;
    footerNote: string;
  }

  const defaultPrinterSettings: TicketPrinterSettings = {
    paperSize: '80mm',
    copies: 1,
    autoPrint: true,
    soundAlert: true,
    clinicName: 'SADAF TIBBIYOT MARKAZI',
    headerTitle: 'SADAF TIBBIYOT MARKAZI',
    headerSubtitle: "Navbat talonini qabul yakunigacha saqlang",
    showLogo: true,
    logoUrl: '',
    address: "Toshkent sh., Chilonzor tumani, Bunyodkor ko'chasi 15-uy",
    phone: "+998 71 200 00 20",
    welcomeNote: "Navbat talonini qabul yakunigacha saqlang",
    showDate: true,
    showTicketNumber: true,
    showSpecialty: true,
    showDepartment: true,
    showDoctor: true,
    showDoctorName: true,
    showCabinet: true,
    showPatientName: true,
    showPaymentStatus: true,
    showServicePrice: true,
    showWaitTime: true,
    showWaitingCount: true,
    showEstimatedTime: true,
    showQrCode: true,
    showFooter: true,
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
    const updateClock = () => {
      const now = new Date();
      setTime(getFormattedTime(now));
      setDateStr(getFormattedDate(now));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);

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

      let res;
      if (editingDoctorId) {
        res = await fetch(`${API_BASE_URL}/doctors/${editingDoctorId}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE_URL}/doctors`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
      }
      const resData = await res.json().catch(() => ({}));
      if (!res.ok || resData.success === false) {
        showNotification('Xatolik', resData.message || 'Shifokorni saqlashda xatolik yuz berdi', 'error');
        return;
      }
      setIsDoctorModalOpen(false);
      setEditingDoctorId(null);
      loadManagerData();
      showNotification('Shifokor saqlandi', `${doctorForm.displayName} ma'lumotlari muvaffaqiyatli saqlandi.`, 'success');
    } catch (e: any) {
      showNotification('Xatolik', e?.message || 'Shifokorni saqlashda xatolik yuz berdi', 'error');
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
          const res = await fetch(`${API_BASE_URL}/doctors/${doc.id}`, { method: 'DELETE', headers: getAuthHeaders() });
          const resData = await res.json().catch(() => ({}));
          if (!res.ok || resData.success === false) {
            showNotification('Xatolik', resData.message || 'Shifokorni o\'chirishda xatolik yuz berdi', 'error');
            return;
          }
          loadManagerData();
          showNotification('Shifokor o\'chirildi', `${doc.display_name} muvaffaqiyatli o'chirildi.`, 'success');
        } catch (e: any) {
          showNotification('Xatolik', e?.message || 'Shifokorni o\'chirishda xatolik yuz berdi', 'error');
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
        const matchesDate = isDateInRange(p.created_at, paymentDatePreset, paymentStartDate, paymentEndDate);
        return matchesSearch && matchesMethod && matchesDate;
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
      const filtered = patientsList.filter(p => {
        const matchesSearch = !patientSearch || 
          p.full_name?.toLowerCase().includes(patientSearch.toLowerCase()) || 
          p.phone?.includes(patientSearch) ||
          p.patient_number?.includes(patientSearch);
        const matchesDate = isDateInRange(p.created_at, patientDatePreset, patientStartDate, patientEndDate);
        return matchesSearch && matchesDate;
      });

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
          const res = await fetch(`${API_BASE_URL}/patients/${patient.id}`, { method: 'DELETE', headers: getAuthHeaders() });
          const resData = await res.json().catch(() => ({}));
          if (!res.ok || resData.success === false) {
            showNotification('Xatolik', resData.message || 'Bemorni o\'chirishda xatolik yuz berdi', 'error');
            return;
          }
          loadManagerData();
          showNotification('Bemor o\'chirildi', `${patient.full_name} bazadan muvaffaqiyatli o'chirildi.`, 'success');
        } catch (e: any) {
          showNotification('Xatolik', e?.message || 'Bemorni o\'chirishda xatolik yuz berdi', 'error');
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

  const handleToggleTvSound = async () => {
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
    <div className="flex h-screen bg-[#F0F4F8] text-[#172B4D] overflow-hidden select-none font-sans relative">
      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* 1. DARK SIDEBAR (RESPONSIVE: DRAWER ON MOBILE, COLLAPSIBLE ON DESKTOP) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 md:static md:z-20 flex flex-col justify-between flex-shrink-0 transition-all duration-300 bg-[#0B1528] border-r border-[#1E293B] ${
          mobileDrawerOpen ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full md:translate-x-0'
        } ${sidebarCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        {/* Top Brand */}
        <div>
          <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-transparent flex items-center justify-center flex-shrink-0 filter drop-shadow-md overflow-hidden">
                <img
                  src={clinicSettings?.logo_url || settingsForm?.logoUrl || APP_LOGO}
                  alt={clinicSettings?.clinic_name || settingsForm?.clinicName || 'Klinika-admin'}
                  className="w-full h-full object-contain bg-transparent rounded-lg"
                />
              </div>
              {(!sidebarCollapsed || mobileDrawerOpen) && (
                <div className="overflow-hidden">
                  <div className="font-bold text-base sm:text-lg text-white tracking-tight leading-tight truncate">
                    {clinicSettings?.clinic_name || settingsForm?.clinicName || 'Klinika-admin'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    Boshqaruv Tizimi
                  </div>
                </div>
              )}
            </div>
            {/* Close button on mobile drawer */}
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              title="Yopish"
            >
              <X className="w-5 h-5" />
            </button>
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
                            setMobileDrawerOpen(false);
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
                        {(!sidebarCollapsed || mobileDrawerOpen) && <span className="truncate">{item.label}</span>}
                      </div>
                      {(!sidebarCollapsed || mobileDrawerOpen) && (
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-white' : ''}`} />
                      )}
                    </button>

                    {/* Submenu dropdown items */}
                    {(!sidebarCollapsed || mobileDrawerOpen) && isExpanded && (
                      <div className="pl-4 pr-1 space-y-1 py-1">
                        {item.children.map(child => {
                          const ChildIcon = child.icon;
                          const isChildActive = activeTab === child.id || currentTabSlug === child.slug;
                          return (
                            <button
                              key={child.id}
                              onClick={() => {
                                setSearchParams({ tab: child.slug });
                                setMobileDrawerOpen(false);
                              }}
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
                    setMobileDrawerOpen(false);
                  }}
                  title={item.label}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-[13px] font-semibold transition text-left cursor-pointer ${
                    isActive
                      ? 'bg-medical-blue text-white shadow-lg shadow-medical-blue/30 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-6 h-6 stroke-[2.2] flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {(!sidebarCollapsed || mobileDrawerOpen) && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Collapse Button (Desktop only) */}
        <div className="p-3 border-t border-slate-800/80 hidden md:block">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800/50 text-xs font-semibold transition cursor-pointer"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            {!sidebarCollapsed && <span>Menyuni yig'ish</span>}
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP NAVBAR (100% RESPONSIVE) */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between flex-shrink-0 relative z-30 shadow-xs">
          {/* Left Brand / Hamburger */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => {
                if (window.innerWidth < 768) {
                  setMobileDrawerOpen(prev => !prev);
                } else {
                  setSidebarCollapsed(prev => !prev);
                }
              }}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition cursor-pointer flex-shrink-0"
              title="Menyuni ochish/yopish"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-[#172B4D] leading-tight truncate max-w-[130px] sm:max-w-xs md:max-w-none">
                {clinicSettings?.clinic_name || settingsForm?.clinicName || 'Klinika-admin'}
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium hidden xs:block truncate">Navbat Tizimi — Boshqaruv</p>
            </div>
          </div>

          {/* Right Header Badges */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Date Pill (Kattalashtirilgan va DD.MM.YYYY formatida, hidden on mobile < 768px) */}
            <div className="hidden md:flex items-center gap-2.5 px-3.5 sm:px-4 py-2 bg-slate-50 border border-slate-200/90 rounded-xl shadow-2xs hover:bg-slate-100/60 transition">
              <Calendar className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#1677FF] flex-shrink-0" />
              <span className="text-sm sm:text-base font-bold text-slate-800 font-mono tracking-wide">
                {dateStr}
              </span>
            </div>

            {/* Live Clock Pill (Kattalashtirilgan va Clock ikonkali, responsive padding) */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-slate-50 border border-slate-200/90 rounded-xl shadow-2xs hover:bg-slate-100/60 transition">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
              <span className="text-sm sm:text-lg font-black text-[#172B4D] font-mono tracking-wider">
                {time}
              </span>
            </div>

            {/* User Profile Pill with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 sm:pr-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition shadow-2xs cursor-pointer"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#1677FF] to-blue-700 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                  {getUserInitials(currentUser?.fullName || currentUser?.name || currentUser?.username)}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-[#172B4D] leading-tight max-w-[120px] truncate">
                    {currentUser?.fullName || currentUser?.name || currentUser?.username || 'Menejer'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold truncate">
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

        {/* 3. SCROLLABLE CONTENT AREA (RESPONSIVE PADDING) */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-y-auto space-y-4 sm:space-y-6">
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
          {/* TAB 1: BOSH SAHIFA */}
          {activeTab === 'BOSH_SAHIFA' && (
            <ManagerDashboardTab
              todayTotal={todayTotal}
              waitingTotal={waitingTotal}
              inConsultationTotal={inConsultationTotal}
              completedTotal={completedTotal}
              hourlyData={hourlyData}
              hoveredHour={hoveredHour}
              setHoveredHour={setHoveredHour}
              pb={pb}
              activePaySegment={activePaySegment}
              setActivePaySegment={setActivePaySegment}
              allTicketsList={allTicketsList}
              setSearchParams={setSearchParams}
              time={time}
              doctorsList={doctorsList}
              paymentsList={paymentsList}
              setIsNewPatientModalOpen={setIsNewPatientModalOpen}
              navigate={navigate}
              setEditingDoctorId={setEditingDoctorId}
              setDoctorForm={setDoctorForm}
              setIsDoctorModalOpen={setIsDoctorModalOpen}
              handleOpenServiceModal={handleOpenServiceModal}
            />
          )}

          {/* TAB 2: NAVBATLAR */}
          {activeTab === 'NAVBATLAR' && (
            <ManagerQueuesTab
              allTicketsList={allTicketsList}
              queueSearch={queueSearch}
              setQueueSearch={setQueueSearch}
              queueStatusFilter={queueStatusFilter}
              setQueueStatusFilter={setQueueStatusFilter}
              visibleManagerTicketsCount={visibleManagerTicketsCount}
              setVisibleManagerTicketsCount={setVisibleManagerTicketsCount}
              loadManagerData={loadManagerData}
              navigate={navigate}
              promptCancelTicket={promptCancelTicket}
              formatUzbekPhone={formatUzbekPhone}
            />
          )}

          {/* TAB 3: BEMORLAR */}
          {activeTab === 'BEMORLAR' && (
            <ManagerPatientsTab
              patientsList={patientsList}
              patientDatePreset={patientDatePreset}
              setPatientDatePreset={setPatientDatePreset}
              patientStartDate={patientStartDate}
              setPatientStartDate={setPatientStartDate}
              patientEndDate={patientEndDate}
              setPatientEndDate={setPatientEndDate}
              patientSearch={patientSearch}
              setPatientSearch={setPatientSearch}
              visibleManagerPatientsCount={visibleManagerPatientsCount}
              setVisibleManagerPatientsCount={setVisibleManagerPatientsCount}
              onExportExcel={exportPatientsToExcel}
              onOpenNewPatient={() => setIsNewPatientModalOpen(true)}
              onOpenPatientModal={handleOpenPatientModal}
              onDeletePatient={promptDeletePatient}
            />
          )}

          {/* TAB 4: SHIFOKORLAR */}
          {activeTab === 'SHIFOKORLAR' && (
            <ManagerDoctorsTab
              doctorsList={doctorsList}
              doctorSearch={doctorSearch}
              setDoctorSearch={setDoctorSearch}
              onAddNewDoctor={() => {
                setEditingDoctorId(null);
                setDoctorForm({ displayName: '', specialtyId: specialtiesList[0]?.id || '', cabinetNumber: '', phone: '+998 ', address: '', username: '', password: 'doctor123' });
                setIsDoctorModalOpen(true);
              }}
              onEditDoctor={(doc) => {
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
              onDeleteDoctor={promptDeleteDoctor}
            />
          )}

          {/* TAB 5: KABINETLAR */}
          {activeTab === 'KABINETLAR' && (
            <ManagerCabinetsTab
              cabinetsList={cabinetsList}
              doctorsList={doctorsList}
              cabinetFloorFilter={cabinetFloorFilter}
              setCabinetFloorFilter={setCabinetFloorFilter}
              cabinetSearch={cabinetSearch}
              setCabinetSearch={setCabinetSearch}
              onAddNewCabinet={() => {
                setEditingCabinetId(null);
                setCabinetForm({ roomNumber: '', name: '', department: 'Ambulatoriya', floor: 1 });
                setIsCabinetModalOpen(true);
              }}
              onEditCabinet={(cab) => {
                setEditingCabinetId(cab.id);
                setCabinetForm({
                  roomNumber: cab.number || cab.room_number || '',
                  name: cab.name || '',
                  department: cab.department || 'Ambulatoriya',
                  floor: Number(cab.floor) || 1
                });
                setIsCabinetModalOpen(true);
              }}
              onDeleteCabinet={promptDeleteCabinet}
            />
          )}

          {/* TAB 6: XIZMATLAR */}
          {activeTab === 'XIZMATLAR' && (
            <ManagerServicesTab
              servicesList={servicesList}
              specialtiesList={specialtiesList}
              serviceSearch={serviceSearch}
              setServiceSearch={setServiceSearch}
              serviceSpecialtyFilter={serviceSpecialtyFilter}
              setServiceSpecialtyFilter={setServiceSpecialtyFilter}
              onExportExcel={exportServicesToExcel}
              onOpenServiceModal={handleOpenServiceModal}
              onDeleteService={promptDeleteService}
            />
          )}

          {/* TAB 7: TO'LOVLAR */}
          {activeTab === 'TOLOVLAR' && (
            <ManagerPaymentsTab
              paymentsList={paymentsList}
              paymentDatePreset={paymentDatePreset}
              setPaymentDatePreset={setPaymentDatePreset}
              paymentStartDate={paymentStartDate}
              setPaymentStartDate={setPaymentStartDate}
              paymentEndDate={paymentEndDate}
              setPaymentEndDate={setPaymentEndDate}
              paymentSearch={paymentSearch}
              setPaymentSearch={setPaymentSearch}
              paymentMethodFilter={paymentMethodFilter}
              setPaymentMethodFilter={setPaymentMethodFilter}
              visibleManagerPaymentsCount={visibleManagerPaymentsCount}
              setVisibleManagerPaymentsCount={setVisibleManagerPaymentsCount}
              onExportExcel={exportPaymentsToExcel}
              onSelectPayment={(payment) => {
                setSelectedPayment(payment);
                setIsPaymentModalOpen(true);
              }}
            />
          )}

          {/* TAB 8: KASSA SMENASI */}
          {activeTab === 'KASSA_SMENASI' && (
            <ManagerCashShiftsTab
              currentShift={currentShift}
              pb={pb}
              allShiftsList={allShiftsList}
              onOpenCloseShift={handleOpenCloseShiftModal}
              onOpenNewShift={() => {
                const firstCashier = usersList.find(u => u.role_code === 'CASHIER' || u.role_name?.toLowerCase().includes('kassir')) || usersList[0];
                if (firstCashier) {
                  setShiftForm(prev => ({ ...prev, cashierName: firstCashier.full_name }));
                }
                setIsShiftModalOpen(true);
              }}
              onOpenShiftDetails={handleOpenShiftDetails}
            />
          )}

          {/* TAB 9: HISOBOTLAR */}
          {activeTab === 'HISOBOTLAR' && (
            <ManagerReportsTab
              allTicketsList={allTicketsList}
              paymentsList={paymentsList}
              doctorsList={doctorsList}
              reportDatePreset={reportDatePreset}
              setReportDatePreset={setReportDatePreset}
              reportStartDate={reportStartDate}
              setReportStartDate={setReportStartDate}
              reportEndDate={reportEndDate}
              setReportEndDate={setReportEndDate}
              onOpenDoctorReport={handleOpenDoctorReport}
            />
          )}

          {/* TAB 10: TV TABLOSI */}
          {activeTab === 'TV_TABLOSI' && (
            <ManagerTvSettingsTab
              tvSettings={tvSettings}
              setTvSettings={setTvSettings}
              isSavingTvSettings={isSavingTvSettings}
              onSaveTvSettings={handleSaveTvSettings}
              isPlayingTvPreview={isPlayingTvPreview}
              onPlayTvPreview={handlePlayTvPreview}
              insertTemplateTag={insertTemplateTag}
              applyPreset={applyPreset}
              testTicketNum={testTicketNum}
              setTestTicketNum={setTestTicketNum}
              testSpecName={testSpecName}
              setTestSpecName={setTestSpecName}
              testCabNum={testCabNum}
              setTestCabNum={setTestCabNum}
              testCallStatus={testCallStatus}
              onSendTvTestCall={handleSendTvTestCall}
              onToggleSound={handleToggleTvSound}
            />
          )}

          {/* TAB 11: XODIMLAR */}
          {activeTab === 'XODIMLAR' && (
            <ManagerEmployeesTab
              usersList={usersList}
              userSearch={userSearch}
              setUserSearch={setUserSearch}
              onExportExcel={exportUsersToExcel}
              onOpenNewUser={handleOpenNewUserModal}
              onEditUser={handleEditUser}
              onDeleteUser={promptDeleteUser}
            />
          )}

          {/* TAB 12: TIZIM SOZLAMALARI */}
          {activeTab === 'TIZIM_SOZLAMALARI' && (
            <ManagerSystemSettingsTab
              settingsForm={settingsForm}
              setSettingsForm={setSettingsForm}
              clinicSettings={clinicSettings}
              isSavingSettings={isSavingSettings}
              onSaveSettings={handleSaveSettings}
              onResetSettings={handleResetSettings}
              onOpenUpdateModal={() => setIsUpdateModalOpen(true)}
              onNavigateTab={(tabSlug) => setSearchParams({ tab: tabSlug })}
            />
          )}

          {/* TAB 13: PRINTER SOZLAMALARI */}
          {activeTab === 'PRINTER_SOZLAMALARI' && (
            <ManagerPrinterSettingsTab
              printerSettings={printerSettings}
              setPrinterSettings={setPrinterSettings}
              isSavingPrinterSettings={isSavingPrinterSettings}
              onSave={handleSavePrinterSettings}
              onReset={handleResetPrinterSettings}
              onTestPrint={handleTestPrint}
              previewPaperSize={previewPaperSize}
              setPreviewPaperSize={setPreviewPaperSize}
              onNavigateTab={(tabSlug) => setSearchParams({ tab: tabSlug })}
            />
          )}

          {/* TAB 14: OBUNA VA SMS */}
          {activeTab === 'OBUNA_SMS' && (
            <ManagerSubscriptionSmsTab
              clinicSubscription={clinicSubscription}
              smsSettings={smsSettings}
              loadingSubscription={loadingSubscription}
              onRefresh={fetchClinicSubscriptionAndSms}
            />
          )}

          {/* TAB 15: AUDIT JURNALI */}
          {activeTab === 'AUDIT_JURNALI' && (
            <ManagerAuditTab
              auditLogsList={auditLogsList}
              auditSearch={auditSearch}
              setAuditSearch={setAuditSearch}
              auditActionFilter={auditActionFilter}
              setAuditActionFilter={setAuditActionFilter}
              onRefresh={() => loadManagerData()}
              onExportExcel={exportAuditLogsToExcel}
              onSelectAuditItem={(log) => {
                setSelectedAuditItem(log);
                setIsAuditModalOpen(true);
              }}
            />
          )}
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

      {/* MODAL: AUDIT YARATILGAN VA TAHLIL POPUP */}
      <AuditDetailModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        item={selectedAuditItem}
        copiedAuditJson={copiedAuditJson}
        onCopy={() => {
          if (selectedAuditItem) {
            navigator.clipboard.writeText(JSON.stringify(selectedAuditItem, null, 2));
            setCopiedAuditJson(true);
            setTimeout(() => setCopiedAuditJson(false), 2000);
          }
        }}
        getExplanation={getAuditExplanation}
      />

      {/* MODAL 2: SHIFOKORNI QO'SHISH / TAHRIRLASH */}
      <DoctorEditModal
        isOpen={isDoctorModalOpen}
        onClose={() => setIsDoctorModalOpen(false)}
        editingDoctorId={editingDoctorId}
        doctorForm={doctorForm}
        onFormChange={setDoctorForm}
        specialtiesList={specialtiesList}
        onSubmit={handleSaveDoctor}
      />

      {/* MODAL 3: XIZMATNI TAHRIRLASH VA BIRIKTIRILGAN SHIFOKORLAR */}
      <ServiceEditModal
        isOpen={isServiceModalOpen}
        onClose={() => {
          setIsServiceModalOpen(false);
          setSelectedServiceForDetail(null);
        }}
        editingServiceId={editingServiceId}
        selectedServiceForDetail={selectedServiceForDetail}
        serviceModalTab={serviceModalTab}
        onTabChange={setServiceModalTab}
        serviceForm={serviceForm}
        onFormChange={setServiceForm}
        specialtiesList={specialtiesList}
        onExportDoctorsExcel={exportServiceDoctorsToExcel}
        onSubmit={handleSaveService}
      />

      {/* MODAL 3.5: TO'LOV TAFSILOTLARI VA MOLIYAVIY CHEK */}
      <PaymentDetailModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedPayment(null);
        }}
        selectedPayment={selectedPayment}
        onPrintReceipt={(pm) => {
          printThermalTicket({
            tickets: [{
              patient_name: pm.patient_name || 'Bemor',
              specialty_name: pm.notes || 'Tibbiy xizmat',
              service_price: pm.amount
            }],
            config: {
              clinicName: settingsForm.clinicName || clinicSettings?.clinic_name || 'KLINIKA-ADMIN',
              address: settingsForm.address || clinicSettings?.address || '',
              phone: settingsForm.phone || clinicSettings?.phone || '',
              footerText: "Tashrifingiz uchun rahmat! Salomat bo'ling!"
            },
            mode: 'RECEIPT',
            payment: pm,
            paperSize: '80mm'
          });
        }}
      />

      {/* MODAL 4: KABINET QO'SHISH / TAHRIRLASH */}
      <CabinetEditModal
        isOpen={isCabinetModalOpen}
        onClose={() => setIsCabinetModalOpen(false)}
        editingCabinetId={editingCabinetId}
        cabinetForm={cabinetForm}
        onFormChange={setCabinetForm}
        cabinetsList={cabinetsList}
        onSubmit={handleSaveCabinet}
      />

      {/* MODAL 5: BEMORNING TO'LIQ TARIXI VA TAHRIRLASH */}
      <PatientHistoryModal
        isOpen={isPatientEditModalOpen}
        onClose={() => setIsPatientEditModalOpen(false)}
        selectedPatientDetail={selectedPatientDetail}
        patientPayments={patientPayments}
        patientTickets={patientTickets}
        patientHistoryLoading={patientHistoryLoading}
        patientModalTab={patientModalTab}
        onTabChange={setPatientModalTab}
        patientForm={patientForm}
        onFormChange={setPatientForm}
        onSubmit={handleSavePatient}
      />

      {/* MODAL 6: XODIMNI QO'SHISH / TAHRIRLASH */}
      <EmployeeEditModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        editingUserId={editingUserId}
        userForm={userForm}
        onFormChange={setUserForm}
        onSubmit={handleSaveUser}
      />

      {/* MODAL 7: KASSA SMENASINI OCHISH */}
      <ShiftOpenModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        shiftForm={shiftForm}
        onFormChange={setShiftForm}
        usersList={usersList}
        onSubmit={handleOpenShift}
      />

      {/* MODAL 8: SMENANI YOPISH POPUP OYNASI */}
      <ShiftCloseModal
        isOpen={isCloseShiftModalOpen}
        onClose={() => setIsCloseShiftModalOpen(false)}
        closingShiftData={closingShiftData}
        closingCashAmount={closingCashAmount}
        onAmountChange={setClosingCashAmount}
        isSubmitting={isClosingShiftSubmitting}
        onSubmit={handleConfirmCloseShift}
      />

      {/* MODAL 9: SMENA TAFSILOTLARI VA EXCELGA EXPORT */}
      <ShiftDetailModal
        isOpen={isShiftDetailsModalOpen}
        onClose={() => setIsShiftDetailsModalOpen(false)}
        shiftDetails={selectedShiftDetails}
        isLoading={isLoadingShiftDetails}
        onExportExcel={handleExportShiftToExcel}
      />

      {/* MODAL 10: SHIFOKOR HISOBOTI & TUSHUM */}
      <DoctorPerformanceModal
        isOpen={isDoctorReportModalOpen}
        onClose={() => setIsDoctorReportModalOpen(false)}
        reportData={selectedDoctorReport}
        isLoading={isDoctorReportLoading}
        onExportExcel={exportDoctorReportToExcel}
      />

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
        config={printerSettings}
        onPaperSizeChange={(size) => {
          setPreviewPaperSize(size);
          setPrinterSettings(prev => ({ ...prev, paperSize: size }));
        }}
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
