import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';
import { DatabaseService } from '../../database/database.service';
import { PostgresService } from '../../database/postgres.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { ClinicStatus, PlanCode, UserRole } from '../../types';

export class AuthController {
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const rawIdentifier = req.body.identifier || req.body.login || req.body.username || req.body.phone;
      const password = req.body.password;

      if (!rawIdentifier || !password) {
        res.status(400).json({ success: false, message: 'Telefon/Email va parol kiritilishi shart.' });
        return;
      }

      const identifier = String(rawIdentifier).trim();
      const cleanPhone = identifier.replace(/[\s\-\(\)\+]/g, '');
      const last9Digits = cleanPhone.length >= 9 ? cleanPhone.slice(-9) : cleanPhone;

      // 1. Check in PostgreSQL database
      const pg = PostgresService.getInstance();
      const pgUserRes = await pg.query(`
        SELECT u.*, r.code as role_code, 
               COALESCE(d.id, d_by_phone.id) as doctor_id, 
               COALESCE(d.room_number, d_by_phone.room_number) as room_number, 
               COALESCE(d.specialty_id, d_by_phone.specialty_id) as specialty_id, 
               COALESCE(s.name, s_by_phone.name) as specialty_name,
               cs.clinic_name as clinic_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN doctors d ON d.user_id = u.id
        LEFT JOIN specialties s ON d.specialty_id = s.id
        LEFT JOIN doctors d_by_phone ON (
          REGEXP_REPLACE(d_by_phone.phone, '[^0-9]', '', 'g') = $2
          OR RIGHT(REGEXP_REPLACE(d_by_phone.phone, '[^0-9]', '', 'g'), 9) = $3
        )
        LEFT JOIN specialties s_by_phone ON d_by_phone.specialty_id = s_by_phone.id
        LEFT JOIN clinic_settings cs ON (cs.clinic_id = u.clinic_id OR cs.id = u.clinic_id)
        WHERE u.username = $1 
           OR u.phone = $1 
           OR REGEXP_REPLACE(u.phone, '[^0-9]', '', 'g') = $2
           OR RIGHT(REGEXP_REPLACE(u.phone, '[^0-9]', '', 'g'), 9) = $3
        LIMIT 1
      `, [identifier, cleanPhone, last9Digits]);

