import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { PostgresService } from '../../database/postgres.service';
import { DatabaseService } from '../../database/database.service';
import { WebSocketGateway } from '../../websocket/websocket.gateway';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { VoiceService } from '../voice/voice.service';

export class ClinicQueueController {
  private static pg = PostgresService.getInstance();
  private static ws = WebSocketGateway.getInstance();

  // --- 1. SPECIALTIES & CABINETS ---
  public static async getSpecialties(req: Request, res: Response): Promise<void> {
    try {
      const data = await ClinicQueueController.pg.getSpecialties();
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async getCabinets(req: Request, res: Response): Promise<void> {
    try {
      const data = await ClinicQueueController.pg.getCabinets();
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // --- 2. DOCTORS ---
  public static async getDoctors(req: Request, res: Response): Promise<void> {
    try {
      const specialtyId = req.query.specialtyId as string | undefined;
      const data = await ClinicQueueController.pg.getDoctors(specialtyId);
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // --- 3. SERVICES ---
  public static async getServices(req: Request, res: Response): Promise<void> {
    try {
      const specialtyId = req.query.specialtyId as string | undefined;
      const data = await ClinicQueueController.pg.getServices(specialtyId);
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async updateServicePolicy(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { paymentPolicy, price, minimumPaymentAmount } = req.body;
      const resQuery = await ClinicQueueController.pg.query(`
        UPDATE services
        SET payment_policy = COALESCE($1, payment_policy),
            price = COALESCE($2, price),
            minimum_payment_amount = COALESCE($3, minimum_payment_amount),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `, [paymentPolicy, price, minimumPaymentAmount, id]);

      res.json({ success: true, data: resQuery.rows[0] });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // --- 4. PATIENTS ---
  public static async getPatients(req: Request, res: Response): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      const data = await ClinicQueueController.pg.getPatients(search, limit, offset);
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async getPatientById(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const patient = await ClinicQueueController.pg.getPatientById(id);
      if (!patient) {
        res.status(404).json({ success: false, message: 'Bemor topilmadi.' });
        return;
      }
      // Get patient history (visits and tickets)
      const ticketsRes = await ClinicQueueController.pg.query(`
        SELECT t.*, 
               COALESCE(t.doctor_name, d.display_name) as doctor_name,
               COALESCE(t.specialty_name, sp.name) as specialty_name,
               COALESCE(t.cabinet_number, c.number) as cabinet_number,
               COALESCE(t.doctor_conclusion, t.notes) as doctor_conclusion,
               s.name as service_name
        FROM queue_tickets t
        LEFT JOIN doctors d ON t.doctor_id = d.id
        LEFT JOIN specialties sp ON d.specialty_id = sp.id
        LEFT JOIN cabinets c ON d.cabinet_id = c.id
        LEFT JOIN services s ON t.service_id = s.id
        WHERE t.patient_id = $1
        ORDER BY t.created_at DESC
      `, [id]);

      const paymentsRes = await ClinicQueueController.pg.query(`
        SELECT * FROM payments WHERE patient_id = $1 ORDER BY created_at DESC
      `, [id]);

      res.json({
        success: true,
        data: {
          patient,
          tickets: ticketsRes.rows,
          payments: paymentsRes.rows
        }
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async createPatient(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { fullName, phone, birthDate, gender, address, notes } = req.body;
      if (!fullName || !fullName.trim()) {
        res.status(400).json({ success: false, message: 'Bemor F.I.Sh. kiritilishi shart.' });
        return;
      }
      const patient = await ClinicQueueController.pg.createPatient({
        fullName,
        phone,
        birthDate,
        gender,
        address,
        notes
      });
      res.status(201).json({ success: true, data: patient });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // --- 5. CASH SHIFTS ---
  public static async getCurrentShift(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const cashierId = req.user?.userId;
      const data = await ClinicQueueController.pg.getCurrentShift(cashierId);
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async openShift(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const cashierId = req.user?.userId || 'usr_cashier1';
      const cashierName = req.body.cashierName || 'Dilnoza Karimova';
      const { openingBalance, notes } = req.body;

      const data = await ClinicQueueController.pg.openShift(cashierId, cashierName, Number(openingBalance) || 0, notes);
      res.json({ success: true, data, message: 'Kassa smenasi ochildi.' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async closeShift(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { closingBalance } = req.body;
      const data = await ClinicQueueController.pg.closeShift(id, Number(closingBalance) || 0);
      res.json({ success: true, data, message: 'Kassa smenasi yopildi.' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // --- 6. MULTI-SERVICE REGISTRATION & TICKET ISSUANCE (K-01 to K-05) ---
  public static async multiRegister(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { patientId, items, payment } = req.body;
      if (!patientId || !items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ success: false, message: 'Bemor va kamida bitta shifokor/xizmat tanlanishi shart.' });
        return;
      }

      let cashierId = req.user?.userId;
      if (!cashierId && req.headers.authorization) {
        try {
          const token = req.headers.authorization.replace(/^Bearer\s+/i, '').trim();
          const decoded: any = jwt.verify(token, config.jwtSecret);
          cashierId = decoded?.userId;
        } catch (e) {}
      }
      if (!cashierId) {
        cashierId = 'usr_cashier1';
      }

      const result = await ClinicQueueController.pg.createMultiTicketRegistration({
        patientId,
        items,
        payment,
        cashierId
      });

      // WebSocket broadcast for each created ticket
      for (const tck of result.tickets) {
        ClinicQueueController.ws.emitTicketCreated('tenant_sadaf_01', 'branch_sadaf_main', tck as any);
      }

      res.status(201).json({
        success: true,
        message: `${result.tickets.length} ta talon muvaffaqiyatli rasmiylashtirildi.`,
        data: result
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // --- 7. QUEUE TICKETS QUERY ---
  public static async getTickets(req: Request, res: Response): Promise<void> {
    try {
      const { doctorId, status, date, search, limit, offset } = req.query as any;
      const data = await ClinicQueueController.pg.getTickets({
        doctorId,
        status,
        date,
        search,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      });
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // --- 8. DOCTOR QUEUE ACTIONS (D-01 to D-03) ---
  public static async callNext(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      let doctorId = req.body.doctorId;
      // If doctor user is logged in, resolve doctorId
      if (!doctorId && req.user?.userId) {
        const doc = await ClinicQueueController.pg.getDoctorByUserId(req.user.userId);
        if (doc) doctorId = doc.id;
      }
      if (!doctorId) {
        res.status(400).json({ success: false, message: 'Shifokor ID kiritilishi shart.' });
        return;
      }

      const ticket = await ClinicQueueController.pg.callNextTicket(doctorId, req.user?.userId);
      if (!ticket) {
        res.json({ success: true, message: 'Navbatda kutayotgan bemor yo\'q.', data: null });
        return;
      }

      // Format audio voice text for Uzbek TTS using manager configured template
      const settings = await ClinicQueueController.pg.getSettings();
      const voiceText = VoiceService.getInstance().formatTicketAnnouncement(ticket, settings?.tv_voice_template);
      const ticketWithVoice = { ...ticket, voiceText };

      // Broadcast to WebSocket (TV Display and Doctor panels)
      ClinicQueueController.ws.emitTicketCalled('tenant_sadaf_01', 'branch_sadaf_main', ticketWithVoice as any);

      res.json({
        success: true,
        message: `${ticket.full_number} raqamli bemor chaqirildi.`,
        data: ticketWithVoice
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async recall(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const ticket = await ClinicQueueController.pg.recallTicket(id, req.user?.userId);

      const settings = await ClinicQueueController.pg.getSettings();
      const voiceText = VoiceService.getInstance().formatTicketAnnouncement(ticket, settings?.tv_voice_template);
      const ticketWithVoice = { ...ticket, voiceText };

      ClinicQueueController.ws.emitTicketCalled('tenant_sadaf_01', 'branch_sadaf_main', ticketWithVoice as any);

      res.json({
        success: true,
        message: `${ticket.full_number} qayta chaqirildi.`,
        data: ticketWithVoice
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async startTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const ticket = await ClinicQueueController.pg.startTicket(id);
      ClinicQueueController.ws.emitTicketStarted('tenant_sadaf_01', 'branch_sadaf_main', ticket as any);
      res.json({ success: true, message: 'Qabul boshlandi.', data: ticket });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async completeTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { doctorId, notes, conclusion } = req.body;
      const ticket = await ClinicQueueController.pg.completeTicket(id, doctorId, notes, conclusion);
      ClinicQueueController.ws.emitTicketCompleted('tenant_sadaf_01', 'branch_sadaf_main', ticket as any);
      res.json({ success: true, message: 'Qabul muvaffaqiyatli yakunlandi.', data: ticket });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async skipTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { doctorId } = req.body;
      const ticket = await ClinicQueueController.pg.skipTicket(id, doctorId);
      ClinicQueueController.ws.emitTicketSkipped('tenant_sadaf_01', 'branch_sadaf_main', ticket as any);
      res.json({ success: true, message: 'Bemor kelmadi deb belgilandi.', data: ticket });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async cancelTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { doctorId } = req.body;
      const ticket = await ClinicQueueController.pg.cancelTicket(id, doctorId);
      res.json({ success: true, message: 'Talon bekor qilindi.', data: ticket });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // --- 9. TV TABLO FEED & TEST CALL ---
  public static async getTvFeed(req: Request, res: Response): Promise<void> {
    try {
      const data = await ClinicQueueController.pg.getTvFeed();
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async testCall(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const full_number = req.body.full_number || req.body.ticketNumber || 'K-015';
      const specialty_name = req.body.specialty_name || req.body.specialtyName || 'Kardiologiya';
      const doctor_name = req.body.doctor_name || req.body.doctorName || 'Dr. Karimova Malika';
      const cabinet_number = req.body.cabinet_number || req.body.cabinetNumber || '3';

      const settings = await ClinicQueueController.pg.getSettings();
      const testTicket = {
        id: 'test_call',
        full_number,
        specialty_name,
        doctor_name,
        cabinet_number,
        voiceText: VoiceService.getInstance().formatTicketAnnouncement({
          full_number,
          specialty_name,
          doctor_name,
          cabinet_number
        }, req.body.template || settings?.tv_voice_template)
      };
      ClinicQueueController.ws.emitTicketCalled('tenant_sadaf_01', 'branch_sadaf_main', testTicket as any);
      res.json({ success: true, message: 'TV ga sinov chaqiruvi yuborildi.', data: testTicket });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // --- 10. PAYMENTS LIST ---
  public static async getPayments(req: Request, res: Response): Promise<void> {
    try {
      const paymentsRes = await ClinicQueueController.pg.query(`
        SELECT 
          p.*, 
          pt.full_name as patient_name, 
          pt.phone as patient_phone,
          pt.patient_number,
          pt.birth_date as patient_birth_date,
          pt.gender as patient_gender,
          u.full_name as cashier_name,
          u.username as cashier_username,
          cs.id as shift_id,
          cs.opened_at as shift_opened_at,
          (
            SELECT json_agg(json_build_object(
              'ticket_id', qt.id,
              'full_number', qt.full_number,
              'doctor_name', qt.doctor_name,
              'specialty_name', qt.specialty_name,
              'cabinet_number', qt.cabinet_number,
              'status', qt.status
            ))
            FROM queue_tickets qt
            WHERE qt.patient_id = p.patient_id 
              AND (p.notes LIKE '%' || qt.full_number || '%' OR abs(EXTRACT(EPOCH FROM (qt.created_at - p.created_at))) < 10)
          ) as related_tickets
        FROM payments p
        LEFT JOIN patients pt ON p.patient_id = pt.id
        LEFT JOIN users u ON p.cashier_id = u.id
        LEFT JOIN cash_shifts cs ON p.cash_shift_id = cs.id
        ORDER BY p.created_at DESC
        LIMIT 200
      `);
      res.json({ success: true, data: paymentsRes.rows });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // --- 11. REPORTS & MANAGER DASHBOARD ---
  public static async getManagerDashboard(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await ClinicQueueController.pg.getDashboardMetrics();
      res.json({ success: true, data: metrics });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // --- 12. CLINIC SETTINGS ---
  public static async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const settings = await ClinicQueueController.pg.getSettings();
      res.json({ success: true, data: settings });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const updated = await ClinicQueueController.pg.updateSettings(req.body);
      ClinicQueueController.ws.emitTvSettingsUpdated('tenant_sadaf_01', 'branch_sadaf_main', updated);
      res.json({ success: true, message: 'Sozlamalar yangilandi va TV tablosi jonli yangilandi.', data: updated });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async getSubscription(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req.query.tenantId as string) || (req.headers['x-tenant-id'] as string) || 'tenant_sadaf_01';
      let data = await ClinicQueueController.pg.getClinicSubscription(tenantId);
      if (!data) {
        const db = DatabaseService.getInstance();
        const sub = db.getSubscriptionByTenant(tenantId);
        if (sub) {
          const clinic = db.getClinicByTenant(tenantId);
          data = {
            id: sub.id,
            clinic_id: sub.tenantId,
            clinic_name: clinic?.name || 'Klinika',
            plan_code: sub.planCode,
            status: sub.status,
            start_date: sub.startDate,
            end_date: sub.endDate,
            days_remaining: Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            plan_name: sub.planCode,
            plan_price: '0',
            sms_balance: 1000,
            sms_enabled: true
          };
        } else {
          data = await ClinicQueueController.pg.getClinicSubscription('tenant_sadaf_01');
        }
      }
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // --- 13. CRUD ACTIONS FOR MANAGER ---
  public static async createDoctor(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const doc = await ClinicQueueController.pg.createDoctor(req.body);
      res.status(201).json({ success: true, message: 'Yangi shifokor yaratildi.', data: doc });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async updateDoctor(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const doc = await ClinicQueueController.pg.updateDoctor(id, req.body);
      res.json({ success: true, message: 'Shifokor ma\'lumotlari yangilandi.', data: doc });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async deleteDoctor(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      await ClinicQueueController.pg.deleteDoctor(id);
      res.json({ success: true, message: 'Shifokor o\'chirildi.' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async createService(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const srv = await ClinicQueueController.pg.createService(req.body);
      res.status(201).json({ success: true, message: 'Yangi xizmat qo\'shildi.', data: srv });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async updateService(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const srv = await ClinicQueueController.pg.updateService(id, req.body);
      res.json({ success: true, message: 'Xizmat ma\'lumotlari yangilandi.', data: srv });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async deleteService(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      await ClinicQueueController.pg.deleteService(id);
      res.json({ success: true, message: 'Xizmat o\'chirildi.' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async createCabinet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const cab = await ClinicQueueController.pg.createCabinet(req.body);
      res.status(201).json({ success: true, message: 'Yangi kabinet yaratildi.', data: cab });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async updateCabinet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const cab = await ClinicQueueController.pg.updateCabinet(id, req.body);
      res.json({ success: true, message: 'Kabinet yangilandi.', data: cab });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async deleteCabinet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      await ClinicQueueController.pg.deleteCabinet(id);
      res.json({ success: true, message: 'Kabinet o\'chirildi.' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async updatePatient(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const pat = await ClinicQueueController.pg.updatePatient(id, req.body);
      res.json({ success: true, message: 'Bemor ma\'lumotlari yangilandi.', data: pat });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async deletePatient(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      await ClinicQueueController.pg.deletePatient(id);
      res.json({ success: true, message: 'Bemor o\'chirildi.' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // --- 14. USERS AND SHIFTS MANAGEMENT ---
  public static async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const users = await ClinicQueueController.pg.getUsers();
      res.json({ success: true, data: users });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await ClinicQueueController.pg.createUser(req.body);
      res.status(201).json({ success: true, message: 'Yangi foydalanuvchi yaratildi.', data: user });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = await ClinicQueueController.pg.updateUser(id, req.body);
      res.json({ success: true, message: 'Foydalanuvchi yangilandi.', data: user });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      await ClinicQueueController.pg.deleteUser(id);
      res.json({ success: true, message: 'Foydalanuvchi o\'chirildi.' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async getAllShifts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const shifts = await ClinicQueueController.pg.getAllShifts();
      res.json({ success: true, data: shifts });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async getShiftDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const data = await ClinicQueueController.pg.getShiftDetails(id);
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async getDoctorPerformance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const data = await ClinicQueueController.pg.getDoctorPerformance(id);
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 200;
      const logs = await ClinicQueueController.pg.getAuditLogs(limit);
      res.json({ success: true, data: logs });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }
}

