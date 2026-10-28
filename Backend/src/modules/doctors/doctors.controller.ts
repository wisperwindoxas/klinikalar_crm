import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { DatabaseService } from '../../database/database.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { WebSocketGateway } from '../../websocket/websocket.gateway';
import { DoctorStatus, UserRole } from '../../types';

export class DoctorsController {
  public static async getDoctors(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const branchId = req.query.branchId as string | undefined;
      const db = DatabaseService.getInstance();
      const doctors = db.getDoctors(tenantId, branchId);
      const tickets = db.getQueueTickets(tenantId, branchId);

      // Dynamically calculate waiting count for each doctor
      const result = doctors.map(d => {
        const waitingCount = tickets.filter(t => t.doctorId === d.id && t.status === 'WAITING').length;
        const currentTicket = tickets.find(t => t.doctorId === d.id && (t.status === 'IN_PROGRESS' || t.status === 'CALLED'));
        return {
          ...d,
          waitingCount,
          currentTicketNumber: currentTicket ? currentTicket.ticketNumber : null
        };
      });

      res.json({ success: true, data: result });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async createDoctor(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant context required.' });
        return;
      }

      const db = DatabaseService.getInstance();
      const sub = db.getSubscriptionByTenant(tenantId);
      const plan = sub ? db.getPlanByCode(sub.planCode) : null;
      const currentDoctors = db.getDoctors(tenantId);

      // STRICT PLAN QUOTA ENFORCEMENT
      if (plan && plan.limits.maxDoctors !== -1 && currentDoctors.length >= plan.limits.maxDoctors) {
        res.status(403).json({
          success: false,
          code: 'DOCTOR_QUOTA_EXCEEDED',
          message: `Joriy tarifingizda maksimal ${plan.limits.maxDoctors} ta shifokor mavjud. Tarifni yangilang.`
        });
        return;
      }

      const {
        fullName,
        phone,
        specialtyId,
        specialtyName,
        branchId,
        cabinetNumber,
        experienceYears,
        avgConsultationMinutes
      } = req.body;

      if (!fullName || !phone || !specialtyName) {
        res.status(400).json({ success: false, message: 'Shifokor ismi, telefon va mutaxassisligi kiritilishi shart.' });
        return;
      }

      const now = new Date().toISOString();
      const userId = `user_${uuidv4().substring(0, 8)}`;
      const doctorId = `doc_${uuidv4().substring(0, 8)}`;

      // Create login account for doctor
      const defaultPasswordHash = bcrypt.hashSync('sadaf123', 10);
      db.addUser({
        id: userId,
        tenantId,
        fullName,
        email: `${phone.replace(/[^0-9]/g, '')}@sadaf.uz`,
        phone,
        passwordHash: defaultPasswordHash,
        role: UserRole.DOCTOR,
        branchId: branchId || 'branch_sadaf_main',
        status: 'ACTIVE',
        createdAt: now
      });

      const newDoctor = {
        id: doctorId,
        tenantId,
        userId,
        fullName,
        phone,
        avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150',
        specialtyId: specialtyId || 'spec_general',
        specialtyName,
        branchId: branchId || 'branch_sadaf_main',
        cabinetNumber: cabinetNumber || '1',
        experienceYears: Number(experienceYears) || 3,
        status: DoctorStatus.AVAILABLE,
        avgConsultationMinutes: Number(avgConsultationMinutes) || 15
      };

      db.addDoctor(newDoctor);

      res.status(201).json({
        success: true,
        message: 'Yangi shifokor muvaffaqiyatli qo\'shildi.',
        data: newDoctor
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async updateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { status } = req.body;
      const tenantId = req.user?.tenantId;
      const db = DatabaseService.getInstance();
      const doctor = db.getDoctorById(id, tenantId);

      if (!doctor) {
        res.status(404).json({ success: false, message: 'Shifokor topilmadi.' });
        return;
      }

      doctor.status = status as DoctorStatus;
      db.updateDoctor(doctor);

      // Realtime websocket emit
      WebSocketGateway.getInstance().emitDoctorStatusChanged(doctor.tenantId, doctor.id, status);

      res.json({ success: true, message: `Shifokor holati yangilandi: ${status}`, data: doctor });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }
}
