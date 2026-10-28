import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import {
  Tenant, Clinic, Branch, Cabinet, User, Specialty, Service,
  Doctor, Patient, QueueTicket, Visit, Plan, Subscription,
  Invoice, AuditLog, UserRole, ClinicStatus, PlanCode,
  QueueStatus, DoctorStatus
} from '../types';

interface DatabaseSchema {
  tenants: Tenant[];
  clinics: Clinic[];
  branches: Branch[];
  cabinets: Cabinet[];
  users: User[];
  specialties: Specialty[];
  services: Service[];
  doctors: Doctor[];
  patients: Patient[];
  queueTickets: QueueTicket[];
  visits: Visit[];
  plans: Plan[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  auditLogs: AuditLog[];
}

export class DatabaseService {
  private static instance: DatabaseService;
  private dbFilePath: string;
  private data: DatabaseSchema;

  private constructor() {
    this.dbFilePath = path.resolve(process.cwd(), config.databasePath);
    this.data = this.loadDatabase();
    if (this.data.users.length === 0) {
      this.seedInitialData();
    }
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private loadDatabase(): DatabaseSchema {
    if (fs.existsSync(this.dbFilePath)) {
      try {
        const raw = fs.readFileSync(this.dbFilePath, 'utf-8');
        return JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse database file, reinitializing', e);
      }
    }
    return {
      tenants: [],
      clinics: [],
      branches: [],
      cabinets: [],
      users: [],
      specialties: [],
      services: [],
      doctors: [],
      patients: [],
      queueTickets: [],
      visits: [],
      plans: [],
      subscriptions: [],
      invoices: [],
      auditLogs: []
    };
  }

  public save(): void {
    try {
      const dir = path.dirname(this.dbFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dbFilePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database file', e);
    }
  }

  // Generic Tenant-Aware Query Helpers
  public getTenants(): Tenant[] {
    return this.data.tenants;
  }

  public getClinics(): Clinic[] {
    return this.data.clinics;
  }

  public getClinicByTenant(tenantId: string): Clinic | undefined {
    return this.data.clinics.find(c => c.tenantId === tenantId);
  }

  public getBranches(tenantId?: string): Branch[] {
    if (!tenantId) return this.data.branches;
    return this.data.branches.filter(b => b.tenantId === tenantId);
  }

  public getCabinets(tenantId?: string, branchId?: string): Cabinet[] {
    return this.data.cabinets.filter(c => {
      if (tenantId && c.tenantId !== tenantId) return false;
      if (branchId && c.branchId !== branchId) return false;
      return true;
    });
  }

  public getUsers(tenantId?: string): User[] {
    if (!tenantId) return this.data.users;
    return this.data.users.filter(u => u.tenantId === tenantId);
  }

  public getUserByEmailOrPhone(identifier: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === identifier.toLowerCase() || u.phone === identifier);
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getDoctors(tenantId?: string, branchId?: string): Doctor[] {
    return this.data.doctors.filter(d => {
      if (tenantId && d.tenantId !== tenantId) return false;
      if (branchId && d.branchId !== branchId) return false;
      return true;
    });
  }

  public getDoctorById(id: string, tenantId?: string): Doctor | undefined {
    return this.data.doctors.find(d => d.id === id && (!tenantId || d.tenantId === tenantId));
  }

  public getPatients(tenantId?: string): Patient[] {
    if (!tenantId) return this.data.patients;
    return this.data.patients.filter(p => p.tenantId === tenantId);
  }

  public getPatientById(id: string, tenantId?: string): Patient | undefined {
    return this.data.patients.find(p => p.id === id && (!tenantId || p.tenantId === tenantId));
  }

  public getQueueTickets(tenantId?: string, branchId?: string): QueueTicket[] {
    return this.data.queueTickets.filter(q => {
      if (tenantId && q.tenantId !== tenantId) return false;
      if (branchId && q.branchId !== branchId) return false;
      return true;
    });
  }

  public getQueueTicketById(id: string, tenantId?: string): QueueTicket | undefined {
    return this.data.queueTickets.find(q => q.id === id && (!tenantId || q.tenantId === tenantId));
  }

  public getVisits(tenantId?: string): Visit[] {
    if (!tenantId) return this.data.visits;
    return this.data.visits.filter(v => v.tenantId === tenantId);
  }

  public getPlans(): Plan[] {
    return this.data.plans;
  }

  public getPlanByCode(code: PlanCode): Plan | undefined {
    return this.data.plans.find(p => p.code === code);
  }

  public getSubscriptionByTenant(tenantId: string): Subscription | undefined {
    return this.data.subscriptions.find(s => s.tenantId === tenantId);
  }

  public getInvoices(tenantId?: string): Invoice[] {
    if (!tenantId) return this.data.invoices;
    return this.data.invoices.filter(i => i.tenantId === tenantId);
  }

  public getAuditLogs(tenantId?: string): AuditLog[] {
    if (!tenantId) return this.data.auditLogs;
    return this.data.auditLogs.filter(a => a.tenantId === tenantId);
  }

  // Mutations
  public addTenant(tenant: Tenant): void {
    this.data.tenants.push(tenant);
    this.save();
  }

  public addClinic(clinic: Clinic): void {
    this.data.clinics.push(clinic);
    this.save();
  }

  public addBranch(branch: Branch): void {
    this.data.branches.push(branch);
    this.save();
  }

  public addUser(user: User): void {
    this.data.users.push(user);
    this.save();
  }

  public addDoctor(doctor: Doctor): void {
    this.data.doctors.push(doctor);
    this.save();
  }

  public addPatient(patient: Patient): void {
    this.data.patients.push(patient);
    this.save();
  }

  public addQueueTicket(ticket: QueueTicket): void {
    this.data.queueTickets.push(ticket);
    this.save();
  }

  public updateQueueTicket(ticket: QueueTicket): void {
    const idx = this.data.queueTickets.findIndex(t => t.id === ticket.id);
    if (idx !== -1) {
      this.data.queueTickets[idx] = ticket;
      this.save();
    }
  }

  public updateDoctor(doctor: Doctor): void {
    const idx = this.data.doctors.findIndex(d => d.id === doctor.id);
    if (idx !== -1) {
      this.data.doctors[idx] = doctor;
      this.save();
    }
  }

  public addVisit(visit: Visit): void {
    this.data.visits.push(visit);
    this.save();
  }

  public addInvoice(invoice: Invoice): void {
    this.data.invoices.push(invoice);
    this.save();
  }

  public addSubscription(sub: Subscription): void {
    this.data.subscriptions.push(sub);
    this.save();
  }

  public updateSubscription(sub: Subscription): void {
    const idx = this.data.subscriptions.findIndex(s => s.id === sub.id);
    if (idx !== -1) {
      this.data.subscriptions[idx] = sub;
      this.save();
    }
  }

  public addAuditLog(log: AuditLog): void {
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 1000) {
      this.data.auditLogs.pop();
    }
    this.save();
  }

  public updateClinic(clinic: Clinic): void {
    const idx = this.data.clinics.findIndex(c => c.id === clinic.id);
    if (idx !== -1) {
      this.data.clinics[idx] = clinic;
      this.save();
    }
  }

  public updateTenant(tenant: Tenant): void {
    const idx = this.data.tenants.findIndex(t => t.id === tenant.id);
    if (idx !== -1) {
      this.data.tenants[idx] = tenant;
      this.save();
    }
  }

  // Seed Data strictly aligned with Design images (Super Admin & User Panel)
  private seedInitialData(): void {
    console.log('Seeding initial multi-tenant data...');
    const now = new Date().toISOString();

    // 1. System Plans (Identical to Super_Admin.png)
    const plans: Plan[] = [
      {
        id: 'plan_starter',
        code: PlanCode.STARTER,
        name: 'STARTER',
        monthlyPrice: 350000,
        yearlyPrice: 3500000,
        currency: 'so\'m',
        trialDays: 14,
        limits: {
          maxBranches: 1,
          maxDoctors: 5,
          maxOperators: 10,
          maxPatientsPerMonth: 1000,
          allowSMS: true,
          allowTelegram: true,
          allowCustomTheme: false,
          allowTvDisplay: true,
          allowApiAccess: false,
          allowMultiBranchAnalytics: false
        },
        isActive: true,
        createdAt: now
      },
      {
        id: 'plan_pro',
        code: PlanCode.PRO,
        name: 'PRO',
        monthlyPrice: 1200000,
        yearlyPrice: 12000000,
        currency: 'so\'m',
        trialDays: 14,
        limits: {
          maxBranches: 3,
          maxDoctors: 20,
          maxOperators: 50,
          maxPatientsPerMonth: -1, // Unlimited
          allowSMS: true,
          allowTelegram: true,
          allowCustomTheme: true,
          allowTvDisplay: true,
          allowApiAccess: true,
          allowMultiBranchAnalytics: true
        },
        isActive: true,
        createdAt: now
      },
      {
        id: 'plan_business',
        code: PlanCode.BUSINESS,
        name: 'BUSINESS',
        monthlyPrice: 2400000,
        yearlyPrice: 24000000,
        currency: 'so\'m',
        trialDays: 14,
        limits: {
          maxBranches: 10,
          maxDoctors: 50,
          maxOperators: -1, // Unlimited
          maxPatientsPerMonth: -1,
          allowSMS: true,
          allowTelegram: true,
          allowCustomTheme: true,
          allowTvDisplay: true,
          allowApiAccess: true,
          allowMultiBranchAnalytics: true
        },
        isActive: true,
        createdAt: now
      },
      {
        id: 'plan_enterprise',
        code: PlanCode.ENTERPRISE,
        name: 'ENTERPRISE',
        monthlyPrice: 5000000,
        yearlyPrice: 50000000,
        currency: 'so\'m',
        trialDays: 30,
        limits: {
          maxBranches: -1,
          maxDoctors: -1,
          maxOperators: -1,
          maxPatientsPerMonth: -1,
          allowSMS: true,
          allowTelegram: true,
          allowCustomTheme: true,
          allowTvDisplay: true,
          allowApiAccess: true,
          allowMultiBranchAnalytics: true
        },
        isActive: true,
        createdAt: now
      }
    ];
    this.data.plans = plans;

    // 2. Super Admin User
    const superAdminPasswordHash = bcrypt.hashSync('admin123', 10);
    const superAdmin: User = {
      id: 'user_super_admin',
      fullName: 'Azizbek (Super Admin)',
      email: 'admin@sadaf.uz',
      phone: '+998901234567',
      passwordHash: superAdminPasswordHash,
      role: UserRole.SUPER_ADMIN,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      status: 'ACTIVE',
      createdAt: now
    };
    this.data.users.push(superAdmin);

    // 3. Primary Tenant: SADAF KLINIKA
    const sadafTenantId = 'tenant_sadaf_01';
    const sadafTenant: Tenant = {
      id: sadafTenantId,
      code: 'SADAF01',
      name: 'SADAF Klinika',
      slug: 'sadaf',
      status: ClinicStatus.ACTIVE,
      createdAt: now,
      updatedAt: now
    };
    this.data.tenants.push(sadafTenant);

    const sadafClinic: Clinic = {
      id: 'clinic_sadaf_01',
      tenantId: sadafTenantId,
      name: 'SADAF KLINIKA',
      logoUrl: '',
      primaryColor: '#008B8B',
      secondaryColor: '#E6FFFA',
      phone: '+998 71 200 00 00',
      email: 'info@sadaf.uz',
      address: 'Toshkent sh., Chilonzor tumani, Bunyodkor shoh ko\'chasi',
      queuePrefix: 'A',
      settings: {
        avgConsultationMinutes: 15,
        tvSoundEnabled: true,
        smsNotification: true
      },
      createdAt: now
    };
    this.data.clinics.push(sadafClinic);

    // Branches for SADAF
    const mainBranchId = 'branch_sadaf_main';
    const mainBranch: Branch = {
      id: mainBranchId,
      tenantId: sadafTenantId,
      clinicId: sadafClinic.id,
      name: 'Asosiy filial',
      address: 'Bunyodkor shoh ko\'chasi 42',
      phone: '+998 71 200 00 01',
      queuePrefix: 'A',
      isMain: true,
      status: 'ACTIVE',
      createdAt: now
    };
    const chilonzorBranch: Branch = {
      id: 'branch_sadaf_chilonzor',
      tenantId: sadafTenantId,
      clinicId: sadafClinic.id,
      name: 'Chilonzor filiali',
      address: 'Chilonzor 9-mavze, 12-uy',
      phone: '+998 71 200 00 02',
      queuePrefix: 'B',
      isMain: false,
      status: 'ACTIVE',
      createdAt: now
    };
    this.data.branches.push(mainBranch, chilonzorBranch);

    // Cabinets
    const cabinets: Cabinet[] = [
      { id: 'cab_1', tenantId: sadafTenantId, branchId: mainBranchId, number: '1', name: 'Kabinet 1 (Terapiya)', floor: 1, status: 'AVAILABLE' },
      { id: 'cab_2', tenantId: sadafTenantId, branchId: mainBranchId, number: '2', name: 'Kabinet 2 (Ortodontiya)', floor: 1, status: 'AVAILABLE' },
      { id: 'cab_3', tenantId: sadafTenantId, branchId: mainBranchId, number: '3', name: 'Kabinet 3 (Terapiya & Maslahat)', floor: 1, status: 'OCCUPIED' },
      { id: 'cab_4', tenantId: sadafTenantId, branchId: mainBranchId, number: '4', name: 'Kabinet 4 (Xirurgiya & Jarrohlik)', floor: 2, status: 'OCCUPIED' },
      { id: 'cab_5', tenantId: sadafTenantId, branchId: mainBranchId, number: '5', name: 'Kabinet 5 (Implantologiya)', floor: 2, status: 'AVAILABLE' },
      { id: 'cab_6', tenantId: sadafTenantId, branchId: mainBranchId, number: '6', name: 'Kabinet 6 (Bolalar bo\'limi)', floor: 1, status: 'AVAILABLE' }
    ];
    this.data.cabinets.push(...cabinets);

    // Clinic Subscription (PRO Plan)
    const sadafSubscription: Subscription = {
      id: 'sub_sadaf_pro',
      tenantId: sadafTenantId,
      planId: 'plan_pro',
      planCode: PlanCode.PRO,
      status: ClinicStatus.ACTIVE,
      startDate: '2026-09-01T00:00:00Z',
      endDate: '2026-10-01T00:00:00Z',
      gracePeriodDays: 3,
      autoRenew: true
    };
    this.data.subscriptions.push(sadafSubscription);

    // Clinic Staff Users (Menejer, Operator, Shifokorlar)
    const defaultPasswordHash = bcrypt.hashSync('sadaf123', 10);
    const managerUser: User = {
      id: 'user_sadaf_manager',
      tenantId: sadafTenantId,
      fullName: 'Azizbek Menejer',
      email: 'azizbek@sadaf.uz',
      phone: '+998900000001',
      passwordHash: defaultPasswordHash,
      role: UserRole.MANAGER,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      branchId: mainBranchId,
      status: 'ACTIVE',
      createdAt: now
    };
    const operatorUser: User = {
      id: 'user_sadaf_operator',
      tenantId: sadafTenantId,
      fullName: 'Dilnoza Operator',
      email: 'dilnoza@sadaf.uz',
      phone: '+998900000002',
      passwordHash: defaultPasswordHash,
      role: UserRole.OPERATOR,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      branchId: mainBranchId,
      status: 'ACTIVE',
      createdAt: now
    };
    this.data.users.push(managerUser, operatorUser);

    // Specialties
    const specialties: Specialty[] = [
      { id: 'spec_terapevt', tenantId: sadafTenantId, name: 'Terapevt', code: 'TER' },
      { id: 'spec_jarroh', tenantId: sadafTenantId, name: 'Jarroh', code: 'SUR' },
      { id: 'spec_ortodont', tenantId: sadafTenantId, name: 'Ortodont', code: 'ORT' },
      { id: 'spec_implantolog', tenantId: sadafTenantId, name: 'Implantolog', code: 'IMP' },
      { id: 'spec_bolalar', tenantId: sadafTenantId, name: 'Bolalar doktori', code: 'PED' },
      { id: 'spec_parodontolog', tenantId: sadafTenantId, name: 'Parodontolog', code: 'PAR' }
    ];
    this.data.specialties.push(...specialties);

    // Doctors (from User_panel.png and Operator.png)
    const doctorProfiles = [
      { id: 'doc_1', name: 'Dr. Aliyev Jahongir', phone: '+998901111111', specId: 'spec_terapevt', specName: 'Terapevt', cab: '3', status: DoctorStatus.IN_VISIT, exp: 8, wait: 10, img: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150' },
      { id: 'doc_2', name: 'Dr. Karimova Sevara', phone: '+998902222222', specId: 'spec_bolalar', specName: 'Bolalar doktori', cab: '6', status: DoctorStatus.AVAILABLE, exp: 6, wait: 5, img: 'https://images.unsplash.com/photo-1594824813583-1111d957d6ea?w=150' },
      { id: 'doc_3', name: 'Dr. Rashidov Akmal', phone: '+998903333333', specId: 'spec_jarroh', specName: 'Jarroh', cab: '4', status: DoctorStatus.IN_VISIT, exp: 12, wait: 20, img: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150' },
      { id: 'doc_4', name: 'Dr. Saidova Dilnoza', phone: '+998904444444', specId: 'spec_ortodont', specName: 'Ortodont', cab: '2', status: DoctorStatus.ON_BREAK, exp: 5, wait: 15, img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150' },
      { id: 'doc_5', name: 'Dr. Nurmatov Bekzod', phone: '+998905555555', specId: 'spec_implantolog', specName: 'Implantolog', cab: '5', status: DoctorStatus.IN_VISIT, exp: 10, wait: 10, img: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150' },
      { id: 'doc_6', name: 'Dr. Xudoyqulova Nilufar', phone: '+998906666666', specId: 'spec_bolalar', specName: 'Bolalar doktori', cab: '6', status: DoctorStatus.AVAILABLE, exp: 4, wait: 15, img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' },
      { id: 'doc_7', name: 'Dr. To\'xtayeva Madina', phone: '+998907777777', specId: 'spec_parodontolog', specName: 'Parodontolog', cab: '1', status: DoctorStatus.AVAILABLE, exp: 7, wait: 5, img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150' },
      { id: 'doc_8', name: 'Dr. Mirzayev Aziz', phone: '+998908888888', specId: 'spec_terapevt', specName: 'Terapevt', cab: '3', status: DoctorStatus.AVAILABLE, exp: 9, wait: 25, img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' }
    ];

    doctorProfiles.forEach(d => {
      const uId = `user_${d.id}`;
      const docUser: User = {
        id: uId,
        tenantId: sadafTenantId,
        fullName: d.name,
        email: `${d.id}@sadaf.uz`,
        phone: d.phone,
        passwordHash: defaultPasswordHash,
        role: UserRole.DOCTOR,
        avatarUrl: d.img,
        branchId: mainBranchId,
        status: 'ACTIVE',
        createdAt: now
      };
      this.data.users.push(docUser);

      const doctor: Doctor = {
        id: d.id,
        tenantId: sadafTenantId,
        userId: uId,
        fullName: d.name,
        phone: d.phone,
        avatarUrl: d.img,
        specialtyId: d.specId,
        specialtyName: d.specName,
        branchId: mainBranchId,
        cabinetNumber: d.cab,
        experienceYears: d.exp,
        status: d.status,
        avgConsultationMinutes: d.wait
      };
      this.data.doctors.push(doctor);
    });

    // Patients (from User_panel.png and Doctor.png)
    const patientData = [
      { id: 'pat_1', num: '1025', name: 'Karimov Akmal', phone: '+998 90 123 45 67', birth: '1990-05-12', gender: 'MALE' as const, note: 'Tish og\'riyapti, sovuq ichganda og\'riq kuchayadi.' },
      { id: 'pat_2', num: '1026', name: 'Tursunova Dilnoza', phone: '+998 91 234 56 78', birth: '1995-08-20', gender: 'FEMALE' as const, note: 'Tish qatorini to\'g\'rilash, breketlar.' },
      { id: 'pat_3', num: '1027', name: 'Rahimov Aziz', phone: '+998 93 345 67 89', birth: '1988-02-14', gender: 'MALE' as const, note: 'Pastki aql tishini oldirish.' },
      { id: 'pat_4', num: '1028', name: 'Yusupova Malika', phone: '+998 90 456 78 90', birth: '2016-11-05', gender: 'FEMALE' as const, note: 'Bolalar stomatologiyasi ko\'rigi.' },
      { id: 'pat_5', num: '1029', name: 'Normatov Bekzod', phone: '+998 91 567 89 01', birth: '1985-07-30', gender: 'MALE' as const, note: 'Implant o\'rnatish bo\'yicha maslahat.' },
      { id: 'pat_6', num: '1030', name: 'Xudoyqulova Nilufar', phone: '+998 91 890 12 34', birth: '1992-04-18', gender: 'FEMALE' as const, note: 'Profilaktik tozalash.' }
    ];

    patientData.forEach(p => {
      this.data.patients.push({
        id: p.id,
        tenantId: sadafTenantId,
        patientNumber: p.num,
        fullName: p.name,
        phone: p.phone,
        birthDate: p.birth,
        gender: p.gender,
        notes: p.note,
        createdAt: now
      });
    });

    // Queue Tickets matching Design exactly
    const tickets: QueueTicket[] = [
      {
        id: 'ticket_015',
        tenantId: sadafTenantId,
        branchId: mainBranchId,
        doctorId: 'doc_1',
        doctorName: 'Dr. Aliyev Jahongir',
        specialtyName: 'Terapevt',
        patientId: 'pat_1',
        patientName: 'Karimov Akmal',
        patientPhone: '+998 90 123 45 67',
        cabinetNumber: '3',
        ticketNumber: 'A015',
        status: QueueStatus.IN_PROGRESS,
        complaint: 'Tish og\'riyapti, sovuq ichganda og\'riq kuchayadi.',
        estimatedWaitMinutes: 0,
        calledAt: '2026-09-30T12:30:00Z',
        startedAt: '2026-09-30T12:34:00Z',
        createdAt: '2026-09-30T12:00:00Z'
      },
      {
        id: 'ticket_016',
        tenantId: sadafTenantId,
        branchId: mainBranchId,
        doctorId: 'doc_4',
        doctorName: 'Dr. Saidova Dilnoza',
        specialtyName: 'Ortodont',
        patientId: 'pat_2',
        patientName: 'Tursunova Dilnoza',
        patientPhone: '+998 91 234 56 78',
        cabinetNumber: '1',
        ticketNumber: 'A016',
        status: QueueStatus.WAITING,
        estimatedWaitMinutes: 10,
        createdAt: '2026-09-30T12:15:00Z'
      },
      {
        id: 'ticket_017',
        tenantId: sadafTenantId,
        branchId: mainBranchId,
        doctorId: 'doc_3',
        doctorName: 'Dr. Rashidov Akmal',
        specialtyName: 'Jarroh',
        patientId: 'pat_3',
        patientName: 'Rahimov Aziz',
        patientPhone: '+998 93 345 67 89',
        cabinetNumber: '4',
        ticketNumber: 'A017',
        status: QueueStatus.WAITING,
        estimatedWaitMinutes: 20,
        createdAt: '2026-09-30T12:20:00Z'
      },
      {
        id: 'ticket_018',
        tenantId: sadafTenantId,
        branchId: mainBranchId,
        doctorId: 'doc_2',
        doctorName: 'Dr. Karimova Sevara',
        specialtyName: 'Bolalar doktori',
        patientId: 'pat_4',
        patientName: 'Yusupova Malika',
        patientPhone: '+998 90 456 78 90',
        cabinetNumber: '2',
        ticketNumber: 'A018',
        status: QueueStatus.WAITING,
        estimatedWaitMinutes: 25,
        createdAt: '2026-09-30T12:25:00Z'
      },
      {
        id: 'ticket_019',
        tenantId: sadafTenantId,
        branchId: mainBranchId,
        doctorId: 'doc_5',
        doctorName: 'Dr. Nurmatov Bekzod',
        specialtyName: 'Implantolog',
        patientId: 'pat_5',
        patientName: 'Normatov Bekzod',
        patientPhone: '+998 91 567 89 01',
        cabinetNumber: '5',
        ticketNumber: 'A019',
        status: QueueStatus.WAITING,
        estimatedWaitMinutes: 35,
        createdAt: '2026-09-30T12:30:00Z'
      },
      {
        id: 'ticket_020',
        tenantId: sadafTenantId,
        branchId: mainBranchId,
        doctorId: 'doc_8',
        doctorName: 'Dr. Mirzayev Aziz',
        specialtyName: 'Terapevt',
        patientId: 'pat_6',
        patientName: 'Xudoyqulova Nilufar',
        patientPhone: '+998 91 890 12 34',
        cabinetNumber: '3',
        ticketNumber: 'A020',
        status: QueueStatus.WAITING,
        estimatedWaitMinutes: 45,
        createdAt: '2026-09-30T12:35:00Z'
      }
    ];
    this.data.queueTickets.push(...tickets);

    // Other Tenants (for Multi-Tenant demonstration in Super Admin)
    const otherTenants = [
      { id: 'tenant_samarqand_05', name: 'Samarqand Med', owner: 'J. Abdurahmonov', plan: PlanCode.PRO, status: ClinicStatus.ACTIVE, date: '2026-09-23', amount: 1200000 },
      { id: 'tenant_dental_02', name: 'Dental Plus', owner: 'N. Karimov', plan: PlanCode.STARTER, status: ClinicStatus.TRIAL, date: '2026-09-23', amount: 350000 },
      { id: 'tenant_family_04', name: 'Family Clinic', owner: 'M. Olimova', plan: PlanCode.BUSINESS, status: ClinicStatus.ACTIVE, date: '2026-09-22', amount: 2400000 },
      { id: 'tenant_shifo_06', name: 'Shifo Medikal', owner: 'A. To\'rayev', plan: PlanCode.STARTER, status: ClinicStatus.ACTIVE, date: '2026-09-22', amount: 350000 },
      { id: 'tenant_medlife_03', name: 'MedLife', owner: 'S. Ergashev', plan: PlanCode.PRO, status: ClinicStatus.EXPIRED, date: '2026-09-21', amount: 1200000 }
    ];

    otherTenants.forEach((ot, idx) => {
      this.data.tenants.push({
        id: ot.id,
        code: `CLN0${idx + 2}`,
        name: ot.name,
        slug: ot.name.toLowerCase().replace(/\s+/g, '-'),
        status: ot.status,
        createdAt: `${ot.date}T10:00:00Z`,
        updatedAt: `${ot.date}T10:00:00Z`
      });

      this.data.clinics.push({
        id: `clinic_${ot.id}`,
        tenantId: ot.id,
        name: ot.name,
        logoUrl: '',
        primaryColor: '#008B8B',
        phone: `+998 71 300 00 0${idx}`,
        email: `contact@${ot.name.toLowerCase().replace(/\s+/g, '')}.uz`,
        address: 'Toshkent sh.',
        queuePrefix: ot.name.charAt(0),
        settings: {},
        createdAt: `${ot.date}T10:00:00Z`
      });

      this.data.subscriptions.push({
        id: `sub_${ot.id}`,
        tenantId: ot.id,
        planId: `plan_${ot.plan.toLowerCase()}`,
        planCode: ot.plan,
        status: ot.status,
        startDate: `${ot.date}T00:00:00Z`,
        endDate: ot.status === ClinicStatus.EXPIRED ? '2026-09-20T00:00:00Z' : '2026-10-23T00:00:00Z',
        gracePeriodDays: 3,
        autoRenew: true
      });

      this.data.invoices.push({
        id: `inv_${ot.id}`,
        tenantId: ot.id,
        clinicName: ot.name,
        planCode: ot.plan,
        amount: ot.amount,
        currency: 'so\'m',
        status: ot.status === ClinicStatus.TRIAL ? 'PENDING' : 'PAID',
        paymentProvider: 'PAYME',
        transactionId: `TX_${uuidv4().substring(0, 8)}`,
        paidAt: ot.status !== ClinicStatus.TRIAL ? `${ot.date}T11:00:00Z` : undefined,
        createdAt: `${ot.date}T10:30:00Z`
      });
    });

    // Recent Invoice for SADAF
    this.data.invoices.unshift({
      id: 'inv_sadaf_01',
      tenantId: sadafTenantId,
      clinicName: 'SADAF Klinika',
      planCode: PlanCode.PRO,
      amount: 1200000,
      currency: 'so\'m',
      status: 'PAID',
      paymentProvider: 'PAYME',
      transactionId: 'TX_SADAF_20260923',
      paidAt: '2026-09-23T09:00:00Z',
      createdAt: '2026-09-23T08:30:00Z'
    });

    // Initial Audit Log
    this.data.auditLogs.push({
      id: 'audit_01',
      tenantId: sadafTenantId,
      userId: 'user_super_admin',
      userRole: UserRole.SUPER_ADMIN,
      userFullName: 'Azizbek (Super Admin)',
      action: 'PLATFORM_INITIALIZATION',
      entityType: 'PLATFORM',
      entityId: 'SYSTEM',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 System Seed',
      createdAt: now
    });

    this.save();
    console.log('Seed completed successfully!');
  }
}
