import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { DatabaseService } from './database/database.service';
import { WebSocketGateway } from './websocket/websocket.gateway';
import { authenticateJwt, requireRoles, enforceTenantBoundary } from './middleware/auth.middleware';
import { authRateLimiter, voiceRateLimiter } from './middleware/rate-limiter.middleware';
import { UserRole } from './types';

// Controllers
import { AuthController } from './modules/auth/auth.controller';
import { SuperAdminController } from './modules/super-admin/super-admin.controller';
import { ClinicsController } from './modules/clinics/clinics.controller';
import { DoctorsController } from './modules/doctors/doctors.controller';
import { PatientsController } from './modules/patients/patients.controller';
import { QueuesController } from './modules/queues/queues.controller';
import { ReportsController } from './modules/reports/reports.controller';
import { ClinicQueueController } from './modules/clinic-queue/clinic-queue.controller';
import { VoiceController } from './modules/voice/voice.controller';

const app = express();
const server = http.createServer(app);

// Security & Parsing
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());

// Initialize Database & WebSocket
DatabaseService.getInstance();
WebSocketGateway.getInstance().init(server, config.corsOrigin);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'klinika-admin Platform (Multi-Tenant SaaS)'
  });
});

const apiRouter = express.Router();

// Role Groups for Authorization Matrix
const STAFF_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.MANAGER,
  UserRole.CASHIER,
  UserRole.DOCTOR,
  UserRole.RECEPTIONIST,
  UserRole.OPERATOR
];
const ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.MANAGER];
const CASHIER_ROLES = [UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CASHIER];

// 1. Auth Endpoints
apiRouter.post('/auth/login', authRateLimiter, AuthController.login);
apiRouter.post('/auth/register-clinic', AuthController.registerClinic);
apiRouter.get('/auth/me', authenticateJwt, AuthController.getMe);

// 2. Super Admin Endpoints (Strictly Restricted to SUPER_ADMIN)
const superAdminAuth = [authenticateJwt, requireRoles([UserRole.SUPER_ADMIN])];
apiRouter.get('/super-admin/dashboard', ...superAdminAuth, SuperAdminController.getDashboard);
apiRouter.get('/super-admin/clinics', ...superAdminAuth, SuperAdminController.getClinics);
apiRouter.get('/super-admin/clinics/:id/details', ...superAdminAuth, SuperAdminController.getClinicDetails);
apiRouter.patch('/super-admin/clinics/:id', ...superAdminAuth, SuperAdminController.updateClinic);
apiRouter.delete('/super-admin/clinics/:id', ...superAdminAuth, SuperAdminController.deleteClinic);
apiRouter.patch('/super-admin/clinics/:id/status', ...superAdminAuth, SuperAdminController.updateClinicStatus);
apiRouter.patch('/super-admin/clinics/:id/plan', ...superAdminAuth, SuperAdminController.updateClinicPlan);
apiRouter.post('/super-admin/clinics/:id/users', ...superAdminAuth, SuperAdminController.createClinicUser);
apiRouter.put('/super-admin/clinics/:id/users/:userId', ...superAdminAuth, SuperAdminController.updateClinicUser);
apiRouter.delete('/super-admin/clinics/:id/users/:userId', ...superAdminAuth, SuperAdminController.deleteClinicUser);
apiRouter.patch('/super-admin/clinics/:id/users/:userId/status', ...superAdminAuth, SuperAdminController.toggleClinicUserStatus);
apiRouter.get('/super-admin/audit-logs', ...superAdminAuth, SuperAdminController.getAuditLogs);

// Real Subscriptions & Plans
apiRouter.get('/super-admin/subscriptions', ...superAdminAuth, SuperAdminController.getSubscriptions);
apiRouter.post('/super-admin/subscriptions/:id/extend', ...superAdminAuth, SuperAdminController.extendSubscription);
apiRouter.patch('/super-admin/subscriptions/:id/status', ...superAdminAuth, SuperAdminController.updateSubscriptionStatus);
apiRouter.patch('/super-admin/subscriptions/:id/sms', ...superAdminAuth, SuperAdminController.updateSubscriptionSms);
apiRouter.post('/super-admin/subscriptions/:id/change-plan', ...superAdminAuth, SuperAdminController.changeSubscriptionPlan);
apiRouter.get('/super-admin/plans', ...superAdminAuth, SuperAdminController.getPlans);
apiRouter.put('/super-admin/plans/:code', ...superAdminAuth, SuperAdminController.updatePlan);

