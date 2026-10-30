import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../../database/database.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export class PatientsController {
  public static async getPatients(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant context required.' });
        return;
      }

      const query = (req.query.search as string || '').toLowerCase().trim();
      const db = DatabaseService.getInstance();
      let patients = db.getPatients(tenantId);

      if (query) {
        patients = patients.filter(p =>
          p.fullName.toLowerCase().includes(query) ||
          p.phone.replace(/[^0-9]/g, '').includes(query.replace(/[^0-9]/g, '')) ||
          p.patientNumber.includes(query)
        );
      }

      res.json({ success: true, data: patients });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async getPatientById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const tenantId = req.user?.tenantId;
      const db = DatabaseService.getInstance();

      // Check if patient exists globally to verify tenant isolation
      const allPatients = db.getPatients();
      const globalPatient = allPatients.find(p => p.id === id);

      if (globalPatient && globalPatient.tenantId !== tenantId) {
        // STRICT SECURITY REQUIREMENT: 403 Forbidden if accessing another clinic's patient
        res.status(403).json({
          success: false,
          code: 'TENANT_VIOLATION',
          message: 'Kirish taqiqlangan: Bu bemor boshqa klinikaga tegishli.'
        });
        return;
      }

      const patient = db.getPatientById(id, tenantId);
      if (!patient) {
        res.status(404).json({ success: false, message: 'Bemor topilmadi.' });
        return;
      }

      const visits = db.getVisits(tenantId).filter(v => v.patientId === id);
      const tickets = db.getQueueTickets(tenantId).filter(t => t.patientId === id);

      res.json({
        success: true,
        data: {
          patient,
          visits,
          tickets
        }
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async createPatient(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ success: false, message: 'Tenant context required.' });
        return;
      }

      const { fullName, phone, birthDate, gender, address, notes } = req.body;
      if (!fullName || !phone) {
        res.status(400).json({ success: false, message: 'Bemor ismi va telefon raqami kiritilishi shart.' });
        return;
      }

      const db = DatabaseService.getInstance();
      const patients = db.getPatients(tenantId);
      const nextNumber = String(1000 + patients.length + 1);

      const newPatient = {
        id: `pat_${uuidv4().substring(0, 8)}`,
        tenantId,
        patientNumber: nextNumber,
        fullName,
        phone,
        birthDate: birthDate || '',
        gender: gender || 'MALE',
        address: address || '',
        notes: notes || '',
        createdAt: new Date().toISOString()
      };

      db.addPatient(newPatient);

      res.status(201).json({
        success: true,
        message: 'Yangi bemor muvaffaqiyatli saqlandi.',
        data: newPatient
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }
}
