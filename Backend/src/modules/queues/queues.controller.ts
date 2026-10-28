import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../../database/database.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { WebSocketGateway } from '../../websocket/websocket.gateway';
import { DoctorStatus, QueueStatus, QueueTicket } from '../../types';

export class QueuesController {
  public static async getTickets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const branchId = (req.query.branchId as string) || req.user?.branchId;
      const doctorId = req.query.doctorId as string | undefined;
      const status = req.query.status as string | undefined;

      const db = DatabaseService.getInstance();
      let tickets = db.getQueueTickets(tenantId, branchId);

      if (doctorId) {
        tickets = tickets.filter(t => t.doctorId === doctorId);
      }
      if (status && status !== 'ALL' && status !== 'Barchasi') {
        tickets = tickets.filter(t => t.status === status);
      }

      res.json({ success: true, data: tickets });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async createTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant context required.' });
        return;
      }

      const { doctorId, patientId, branchId, serviceId, complaint } = req.body;
      if (!doctorId || !patientId) {
        res.status(400).json({ success: false, message: 'Shifokor va bemor tanlanishi shart.' });
        return;
      }

      const db = DatabaseService.getInstance();
      const doctor = db.getDoctorById(doctorId, tenantId);
      const patient = db.getPatientById(patientId, tenantId);
      const effectiveBranchId = branchId || doctor?.branchId || 'branch_sadaf_main';
      const branch = db.getBranches(tenantId).find(b => b.id === effectiveBranchId);
      const clinic = db.getClinicByTenant(tenantId);

      if (!doctor || !patient) {
        res.status(404).json({ success: false, message: 'Shifokor yoki bemor topilmadi.' });
        return;
      }

      // Generate ticket number e.g. A015, A021
      const prefix = branch?.queuePrefix || clinic?.queuePrefix || 'A';
      const existingTickets = db.getQueueTickets(tenantId, effectiveBranchId);
      const nextSequence = existingTickets.length + 15;
      const ticketNumber = `${prefix}${String(nextSequence).padStart(3, '0')}`;

      // Calculate estimated wait
      const waitingAhead = existingTickets.filter(t => t.doctorId === doctorId && t.status === QueueStatus.WAITING).length;
      const estimatedWait = waitingAhead * (doctor.avgConsultationMinutes || 15);

      const newTicket: QueueTicket = {
        id: `ticket_${uuidv4().substring(0, 8)}`,
        tenantId,
        branchId: effectiveBranchId,
        doctorId,
        doctorName: doctor.fullName,
        specialtyName: doctor.specialtyName,
        patientId,
        patientName: patient.fullName,
        patientPhone: patient.phone,
        cabinetNumber: doctor.cabinetNumber,
        ticketNumber,
        serviceId,
        complaint: complaint || 'Talon berildi',
        status: QueueStatus.WAITING,
        estimatedWaitMinutes: estimatedWait,
        createdAt: new Date().toISOString()
      };

      db.addQueueTicket(newTicket);

      // WebSocket broadcast
      WebSocketGateway.getInstance().emitTicketCreated(tenantId, effectiveBranchId, newTicket);

      res.status(201).json({
        success: true,
        message: `Talon ${ticketNumber} muvaffaqiyatli berildi.`,
        data: newTicket
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async callTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const tenantId = req.user?.tenantId;
      const db = DatabaseService.getInstance();
      const ticket = db.getQueueTicketById(id, tenantId);

      if (!ticket) {
        res.status(404).json({ success: false, message: 'Talon topilmadi.' });
        return;
      }

      ticket.status = QueueStatus.CALLED;
      ticket.calledAt = new Date().toISOString();
      db.updateQueueTicket(ticket);

      // Update doctor status
      const doctor = db.getDoctorById(ticket.doctorId, tenantId);
      if (doctor) {
        doctor.status = DoctorStatus.IN_VISIT;
        doctor.currentTicketId = ticket.id;
        db.updateDoctor(doctor);
        WebSocketGateway.getInstance().emitDoctorStatusChanged(tenantId || '', doctor.id, DoctorStatus.IN_VISIT);
      }

      // WebSocket emit -> TV and Manager receive event instantly
      WebSocketGateway.getInstance().emitTicketCalled(ticket.tenantId, ticket.branchId, ticket);

      res.json({
        success: true,
        message: `${ticket.ticketNumber} raqamli bemor chaqirildi.`,
        data: ticket
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async startTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const tenantId = req.user?.tenantId;
      const db = DatabaseService.getInstance();
      const ticket = db.getQueueTicketById(id, tenantId);

      if (!ticket) {
        res.status(404).json({ success: false, message: 'Talon topilmadi.' });
        return;
      }

      ticket.status = QueueStatus.IN_PROGRESS;
      ticket.startedAt = new Date().toISOString();
      db.updateQueueTicket(ticket);

      WebSocketGateway.getInstance().emitTicketStarted(ticket.tenantId, ticket.branchId, ticket);

      res.json({ success: true, message: 'Qabul boshlandi.', data: ticket });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async completeTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const tenantId = req.user?.tenantId;
      const { diagnosis, notes, prescriptions, servicesProvided, totalCost } = req.body;
      const db = DatabaseService.getInstance();
      const ticket = db.getQueueTicketById(id, tenantId);

      if (!ticket) {
        res.status(404).json({ success: false, message: 'Talon topilmadi.' });
        return;
      }

      const now = new Date().toISOString();
      ticket.status = QueueStatus.COMPLETED;
      ticket.completedAt = now;
      db.updateQueueTicket(ticket);

      // Create Visit Record
      const visit = {
        id: `visit_${uuidv4().substring(0, 8)}`,
        tenantId: ticket.tenantId,
        queueTicketId: ticket.id,
        patientId: ticket.patientId,
        doctorId: ticket.doctorId,
        diagnosis: diagnosis || 'Tekshiruv yakunlandi',
        notes: notes || '',
        prescriptions: prescriptions || [],
        servicesProvided: servicesProvided || [{ serviceId: 'srv_1', name: 'Konsultatsiya', price: 100000 }],
        totalCost: Number(totalCost) || 100000,
        startedAt: ticket.startedAt || ticket.calledAt || now,
        completedAt: now
      };
      db.addVisit(visit);

      // Free doctor
      const doctor = db.getDoctorById(ticket.doctorId, tenantId);
      if (doctor) {
        doctor.status = DoctorStatus.AVAILABLE;
        doctor.currentTicketId = undefined;
        db.updateDoctor(doctor);
        WebSocketGateway.getInstance().emitDoctorStatusChanged(ticket.tenantId, doctor.id, DoctorStatus.AVAILABLE);
      }

      WebSocketGateway.getInstance().emitTicketCompleted(ticket.tenantId, ticket.branchId, ticket);

      res.json({
        success: true,
        message: `${ticket.ticketNumber} talon bo'yicha qabul muvaffaqiyatli yakunlandi.`,
        data: { ticket, visit }
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async skipTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const tenantId = req.user?.tenantId;
      const db = DatabaseService.getInstance();
      const ticket = db.getQueueTicketById(id, tenantId);

      if (!ticket) {
        res.status(404).json({ success: false, message: 'Talon topilmadi.' });
        return;
      }

      ticket.status = QueueStatus.SKIPPED;
      db.updateQueueTicket(ticket);

      const doctor = db.getDoctorById(ticket.doctorId, tenantId);
      if (doctor) {
        doctor.status = DoctorStatus.AVAILABLE;
        db.updateDoctor(doctor);
      }

      WebSocketGateway.getInstance().emitTicketSkipped(ticket.tenantId, ticket.branchId, ticket);

      res.json({ success: true, message: 'Navbat o\'tkazildi.', data: ticket });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async cancelTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const tenantId = req.user?.tenantId;
      const db = DatabaseService.getInstance();
      const ticket = db.getQueueTicketById(id, tenantId);

      if (!ticket) {
        res.status(404).json({ success: false, message: 'Talon topilmadi.' });
        return;
      }

      ticket.status = QueueStatus.CANCELLED;
      db.updateQueueTicket(ticket);

      const doctor = db.getDoctorById(ticket.doctorId, tenantId);
      if (doctor && doctor.currentTicketId === ticket.id) {
        doctor.status = DoctorStatus.AVAILABLE;
        doctor.currentTicketId = undefined;
        db.updateDoctor(doctor);
      }

      res.json({ success: true, message: 'Talon bekor qilindi.', data: ticket });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // Public/Tokenized Endpoint for TV Display Screens
  public static async getTvFeed(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req.query.tenantId as string) || 'tenant_sadaf_01';
      const branchId = (req.query.branchId as string) || 'branch_sadaf_main';

      const db = DatabaseService.getInstance();
      const tickets = db.getQueueTickets(tenantId, branchId);
      const clinic = db.getClinicByTenant(tenantId);
      const branch = db.getBranches(tenantId).find(b => b.id === branchId);

      // Current active called or in-progress tickets
      const currentCalled = tickets.filter(t => t.status === QueueStatus.CALLED || t.status === QueueStatus.IN_PROGRESS);
      const waitingNext = tickets.filter(t => t.status === QueueStatus.WAITING).slice(0, 8);

      res.json({
        success: true,
        data: {
          clinicName: clinic?.name || 'SADAF KLINIKA',
          branchName: branch?.name || 'Asosiy filial',
          primaryColor: clinic?.primaryColor || '#008B8B',
          currentCalled,
          waitingNext
        }
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }
}
