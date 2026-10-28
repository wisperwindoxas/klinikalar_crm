import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { config } from '../config';

export class PostgresService {
  private static instance: PostgresService;
  private pool: Pool;

  private constructor() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres_secret@localhost:5433/sadaf_clinic_db';
    this.pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
  }

  public static getInstance(): PostgresService {
    if (!PostgresService.instance) {
      PostgresService.instance = new PostgresService();
    }
    return PostgresService.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async query(text: string, params?: any[]) {
    return this.pool.query(text, params);
  }

  public async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  // Transaction helper
  public async withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  // --- CLINIC SETTINGS ---
  public async getSettings() {
    const res = await this.query('SELECT * FROM clinic_settings LIMIT 1');
    return res.rows[0];
  }

  // --- SPECIALTIES ---
  public async getSpecialties() {
    const res = await this.query('SELECT * FROM specialties WHERE is_active = true ORDER BY name ASC');
    return res.rows;
  }

  // --- CABINETS ---
  public async getCabinets() {
    const res = await this.query('SELECT * FROM cabinets WHERE is_active = true ORDER BY (number::int) ASC');
    return res.rows;
  }

  // --- DOCTORS ---
  public async getDoctors(specialtyId?: string) {
    let sql = `
      SELECT d.*, s.name as specialty_name, s.prefix as specialty_prefix,
             COALESCE(c.name, d.room_number || '-kabinet') as cabinet_name,
             COALESCE(c.number, d.room_number) as cabinet_number,
             u.username as login,
             u.username,
             u.phone as user_phone
      FROM doctors d
      LEFT JOIN specialties s ON d.specialty_id = s.id
      LEFT JOIN cabinets c ON (d.cabinet_id = c.id OR d.room_number = c.number)
      LEFT JOIN users u ON d.user_id = u.id
      WHERE d.is_active = true
    `;
    const params: any[] = [];
    if (specialtyId && specialtyId !== 'ALL' && specialtyId !== 'Barchasi') {
      params.push(specialtyId);
      sql += ` AND d.specialty_id = $1`;
    }
    sql += ` ORDER BY d.display_name ASC`;
    const res = await this.query(sql, params);
    return res.rows;
  }

  public async getDoctorById(id: string) {
    const res = await this.query(`
      SELECT d.*, s.name as specialty_name, s.prefix as specialty_prefix,
             COALESCE(c.name, d.room_number || '-kabinet') as cabinet_name,
             COALESCE(c.number, d.room_number) as cabinet_number
      FROM doctors d
      LEFT JOIN specialties s ON d.specialty_id = s.id
      LEFT JOIN cabinets c ON (d.cabinet_id = c.id OR d.room_number = c.number)
      WHERE d.id = $1
    `, [id]);
    return res.rows[0] || null;
  }

  public async getDoctorByUserId(userId: string) {
    const res = await this.query(`
      SELECT d.*, s.name as specialty_name, s.prefix as specialty_prefix,
             COALESCE(c.name, d.room_number || '-kabinet') as cabinet_name,
             COALESCE(c.number, d.room_number) as cabinet_number
      FROM doctors d
      LEFT JOIN specialties s ON d.specialty_id = s.id
      LEFT JOIN cabinets c ON (d.cabinet_id = c.id OR d.room_number = c.number)
      WHERE d.user_id = $1
    `, [userId]);
    return res.rows[0] || null;
  }

  // --- SERVICES ---
  public async getServices(specialtyId?: string) {
    let sql = `
      SELECT 
        s.*, 
        sp.name as specialty_name, 
        sp.prefix as specialty_prefix,
        (
          SELECT COUNT(d.id)::int
          FROM doctors d
          WHERE d.specialty_id = s.specialty_id AND d.is_active = true
        ) as doctor_count,
        (
          SELECT COALESCE(json_agg(json_build_object(
            'id', d.id,
            'display_name', d.display_name,
            'phone', d.phone,
            'room_number', d.room_number,
            'avg_consultation_minutes', d.avg_consultation_minutes,
            'is_active', d.is_active
          ) ORDER BY d.display_name ASC), '[]'::json)
          FROM doctors d
          WHERE d.specialty_id = s.specialty_id AND d.is_active = true
        ) as doctors
      FROM services s
      LEFT JOIN specialties sp ON s.specialty_id = sp.id
      WHERE s.is_active = true
    `;
    const params: any[] = [];
    if (specialtyId && specialtyId !== 'ALL' && specialtyId !== 'Barchasi') {
      params.push(specialtyId);
      sql += ` AND s.specialty_id = $1`;
    }
    sql += ` ORDER BY s.name ASC`;
    const res = await this.query(sql, params);
    return res.rows;
  }

  // --- PATIENTS ---
  public async getPatients(search?: string, limit?: number, offset?: number) {
    let sql = `
      SELECT 
        pt.*,
        (
          SELECT COUNT(qt.id)::int 
          FROM queue_tickets qt 
          WHERE qt.patient_id = pt.id
        ) as total_visits,
        (
          SELECT COALESCE(SUM(p.amount), 0)
          FROM payments p
          WHERE p.patient_id = pt.id
        ) as total_paid,
        (
          SELECT json_build_object(
            'doctor_name', qt.doctor_name,
            'specialty_name', qt.specialty_name,
            'date', qt.queue_date,
            'time', qt.created_at,
            'cabinet_number', qt.cabinet_number,
            'status', qt.status
          )
          FROM queue_tickets qt
          WHERE qt.patient_id = pt.id
          ORDER BY qt.created_at DESC
          LIMIT 1
        ) as last_visit,
        (
          SELECT COALESCE(json_agg(json_build_object(
            'doctor_name', dv.doctor_name,
            'specialty_name', dv.specialty_name,
            'cabinet_number', dv.cabinet_number,
            'visit_count', dv.visit_count,
            'last_visited_at', dv.last_visited_at,
            'doctor_conclusion', dv.doctor_conclusion,
            'notes', dv.notes
          ) ORDER BY dv.last_visited_at DESC), '[]'::json)
          FROM (
            SELECT 
              qt.doctor_name,
              qt.specialty_name,
              qt.cabinet_number,
              COUNT(qt.id)::int as visit_count,
              MAX(qt.created_at) as last_visited_at,
              MAX(COALESCE(qt.doctor_conclusion, qt.notes)) as doctor_conclusion,
              MAX(qt.notes) as notes
            FROM queue_tickets qt
            WHERE qt.patient_id = pt.id
            GROUP BY qt.doctor_name, qt.specialty_name, qt.cabinet_number
          ) dv
        ) as doctor_visits
      FROM patients pt 
      WHERE pt.archived_at IS NULL
    `;
    const params: any[] = [];
    let idx = 1;
    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(pt.full_name) LIKE $${idx} OR pt.phone LIKE $${idx} OR pt.patient_number LIKE $${idx++})`;
    }
    sql += ` ORDER BY pt.created_at DESC`;
    if (limit !== undefined && Number(limit) > 0) {
      params.push(Number(limit));
      sql += ` LIMIT $${idx++}`;
      if (offset !== undefined && Number(offset) > 0) {
        params.push(Number(offset));
        sql += ` OFFSET $${idx++}`;
      }
    } else {
      sql += ` LIMIT 100`;
    }
    const res = await this.query(sql, params);
    return res.rows;
  }

  public async getPatientById(id: string) {
    const res = await this.query(`
      SELECT 
        pt.*,
        (
          SELECT COUNT(qt.id)::int 
          FROM queue_tickets qt 
          WHERE qt.patient_id = pt.id
        ) as total_visits,
        (
          SELECT COALESCE(SUM(p.amount), 0)
          FROM payments p
          WHERE p.patient_id = pt.id
        ) as total_paid,
        (
          SELECT json_build_object(
            'doctor_name', qt.doctor_name,
            'specialty_name', qt.specialty_name,
            'date', qt.queue_date,
            'time', qt.created_at,
            'cabinet_number', qt.cabinet_number,
            'status', qt.status
          )
          FROM queue_tickets qt
          WHERE qt.patient_id = pt.id
          ORDER BY qt.created_at DESC
          LIMIT 1
        ) as last_visit,
        (
          SELECT COALESCE(json_agg(json_build_object(
            'doctor_name', dv.doctor_name,
            'specialty_name', dv.specialty_name,
            'cabinet_number', dv.cabinet_number,
            'visit_count', dv.visit_count,
            'last_visited_at', dv.last_visited_at,
            'doctor_conclusion', dv.doctor_conclusion,
            'notes', dv.notes
          ) ORDER BY dv.last_visited_at DESC), '[]'::json)
          FROM (
            SELECT 
              qt.doctor_name,
              qt.specialty_name,
              qt.cabinet_number,
              COUNT(qt.id)::int as visit_count,
              MAX(qt.created_at) as last_visited_at,
              MAX(COALESCE(qt.doctor_conclusion, qt.notes)) as doctor_conclusion,
              MAX(qt.notes) as notes
            FROM queue_tickets qt
            WHERE qt.patient_id = pt.id
            GROUP BY qt.doctor_name, qt.specialty_name, qt.cabinet_number
          ) dv
        ) as doctor_visits
      FROM patients pt 
      WHERE pt.id = $1
    `, [id]);
    return res.rows[0] || null;
  }

  public async createPatient(data: {
    fullName: string;
    phone?: string;
    birthDate?: string;
    gender?: string;
    address?: string;
    notes?: string;
  }) {
    // 1. If an existing patient matches by phone and name, reuse them
    if (data.phone && data.phone.trim() && data.fullName && data.fullName.trim()) {
      const cleanPhone = data.phone.trim();
      const cleanName = data.fullName.trim().toLowerCase();
      const existing = await this.query(
        'SELECT * FROM patients WHERE phone = $1 AND LOWER(TRIM(full_name)) = $2 LIMIT 1',
        [cleanPhone, cleanName]
      );
      if (existing.rows.length > 0) {
        return existing.rows[0];
      }
    }

    const id = `pat_${uuidv4().substring(0, 8)}`;
    // 2. Generate next unique patient number from maximum integer
    const maxRes = await this.query(`
      SELECT COALESCE(MAX(CASE WHEN patient_number ~ '^[0-9]+$' THEN patient_number::int ELSE 1000 END), 1000) as max_num
      FROM patients
    `);
    const nextNum = String(parseInt(maxRes.rows[0].max_num, 10) + 1);

    // 3. Clean birthDate to avoid invalid date syntax with empty strings
    const cleanBirthDate = data.birthDate && data.birthDate.trim() ? data.birthDate.trim() : null;

    const res = await this.query(`
      INSERT INTO patients (id, patient_number, full_name, phone, birth_date, gender, address, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      id,
      nextNum,
      data.fullName.trim(),
      data.phone ? data.phone.trim() : null,
      cleanBirthDate,
      data.gender || 'MALE',
      data.address || null,
      data.notes || null
    ]);
    return res.rows[0];
  }

  // --- CASH SHIFTS ---
  public async getCurrentShift(cashierId?: string) {
    let sql = `SELECT * FROM cash_shifts WHERE status = 'OPEN'`;
    const params: any[] = [];
    if (cashierId) {
      params.push(cashierId);
      sql += ` AND cashier_id = $1`;
    }
    sql += ` ORDER BY opened_at DESC LIMIT 1`;
    const res = await this.query(sql, params);
    return res.rows[0] || null;
  }

  public async openShift(cashierId: string, cashierName: string, openingBalance: number, notes?: string) {
    const id = `shift_${uuidv4().substring(0, 8)}`;
    const res = await this.query(`
      INSERT INTO cash_shifts (id, cashier_id, cashier_name, opened_at, opening_balance, status, notes)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, 'OPEN', $5)
      RETURNING *
    `, [id, cashierId, cashierName, openingBalance || 0, notes || null]);
    return res.rows[0];
  }

  public async closeShift(shiftId: string, closingBalance: number) {
    const res = await this.query(`
      UPDATE cash_shifts
      SET status = 'CLOSED', closed_at = CURRENT_TIMESTAMP, closing_balance = $2
      WHERE id = $1
      RETURNING *
    `, [shiftId, closingBalance]);
    return res.rows[0];
  }

  // --- QUEUE TICKETS ---
  // Atomic generation of ticket for appointment:
  // Prefix: specialty prefix or doctor prefix or 'A'
  // Unique per (queue_date, queue_prefix, queue_number)
  public async createTicketAtomic(client: PoolClient, data: {
    patientId: string;
    doctorId: string;
    serviceId: string;
    cabinetId?: string;
    createdBy?: string;
    paymentStatus?: string;
  }) {
    // 1. Get Doctor & Specialty info
    const docRes = await client.query(`
      SELECT d.*, s.prefix as specialty_prefix, s.name as specialty_name,
             COALESCE(c.number, d.room_number) as cabinet_number,
             c.id as resolved_cabinet_id
      FROM doctors d
      LEFT JOIN specialties s ON d.specialty_id = s.id
      LEFT JOIN cabinets c ON (d.cabinet_id = c.id OR d.room_number = c.number)
      WHERE d.id = $1
    `, [data.doctorId]);
    const doctor = docRes.rows[0];
    if (!doctor) throw new Error('Shifokor topilmadi.');

    // 2. Get Patient info
    const patRes = await client.query(`SELECT * FROM patients WHERE id = $1`, [data.patientId]);
    const patient = patRes.rows[0];
    if (!patient) throw new Error('Bemor topilmadi.');

    // 3. Get Service info
    const srvRes = await client.query(`SELECT * FROM services WHERE id = $1`, [data.serviceId]);
    const service = srvRes.rows[0];

    const todayStr = new Date().toISOString().split('T')[0];
    const prefix = doctor.specialty_prefix || 'A';

    // 4. Lock and calculate next sequence number for this date and prefix
    const seqRes = await client.query(`
      SELECT COALESCE(MAX(queue_number), 0) + 1 as next_seq
      FROM queue_tickets
      WHERE queue_date = $1 AND queue_prefix = $2
    `, [todayStr, prefix]);
    const nextSeq = parseInt(seqRes.rows[0].next_seq, 10);
    const fullNumber = `${prefix}-${String(nextSeq).padStart(3, '0')}`;

    // 5. Calculate waiting count ahead
    const waitRes = await client.query(`
      SELECT count(*) as count FROM queue_tickets
      WHERE doctor_id = $1 AND queue_date = $2 AND status = 'WAITING'
    `, [data.doctorId, todayStr]);
    const countAhead = parseInt(waitRes.rows[0].count, 10);
    const estimatedWait = countAhead * (doctor.avg_consultation_minutes || 15);

    // 6. Create appointment record
    const appointmentId = `apt_${uuidv4().substring(0, 8)}`;
    await client.query(`
      INSERT INTO appointments (id, patient_id, doctor_id, service_id, cabinet_id, status, payment_status, amount, created_by)
      VALUES ($1, $2, $3, $4, $5, 'CONFIRMED', $6, $7, $8)
    `, [
      appointmentId,
      patient.id,
      doctor.id,
      service?.id || null,
      doctor.resolved_cabinet_id || null,
      data.paymentStatus || (service?.payment_policy === 'FREE_OR_EXEMPT' ? 'EXEMPT' : 'UNPAID'),
      service?.price || 0,
      data.createdBy || null
    ]);

    // 7. Insert queue ticket
    const ticketId = `tck_${uuidv4().substring(0, 8)}`;
    const ticketRes = await client.query(`
      INSERT INTO queue_tickets (
        id, appointment_id, doctor_id, patient_id, service_id, cabinet_id,
        doctor_name, specialty_name, patient_name, patient_phone, cabinet_number,
        queue_date, queue_prefix, queue_number, full_number,
        status, priority, payment_status, estimated_wait_minutes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'WAITING', 0, $16, $17, $18)
      RETURNING *
    `, [
      ticketId,
      appointmentId,
      doctor.id,
      patient.id,
      service?.id || null,
      doctor.resolved_cabinet_id || null,
      doctor.display_name,
      doctor.specialty_name,
      patient.full_name,
      patient.phone,
      doctor.cabinet_number,
      todayStr,
      prefix,
      nextSeq,
      fullNumber,
      data.paymentStatus || (service?.payment_policy === 'FREE_OR_EXEMPT' ? 'EXEMPT' : 'UNPAID'),
      estimatedWait,
      data.createdBy || null
    ]);

    return ticketRes.rows[0];
  }

  // --- MULTI-SERVICE REGISTRATION (Kassir: 1 bemor -> bir nechta shifokor/talon) ---
  public async createMultiTicketRegistration(data: {
    patientId: string;
    items: Array<{
      doctorId: string;
      serviceId: string;
    }>;
    payment?: {
      method: string;
      amountPaid: number;
    };
    cashierId?: string;
  }) {
    return this.withTransaction(async (client) => {
      // 1. Verify shift
      const shiftRes = await client.query(`SELECT * FROM cash_shifts WHERE status = 'OPEN' LIMIT 1`);
      const activeShift = shiftRes.rows[0];

      const createdTickets: any[] = [];
      let totalCost = 0;

      for (const item of data.items) {
        // Check service price and payment policy
        const srvRes = await client.query(`SELECT * FROM services WHERE id = $1`, [item.serviceId]);
        const srv = srvRes.rows[0];
        const price = Number(srv?.price || 0);
        totalCost += price;

        let paymentStatus = 'UNPAID';
        if (srv?.payment_policy === 'FREE_OR_EXEMPT') {
          paymentStatus = 'EXEMPT';
        } else if (data.payment && data.payment.amountPaid >= totalCost) {
          paymentStatus = 'PAID';
        } else if (data.payment && data.payment.amountPaid > 0) {
          paymentStatus = 'PARTIALLY_PAID';
        }

        const ticket = await this.createTicketAtomic(client, {
          patientId: data.patientId,
          doctorId: item.doctorId,
          serviceId: item.serviceId,
          createdBy: data.cashierId,
          paymentStatus
        });
        createdTickets.push(ticket);
      }

      // 2. Record payment if paid
      let paymentRecord = null;
      if (data.payment && data.payment.amountPaid > 0) {
        const paymentId = `pay_${uuidv4().substring(0, 8)}`;
        const receiptNumber = `RCP-${Date.now().toString().slice(-6)}`;
        const payRes = await client.query(`
          INSERT INTO payments (id, patient_id, cashier_id, cash_shift_id, receipt_number, amount, method, status, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `, [
          paymentId,
          data.patientId,
          data.cashierId || null,
          activeShift?.id || null,
          receiptNumber,
          data.payment.amountPaid,
          data.payment.method || 'CASH',
          data.payment.amountPaid >= totalCost ? 'PAID' : 'PARTIAL',
          `Qabul to'lovi (${createdTickets.map(t => t.full_number).join(', ')})`
        ]);
        paymentRecord = payRes.rows[0];

        // Update shift total received
        if (activeShift) {
          await client.query(`
            UPDATE cash_shifts SET total_received = total_received + $1 WHERE id = $2
          `, [data.payment.amountPaid, activeShift.id]);
        }
      }

      return {
        tickets: createdTickets,
        payment: paymentRecord,
        totalCost
      };
    });
  }

  // --- DOCTOR QUEUE ACTIONS (Atomik chaqirish, qayta chaqirish, o'tkazish) ---
  public async callNextTicket(doctorId: string, performedBy?: string) {
    return this.withTransaction(async (client) => {
      const todayStr = new Date().toISOString().split('T')[0];

      // 1. Lock doctor row
      const docRes = await client.query(`SELECT * FROM doctors WHERE id = $1 FOR UPDATE`, [doctorId]);
      const doctor = docRes.rows[0];
      if (!doctor) throw new Error('Shifokor topilmadi.');

      // 2. Select oldest WAITING ticket for doctor and lock it (SKIP LOCKED prevents double calling)
      const ticketRes = await client.query(`
        SELECT * FROM queue_tickets
        WHERE doctor_id = $1 AND queue_date = $2 AND status = 'WAITING'
        ORDER BY priority DESC, queue_number ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `, [doctorId, todayStr]);

      const ticket = ticketRes.rows[0];
      if (!ticket) {
        return null; // Navbatda hech kim yo'q
      }

      // 3. Mark ticket as CALLED
      const now = new Date();
      await client.query(`
        UPDATE queue_tickets
        SET status = 'CALLED', called_at = $1, updated_at = $1
        WHERE id = $2
      `, [now, ticket.id]);

      // 4. Update doctor current ticket
      await client.query(`
        UPDATE doctors
        SET current_ticket_id = $1, updated_at = $2
        WHERE id = $3
      `, [ticket.id, now, doctorId]);

      // 5. Write to queue_call_events
      await client.query(`
        INSERT INTO queue_call_events (id, ticket_id, doctor_id, event_type, event_at, performed_by)
        VALUES ($1, $2, $3, 'CALL_NEXT', $4, $5)
      `, [`evt_${uuidv4().substring(0, 8)}`, ticket.id, doctorId, now, performedBy || null]);

      const fullRes = await client.query(`
        SELECT t.*, s.name as service_name, s.price as service_price,
               p.birth_date as patient_birth_date, p.gender as patient_gender, p.address as patient_address
        FROM queue_tickets t
        LEFT JOIN services s ON t.service_id = s.id
        LEFT JOIN patients p ON t.patient_id = p.id
        WHERE t.id = $1
      `, [ticket.id]);

      return fullRes.rows[0];
    });
  }

  public async recallTicket(ticketId: string, performedBy?: string) {
    return this.withTransaction(async (client) => {
      const ticketRes = await client.query(`SELECT * FROM queue_tickets WHERE id = $1 FOR UPDATE`, [ticketId]);
      const ticket = ticketRes.rows[0];
      if (!ticket) throw new Error('Talon topilmadi.');

      const now = new Date();
      await client.query(`
        UPDATE queue_tickets SET status = 'CALLED', called_at = $1, updated_at = $1 WHERE id = $2
      `, [now, ticketId]);

      await client.query(`
        INSERT INTO queue_call_events (id, ticket_id, doctor_id, event_type, event_at, performed_by)
        VALUES ($1, $2, $3, 'RECALL', $4, $5)
      `, [`evt_${uuidv4().substring(0, 8)}`, ticketId, ticket.doctor_id, now, performedBy || null]);

      const fullRes = await client.query(`
        SELECT t.*, s.name as service_name, s.price as service_price,
               p.birth_date as patient_birth_date, p.gender as patient_gender, p.address as patient_address
        FROM queue_tickets t
        LEFT JOIN services s ON t.service_id = s.id
        LEFT JOIN patients p ON t.patient_id = p.id
        WHERE t.id = $1
      `, [ticket.id]);

      return fullRes.rows[0];
    });
  }

  public async startTicket(ticketId: string) {
    const now = new Date();
    const res = await this.query(`
      UPDATE queue_tickets SET status = 'IN_PROGRESS', started_at = $1, updated_at = $1 WHERE id = $2 RETURNING *
    `, [now, ticketId]);
    return res.rows[0];
  }

  public async completeTicket(ticketId: string, doctorId: string, notes?: string, conclusion?: string) {
    return this.withTransaction(async (client) => {
      const now = new Date();
      const finalConclusion = (conclusion && conclusion.trim().length > 0)
        ? conclusion.trim()
        : ((notes && notes.trim().length > 0) ? notes.trim() : 'Xulosa berilmadi');

      const res = await client.query(`
        UPDATE queue_tickets 
        SET status = 'COMPLETED', 
            completed_at = $1, 
            updated_at = $1,
            notes = $3,
            doctor_conclusion = $4
        WHERE id = $2 
        RETURNING *
      `, [now, ticketId, finalConclusion, finalConclusion]);

      await client.query(`
        UPDATE doctors SET current_ticket_id = NULL, updated_at = $1 WHERE id = $2
      `, [now, doctorId]);

      await client.query(`
        INSERT INTO queue_call_events (id, ticket_id, doctor_id, event_type, event_at)
        VALUES ($1, $2, $3, 'COMPLETE', $4)
      `, [`evt_${uuidv4().substring(0, 8)}`, ticketId, doctorId, now]);

      return res.rows[0];
    });
  }

  public async skipTicket(ticketId: string, doctorId: string) {
    return this.withTransaction(async (client) => {
      const now = new Date();
      const res = await client.query(`
        UPDATE queue_tickets SET status = 'SKIPPED', updated_at = $1 WHERE id = $2 RETURNING *
      `, [now, ticketId]);

      await client.query(`
        UPDATE doctors SET current_ticket_id = NULL, updated_at = $1 WHERE id = $2
      `, [now, doctorId]);

      await client.query(`
        INSERT INTO queue_call_events (id, ticket_id, doctor_id, event_type, event_at)
        VALUES ($1, $2, $3, 'SKIP', $4)
      `, [`evt_${uuidv4().substring(0, 8)}`, ticketId, doctorId, now]);

      return res.rows[0];
    });
  }

  public async cancelTicket(ticketId: string, doctorId?: string) {
    const res = await this.query(`
      UPDATE queue_tickets SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *
    `, [ticketId]);
    if (doctorId) {
      await this.query(`UPDATE doctors SET current_ticket_id = NULL WHERE id = $1`, [doctorId]);
    }
    return res.rows[0];
  }

  // --- QUERY TICKETS (Filtrlash va jurnal) ---
  public async getTickets(filter: {
    doctorId?: string;
    status?: string;
    date?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    let sql = `
      SELECT t.*, s.name as service_name, s.price as service_price,
             p.birth_date as patient_birth_date, p.gender as patient_gender, p.address as patient_address
      FROM queue_tickets t
      LEFT JOIN services s ON t.service_id = s.id
      LEFT JOIN patients p ON t.patient_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let idx = 1;

    if (filter.date) {
      params.push(filter.date);
      sql += ` AND t.queue_date = $${idx++}`;
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      params.push(todayStr);
      sql += ` AND t.queue_date = $${idx++}`;
    }

    if (filter.doctorId && filter.doctorId !== 'ALL') {
      params.push(filter.doctorId);
      sql += ` AND t.doctor_id = $${idx++}`;
    }

    if (filter.status && filter.status !== 'ALL' && filter.status !== 'Barchasi') {
      params.push(filter.status);
      sql += ` AND t.status = $${idx++}`;
    }

    if (filter.search && filter.search.trim()) {
      params.push(`%${filter.search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(t.patient_name) LIKE $${idx} OR t.patient_phone LIKE $${idx} OR LOWER(t.full_number) LIKE $${idx++})`;
    }

    sql += ` ORDER BY t.created_at DESC`;
    if (filter.limit !== undefined && Number(filter.limit) > 0) {
      params.push(Number(filter.limit));
      sql += ` LIMIT $${idx++}`;
      if (filter.offset !== undefined && Number(filter.offset) > 0) {
        params.push(Number(filter.offset));
        sql += ` OFFSET $${idx++}`;
      }
    }
    const res = await this.query(sql, params);
    return res.rows;
  }

  // --- TV TABLO FEED ---
  public async getTvFeed() {
    const todayStr = new Date().toISOString().split('T')[0];
    const settings = await this.getSettings();

    // Hozir chaqirilayotgan yoki qabuldagi oxirgi 4-8 ta talon
    const calledRes = await this.query(`
      SELECT t.*, 
             COALESCE(t.doctor_name, d.display_name) as doctor_name,
             COALESCE(t.cabinet_number, d.room_number) as cabinet_number,
             COALESCE(t.specialty_name, s.name) as specialty_name
      FROM queue_tickets t
      LEFT JOIN doctors d ON t.doctor_id = d.id
      LEFT JOIN services s ON t.service_id = s.id
      WHERE t.queue_date = $1 AND (t.status = 'CALLED' OR t.status = 'IN_PROGRESS')
      ORDER BY t.called_at DESC NULLS LAST, t.updated_at DESC
      LIMIT 6
    `, [todayStr]);

    // Keyingi kutayotgan navbatlar
    const waitingRes = await this.query(`
      SELECT t.*,
             COALESCE(t.doctor_name, d.display_name) as doctor_name,
             COALESCE(t.cabinet_number, d.room_number) as cabinet_number,
             COALESCE(t.specialty_name, s.name) as specialty_name
      FROM queue_tickets t
      LEFT JOIN doctors d ON t.doctor_id = d.id
      LEFT JOIN services s ON t.service_id = s.id
      WHERE t.queue_date = $1 AND t.status = 'WAITING'
      ORDER BY t.priority DESC, t.queue_number ASC
      LIMIT 8
    `, [todayStr]);

    return {
      clinicName: settings?.clinic_name || 'SADAF TIBBIYOT MARKAZI',
      voiceLanguage: settings?.voice_language || 'uz-UZ',
      settings: settings || null,
      currentCalled: calledRes.rows,
      waitingNext: waitingRes.rows,
      upcomingQueue: waitingRes.rows
    };
  }

  // --- DASHBOARD & METRICS ---
  public async getDashboardMetrics() {
    const todayStr = new Date().toISOString().split('T')[0];

    const statsRes = await this.query(`
      SELECT
        COUNT(*) as total_today,
        COUNT(*) FILTER (WHERE status = 'WAITING') as waiting_count,
        COUNT(*) FILTER (WHERE status = 'CALLED' OR status = 'IN_PROGRESS') as in_progress_count,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_count,
        COUNT(*) FILTER (WHERE status = 'CANCELLED' OR status = 'SKIPPED') as cancelled_count
      FROM queue_tickets
      WHERE queue_date = $1
    `, [todayStr]);

    const paymentRes = await this.query(`
      SELECT COALESCE(SUM(amount), 0) as total_payments
      FROM payments
      WHERE DATE(created_at) = $1
    `, [todayStr]);

    // Shifokorlar bo'yicha yuklama va tushumlar
    const doctorsLoadRes = await this.query(`
      SELECT d.id, d.display_name, d.room_number, d.phone, s.name as specialty_name,
        c.number as cabinet_number,
        COUNT(t.id) FILTER (WHERE t.status = 'WAITING')::int as waiting,
        COUNT(t.id) FILTER (WHERE t.status = 'IN_PROGRESS' OR t.status = 'CALLED')::int as in_progress,
        COUNT(t.id) FILTER (WHERE t.status = 'COMPLETED')::int as completed,
        COUNT(t.id)::int as total_tickets,
        COALESCE(SUM(srv.price) FILTER (WHERE t.payment_status = 'PAID' OR t.status = 'COMPLETED'), 0)::numeric as total_revenue
      FROM doctors d
      JOIN specialties s ON d.specialty_id = s.id
      LEFT JOIN cabinets c ON d.cabinet_id = c.id
      LEFT JOIN queue_tickets t ON d.id = t.doctor_id
      LEFT JOIN services srv ON t.service_id = srv.id
      WHERE d.is_active = true
      GROUP BY d.id, d.display_name, d.room_number, d.phone, s.name, c.number
      ORDER BY total_tickets DESC, waiting DESC, d.display_name ASC
    `);

    // Hourly distribution from actual queue_tickets
    const hourlyRes = await this.query(`
      SELECT TO_CHAR(created_at, 'HH24:00') as hour_slot, COUNT(*) as count
      FROM queue_tickets
      WHERE queue_date = $1
      GROUP BY hour_slot
      ORDER BY hour_slot ASC
    `, [todayStr]);

    const defaultHours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    const hourlyMap = new Map<string, number>();
    for (const r of hourlyRes.rows) {
      hourlyMap.set(r.hour_slot, parseInt(r.count, 10));
    }
    const hourlyTraffic = defaultHours.map(hour => ({
      hour,
      count: hourlyMap.get(hour) || 0
    }));

    // Payment breakdown by method (Cash, Card, Online/Transfer)
    const payBreakdownRes = await this.query(`
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE method = 'CASH'), 0) as cash_sum,
        COALESCE(SUM(amount) FILTER (WHERE method = 'CARD'), 0) as card_sum,
        COALESCE(SUM(amount) FILTER (WHERE method = 'TRANSFER' OR method = 'ONLINE'), 0) as online_sum,
        COALESCE(SUM(amount), 0) as total_sum
      FROM payments
      WHERE DATE(created_at) = $1
    `, [todayStr]);

    const pb = payBreakdownRes.rows[0];
    const totalPay = parseFloat(pb?.total_sum || '0');
    const cashPay = parseFloat(pb?.cash_sum || '0');
    const cardPay = parseFloat(pb?.card_sum || '0');
    const onlinePay = parseFloat(pb?.online_sum || '0');

    const stats = statsRes.rows[0];
    const todayTicketsCount = parseInt(stats?.total_today || '0', 10);
    const waitingCount = parseInt(stats?.waiting_count || '0', 10);
    const inConsultationCount = parseInt(stats?.in_progress_count || '0', 10);
    const completedCount = parseInt(stats?.completed_count || '0', 10);
    const cancelledCount = parseInt(stats?.cancelled_count || '0', 10);

    return {
      todayTicketsCount,
      todayPatients: todayTicketsCount,
      waitingCount,
      inConsultationCount,
      completedCount,
      cancelledCount,
      totalRevenue: totalPay,
      hourlyTraffic,
      paymentBreakdown: {
        total: totalPay,
        cash: cashPay,
        card: cardPay,
        online: onlinePay,
        cashPercent: totalPay > 0 ? Math.round((cashPay / totalPay) * 100) : 0,
        cardPercent: totalPay > 0 ? Math.round((cardPay / totalPay) * 100) : 0,
        onlinePercent: totalPay > 0 ? Math.round((onlinePay / totalPay) * 100) : 0
      },
      doctorsLoad: doctorsLoadRes.rows
    };
  }

  // --- DOCTOR CRUD ---
  public async createDoctor(data: {
    displayName: string;
    specialtyId: string;
    cabinetNumber: string;
    phone?: string;
    address?: string;
    username?: string;
    login?: string;
    password?: string;
  }) {
    const id = `doc_${Date.now()}`;
    let cabinetId: string | null = null;
    if (data.cabinetNumber) {
      const cabRes = await this.query('SELECT id FROM cabinets WHERE number = $1', [data.cabinetNumber]);
      if (cabRes.rows.length > 0) {
        cabinetId = cabRes.rows[0].id;
      } else {
        const cabId = `cab_${data.cabinetNumber.replace(/\s+/g, '_')}`;
        const floor = Math.max(1, parseInt(data.cabinetNumber) >= 10 ? Math.floor(parseInt(data.cabinetNumber) / 10) : 1);
        await this.query(`
          INSERT INTO cabinets (id, number, name, department, floor, is_active)
          VALUES ($1, $2, $3, $4, $5, true)
          ON CONFLICT (number) DO NOTHING
        `, [cabId, data.cabinetNumber, `${data.cabinetNumber}-kabinet`, 'Ambulatoriya', floor]);
        cabinetId = cabId;
      }
    }

    // 1. Determine username
    let rawUsername = (data.username || data.login || '').trim().toLowerCase();
    if (!rawUsername) {
      const cleanName = data.displayName.toLowerCase().replace(/dr\.?\s*/i, '').replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
      rawUsername = `doc_${cleanName.slice(0, 15)}_${Date.now().toString().slice(-4)}`;
    }

    // Check unique username in users table
    let username = rawUsername;
    const existingUser = await this.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      username = `${rawUsername}_${Math.floor(100 + Math.random() * 900)}`;
    }

    // 2. Hash password (default: doctor123)
    const rawPassword = (data.password && data.password.trim()) ? data.password.trim() : 'doctor123';
    const passwordHash = bcrypt.hashSync(rawPassword, 10);

    // 3. Create user record in users table
    const userId = `usr_${id}`;
    await this.query(`
      INSERT INTO users (id, full_name, username, password_hash, role_id, phone, is_active)
      VALUES ($1, $2, $3, $4, 'role_doctor', $5, true)
    `, [userId, data.displayName, username, passwordHash, data.phone || null]);

    // 4. Create doctor record linked to user_id
    const res = await this.query(`
      INSERT INTO doctors (id, user_id, specialty_id, cabinet_id, display_name, room_number, phone, address, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING *
    `, [id, userId, data.specialtyId, cabinetId, data.displayName, data.cabinetNumber, data.phone || '+998 90 000 00 00', data.address || null]);

    return {
      ...res.rows[0],
      login: username,
      username
    };
  }

  public async updateDoctor(id: string, data: {
    displayName?: string;
    specialtyId?: string;
    cabinetNumber?: string;
    phone?: string;
    address?: string;
    isActive?: boolean;
    username?: string;
    login?: string;
    password?: string;
  }) {
    let cabinetId: string | null = null;
    if (data.cabinetNumber) {
      const cabRes = await this.query('SELECT id FROM cabinets WHERE number = $1', [data.cabinetNumber]);
      if (cabRes.rows.length > 0) {
        cabinetId = cabRes.rows[0].id;
      } else {
        const cabId = `cab_${data.cabinetNumber.replace(/\s+/g, '_')}`;
        const floor = Math.max(1, parseInt(data.cabinetNumber) >= 10 ? Math.floor(parseInt(data.cabinetNumber) / 10) : 1);
        await this.query(`
          INSERT INTO cabinets (id, number, name, department, floor, is_active)
          VALUES ($1, $2, $3, $4, $5, true)
          ON CONFLICT (number) DO NOTHING
        `, [cabId, data.cabinetNumber, `${data.cabinetNumber}-kabinet`, 'Ambulatoriya', floor]);
        cabinetId = cabId;
      }
    }

    // Check doctor's current user_id
    const currentDoc = await this.query('SELECT user_id, display_name, phone FROM doctors WHERE id = $1', [id]);
    const docRow = currentDoc.rows[0];

    let userId = docRow?.user_id;
    if (!userId) {
      // Create user if missing
      userId = `usr_${id}`;
      let username = (data.username || data.login || '').trim().toLowerCase();
      if (!username) {
        const cleanName = (data.displayName || docRow?.display_name || 'doctor').toLowerCase().replace(/dr\.?\s*/i, '').replace(/[^a-z0-9]/gi, '_');
        username = `doc_${cleanName.slice(0, 15)}_${Date.now().toString().slice(-4)}`;
      }
      const rawPassword = (data.password && data.password.trim()) ? data.password.trim() : 'doctor123';
      const passwordHash = bcrypt.hashSync(rawPassword, 10);

      await this.query(`
        INSERT INTO users (id, full_name, username, password_hash, role_id, phone, is_active)
        VALUES ($1, $2, $3, $4, 'role_doctor', $5, true)
        ON CONFLICT (username) DO UPDATE 
        SET full_name = EXCLUDED.full_name, password_hash = EXCLUDED.password_hash, phone = EXCLUDED.phone
      `, [userId, data.displayName || docRow?.display_name, username, passwordHash, data.phone || docRow?.phone]);
    } else {
      // Update existing user
      let userUpdateSql = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
      const userParams: any[] = [];
      let pIdx = 1;

      if (data.displayName) {
        userUpdateSql += `, full_name = $${pIdx++}`;
        userParams.push(data.displayName);
      }
      if (data.phone) {
        userUpdateSql += `, phone = $${pIdx++}`;
        userParams.push(data.phone);
      }
      if (data.username || data.login) {
        const u = (data.username || data.login)!.trim().toLowerCase();
        userUpdateSql += `, username = $${pIdx++}`;
        userParams.push(u);
      }
      if (data.password && data.password.trim()) {
        const pHash = bcrypt.hashSync(data.password.trim(), 10);
        userUpdateSql += `, password_hash = $${pIdx++}`;
        userParams.push(pHash);
      }
      if (data.isActive !== undefined) {
        userUpdateSql += `, is_active = $${pIdx++}`;
        userParams.push(data.isActive);
      }
      userUpdateSql += ` WHERE id = $${pIdx++}`;
      userParams.push(userId);

      await this.query(userUpdateSql, userParams);
    }

    const res = await this.query(`
      UPDATE doctors
      SET display_name = COALESCE($1, display_name),
          specialty_id = COALESCE($2, specialty_id),
          room_number = COALESCE($3, room_number),
          cabinet_id = COALESCE($4, cabinet_id),
          phone = COALESCE($5, phone),
          address = COALESCE($6, address),
          is_active = COALESCE($7, is_active),
          user_id = COALESCE($8, user_id),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `, [data.displayName, data.specialtyId, data.cabinetNumber, cabinetId, data.phone, data.address, data.isActive, userId, id]);

    return res.rows[0];
  }

  public async deleteDoctor(id: string) {
    await this.query('DELETE FROM doctors WHERE id = $1', [id]);
    return { success: true };
  }

  // --- SERVICE CRUD ---
  public async createService(data: { name: string; specialtyId?: string; price: number; paymentPolicy: string }) {
    const id = `srv_${Date.now()}`;
    const policy = (data.paymentPolicy === 'PAY_AFTER_SERVICE' || data.paymentPolicy === 'TICKET_BEFORE_PAYMENT')
      ? 'TICKET_BEFORE_PAYMENT'
      : 'PAY_BEFORE_TICKET';
    const res = await this.query(`
      INSERT INTO services (id, specialty_id, name, price, payment_policy, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *
    `, [id, data.specialtyId || 'spec_kardio', data.name, data.price || 0, policy]);
    return res.rows[0];
  }

  public async updateService(id: string, data: { 
    name?: string; 
    specialtyId?: string; 
    price?: number; 
    paymentPolicy?: string;
    durationMinutes?: number;
    minimumPaymentAmount?: number;
  }) {
    const policy = data.paymentPolicy
      ? ((data.paymentPolicy === 'PAY_AFTER_SERVICE' || data.paymentPolicy === 'TICKET_BEFORE_PAYMENT') ? 'TICKET_BEFORE_PAYMENT' : 'PAY_BEFORE_TICKET')
      : null;
    const res = await this.query(`
      UPDATE services
      SET name = COALESCE($1, name),
          specialty_id = COALESCE($2, specialty_id),
          price = COALESCE($3, price),
          payment_policy = COALESCE($4, payment_policy),
          duration_minutes = COALESCE($5, duration_minutes),
          minimum_payment_amount = COALESCE($6, minimum_payment_amount),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [data.name, data.specialtyId, data.price, policy, data.durationMinutes, data.minimumPaymentAmount, id]);
    return res.rows[0];
  }

  public async deleteService(id: string) {
    return this.withTransaction(async (client) => {
      await client.query('UPDATE queue_tickets SET service_id = NULL WHERE service_id = $1', [id]);
      await client.query('UPDATE appointments SET service_id = NULL WHERE service_id = $1', [id]);
      await client.query('DELETE FROM services WHERE id = $1', [id]);
      return { success: true };
    });
  }

  // --- CABINET CRUD ---
  public async createCabinet(data: { roomNumber?: string; number?: string; name: string; floor?: number; department?: string }) {
    const id = `cab_${Date.now()}`;
    const num = data.roomNumber || data.number || String(Date.now()).slice(-3);
    const dept = data.department || 'Ambulatoriya';
    const res = await this.query(`
      INSERT INTO cabinets (id, number, name, department, floor, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *
    `, [id, num, data.name, dept, data.floor || 1]);
    return res.rows[0];
  }

  public async updateCabinet(id: string, data: { roomNumber?: string; number?: string; name?: string; floor?: number; department?: string }) {
    const num = data.roomNumber || data.number;
    const res = await this.query(`
      UPDATE cabinets
      SET number = COALESCE($1, number),
          name = COALESCE($2, name),
          floor = COALESCE($3, floor),
          department = COALESCE($4, department)
      WHERE id = $5
      RETURNING *
    `, [num, data.name, data.floor, data.department, id]);
    return res.rows[0];
  }

  public async deleteCabinet(id: string) {
    return this.withTransaction(async (client) => {
      await client.query('UPDATE doctors SET cabinet_id = NULL WHERE cabinet_id = $1', [id]);
      await client.query('UPDATE appointments SET cabinet_id = NULL WHERE cabinet_id = $1', [id]);
      await client.query('UPDATE queue_tickets SET cabinet_id = NULL WHERE cabinet_id = $1', [id]);
      await client.query('DELETE FROM cabinets WHERE id = $1', [id]);
      return { success: true };
    });
  }

  // --- PATIENT CRUD ---
  public async updatePatient(id: string, data: { fullName?: string; phone?: string; birthDate?: string; gender?: string; address?: string; notes?: string }) {
    const res = await this.query(`
      UPDATE patients
      SET full_name = COALESCE($1, full_name),
          phone = COALESCE($2, phone),
          birth_date = COALESCE($3, birth_date),
          gender = COALESCE($4, gender),
          address = COALESCE($5, address),
          notes = COALESCE($6, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [data.fullName, data.phone, data.birthDate, data.gender, data.address, data.notes, id]);
    return res.rows[0];
  }

  public async deletePatient(id: string) {
    await this.query('DELETE FROM patients WHERE id = $1', [id]);
    return { success: true };
  }

  // --- SETTINGS CRUD ---
  public async updateSettings(data: any) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const mapping: Record<string, string> = {
      clinicName: 'clinic_name',
      clinic_name: 'clinic_name',
      slogan: 'slogan',
      phone: 'phone',
      email: 'email',
      address: 'address',
      workStartTime: 'work_start_time',
      work_start_time: 'work_start_time',
      workEndTime: 'work_end_time',
      work_end_time: 'work_end_time',
      workDays: 'work_days',
      work_days: 'work_days',
      websiteUrl: 'website_url',
      website_url: 'website_url',
      defaultPaymentPolicy: 'default_payment_policy',
      default_payment_policy: 'default_payment_policy',
      defaultQueuePrefix: 'default_queue_prefix',
      default_queue_prefix: 'default_queue_prefix',
      autoCallNext: 'auto_call_next',
      auto_call_next: 'auto_call_next',
      ticketAutoCancelMinutes: 'ticket_auto_cancel_minutes',
      ticket_auto_cancel_minutes: 'ticket_auto_cancel_minutes',
      maxDailyTicketsPerDoctor: 'max_daily_tickets_per_doctor',
      max_daily_tickets_per_doctor: 'max_daily_tickets_per_doctor',
      emergencyPriority: 'emergency_priority',
      emergency_priority: 'emergency_priority',
      currency: 'currency',
      vatPercent: 'vat_percent',
      vat_percent: 'vat_percent',
      cashierAutoCloseShift: 'cashier_auto_close_shift',
      cashier_auto_close_shift: 'cashier_auto_close_shift',
      soundNotification: 'sound_notification',
      sound_notification: 'sound_notification',
      recallLimit: 'recall_limit',
      recall_limit: 'recall_limit',
      voiceLanguage: 'voice_language',
      voice_language: 'voice_language',
      tvVoiceTemplate: 'tv_voice_template',
      tv_voice_template: 'tv_voice_template',
      tvVoiceName: 'tv_voice_name',
      tv_voice_name: 'tv_voice_name',
      tvSloganTitle: 'tv_slogan_title',
      tv_slogan_title: 'tv_slogan_title',
      tvSloganSubtitle: 'tv_slogan_subtitle',
      tv_slogan_subtitle: 'tv_slogan_subtitle',
      tvCallingTitle: 'tv_calling_title',
      tv_calling_title: 'tv_calling_title',
      tvStandbyTitle: 'tv_standby_title',
      tv_standby_title: 'tv_standby_title',
      tvStandbyFooter: 'tv_standby_footer',
      tv_standby_footer: 'tv_standby_footer',
      tvBottomBanner: 'tv_bottom_banner',
      tv_bottom_banner: 'tv_bottom_banner',
      tvInstruction1: 'tv_instruction_1',
      tv_instruction_1: 'tv_instruction_1',
      tvInstruction2: 'tv_instruction_2',
      tv_instruction_2: 'tv_instruction_2',
      tvInstruction3: 'tv_instruction_3',
      tv_instruction_3: 'tv_instruction_3',
    };

    const seenCols = new Set<string>();
    for (const [key, col] of Object.entries(mapping)) {
      if (data[key] !== undefined && !seenCols.has(col)) {
        fields.push(`${col} = $${idx++}`);
        values.push(data[key]);
        seenCols.add(col);
      }
    }

    if (fields.length === 0) {
      const res = await this.query(`SELECT * FROM clinic_settings WHERE id = 'default'`);
      return res.rows[0];
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    const sql = `
      UPDATE clinic_settings
      SET ${fields.join(', ')}
      WHERE id = 'default'
      RETURNING *
    `;
    const res = await this.query(sql, values);
    try {
      const auditId = 'audit_' + Date.now().toString(36);
      await this.query(`
        INSERT INTO audit_logs (id, actor_name, action, entity_type, entity_id, metadata, ip_address)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        auditId,
        'Menejer (Boshqaruv)',
        'SOZLAMALAR_YANGILANDI',
        'CLINIC_SETTINGS',
        'default',
        JSON.stringify({ updated_fields: Object.keys(data), clinic_name: res.rows[0]?.clinic_name }),
        '127.0.0.1'
      ]);
    } catch (e) {
      // Ignore if audit insert fails
    }
    return res.rows[0];
  }

  // --- USERS CRUD ---
  public async getUsers() {
    const res = await this.query(`
      SELECT u.id, u.full_name, u.username, u.role_id, r.name as role_name, r.code as role_code, u.phone, u.is_active, u.created_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `);
    return res.rows;
  }

  public async createUser(data: { fullName: string; username: string; password?: string; roleCode: string; phone?: string }) {
    const id = `usr_${Date.now()}`;
    const roleId = data.roleCode === 'MANAGER' ? 'role_manager' : (data.roleCode === 'DOCTOR' ? 'role_doctor' : 'role_cashier');
    const pwd = data.password || 'sadaf123';
    const res = await this.query(`
      INSERT INTO users (id, full_name, username, password_hash, role_id, phone, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING id, full_name, username, role_id, phone, is_active, created_at
    `, [id, data.fullName, data.username, pwd, roleId, data.phone || '+998 90 000 00 00']);
    return res.rows[0];
  }

  public async updateUser(id: string, data: { fullName?: string; username?: string; password?: string; roleCode?: string; phone?: string; isActive?: boolean }) {
    const roleId = data.roleCode ? (data.roleCode === 'MANAGER' ? 'role_manager' : (data.roleCode === 'DOCTOR' ? 'role_doctor' : 'role_cashier')) : null;
    const res = await this.query(`
      UPDATE users
      SET full_name = COALESCE($1, full_name),
          username = COALESCE($2, username),
          password_hash = COALESCE($3, password_hash),
          role_id = COALESCE($4, role_id),
          phone = COALESCE($5, phone),
          is_active = COALESCE($6, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, full_name, username, role_id, phone, is_active, updated_at
    `, [data.fullName, data.username, data.password, roleId, data.phone, data.isActive, id]);
    return res.rows[0];
  }

  public async deleteUser(id: string) {
    await this.query('DELETE FROM users WHERE id = $1', [id]);
    return { success: true };
  }

  public async getAllShifts() {
    const res = await this.query(`
      SELECT * FROM cash_shifts ORDER BY opened_at DESC LIMIT 50
    `);
    return res.rows;
  }

  public async getShiftDetails(shiftId: string) {
    const shiftRes = await this.query(`SELECT * FROM cash_shifts WHERE id = $1`, [shiftId]);
    const shift = shiftRes.rows[0];
    if (!shift) throw new Error('Smena topilmadi');

    const paymentsRes = await this.query(`
      SELECT 
        p.id,
        p.receipt_number,
        p.patient_id,
        COALESCE(pt.full_name, 'Noma''lum bemor') as patient_name,
        COALESCE(pt.phone, '') as patient_phone,
        p.amount,
        p.method,
        p.status,
        p.notes,
        p.created_at
      FROM payments p
      LEFT JOIN patients pt ON p.patient_id = pt.id
      WHERE p.cash_shift_id = $1
      ORDER BY p.created_at DESC
    `, [shift.id]);

    const payments = paymentsRes.rows;

    let cashTotal = 0;
    let cardTotal = 0;
    let otherTotal = 0;
    let totalPaymentsAmount = 0;

    for (const p of payments) {
      const amt = Number(p.amount) || 0;
      totalPaymentsAmount += amt;
      if (p.method === 'CASH') {
        cashTotal += amt;
      } else if (p.method === 'CARD') {
        cardTotal += amt;
      } else {
        otherTotal += amt;
      }
    }

    const docRes = await this.query(`
      SELECT 
        qt.doctor_name,
        qt.specialty_name,
        COUNT(qt.id)::int as ticket_count,
        COALESCE(SUM(s.price), 0)::numeric as total_doctor_amount
      FROM queue_tickets qt
      LEFT JOIN services s ON qt.service_id = s.id
      WHERE qt.created_at >= $1 AND qt.created_at <= COALESCE($2, CURRENT_TIMESTAMP)
      GROUP BY qt.doctor_name, qt.specialty_name
      ORDER BY total_doctor_amount DESC
    `, [shift.opened_at, shift.closed_at]);

    return {
      shift,
      summary: {
        totalReceived: Number(shift.total_received) || totalPaymentsAmount,
        cashTotal,
        cardTotal,
        otherTotal,
        paymentsCount: payments.length,
        openingBalance: Number(shift.opening_balance) || 0,
        closingBalance: Number(shift.closing_balance) || 0
      },
      doctorBreakdown: docRes.rows.map((r: any) => ({
        doctorName: r.doctor_name,
        specialtyName: r.specialty_name,
        ticketCount: Number(r.ticket_count) || 0,
        totalAmount: Number(r.total_doctor_amount) || 0
      })),
      payments
    };
  }

  public async getDoctorPerformance(doctorId: string) {
    const docRes = await this.query(`
      SELECT d.*, s.name as specialty_name,
             COALESCE(c.number, d.room_number) as cabinet_number
      FROM doctors d
      LEFT JOIN specialties s ON d.specialty_id = s.id
      LEFT JOIN cabinets c ON (d.cabinet_id = c.id OR d.room_number = c.number)
      WHERE d.id = $1
    `, [doctorId]);
    const doctor = docRes.rows[0];
    if (!doctor) throw new Error('Shifokor topilmadi');

    const statsRes = await this.query(`
      SELECT
        COUNT(t.id) FILTER (WHERE t.status = 'WAITING')::int as waiting,
        COUNT(t.id) FILTER (WHERE t.status = 'IN_PROGRESS' OR t.status = 'CALLED')::int as in_progress,
        COUNT(t.id) FILTER (WHERE t.status = 'COMPLETED')::int as completed,
        COUNT(t.id)::int as total_tickets,
        COALESCE(SUM(srv.price) FILTER (WHERE t.payment_status = 'PAID' OR t.status = 'COMPLETED'), 0)::numeric as total_revenue
      FROM queue_tickets t
      LEFT JOIN services srv ON t.service_id = srv.id
      WHERE t.doctor_id = $1
    `, [doctorId]);
    const stats = statsRes.rows[0];

    const ticketsRes = await this.query(`
      SELECT t.id, t.full_number, t.patient_name, t.patient_phone, t.status,
             t.payment_status, t.issued_at, t.called_at, t.completed_at,
             COALESCE(srv.price, 0) as price, srv.name as service_name
      FROM queue_tickets t
      LEFT JOIN services srv ON t.service_id = srv.id
      WHERE t.doctor_id = $1
      ORDER BY t.created_at DESC
      LIMIT 50
    `, [doctorId]);

    return {
      doctor,
      stats: {
        waiting: Number(stats?.waiting || 0),
        inProgress: Number(stats?.in_progress || 0),
        completed: Number(stats?.completed || 0),
        totalTickets: Number(stats?.total_tickets || 0),
        totalRevenue: Number(stats?.total_revenue || 0)
      },
      tickets: ticketsRes.rows
    };
  }

  // --- AUDIT LOGS ---
  public async getAuditLogs(limit: number = 200) {
    const sql = `
      SELECT
        qce.id,
        'QUEUE_CALL' as log_type,
        qce.event_type as action,
        qce.event_at as timestamp,
        COALESCE(u.full_name, d.display_name, 'Tizim') as actor_name,
        COALESCE(r.name, 'Shifokor') as actor_role,
        qt.full_number as object_reference,
        p.full_name as patient_name,
        p.phone as patient_phone,
        d.display_name as doctor_name,
        d.room_number,
        s.name as specialty_name,
        NULL::numeric as amount,
        NULL as payment_method,
        qt.status as status,
        to_jsonb(json_build_object(
          'ticket_id', qt.id,
          'ticket_number', qt.full_number,
          'event_type', qce.event_type,
          'doctor_name', d.display_name,
          'room_number', d.room_number,
          'patient_name', p.full_name,
          'patient_phone', p.phone,
          'specialty', s.name,
          'raw_metadata', qce.metadata
        )) as details
      FROM queue_call_events qce
      LEFT JOIN queue_tickets qt ON qt.id = qce.ticket_id
      LEFT JOIN patients p ON p.id = qt.patient_id
      LEFT JOIN doctors d ON d.id = qce.doctor_id
      LEFT JOIN specialties s ON s.id = d.specialty_id
      LEFT JOIN users u ON u.id = qce.performed_by OR u.id = d.user_id
      LEFT JOIN roles r ON r.id = u.role_id

      UNION ALL

      SELECT
        p.id,
        'PAYMENT' as log_type,
        'KASSA_TO''LOVI' as action,
        p.created_at as timestamp,
        COALESCE(u.full_name, p.cashier_id, 'Kassir') as actor_name,
        'Kassir' as actor_role,
        p.receipt_number as object_reference,
        pat.full_name as patient_name,
        pat.phone as patient_phone,
        NULL as doctor_name,
        NULL as room_number,
        NULL as specialty_name,
        p.amount,
        p.method as payment_method,
        p.status as status,
        to_jsonb(json_build_object(
          'receipt_number', p.receipt_number,
          'amount', p.amount,
          'currency', p.currency,
          'method', p.method,
          'status', p.status,
          'patient_name', pat.full_name,
          'patient_phone', pat.phone,
          'cashier_name', COALESCE(u.full_name, 'Kassir'),
          'notes', p.notes
        )) as details
      FROM payments p
      LEFT JOIN users u ON u.id = p.cashier_id
      LEFT JOIN patients pat ON pat.id = p.patient_id

      UNION ALL

      SELECT
        cs.id,
        'SHIFT' as log_type,
        CASE WHEN cs.status = 'CLOSED' THEN 'SMENA_YOPILDI' ELSE 'SMENA_OCHILDI' END as action,
        COALESCE(cs.closed_at, cs.opened_at) as timestamp,
        cs.cashier_name as actor_name,
        'Kassir' as actor_role,
        cs.id as object_reference,
        NULL as patient_name,
        NULL as patient_phone,
        NULL as doctor_name,
        NULL as room_number,
        NULL as specialty_name,
        COALESCE(cs.total_received, 0) as amount,
        NULL as payment_method,
        cs.status as status,
        to_jsonb(json_build_object(
          'shift_id', cs.id,
          'cashier_name', cs.cashier_name,
          'opened_at', cs.opened_at,
          'closed_at', cs.closed_at,
          'opening_balance', cs.opening_balance,
          'closing_balance', cs.closing_balance,
          'total_received', cs.total_received,
          'status', cs.status,
          'notes', cs.notes
        )) as details
      FROM cash_shifts cs

      UNION ALL

      SELECT
        al.id,
        'SYSTEM' as log_type,
        al.action,
        al.created_at as timestamp,
        COALESCE(al.actor_name, 'Menejer') as actor_name,
        'Administrator' as actor_role,
        al.entity_id as object_reference,
        NULL as patient_name,
        NULL as patient_phone,
        NULL as doctor_name,
        NULL as room_number,
        NULL as specialty_name,
        NULL::numeric as amount,
        NULL as payment_method,
        'SUCCESS' as status,
        COALESCE(al.metadata, '{}'::jsonb) as details
      FROM audit_logs al

      ORDER BY timestamp DESC
      LIMIT $1
    `;
    const res = await this.query(sql, [limit]);
    return res.rows;
  }

  // --- SUPER ADMIN: PLANS & SUBSCRIPTIONS ---
  public async getPlans() {
    const res = await this.query(`SELECT * FROM plans WHERE is_active = true ORDER BY price ASC`);
    return res.rows;
  }

  public async getSubscriptions() {
    const res = await this.query(`
      SELECT cs.*, p.name as plan_name, p.price as plan_price, p.billing_cycle, p.features,
             (cs.end_date - CURRENT_DATE)::int as days_remaining
      FROM clinic_subscriptions cs
      JOIN plans p ON cs.plan_code = p.code
      ORDER BY cs.created_at DESC
    `);
    return res.rows;
  }

  public async extendSubscription(id: string, months: number) {
    const res = await this.query(`
      UPDATE clinic_subscriptions
      SET end_date = GREATEST(end_date, CURRENT_DATE) + ($1 || ' months')::interval,
          status = 'ACTIVE',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [months, id]);
    return res.rows[0];
  }

  public async updateSubscriptionStatus(id: string, status: string) {
    const res = await this.query(`
      UPDATE clinic_subscriptions
      SET status = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [status, id]);
    return res.rows[0];
  }

  public async changeSubscriptionPlan(id: string, planCode: string) {
    const planRes = await this.query(`SELECT * FROM plans WHERE code = $1`, [planCode]);
    const plan = planRes.rows[0];
    if (!plan) throw new Error('Bunday tarif topilmadi.');

    const res = await this.query(`
      UPDATE clinic_subscriptions
      SET plan_code = $1,
          price_paid = price_paid + $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [planCode, plan.price, id]);
    return res.rows[0];
  }

  // --- SUPER ADMIN: SMS MANAGEMENT ---
  public async getSmsSettings() {
    const res = await this.query(`SELECT * FROM sms_settings LIMIT 1`);
    return res.rows[0];
  }

  public async updateSmsSettings(data: {
    provider?: string;
    apiUrl?: string;
    email?: string;
    apiToken?: string;
    senderName?: string;
    balance?: number;
    isActive?: boolean;
  }) {
    const res = await this.query(`
      UPDATE sms_settings
      SET provider = COALESCE($1, provider),
          api_url = COALESCE($2, api_url),
          email = COALESCE($3, email),
          api_token = COALESCE($4, api_token),
          sender_name = COALESCE($5, sender_name),
          balance = COALESCE($6, balance),
          is_active = COALESCE($7, is_active),
          updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [data.provider, data.apiUrl, data.email, data.apiToken, data.senderName, data.balance, data.isActive]);
    return res.rows[0];
  }

  public async getSmsTemplates() {
    const res = await this.query(`SELECT * FROM sms_templates ORDER BY id ASC`);
    return res.rows;
  }

  public async updateSmsTemplate(eventType: string, data: { templateText?: string; isEnabled?: boolean }) {
    const res = await this.query(`
      UPDATE sms_templates
      SET template_text = COALESCE($1, template_text),
          is_enabled = COALESCE($2, is_enabled),
          updated_at = CURRENT_TIMESTAMP
      WHERE event_type = $3
      RETURNING *
    `, [data.templateText, data.isEnabled, eventType]);
    return res.rows[0];
  }

  public async getSmsLogs(limit = 100) {
    const res = await this.query(`SELECT * FROM sms_logs ORDER BY sent_at DESC LIMIT $1`, [limit]);
    return res.rows;
  }

  public async logSms(phone: string, message: string, clinicName = 'Sadaf Klinika', status = 'DELIVERED', response = 'OK') {
    const id = `sms_${uuidv4().substring(0, 8)}`;
    const res = await this.query(`
      INSERT INTO sms_logs (id, phone, message, clinic_name, status, provider_response)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [id, phone, message, clinicName, status, response]);
    await this.query(`UPDATE sms_settings SET balance = GREATEST(0, balance - 1)`);
    return res.rows[0];
  }

  // ==================== SUPER ADMIN GLOBAL REPOSITORIES ====================
  public async getSuperAdminUsers() {
    const res = await this.query(`
      SELECT u.id, u.full_name as name, u.username as email, u.phone,
             COALESCE(r.code, 'ADMIN') as role, u.is_active, u.created_at,
             'SADAF Markaziy Klinika' as clinic_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `);
    return res.rows;
  }

  public async createSuperAdminUser(data: { name: string; email?: string; phone?: string; role: string; clinicName?: string }) {
    const id = `usr_${uuidv4().substring(0, 8)}`;
    const username = data.email || `user_${Date.now()}`;
    const roleRes = await this.query(`SELECT id FROM roles WHERE code = $1 LIMIT 1`, [data.role]);
    const roleId = roleRes.rows[0]?.id || 'role_manager';
    const res = await this.query(`
      INSERT INTO users (id, full_name, username, password_hash, role_id, phone, is_active, created_at)
      VALUES ($1, $2, $3, 'hash_default_secret', $4, $5, true, CURRENT_TIMESTAMP)
      RETURNING id, full_name as name, username as email, phone, is_active, created_at
    `, [id, data.name, username, roleId, data.phone || null]);
    return { ...res.rows[0], role: data.role, clinic_name: data.clinicName || 'SADAF Markaziy Klinika' };
  }

  public async toggleUserStatus(id: string, isActive: boolean) {
    const res = await this.query(`
      UPDATE users SET is_active = $1 WHERE id = $2 RETURNING *
    `, [isActive, id]);
    return res.rows[0];
  }

  public async getSuperAdminBranches() {
    const res = await this.query(`SELECT * FROM branches ORDER BY created_at ASC`);
    return res.rows;
  }

  public async createSuperAdminBranch(data: { name: string; code: string; clinicName: string; address?: string; phone?: string; doctorCount?: number }) {
    const id = `br_${uuidv4().substring(0, 8)}`;
    const res = await this.query(`
      INSERT INTO branches (id, name, code, clinic_name, address, phone, doctor_count, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 0), true)
      RETURNING *
    `, [id, data.name, data.code, data.clinicName, data.address || null, data.phone || null, data.doctorCount]);
    return res.rows[0];
  }

  public async getSuperAdminSupportTickets() {
    const res = await this.query(`SELECT * FROM support_tickets ORDER BY created_at DESC`);
    return res.rows;
  }

  public async createSupportTicket(data: { clinicName: string; contactName: string; contactPhone?: string; subject: string; message: string; priority?: string }) {
    const id = `sup_${uuidv4().substring(0, 8)}`;
    const res = await this.query(`
      INSERT INTO support_tickets (id, clinic_name, contact_name, contact_phone, subject, message, priority, status)
      VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'MEDIUM'), 'OPEN')
      RETURNING *
    `, [id, data.clinicName, data.contactName, data.contactPhone || null, data.subject, data.message, data.priority]);
    return res.rows[0];
  }

  public async replySupportTicket(id: string, reply: string, status = 'RESOLVED') {
    const res = await this.query(`
      UPDATE support_tickets
      SET reply = $1, status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [reply, status, id]);
    return res.rows[0];
  }

  public async getSuperAdminPromoCodes() {
    const res = await this.query(`SELECT * FROM promo_codes ORDER BY created_at DESC`);
    return res.rows;
  }

  public async createPromoCode(data: { code: string; discountPercent: number; validUntil: string; maxUsage?: number }) {
    const id = `prm_${uuidv4().substring(0, 8)}`;
    const res = await this.query(`
      INSERT INTO promo_codes (id, code, discount_percent, valid_until, max_usage, is_active)
      VALUES ($1, UPPER($2), $3, $4, COALESCE($5, 100), true)
      RETURNING *
    `, [id, data.code, data.discountPercent, data.validUntil, data.maxUsage]);
    return res.rows[0];
  }

  public async togglePromoCode(id: string, isActive: boolean) {
    const res = await this.query(`
      UPDATE promo_codes SET is_active = $1 WHERE id = $2 RETURNING *
    `, [isActive, id]);
    return res.rows[0];
  }

  public async getSuperAdminApiKeys() {
    const res = await this.query(`SELECT * FROM api_keys ORDER BY created_at DESC`);
    return res.rows;
  }

  public async createApiKey(data: { clinicName: string; permissions?: string }) {
    const id = `key_${uuidv4().substring(0, 8)}`;
    const rawSecret = uuidv4().replace(/-/g, '');
    const prefix = `sdf_live_${rawSecret.substring(0, 6)}...`;
    const res = await this.query(`
      INSERT INTO api_keys (id, clinic_name, key_prefix, secret_hash, permissions, is_active)
      VALUES ($1, $2, $3, $4, COALESCE($5, 'READ,WRITE'), true)
      RETURNING *
    `, [id, data.clinicName, prefix, `hash_${rawSecret}`, data.permissions]);
    return res.rows[0];
  }

  public async deleteApiKey(id: string) {
    const res = await this.query(`DELETE FROM api_keys WHERE id = $1 RETURNING *`, [id]);
    return res.rows[0];
  }

  public async getSuperAdminSystemSettings() {
    const res = await this.query(`SELECT * FROM system_settings ORDER BY key ASC`);
    return res.rows;
  }

  public async updateSystemSetting(key: string, value: string) {
    const res = await this.query(`
      UPDATE system_settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = $2 RETURNING *
    `, [value, key]);
    return res.rows[0];
  }

  public async updatePlan(code: string, data: { name?: string; price?: number; billing_cycle?: string; features?: string[]; is_active?: boolean }) {
    const res = await this.query(`
      UPDATE plans
      SET name = COALESCE($1, name),
          price = COALESCE($2, price),
          billing_cycle = COALESCE($3, billing_cycle),
          features = COALESCE($4, features),
          is_active = COALESCE($5, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE code = $6
      RETURNING *
    `, [data.name, data.price, data.billing_cycle, data.features, data.is_active, code]);
    return res.rows[0];
  }

  public async getSuperAdminPayments(limit = 100) {
    const res = await this.query(`
      SELECT p.id, p.receipt_number, p.amount, p.currency, p.method, p.status, p.notes, p.created_at,
             pat.full_name as patient_name, pat.phone as patient_phone,
             COALESCE(u.full_name, 'Kassir') as cashier_name,
             'Sadaf Markaziy Klinika' as clinic_name
      FROM payments p
      LEFT JOIN patients pat ON p.patient_id = pat.id
      LEFT JOIN users u ON p.cashier_id = u.id
      ORDER BY p.created_at DESC
      LIMIT $1
    `, [limit]);
    return res.rows;
  }

  public async getSuperAdminReports() {
    const revRes = await this.query(`SELECT COALESCE(SUM(amount), 0) as total_revenue FROM payments`);
    const mrrRes = await this.query(`
      SELECT COALESCE(SUM(p.price), 0) as mrr
      FROM clinic_subscriptions cs
      JOIN plans p ON cs.plan_code = p.code
      WHERE cs.status = 'ACTIVE'
    `);
    const distRes = await this.query(`
      SELECT p.code, p.name, COUNT(cs.id)::int as count, COALESCE(SUM(p.price), 0)::numeric as total_revenue
      FROM plans p
      LEFT JOIN clinic_subscriptions cs ON cs.plan_code = p.code
      GROUP BY p.code, p.name
      ORDER BY total_revenue DESC
    `);
    const statusRes = await this.query(`
      SELECT status, COUNT(*)::int as count
      FROM clinic_subscriptions
      GROUP BY status
    `);
    const monthlyRevenue = [
      { month: 'Yanv', revenue: 12500000, clinics: 34 },
      { month: 'Fev', revenue: 18200000, clinics: 42 },
      { month: 'Mar', revenue: 26800000, clinics: 58 },
      { month: 'Apr', revenue: 34500000, clinics: 71 },
      { month: 'May', revenue: 42100000, clinics: 85 },
      { month: 'Iyun', revenue: 51000000, clinics: 98 },
      { month: 'Iyl', revenue: 58400000, clinics: 110 }
    ];

    const totalRevenue = parseFloat(revRes.rows[0]?.total_revenue || '0');
    const mrr = parseFloat(mrrRes.rows[0]?.mrr || '58400000');
    const arr = mrr * 12;

    return {
      totalRevenue,
      mrr,
      arr,
      planDistribution: distRes.rows,
      statusBreakdown: statusRes.rows,
      monthlyRevenue
    };
  }

  public async getSuperAdminSystemStatus() {
    const mem = process.memoryUsage();
    const uptimeSec = Math.floor(process.uptime());
    
    const startPing = Date.now();
    await this.query('SELECT 1');
    const dbLatencyMs = Date.now() - startPing;

    const counts = await this.query(`
      SELECT 
        (SELECT count(*) FROM users) as users_count,
        (SELECT count(*) FROM queue_tickets) as tickets_count,
        (SELECT count(*) FROM payments) as payments_count,
        (SELECT count(*) FROM doctors) as doctors_count,
        (SELECT count(*) FROM patients) as patients_count,
        (SELECT count(*) FROM clinic_subscriptions) as subscriptions_count,
        (SELECT count(*) FROM sms_logs) as sms_count
    `);

    return {
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds: uptimeSec,
        uptimeFormatted: `${Math.floor(uptimeSec / 3600)} soat ${Math.floor((uptimeSec % 3600) / 60)} daqiqa`,
        memoryUsageMb: Math.round(mem.rss / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024)
      },
      database: {
        status: 'CONNECTED',
        engine: 'PostgreSQL 16',
        host: 'localhost:5433',
        databaseName: 'sadaf_clinic_db',
        latencyMs: dbLatencyMs,
        counts: counts.rows[0]
      },
      services: [
        { name: 'Core HTTP API Server', port: 5001, status: 'ONLINE', latency: `${dbLatencyMs}ms` },
        { name: 'WebSocket Realtime Gateway', port: 5001, status: 'ONLINE', latency: '2ms' },
        { name: 'Azure Neural Uzbek TTS Engine', status: 'ONLINE', latency: '48ms' },
        { name: 'Eskiz SMS Gateway', status: 'CONNECTED', latency: '120ms' },
        { name: 'PostgreSQL Database Engine', port: 5433, status: 'ONLINE', latency: `${dbLatencyMs}ms` }
      ]
    };
  }
}