// Real Users (Global)
apiRouter.get('/super-admin/users', ...superAdminAuth, SuperAdminController.getUsers);
apiRouter.post('/super-admin/users', ...superAdminAuth, SuperAdminController.createUser);
apiRouter.put('/super-admin/users/:id', ...superAdminAuth, SuperAdminController.updateUser);
apiRouter.delete('/super-admin/users/:id', ...superAdminAuth, SuperAdminController.deleteUser);
apiRouter.patch('/super-admin/users/:id/status', ...superAdminAuth, SuperAdminController.updateUserStatus);

// Real Branches
apiRouter.get('/super-admin/branches', ...superAdminAuth, SuperAdminController.getBranches);
apiRouter.post('/super-admin/branches', ...superAdminAuth, SuperAdminController.createBranch);

// Real Services (Global catalog)
apiRouter.get('/super-admin/services', ...superAdminAuth, SuperAdminController.getServices);
apiRouter.post('/super-admin/services', ...superAdminAuth, SuperAdminController.createService);
apiRouter.put('/super-admin/services/:id', ...superAdminAuth, SuperAdminController.updateService);
apiRouter.delete('/super-admin/services/:id', ...superAdminAuth, SuperAdminController.deleteService);

// Real Support Desk
apiRouter.get('/super-admin/support', ...superAdminAuth, SuperAdminController.getSupportTickets);
apiRouter.post('/super-admin/support', ...superAdminAuth, SuperAdminController.createSupportTicket);
apiRouter.post('/super-admin/support/:id/reply', ...superAdminAuth, SuperAdminController.replySupportTicket);

// Real Promo Codes
apiRouter.get('/super-admin/promo', ...superAdminAuth, SuperAdminController.getPromoCodes);
apiRouter.post('/super-admin/promo', ...superAdminAuth, SuperAdminController.createPromoCode);
apiRouter.patch('/super-admin/promo/:id/status', ...superAdminAuth, SuperAdminController.togglePromoCode);

// Real API Keys & Integrations
apiRouter.get('/super-admin/api-keys', ...superAdminAuth, SuperAdminController.getApiKeys);
apiRouter.post('/super-admin/api-keys', ...superAdminAuth, SuperAdminController.createApiKey);
apiRouter.delete('/super-admin/api-keys/:id', ...superAdminAuth, SuperAdminController.deleteApiKey);

// Real System Settings
apiRouter.get('/super-admin/settings', ...superAdminAuth, SuperAdminController.getSystemSettings);
apiRouter.put('/super-admin/settings/:key', ...superAdminAuth, SuperAdminController.updateSystemSetting);

// Real Payments & Invoices
apiRouter.get('/super-admin/payments', ...superAdminAuth, SuperAdminController.getPayments);

// Real Reports & Analytics
apiRouter.get('/super-admin/reports', ...superAdminAuth, SuperAdminController.getReports);

// Real System Status
apiRouter.get('/super-admin/system-status', ...superAdminAuth, SuperAdminController.getSystemStatus);

// Real SMS Gateway & Management
apiRouter.get('/super-admin/sms/settings', ...superAdminAuth, SuperAdminController.getSmsSettings);
apiRouter.put('/super-admin/sms/settings', ...superAdminAuth, SuperAdminController.updateSmsSettings);
apiRouter.get('/super-admin/sms/templates', ...superAdminAuth, SuperAdminController.getSmsTemplates);
apiRouter.put('/super-admin/sms/templates/:eventType', ...superAdminAuth, SuperAdminController.updateSmsTemplate);
apiRouter.get('/super-admin/sms/logs', ...superAdminAuth, SuperAdminController.getSmsLogs);
apiRouter.post('/super-admin/sms/send-test', ...superAdminAuth, SuperAdminController.sendTestSms);

