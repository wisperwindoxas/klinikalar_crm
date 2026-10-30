import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../../database/database.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export class ClinicsController {
  public static async getCurrentClinic(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant context required.' });
        return;
      }

      const db = DatabaseService.getInstance();
      const clinic = db.getClinicByTenant(tenantId);
      const branches = db.getBranches(tenantId);
      const sub = db.getSubscriptionByTenant(tenantId);
      const plan = sub ? db.getPlanByCode(sub.planCode) : null;

      res.json({
        success: true,
        data: {
          clinic,
          branches,
          subscription: sub,
          plan
        }
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async updateBranding(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant context required.' });
        return;
      }

      const { name, primaryColor, secondaryColor, logoUrl, queuePrefix, address, phone } = req.body;
      const db = DatabaseService.getInstance();
      const clinic = db.getClinicByTenant(tenantId);

      if (!clinic) {
        res.status(404).json({ success: false, message: 'Klinika topilmadi.' });
        return;
      }

      if (name) clinic.name = name;
      if (primaryColor) clinic.primaryColor = primaryColor;
      if (secondaryColor) clinic.secondaryColor = secondaryColor;
      if (logoUrl !== undefined) clinic.logoUrl = logoUrl;
      if (queuePrefix) clinic.queuePrefix = queuePrefix;
      if (address) clinic.address = address;
      if (phone) clinic.phone = phone;

      db.updateClinic(clinic);

      res.json({ success: true, message: 'Klinika sozlamalari saqlandi.', data: clinic });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async getBranches(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const db = DatabaseService.getInstance();
      const branches = db.getBranches(tenantId);
      res.json({ success: true, data: branches });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async createBranch(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant context required.' });
        return;
      }

      const db = DatabaseService.getInstance();
      const sub = db.getSubscriptionByTenant(tenantId);
      const plan = sub ? db.getPlanByCode(sub.planCode) : null;
      const currentBranches = db.getBranches(tenantId);

      // Quota validation
      if (plan && plan.limits.maxBranches !== -1 && currentBranches.length >= plan.limits.maxBranches) {
        res.status(403).json({
          success: false,
          code: 'BRANCH_QUOTA_EXCEEDED',
          message: `Joriy ${sub?.planCode} tarifingizda maksimal ${plan.limits.maxBranches} ta filial mavjud. Yangi filial qo'shish uchun tarifni oshiring.`
        });
        return;
      }

      const { name, address, phone, queuePrefix } = req.body;
      const clinic = db.getClinicByTenant(tenantId);

      const newBranch = {
        id: `branch_${uuidv4().substring(0, 8)}`,
        tenantId,
        clinicId: clinic?.id || '',
        name,
        address: address || '',
        phone: phone || '',
        queuePrefix: queuePrefix || 'B',
        isMain: false,
        status: 'ACTIVE' as const,
        createdAt: new Date().toISOString()
      };

      db.addBranch(newBranch);
      res.status(201).json({ success: true, message: 'Yangi filial yaratildi.', data: newBranch });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async getCabinets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const branchId = req.query.branchId as string | undefined;
      const db = DatabaseService.getInstance();
      const cabinets = db.getCabinets(tenantId, branchId);
      res.json({ success: true, data: cabinets });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }
}
