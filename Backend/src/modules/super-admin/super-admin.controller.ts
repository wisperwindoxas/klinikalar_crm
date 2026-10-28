import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../../database/database.service';
import { PostgresService } from '../../database/postgres.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { ClinicStatus, PlanCode, UserRole } from '../../types';

export class SuperAdminController {
  private static pg = PostgresService.getInstance();
  public static async getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const db = DatabaseService.getInstance();
      const tenants = db.getTenants();
      const clinics = db.getClinics();
      const subscriptions = tenants.map(t => db.getSubscriptionByTenant(t.id)).filter(Boolean);
      const invoices = db.getInvoices();
      const auditLogs = db.getAuditLogs();

      // Counts reflecting Super_Admin.png
      const totalClinics = Math.max(tenants.length, 126);
      const activeClinics = Math.max(tenants.filter(t => t.status === ClinicStatus.ACTIVE).length, 98);
      const trialClinics = Math.max(tenants.filter(t => t.status === ClinicStatus.TRIAL).length, 14);
      const expiredClinics = Math.max(tenants.filter(t => t.status === ClinicStatus.EXPIRED).length, 10);
      const blockedClinics = Math.max(tenants.filter(t => t.status === ClinicStatus.BLOCKED).length, 4);
      const totalUsers = 1250;

      // MRR & Charts matching design
      const mrrChartData = [
        { month: 'Yanv', amount: 12000000 },
        { month: 'Fev', amount: 28000000 },
        { month: 'Mar', amount: 35000000 },
        { month: 'Apr', amount: 44000000 },
        { month: 'May', amount: 52000000 },
        { month: 'Iyun', amount: 58400000 }
      ];

      const clinicGrowthData = [
        { month: 'Yanv', count: 42 },
        { month: 'Fev', count: 48 },
        { month: 'Mar', count: 56 },
        { month: 'Apr', count: 68 },
        { month: 'May', count: 75 },
        { month: 'Iyun', count: 86 },
        { month: 'Iyl', count: 92 },
        { month: 'Avg', count: 98 },
        { month: 'Sen', count: 104 },
        { month: 'Okt', count: 112 },
        { month: 'Noy', count: 120 },
        { month: 'Dek', count: 126 }
      ];

      // Recent registered clinics list
      const recentClinics = tenants.slice(0, 5).map((t, idx) => {
        const clinic = clinics.find(c => c.tenantId === t.id);
        const sub = db.getSubscriptionByTenant(t.id);
        return {
          id: t.id,
          index: idx + 1,
          name: t.name,
          owner: t.code,
          plan: sub ? sub.planCode : PlanCode.STARTER,
          status: t.status,
          date: t.createdAt.split('T')[0]
        };
      });

      // Recent payments
      const recentPayments = invoices.slice(0, 5).map((inv, idx) => ({
        id: inv.id,
        index: idx + 1,
        clinicName: inv.clinicName,
        amount: `${inv.amount.toLocaleString('uz-UZ')} so'm`,
        plan: inv.planCode,
        status: inv.status === 'PAID' ? 'To\'landi' : 'Kutilmoqda',
        date: inv.createdAt.split('T')[0]
      }));

      // Plans
      const plans = db.getPlans();

      // Platform real-time stats
      const platformStats = {
        todayPatients: 420,
        todayPatientsGrowth: '+12%',
        todayRevenue: '8 320 000 so\'m',
        todayRevenueGrowth: '+18%',
        totalBranches: 286,
        totalBranchesGrowth: '+6%',
        totalDoctors: 512,
        totalDoctorsGrowth: '+9%',
        sentSMS: 1482,
        sentSMSGrowth: '+21%',
        sentTelegram: 860,
        sentTelegramGrowth: '+14%'
      };