// 3. Clinic Management & Settings (Tenant Bound)
apiRouter.get('/clinics/current', authenticateJwt, enforceTenantBoundary, ClinicsController.getCurrentClinic);
apiRouter.patch('/clinics/branding', authenticateJwt, enforceTenantBoundary, requireRoles(ADMIN_ROLES), ClinicsController.updateBranding);
apiRouter.get('/branches', authenticateJwt, enforceTenantBoundary, requireRoles(STAFF_ROLES), ClinicsController.getBranches);
apiRouter.post('/branches', authenticateJwt, enforceTenantBoundary, requireRoles(ADMIN_ROLES), ClinicsController.createBranch);

// 4. Doctors (CRUD)
apiRouter.get('/doctors', authenticateJwt, enforceTenantBoundary, requireRoles(STAFF_ROLES), ClinicQueueController.getDoctors);
apiRouter.get('/doctors/:id/performance', authenticateJwt, enforceTenantBoundary, requireRoles(ADMIN_ROLES), ClinicQueueController.getDoctorPerformance);
apiRouter.post('/doctors', authenticateJwt, enforceTenantBoundary, requireRoles(ADMIN_ROLES), ClinicQueueController.createDoctor);
apiRouter.put('/doctors/:id', authenticateJwt, enforceTenantBoundary, requireRoles(ADMIN_ROLES), ClinicQueueController.updateDoctor);
apiRouter.delete('/doctors/:id', authenticateJwt, enforceTenantBoundary, requireRoles(ADMIN_ROLES), ClinicQueueController.deleteDoctor);

// 5. Patients (CRUD)
apiRouter.get('/patients', authenticateJwt, enforceTenantBoundary, requireRoles(STAFF_ROLES), ClinicQueueController.getPatients);
apiRouter.get('/patients/:id', authenticateJwt, enforceTenantBoundary, requireRoles(STAFF_ROLES), ClinicQueueController.getPatientById);
apiRouter.post('/patients', authenticateJwt, enforceTenantBoundary, requireRoles(STAFF_ROLES), ClinicQueueController.createPatient);
apiRouter.put('/patients/:id', authenticateJwt, enforceTenantBoundary, requireRoles(STAFF_ROLES), ClinicQueueController.updatePatient);
apiRouter.delete('/patients/:id', authenticateJwt, enforceTenantBoundary, requireRoles(ADMIN_ROLES), ClinicQueueController.deletePatient);

// 6. Queues & Tickets (PostgreSQL Engine & Multi-tenant)
apiRouter.get('/queues/tickets', authenticateJwt, enforceTenantBoundary, requireRoles(STAFF_ROLES), ClinicQueueController.getTickets);
apiRouter.post('/queues/tickets', authenticateJwt, enforceTenantBoundary, requireRoles(STAFF_ROLES), QueuesController.createTicket);
apiRouter.post('/queues/multi-register', authenticateJwt, enforceTenantBoundary, requireRoles(STAFF_ROLES), ClinicQueueController.multiRegister);
apiRouter.post('/queues/call-next', authenticateJwt, enforceTenantBoundary, requireRoles(STAFF_ROLES), ClinicQueueController.callNext);
apiRouter.post('/queues/tickets/:id/recall', authenticateJwt, enforceTenantBoundary, requireRoles(STAFF_ROLES), ClinicQueueController.recall);
apiRouter.post('/queues/tickets/:id/call', authenticateJwt, enforceTenantBoundary, requireRoles(STAFF_ROLES), QueuesController.callTicket);
apiRouter.post('/queues/tickets/:id/start', authenticateJwt, enforceTenantBoundary, requireRoles(STAFF_ROLES), ClinicQueueController.startTicket);
apiRouter.post('/queues/tickets/:id/complete', authenticateJwt, enforceTenantBoundary, requireRoles(STAFF_ROLES), ClinicQueueController.completeTicket);
apiRouter.post('/queues/tickets/:id/skip', authenticateJwt, enforceTenantBoundary, requireRoles(STAFF_ROLES), ClinicQueueController.skipTicket);
apiRouter.post('/queues/tickets/:id/cancel', authenticateJwt, enforceTenantBoundary, requireRoles(STAFF_ROLES), ClinicQueueController.cancelTicket);

