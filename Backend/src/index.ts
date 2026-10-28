import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { DatabaseService } from './database/database.service';
import { WebSocketGateway } from './websocket/websocket.gateway';
import { authenticateJwt, requireRoles, enforceTenantBoundary } from './middleware/auth.middleware';
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
    service: 'SADAF Clinic Management Platform (Multi-Tenant SaaS)'
  });
});

const apiRouter = express.Router();

// 1. Auth Endpoints
apiRouter.post('/auth/login', AuthController.login);
apiRouter.post('/auth/register-clinic', AuthController.registerClinic);
apiRouter.get('/auth/me', authenticateJwt, AuthController.getMe);

// 2. Super Admin Endpoints (Restricted to SUPER_ADMIN)
apiRouter.get('/super-admin/dashboard', SuperAdminController.getDashboard);
apiRouter.get('/super-admin/clinics', SuperAdminController.getClinics);
apiRouter.patch('/super-admin/clinics/:id/status', SuperAdminController.updateClinicStatus);
apiRouter.patch('/super-admin/clinics/:id/plan', SuperAdminController.updateClinicPlan);
apiRouter.get('/super-admin/audit-logs', SuperAdminController.getAuditLogs);

// Real Subscriptions & Plans
apiRouter.get('/super-admin/subscriptions', SuperAdminController.getSubscriptions);
apiRouter.post('/super-admin/subscriptions/:id/extend', SuperAdminController.extendSubscription);
apiRouter.patch('/super-admin/subscriptions/:id/status', SuperAdminController.updateSubscriptionStatus);
apiRouter.post('/super-admin/subscriptions/:id/change-plan', SuperAdminController.changeSubscriptionPlan);
apiRouter.get('/super-admin/plans', SuperAdminController.getPlans);
apiRouter.put('/super-admin/plans/:code', SuperAdminController.updatePlan);

// Real Users (Global)
apiRouter.get('/super-admin/users', SuperAdminController.getUsers);
apiRouter.post('/super-admin/users', SuperAdminController.createUser);
apiRouter.patch('/super-admin/users/:id/status', SuperAdminController.updateUserStatus);

// Real Branches
apiRouter.get('/super-admin/branches', SuperAdminController.getBranches);
apiRouter.post('/super-admin/branches', SuperAdminController.createBranch);

// Real Services (Global catalog)
apiRouter.get('/super-admin/services', SuperAdminController.getServices);
apiRouter.post('/super-admin/services', SuperAdminController.createService);
apiRouter.put('/super-admin/services/:id', SuperAdminController.updateService);
apiRouter.delete('/super-admin/services/:id', SuperAdminController.deleteService);

// Real Support Desk
apiRouter.get('/super-admin/support', SuperAdminController.getSupportTickets);
apiRouter.post('/super-admin/support', SuperAdminController.createSupportTicket);
apiRouter.post('/super-admin/support/:id/reply', SuperAdminController.replySupportTicket);

// Real Promo Codes
apiRouter.get('/super-admin/promo', SuperAdminController.getPromoCodes);
apiRouter.post('/super-admin/promo', SuperAdminController.createPromoCode);
apiRouter.patch('/super-admin/promo/:id/status', SuperAdminController.togglePromoCode);

// Real API Keys & Integrations
apiRouter.get('/super-admin/api-keys', SuperAdminController.getApiKeys);
apiRouter.post('/super-admin/api-keys', SuperAdminController.createApiKey);
apiRouter.delete('/super-admin/api-keys/:id', SuperAdminController.deleteApiKey);

// Real System Settings
apiRouter.get('/super-admin/settings', SuperAdminController.getSystemSettings);
apiRouter.put('/super-admin/settings/:key', SuperAdminController.updateSystemSetting);

// Real Payments & Invoices
apiRouter.get('/super-admin/payments', SuperAdminController.getPayments);

// Real Reports & Analytics
apiRouter.get('/super-admin/reports', SuperAdminController.getReports);

// Real System Status
apiRouter.get('/super-admin/system-status', SuperAdminController.getSystemStatus);

// Real SMS Gateway & Management
apiRouter.get('/super-admin/sms/settings', SuperAdminController.getSmsSettings);
apiRouter.put('/super-admin/sms/settings', SuperAdminController.updateSmsSettings);
apiRouter.get('/super-admin/sms/templates', SuperAdminController.getSmsTemplates);
apiRouter.put('/super-admin/sms/templates/:eventType', SuperAdminController.updateSmsTemplate);
apiRouter.get('/super-admin/sms/logs', SuperAdminController.getSmsLogs);
apiRouter.post('/super-admin/sms/send-test', SuperAdminController.sendTestSms);

// 3. Clinic Management & Settings (Tenant Bound)
apiRouter.get('/clinics/current', authenticateJwt, enforceTenantBoundary, ClinicsController.getCurrentClinic);
apiRouter.patch('/clinics/branding', authenticateJwt, enforceTenantBoundary, ClinicsController.updateBranding);
apiRouter.get('/branches', authenticateJwt, enforceTenantBoundary, ClinicsController.getBranches);
apiRouter.post('/branches', authenticateJwt, enforceTenantBoundary, ClinicsController.createBranch);

