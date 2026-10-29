export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  OPERATOR = 'OPERATOR',
  DOCTOR = 'DOCTOR',
  RECEPTIONIST = 'RECEPTIONIST',
  TV_DISPLAY = 'TV_DISPLAY',
  PATIENT = 'PATIENT'
}

export enum ClinicStatus {
  ACTIVE = 'ACTIVE',
  TRIAL = 'TRIAL',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
  BLOCKED = 'BLOCKED'
}

export enum PlanCode {
  STARTER = 'STARTER',
  PRO = 'PRO',
  BUSINESS = 'BUSINESS',
  ENTERPRISE = 'ENTERPRISE'
}

export enum QueueStatus {
  WAITING = 'WAITING',
  CALLED = 'CALLED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
  CANCELLED = 'CANCELLED',
  TRANSFERRED = 'TRANSFERRED'
}

export enum DoctorStatus {
  AVAILABLE = 'AVAILABLE',
  IN_VISIT = 'IN_VISIT',
  ON_BREAK = 'ON_BREAK',
  OFFLINE = 'OFFLINE'
}

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: UserRole;
  branchId?: string;
  clinicName?: string;
}

export interface PlanLimits {
  maxBranches: number;
  maxDoctors: number;
  maxOperators: number;
  maxPatientsPerMonth: number;
  allowSMS: boolean;
  allowTelegram: boolean;
  allowCustomTheme: boolean;
  allowTvDisplay: boolean;
  allowApiAccess: boolean;
  allowMultiBranchAnalytics: boolean;
}

export interface Plan {
  id: string;
  code: PlanCode;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  trialDays: number;
  limits: PlanLimits;
  isActive: boolean;
  createdAt: string;
}

export interface Tenant {
  id: string;
  code: string;
  name: string;
  slug: string;
  status: ClinicStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Clinic {
  id: string;
  tenantId: string;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  phone: string;
  email: string;
  address: string;
  region?: string;
  district?: string;
  queuePrefix: string;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

export interface Branch {
  id: string;
  tenantId: string;
  clinicId: string;
  name: string;
  address: string;
  phone: string;
  queuePrefix: string;
  isMain: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface Cabinet {
  id: string;
  tenantId: string;
  branchId: string;
  number: string;
  name: string;
  floor: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
}

export interface User {
  id: string;
  tenantId?: string; // null for SUPER_ADMIN
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  avatarUrl?: string;
  branchId?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  createdAt: string;
  lastLoginAt?: string;
}

export interface Specialty {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  icon?: string;
}

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  specialtyId?: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
}

export interface Doctor {
  id: string;
  tenantId: string;
  userId: string;
  fullName: string;
  phone: string;
  avatarUrl?: string;
  specialtyId: string;
  specialtyName: string;
  branchId: string;
  cabinetNumber: string;
  experienceYears: number;
  status: DoctorStatus;
  currentTicketId?: string;
  avgConsultationMinutes: number;
}

export interface Patient {
  id: string;
  tenantId: string;
  patientNumber: string;
  fullName: string;
  phone: string;
  birthDate?: string;
  gender?: 'MALE' | 'FEMALE';
  address?: string;
  notes?: string;
  lastVisitAt?: string;
  createdAt: string;
}

export interface QueueTicket {
  id: string;
  tenantId: string;
  branchId: string;
  doctorId: string;
  patientId: string;
  cabinetNumber: string;
  ticketNumber: string; // e.g. A015
  serviceId?: string;
  serviceName?: string;
  complaint?: string;
  status: QueueStatus;
  estimatedWaitMinutes: number;
  calledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  // Hydrated references
  patientName?: string;
  patientPhone?: string;
  doctorName?: string;
  specialtyName?: string;
}

export interface Visit {
  id: string;
  tenantId: string;
  queueTicketId: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  notes: string;
  prescriptions: PrescriptionItem[];
  servicesProvided: { serviceId: string; name: string; price: number }[];
  totalCost: number;
  startedAt: string;
  completedAt: string;
}

export interface PrescriptionItem {
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions: string;
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  planCode: PlanCode;
  status: ClinicStatus;
  startDate: string;
  endDate: string;
  trialEndDate?: string;
  gracePeriodDays: number;
  autoRenew: boolean;
  createdAt?: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  clinicName: string;
  planCode: PlanCode;
  amount: number;
  currency: string;
  status: 'PAID' | 'PENDING' | 'CANCELLED' | 'REFUNDED';
  paymentProvider: 'PAYME' | 'CLICK' | 'UZCARD' | 'HUMO' | 'STRIPE';
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  tenantId?: string;
  userId: string;
  userRole: UserRole;
  userFullName: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}