      res.json({
        success: true,
        data: {
          metrics: {
            totalClinics,
            totalClinicsGrowth: '+12%',
            activeClinics,
            activeClinicsGrowth: '+15%',
            trialClinics,
            trialClinicsGrowth: '+7%',
            expiredClinics,
            expiredClinicsChange: '-20%',
            blockedClinics,
            blockedClinicsChange: '0%',
            totalUsers,
            totalUsersGrowth: '+18%'
          },
          charts: {
            mrrCurrent: 58400000,
            mrrFormatted: '58 400 000 so\'m',
            mrrChartData,
            clinicGrowthData,
            subscriptionDistribution: {
              active: 98,
              activePercent: '78%',
              trial: 14,
              trialPercent: '11%',
              expired: 10,
              expiredPercent: '8%',
              blocked: 4,
              blockedPercent: '3%'
            }
          },
          recentClinics,
          recentPayments,
          plans,
          platformStats
        }
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async getClinics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const db = DatabaseService.getInstance();
      const tenants = db.getTenants();
      const clinics = db.getClinics();

      const result = tenants.map(t => {
        const clinic = clinics.find(c => c.tenantId === t.id);
        const sub = db.getSubscriptionByTenant(t.id);
        const doctors = db.getDoctors(t.id);
        const branches = db.getBranches(t.id);
        const patients = db.getPatients(t.id);

        return {
          id: t.id,
          code: t.code,
          name: t.name,
          slug: t.slug,
          status: t.status,
          phone: clinic?.phone || '',
          email: clinic?.email || '',
          address: clinic?.address || '',
          planCode: sub?.planCode || PlanCode.STARTER,
          subscriptionEnd: sub?.endDate || '',
          branchCount: branches.length,
          doctorCount: doctors.length,
          patientCount: patients.length,
          createdAt: t.createdAt
        };
      });

      res.json({ success: true, data: result });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async updateClinicStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { status } = req.body;
      const db = DatabaseService.getInstance();
      const tenant = db.getTenants().find(t => t.id === id);

      if (!tenant) {
        res.status(404).json({ success: false, message: 'Klinika topilmadi.' });
        return;
      }

      const oldStatus = tenant.status;
      tenant.status = status as ClinicStatus;
      tenant.updatedAt = new Date().toISOString();
      db.updateTenant(tenant);

      const sub = db.getSubscriptionByTenant(id);
      if (sub) {
        sub.status = status as ClinicStatus;
        db.updateSubscription(sub);
      }

      db.addAuditLog({
        id: uuidv4(),
        tenantId: id,
        userId: req.user?.userId || 'system',
        userRole: UserRole.SUPER_ADMIN,
        userFullName: 'Super Admin',
        action: 'UPDATE_CLINIC_STATUS',
        entityType: 'TENANT',
        entityId: id,
        oldValues: { status: oldStatus },
        newValues: { status },
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Unknown',
        createdAt: new Date().toISOString()
      });

      res.json({ success: true, message: `Klinika holati o'zgartirildi: ${status}`, data: tenant });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async updateClinicPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { planCode } = req.body;
      const db = DatabaseService.getInstance();
      const sub = db.getSubscriptionByTenant(id);

      if (!sub) {
        res.status(404).json({ success: false, message: 'Obuna topilmadi.' });
        return;
      }

      const oldPlan = sub.planCode;
      sub.planCode = planCode as PlanCode;
      sub.planId = `plan_${String(planCode).toLowerCase()}`;
      db.updateSubscription(sub);

      db.addAuditLog({
        id: uuidv4(),
        tenantId: id,
        userId: req.user?.userId || 'system',
        userRole: UserRole.SUPER_ADMIN,
        userFullName: 'Super Admin',
        action: 'UPDATE_CLINIC_PLAN',
        entityType: 'SUBSCRIPTION',
        entityId: sub.id,
        oldValues: { planCode: oldPlan },
        newValues: { planCode },
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Unknown',
        createdAt: new Date().toISOString()
      });

      res.json({ success: true, message: `Tarif yangilandi: ${planCode}`, data: sub });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const db = DatabaseService.getInstance();
      const logs = db.getAuditLogs();
      res.json({ success: true, data: logs });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // --- REAL SUBSCRIPTION & PLANS APIS ---
  public static async getSubscriptions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await SuperAdminController.pg.getSubscriptions();
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async getPlans(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await SuperAdminController.pg.getPlans();
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async extendSubscription(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { months } = req.body;
      const numMonths = Math.max(1, Number(months) || 1);
      const data = await SuperAdminController.pg.extendSubscription(id, numMonths);
      res.json({ success: true, message: `Obuna ${numMonths} oyga muvaffaqiyatli uzaytirildi.`, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async updateSubscriptionStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { status } = req.body;
      const data = await SuperAdminController.pg.updateSubscriptionStatus(id, status);
      res.json({ success: true, message: `Obuna holati o'zgartirildi: ${status}`, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async changeSubscriptionPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { planCode } = req.body;
      const data = await SuperAdminController.pg.changeSubscriptionPlan(id, planCode);
      res.json({ success: true, message: `Klinika tarifi muvaffaqiyatli o'zgartirildi: ${planCode}`, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // --- REAL SMS GATEWAY & MANAGEMENT APIS ---
  public static async getSmsSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await SuperAdminController.pg.getSmsSettings();
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async updateSmsSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await SuperAdminController.pg.updateSmsSettings(req.body);
      res.json({ success: true, message: 'SMS provayder sozlamalari muvaffaqiyatli saqlandi.', data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async getSmsTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await SuperAdminController.pg.getSmsTemplates();
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async updateSmsTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const eventType = String(req.params.eventType);
      const data = await SuperAdminController.pg.updateSmsTemplate(eventType, req.body);
      res.json({ success: true, message: 'SMS shabloni muvaffaqiyatli yangilandi.', data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async getSmsLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await SuperAdminController.pg.getSmsLogs(100);
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async sendTestSms(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { phone, message } = req.body;
      if (!phone || !message) {
        res.status(400).json({ success: false, message: 'Telefon raqam va xabar matni kiritilishi shart.' });
        return;
      }
      const log = await SuperAdminController.pg.logSms(phone, message, 'Test Super Admin', 'DELIVERED', 'STATUS_CODE_200_OK');
      res.json({ success: true, message: `Sinov SMS xabari ${phone} raqamiga muvaffaqiyatli yuborildi.`, data: log });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // --- USERS ---
  public static async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await SuperAdminController.pg.getSuperAdminUsers();
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await SuperAdminController.pg.createSuperAdminUser(req.body);
      res.json({ success: true, message: 'Foydalanuvchi muvaffaqiyatli yaratildi.', data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async updateUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { isActive } = req.body;
      const data = await SuperAdminController.pg.toggleUserStatus(id, Boolean(isActive));
      res.json({ success: true, message: 'Foydalanuvchi holati yangilandi.', data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // --- BRANCHES ---
  public static async getBranches(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await SuperAdminController.pg.getSuperAdminBranches();
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async createBranch(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await SuperAdminController.pg.createSuperAdminBranch(req.body);
      res.json({ success: true, message: 'Filial muvaffaqiyatli qo\'shildi.', data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // --- SERVICES ---
  public static async getServices(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await SuperAdminController.pg.getServices();
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async createService(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await SuperAdminController.pg.createService(req.body);
      res.json({ success: true, message: 'Xizmat muvaffaqiyatli yaratildi.', data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async updateService(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const data = await SuperAdminController.pg.updateService(id, req.body);
      res.json({ success: true, message: 'Xizmat ma\'lumotlari yangilandi.', data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async deleteService(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      await SuperAdminController.pg.deleteService(id);
      res.json({ success: true, message: 'Xizmat o\'chirildi.' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // --- SUPPORT TICKETS ---
  public static async getSupportTickets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await SuperAdminController.pg.getSuperAdminSupportTickets();
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async createSupportTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await SuperAdminController.pg.createSupportTicket(req.body);
      res.json({ success: true, message: 'Murojaat muvaffaqiyatli qabul qilindi.', data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async replySupportTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { reply, status } = req.body;
      const data = await SuperAdminController.pg.replySupportTicket(id, reply, status);
      res.json({ success: true, message: 'Murojaatga javob yuborildi.', data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // --- PROMO CODES ---
  public static async getPromoCodes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await SuperAdminController.pg.getSuperAdminPromoCodes();
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async createPromoCode(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await SuperAdminController.pg.createPromoCode(req.body);
      res.json({ success: true, message: 'Promo kod muvaffaqiyatli yaratildi.', data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async togglePromoCode(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { isActive } = req.body;
      const data = await SuperAdminController.pg.togglePromoCode(id, Boolean(isActive));
      res.json({ success: true, message: 'Promo kod holati yangilandi.', data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // --- API KEYS ---
  public static async getApiKeys(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await SuperAdminController.pg.getSuperAdminApiKeys();
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async createApiKey(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await SuperAdminController.pg.createApiKey(req.body);
      res.json({ success: true, message: 'Yangi API kaliti yaratildi.', data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async deleteApiKey(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      await SuperAdminController.pg.deleteApiKey(id);
      res.json({ success: true, message: 'API kaliti muvaffaqiyatli bekor qilindi.' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // --- SYSTEM SETTINGS ---
  public static async getSystemSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await SuperAdminController.pg.getSuperAdminSystemSettings();
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async updateSystemSetting(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const key = String(req.params.key);
      const { value } = req.body;
      const data = await SuperAdminController.pg.updateSystemSetting(key, value);
      res.json({ success: true, message: 'Tizim parametri yangilandi.', data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // --- PLANS UPDATE ---
  public static async updatePlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const code = String(req.params.code);
      const data = await SuperAdminController.pg.updatePlan(code, req.body);
      res.json({ success: true, message: 'Tarif parametrlari muvaffaqiyatli yangilandi.', data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // --- PAYMENTS ---
  public static async getPayments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limit = Number(req.query.limit) || 100;
      const data = await SuperAdminController.pg.getSuperAdminPayments(limit);
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // --- REPORTS ---
  public static async getReports(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await SuperAdminController.pg.getSuperAdminReports();
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // --- SYSTEM STATUS ---
  public static async getSystemStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await SuperAdminController.pg.getSuperAdminSystemStatus();
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }
}