// 7. Catalogs (Specialties, Cabinets, Services CRUD)
apiRouter.get('/specialties', ClinicQueueController.getSpecialties); // Public catalog for Kiosk / Screens
apiRouter.get('/cabinets', authenticateJwt, enforceTenantBoundary, requireRoles(STAFF_ROLES), ClinicQueueController.getCabinets);
apiRouter.post('/cabinets', authenticateJwt, enforceTenantBoundary, requireRoles(ADMIN_ROLES), ClinicQueueController.createCabinet);
apiRouter.put('/cabinets/:id', authenticateJwt, enforceTenantBoundary, requireRoles(ADMIN_ROLES), ClinicQueueController.updateCabinet);
apiRouter.delete('/cabinets/:id', authenticateJwt, enforceTenantBoundary, requireRoles(ADMIN_ROLES), ClinicQueueController.deleteCabinet);

apiRouter.get('/services', authenticateJwt, enforceTenantBoundary, requireRoles(STAFF_ROLES), ClinicQueueController.getServices);
apiRouter.post('/services', authenticateJwt, enforceTenantBoundary, requireRoles(ADMIN_ROLES), ClinicQueueController.createService);
apiRouter.put('/services/:id', authenticateJwt, enforceTenantBoundary, requireRoles(ADMIN_ROLES), ClinicQueueController.updateService);
apiRouter.delete('/services/:id', authenticateJwt, enforceTenantBoundary, requireRoles(ADMIN_ROLES), ClinicQueueController.deleteService);
apiRouter.patch('/services/:id/payment-policy', authenticateJwt, enforceTenantBoundary, requireRoles(ADMIN_ROLES), ClinicQueueController.updateServicePolicy);

// 8. Cash Shifts & Payments
apiRouter.get('/cash-shifts/current', authenticateJwt, enforceTenantBoundary, requireRoles(CASHIER_ROLES), ClinicQueueController.getCurrentShift);
apiRouter.post('/cash-shifts/open', authenticateJwt, enforceTenantBoundary, requireRoles(CASHIER_ROLES), ClinicQueueController.openShift);
apiRouter.post('/cash-shifts/:id/close', authenticateJwt, enforceTenantBoundary, requireRoles(CASHIER_ROLES), ClinicQueueController.closeShift);
apiRouter.get('/cash-shifts/:id/details', authenticateJwt, enforceTenantBoundary, requireRoles(CASHIER_ROLES), ClinicQueueController.getShiftDetails);
apiRouter.get('/payments', authenticateJwt, enforceTenantBoundary, requireRoles(CASHIER_ROLES), ClinicQueueController.getPayments);

// 9. TV Display Screen (Public Waiting Hall Feed & Protected Test Calls)
apiRouter.get('/tv/feed', ClinicQueueController.getTvFeed);
apiRouter.post('/tv/test-call', authenticateJwt, enforceTenantBoundary, requireRoles(STAFF_ROLES), ClinicQueueController.testCall);

// 10. Reports & Manager Analytics
apiRouter.get('/reports/manager-dashboard', authenticateJwt, enforceTenantBoundary, requireRoles(ADMIN_ROLES), ClinicQueueController.getManagerDashboard);
apiRouter.get('/clinic/settings', authenticateJwt, enforceTenantBoundary, requireRoles(STAFF_ROLES), ClinicQueueController.getSettings);
apiRouter.patch('/clinic/settings', authenticateJwt, enforceTenantBoundary, requireRoles(ADMIN_ROLES), ClinicQueueController.updateSettings);
apiRouter.get('/clinic/subscription', authenticateJwt, enforceTenantBoundary, requireRoles(ADMIN_ROLES), ClinicQueueController.getSubscription);
apiRouter.get('/clinic/audit-logs', authenticateJwt, enforceTenantBoundary, requireRoles(ADMIN_ROLES), ClinicQueueController.getAuditLogs);