// 4. Doctors (CRUD)
apiRouter.get('/doctors', ClinicQueueController.getDoctors);
apiRouter.get('/doctors/:id/performance', ClinicQueueController.getDoctorPerformance);
apiRouter.post('/doctors', ClinicQueueController.createDoctor);
apiRouter.put('/doctors/:id', ClinicQueueController.updateDoctor);
apiRouter.delete('/doctors/:id', ClinicQueueController.deleteDoctor);

// 5. Patients (CRUD)
apiRouter.get('/patients', ClinicQueueController.getPatients);
apiRouter.get('/patients/:id', ClinicQueueController.getPatientById);
apiRouter.post('/patients', ClinicQueueController.createPatient);
apiRouter.put('/patients/:id', ClinicQueueController.updatePatient);
apiRouter.delete('/patients/:id', ClinicQueueController.deletePatient);

// 6. Queues & Tickets (PostgreSQL Engine & Multi-tenant)
apiRouter.get('/queues/tickets', ClinicQueueController.getTickets);
apiRouter.post('/queues/tickets', QueuesController.createTicket);
apiRouter.post('/queues/multi-register', ClinicQueueController.multiRegister);
apiRouter.post('/queues/call-next', ClinicQueueController.callNext);
apiRouter.post('/queues/tickets/:id/recall', ClinicQueueController.recall);
apiRouter.post('/queues/tickets/:id/call', QueuesController.callTicket);
apiRouter.post('/queues/tickets/:id/start', ClinicQueueController.startTicket);
apiRouter.post('/queues/tickets/:id/complete', ClinicQueueController.completeTicket);
apiRouter.post('/queues/tickets/:id/skip', ClinicQueueController.skipTicket);
apiRouter.post('/queues/tickets/:id/cancel', ClinicQueueController.cancelTicket);

// 7. Catalogs (Specialties, Cabinets, Services CRUD)
apiRouter.get('/specialties', ClinicQueueController.getSpecialties);
apiRouter.get('/cabinets', ClinicQueueController.getCabinets);
apiRouter.post('/cabinets', ClinicQueueController.createCabinet);
apiRouter.put('/cabinets/:id', ClinicQueueController.updateCabinet);
apiRouter.delete('/cabinets/:id', ClinicQueueController.deleteCabinet);

apiRouter.get('/services', ClinicQueueController.getServices);
apiRouter.post('/services', ClinicQueueController.createService);
apiRouter.put('/services/:id', ClinicQueueController.updateService);
apiRouter.delete('/services/:id', ClinicQueueController.deleteService);
apiRouter.patch('/services/:id/payment-policy', ClinicQueueController.updateServicePolicy);

// 8. Cash Shifts & Payments
apiRouter.get('/cash-shifts/current', ClinicQueueController.getCurrentShift);
apiRouter.post('/cash-shifts/open', ClinicQueueController.openShift);
apiRouter.post('/cash-shifts/:id/close', ClinicQueueController.closeShift);
apiRouter.get('/cash-shifts/:id/details', ClinicQueueController.getShiftDetails);
apiRouter.get('/payments', ClinicQueueController.getPayments);

// 9. TV Display Screen (Public & Test Calls)
apiRouter.get('/tv/feed', ClinicQueueController.getTvFeed);
apiRouter.post('/tv/test-call', ClinicQueueController.testCall);

// 10. Reports & Manager Analytics
apiRouter.get('/reports/manager-dashboard', ClinicQueueController.getManagerDashboard);
apiRouter.get('/clinic/settings', ClinicQueueController.getSettings);
apiRouter.patch('/clinic/settings', ClinicQueueController.updateSettings);
apiRouter.get('/clinic/audit-logs', ClinicQueueController.getAuditLogs);

// 11. Users & Shifts Management
apiRouter.get('/users', ClinicQueueController.getUsers);
apiRouter.post('/users', ClinicQueueController.createUser);
apiRouter.put('/users/:id', ClinicQueueController.updateUser);
apiRouter.delete('/users/:id', ClinicQueueController.deleteUser);
apiRouter.get('/cash-shifts', ClinicQueueController.getAllShifts);

// 12. Realistic Human Voice (Studio Quality Azure Neural Uzbek TTS)
apiRouter.get('/voice/speak', VoiceController.speak);
apiRouter.get('/voice/voices', VoiceController.getVoices);

app.use('/api/v1', apiRouter);

server.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`  SADAF SAAS BACKEND ENGINE RUNNING ON PORT ${config.port}`);
  console.log(`  Health Check: http://localhost:${config.port}/health`);
  console.log(`  API Base: http://localhost:${config.port}/api/v1`);
  console.log(`====================================================`);
});