      if (pgUserRes.rows.length > 0) {
        const pgUser = pgUserRes.rows[0];

        if (pgUser.is_active === false) {
          res.status(403).json({ success: false, message: 'Foydalanuvchi hisobi bloklangan. Menejerga murojaat qiling.' });
          return;
        }

        let isValid = false;
        if (pgUser.password_hash) {
          try {
            isValid = bcrypt.compareSync(password, pgUser.password_hash);
          } catch (_) {
            isValid = false;
          }
        }

        // Automatic secure migration: If legacy password was stored as plain text, migrate to bcrypt
        if (!isValid && pgUser.password_hash === password) {
          isValid = true;
          const newHash = bcrypt.hashSync(password, 10);
          pg.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, pgUser.id]).catch(() => {});
        }

        if (!isValid) {
          res.status(401).json({ success: false, message: 'Foydalanuvchi topilmadi yoki parol noto\'g\'ri.' });
          return;
        }

        const role = pgUser.role_code || 'MANAGER';
        const userTenantId = pgUser.clinic_id || 'tenant_sadaf_01';
        const userBranchId = pgUser.branch_id || 'branch_sadaf_main';
        
        // Clinic name from query or fallback
        let clinicName = pgUser.clinic_name || '';
        if (!clinicName) {
          try {
            const cRes = await pg.query('SELECT clinic_name FROM clinic_settings WHERE clinic_id = $1 OR id = $1 LIMIT 1', [userTenantId]);
            if (cRes.rows.length > 0 && cRes.rows[0].clinic_name) {
              clinicName = cRes.rows[0].clinic_name;
            } else if (userTenantId === 'tenant_sadaf_01') {
              clinicName = 'Sadaf Dental';
            } else {
              clinicName = 'Klinika';
            }
          } catch (e) {
            clinicName = userTenantId === 'tenant_sadaf_01' ? 'Sadaf Dental' : 'Klinika';
          }
        }

        const token = jwt.sign(
          {
            userId: pgUser.id,
            role,
            tenantId: userTenantId,
            branchId: userBranchId,
            doctorId: pgUser.doctor_id,
            fullName: pgUser.full_name
          },
          config.jwtSecret,
          { expiresIn: '24h' }
        );

        res.json({
          success: true,
          data: {
            token,
            user: {
              id: pgUser.id,
              fullName: pgUser.full_name,
              username: pgUser.username,
              phone: pgUser.phone,
              role,
              doctorId: pgUser.doctor_id,
              roomNumber: pgUser.room_number,
              specialtyName: pgUser.specialty_name,
              tenantId: userTenantId,
              branchId: userBranchId
            },
            clinic: {
              id: userTenantId,
              name: clinicName
            }
          }
        });
        return;
      }

      // 2. Fallback to in-memory DatabaseService
      const db = DatabaseService.getInstance();
      const user = db.getUserByEmailOrPhone(identifier);

      if (!user) {
        res.status(401).json({ success: false, message: 'Foydalanuvchi topilmadi yoki parol noto\'g\'ri.' });
        return;
      }

      const isValid = bcrypt.compareSync(password, user.passwordHash);
      if (!isValid) {
        res.status(401).json({ success: false, message: 'Foydalanuvchi topilmadi yoki parol noto\'g\'ri.' });
        return;
      }

      let clinic = null;
      let subscription = null;
      if (user.tenantId) {
        clinic = db.getClinicByTenant(user.tenantId);
        subscription = db.getSubscriptionByTenant(user.tenantId);
      }

      const token = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          tenantId: user.tenantId || null,
          branchId: user.branchId || null
        },
        config.jwtSecret,
        { expiresIn: '24h' }
      );

      // Audit log
      db.addAuditLog({
        id: uuidv4(),
        tenantId: user.tenantId,
        userId: user.id,
        userRole: user.role,
        userFullName: user.fullName,
        action: 'USER_LOGIN',
        entityType: 'AUTH',
        entityId: user.id,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Unknown',
        createdAt: new Date().toISOString()
      });

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            avatarUrl: user.avatarUrl,
            branchId: user.branchId,
            tenantId: user.tenantId
          },
          clinic: clinic ? {
            id: clinic.id,
            name: clinic.name,
            primaryColor: clinic.primaryColor,
            secondaryColor: clinic.secondaryColor,
            logoUrl: clinic.logoUrl,
            queuePrefix: clinic.queuePrefix
          } : null,
          subscription: subscription ? {
            planCode: subscription.planCode,
            status: subscription.status,
            endDate: subscription.endDate
          } : null
        }
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async registerClinic(req: Request, res: Response): Promise<void> {
    try {
      const {
        clinicName,
        ownerFullName,
        email,
        phone,
        password,
        address,
        planCode = PlanCode.STARTER
      } = req.body;

      if (!clinicName || !ownerFullName || !phone || !password) {
        res.status(400).json({ success: false, message: 'Barcha majburiy maydonlarni to\'ldiring.' });
        return;
      }

      const db = DatabaseService.getInstance();
      const existingUser = db.getUserByEmailOrPhone(email || phone);
      if (existingUser) {
        res.status(400).json({ success: false, message: 'Ushbu email yoki telefon allaqachon ro\'yxatdan o\'tgan.' });
        return;
      }

      const now = new Date().toISOString();
      const tenantId = `tenant_${uuidv4().substring(0, 8)}`;
      const clinicId = `clinic_${uuidv4().substring(0, 8)}`;
      const branchId = `branch_${uuidv4().substring(0, 8)}`;
      const userId = `user_${uuidv4().substring(0, 8)}`;

      // 1. Tenant
      db.addTenant({
        id: tenantId,
        code: `CLN_${Math.floor(1000 + Math.random() * 9000)}`,
        name: clinicName,
        slug: clinicName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        status: ClinicStatus.TRIAL,
        createdAt: now,
        updatedAt: now
      });

      // 2. Clinic
      db.addClinic({
        id: clinicId,
        tenantId,
        name: clinicName,
        primaryColor: '#008B8B',
        phone,
        email: email || '',
        address: address || '',
        queuePrefix: clinicName.charAt(0).toUpperCase() || 'A',
        settings: { avgConsultationMinutes: 15 },
        createdAt: now
      });

      // 3. Default Main Branch
      db.addBranch({
        id: branchId,
        tenantId,
        clinicId,
        name: 'Asosiy filial',
        address: address || 'Bosh bino',
        phone,
        queuePrefix: 'A',
        isMain: true,
        status: 'ACTIVE',
        createdAt: now
      });

      // 4. Owner User
      const passwordHash = bcrypt.hashSync(password, 10);
      const ownerUser = {
        id: userId,
        tenantId,
        fullName: ownerFullName,
        email: email || `${phone}@sadaf-saas.uz`,
        phone,
        passwordHash,
        role: UserRole.OWNER,
        branchId,
        status: 'ACTIVE' as const,
        createdAt: now
      };
      db.addUser(ownerUser);

      // 5. Subscription (Trial 14 days)
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);

      let normalizedPlanCode = 'STANDARD';
      const upperPlan = String(planCode || '').toUpperCase();
      if (upperPlan === 'STARTER') normalizedPlanCode = 'STARTER';
      else if (upperPlan === 'PREMIUM' || upperPlan === 'ENTERPRISE') normalizedPlanCode = 'PREMIUM';
      else normalizedPlanCode = 'STANDARD';

      const subId = `sub_${uuidv4().substring(0, 8)}`;

      db.addSubscription({
        id: subId,
        tenantId,
        planId: `plan_${normalizedPlanCode.toLowerCase()}`,
        planCode: normalizedPlanCode as PlanCode,
        status: ClinicStatus.TRIAL,
        startDate: now,
        endDate: trialEndDate.toISOString(),
        trialEndDate: trialEndDate.toISOString(),
        gracePeriodDays: 3,
        autoRenew: true
      });

      // 6. Sync to PostgreSQL (Clinic Settings, Subscriptions, Users, Specialties, Cabinets)
      const pg = PostgresService.getInstance();
      try {
        await pg.query(
          `INSERT INTO clinic_settings (
            id, clinic_id, clinic_name, phone, address, work_start_time, work_end_time, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, '08:00', '18:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO UPDATE SET clinic_name = EXCLUDED.clinic_name, phone = EXCLUDED.phone`,
          [tenantId, tenantId, clinicName, phone, address || '']
        );
      } catch (err) {
        console.warn('Postgres clinic_settings insert fallback:', err);
      }

      try {
        await pg.query(
          `INSERT INTO clinic_subscriptions (
            id, clinic_id, clinic_name, plan_code, status, start_date, end_date, auto_renew, price_paid, sms_balance, sms_enabled, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            subId,
            tenantId,
            clinicName,
            normalizedPlanCode,
            'ACTIVE', // Trial is actively running
            now.split('T')[0],
            trialEndDate.toISOString().split('T')[0],
            true,
            0,
            1000,
            true
          ]
        );
      } catch (err) {
        console.warn('Postgres subscription insert fallback:', err);
      }

      try {
        const cleanPhoneDigits = phone.replace(/[^0-9]/g, '');
        await pg.query(
          `INSERT INTO users (
            id, username, full_name, phone, password_hash, role_id, clinic_id, is_active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, 'role_manager', $6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (username) DO UPDATE SET phone = EXCLUDED.phone, password_hash = EXCLUDED.password_hash, clinic_id = EXCLUDED.clinic_id`,
          [
            userId,
            cleanPhoneDigits || userId,
            ownerFullName,
            phone,
            passwordHash,
            tenantId
          ]
        );
      } catch (err) {
        console.warn('Postgres user insert fallback:', err);
      }

      try {
        const specs = [
          { name: 'Terapiya', code: 'TER' },
          { name: 'Kardiologiya', code: 'KARD' },
          { name: 'Pediatriya', code: 'PED' },
          { name: 'Stomatologiya', code: 'STOM' }
        ];
        for (const sp of specs) {
          await pg.query(
            `INSERT INTO specialties (id, clinic_id, name, code, is_active)
             VALUES ($1, $2, $3, $4, true)
             ON CONFLICT DO NOTHING`,
            [`spec_${uuidv4().substring(0, 8)}`, tenantId, sp.name, sp.code]
          );
        }

        const cabs = ['101', '102', '103'];
        for (const cNum of cabs) {
          await pg.query(
            `INSERT INTO cabinets (id, clinic_id, number, name, is_active)
             VALUES ($1, $2, $3, $4, true)
             ON CONFLICT DO NOTHING`,
            [`cab_${uuidv4().substring(0, 8)}`, tenantId, cNum, `${cNum}-xona`]
          );
        }
      } catch (err) {
        console.warn('Postgres seed specialties/cabinets fallback:', err);
      }

      // Audit Log
      db.addAuditLog({
        id: uuidv4(),
        tenantId,
        userId,
        userRole: UserRole.OWNER,
        userFullName: ownerFullName,
        action: 'CLINIC_SELF_REGISTRATION',
        entityType: 'CLINIC',
        entityId: clinicId,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Unknown',
        createdAt: now
      });

      res.status(201).json({
        success: true,
        message: 'Klinika muvaffaqiyatli ro\'yxatdan o\'tkazildi (14 kunlik bepul sinov boshlandi).',
        data: {
          tenantId,
          clinicId,
          owner: {
            id: userId,
            fullName: ownerFullName,
            phone
          }
        }
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  public static async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }
    const pg = PostgresService.getInstance();
    try {
      const pgUser = await pg.query(
        `SELECT u.*, r.code as role_code, cs.clinic_name 
         FROM users u 
         LEFT JOIN roles r ON u.role_id = r.id 
         LEFT JOIN clinic_settings cs ON (u.clinic_id = cs.clinic_id OR u.clinic_id = cs.id)
         WHERE u.id = $1 LIMIT 1`,
        [req.user.userId]
      );
      if (pgUser.rows.length > 0) {
        const u = pgUser.rows[0];
        res.json({
          success: true,
          data: {
            user: {
              id: u.id,
              fullName: u.full_name,
              email: u.username,
              phone: u.phone,
              role: u.role_code || req.user.role || 'SUPER_ADMIN',
              avatarUrl: null,
              branchId: u.branch_id,
              tenantId: u.clinic_id
            },
            clinic: {
              id: u.clinic_id,
              name: u.clinic_name || 'Klinika'
            }
          }
        });
        return;
      }
    } catch (e) {
      console.warn('Postgres getMe fallback:', e);
    }

    const db = DatabaseService.getInstance();
    const user = db.getUserById(req.user.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    const clinic = user.tenantId ? db.getClinicByTenant(user.tenantId) : null;
    const subscription = user.tenantId ? db.getSubscriptionByTenant(user.tenantId) : null;

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatarUrl,
          branchId: user.branchId,
          tenantId: user.tenantId
        },
        clinic,
        subscription
      }
    });
  }

  public static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    const { fullName, phone, email, currentPassword, newPassword } = req.body;
    const pg = PostgresService.getInstance();

    try {
      const uRes = await pg.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [req.user.userId]);
      if (uRes.rows.length > 0) {
        const u = uRes.rows[0];

        // If changing password, verify current password
        let newHash = null;
        if (newPassword && String(newPassword).trim()) {
          if (currentPassword && u.password_hash) {
            let valid = false;
            try {
              valid = bcrypt.compareSync(currentPassword, u.password_hash) || currentPassword === u.password_hash;
            } catch (_) {}
            if (!valid) {
              res.status(400).json({ success: false, message: 'Amaldagi parol noto‘g‘ri kiritildi.' });
              return;
            }
          }
          newHash = bcrypt.hashSync(String(newPassword).trim(), 10);
        }

        const updateFields: string[] = ['updated_at = CURRENT_TIMESTAMP'];
        const params: any[] = [];
        let idx = 1;

        if (fullName !== undefined) {
          updateFields.push(`full_name = $${idx++}`);
          params.push(fullName);
        }
        if (phone !== undefined) {
          updateFields.push(`phone = $${idx++}`);
          params.push(phone);
        }
        if (email !== undefined) {
          updateFields.push(`username = $${idx++}`);
          params.push(email);
        }
        if (newHash) {
          updateFields.push(`password_hash = $${idx++}`);
          params.push(newHash);
        }

        params.push(req.user.userId);
        const updateSql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${idx} RETURNING id, full_name, username, phone`;
        const updatedRes = await pg.query(updateSql, params);
        const updated = updatedRes.rows[0];

        // Sync with DatabaseService
        try {
          const db = DatabaseService.getInstance();
          const dbUser = db.getUserById(req.user.userId);
          if (dbUser) {
            if (fullName) dbUser.fullName = fullName;
            if (phone) dbUser.phone = phone;
            if (email) dbUser.email = email;
            if (newHash) dbUser.passwordHash = newHash;
            db.updateUser(dbUser);
          }
        } catch (_) {}

        res.json({
          success: true,
          message: 'Profil ma\'lumotlari muvaffaqiyatli saqlandi.',
          data: {
            id: updated.id,
            fullName: updated.full_name,
            email: updated.username,
            phone: updated.phone
          }
        });
        return;
      }
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
      return;
    }

    res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi.' });
  }
}