// 11. Users & Shifts Management
apiRouter.get('/users', authenticateJwt, enforceTenantBoundary, requireRoles(ADMIN_ROLES), ClinicQueueController.getUsers);
apiRouter.post('/users', authenticateJwt, enforceTenantBoundary, requireRoles(ADMIN_ROLES), ClinicQueueController.createUser);
apiRouter.put('/users/:id', authenticateJwt, enforceTenantBoundary, requireRoles(ADMIN_ROLES), ClinicQueueController.updateUser);
apiRouter.delete('/users/:id', authenticateJwt, enforceTenantBoundary, requireRoles(ADMIN_ROLES), ClinicQueueController.deleteUser);
apiRouter.get('/cash-shifts', authenticateJwt, enforceTenantBoundary, requireRoles(CASHIER_ROLES), ClinicQueueController.getAllShifts);

// 12. Realistic Human Voice (Studio Quality Azure Neural Uzbek TTS with Rate Limiter)
apiRouter.get('/voice/speak', voiceRateLimiter, VoiceController.speak);
apiRouter.get('/voice/voices', VoiceController.getVoices);

// 13. Application Updates & Release Metadata (Public / Cross-platform)
apiRouter.get('/app/latest-release', (req, res) => {
  const host = req.get('host') || 'localhost:5001';
  const protocol = req.protocol || 'http';
  const baseUrl = `${protocol}://${host}/api/v1`;

  res.json({
    success: true,
    data: {
      tag_name: 'v1.0.2',
      name: 'Klinika-admin v1.0.2',
      body: "• ManagerView to'liq modullashtirildi (tabs & modals)\n• Bemorlar, Hisobotlar va To'lovlar sahifalariga yangi sana oralig'i filtri (Bugun, Kecha, 1 hafta, 1 oy) qo'shildi\n• Login sahifasida telefon raqamini o'chirishda +998 prefiksi o'chmaydigan qilindi\n• Mobil ilovada zamonaviy qavariq (Curved Notched) navigatsiya paneli joriy qilindi\n• macOS, Windows va Android o'rnatuvchi paketlar yangilandi",
      published_at: new Date().toISOString(),
      html_url: 'https://github.com/wisperwindoxas/klinikalar_crm/releases/tag/v1.0.2',
      assets: [
        {
          name: 'Klinika-admin-1.0.2.dmg',
          browser_download_url: `${baseUrl}/app/download/Klinika-admin-1.0.2.dmg`,
          size: 113622259
        },
        {
          name: 'Klinika-admin Setup 1.0.2.exe',
          browser_download_url: `${baseUrl}/app/download/Klinika-admin%20Setup%201.0.2.exe`,
          size: 94102295
        },
        {
          name: 'Klinika-admin-1.0.2-mac.zip',
          browser_download_url: `${baseUrl}/app/download/Klinika-admin-1.0.2-mac.zip`,
          size: 108843437
        },
        {
          name: 'Klinika-admin-1.0.2-win.zip',
          browser_download_url: `${baseUrl}/app/download/Klinika-admin-1.0.2-win.zip`,
          size: 119411433
        },
        {
          name: 'Sadaf-Klinika-Mobile-1.0.2.apk',
          browser_download_url: `${baseUrl}/app/download/Sadaf-Klinika-Mobile-1.0.2.apk`,
          size: 59768832
        }
      ]
    }
  });
});

apiRouter.get('/app/download/:filename', (req, res) => {
  const rawFileName = req.params.filename;
  const fileName = path.basename(decodeURIComponent(rawFileName));
  const releaseDir = path.resolve(__dirname, '../../Desktop-App/release');
  const filePath = path.join(releaseDir, fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: `Fayl topilmadi: ${fileName}` });
  }

  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

app.use('/api/v1', apiRouter);

server.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`  klinika-admin SAAS BACKEND ENGINE RUNNING ON PORT ${config.port}`);
  console.log(`  Health Check: http://localhost:${config.port}/health`);
  console.log(`  API Base: http://localhost:${config.port}/api/v1`);
  console.log(`====================================================`);
});
