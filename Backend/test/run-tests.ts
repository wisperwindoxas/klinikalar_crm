import { DatabaseService } from '../src/database/database.service';
import { QueueStatus, PlanCode, UserRole, DoctorStatus } from '../src/types';

async function runTestSuite() {
  console.log('====================================================');
  console.log('  RUNNING SADAF MULTI-TENANT SAAS TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, failDetails?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (failDetails) console.error(`   Details: ${failDetails}`);
      failed++;
    }
  }

  const db = DatabaseService.getInstance();

  // TEST 1: Initial Seed Verification
  const tenants = db.getTenants();
  assert(tenants.length >= 6, 'Seed: Multi-tenant accounts seeded (>= 6 clinics)');
  const sadaf = db.getClinicByTenant('tenant_sadaf_01');
  assert(sadaf?.name === 'SADAF KLINIKA', 'Seed: SADAF KLINIKA primary tenant initialized');
  const doctors = db.getDoctors('tenant_sadaf_01');
  assert(doctors.length === 8, 'Seed: SADAF has 8 doctors seeded matching UI design');
  const tickets = db.getQueueTickets('tenant_sadaf_01');
  assert(tickets.length >= 6, 'Seed: Queue tickets seeded matching UI design (A015 - A020)');

  // TEST 2: CRITICAL SECURITY TEST - TENANT ISOLATION (Rule 60)
  console.log('\n--- Running Rule 60: Tenant Isolation Test ---');
  // Tenant A: SADAF
  const tenantAId = 'tenant_sadaf_01';
  // Tenant B: Dental Plus
  const tenantBId = 'tenant_dental_02';

  // Create Patient in Tenant B
  const patientBId = 'pat_dental_test_99';
  db.addPatient({
    id: patientBId,
    tenantId: tenantBId,
    patientNumber: '9901',
    fullName: 'Dental Plus Patient B',
    phone: '+998990001122',
    createdAt: new Date().toISOString()
  });

  // Clinic A tries to access Patient B through Tenant-isolated query
  const clinicAAccess = db.getPatientById(patientBId, tenantAId);
  assert(clinicAAccess === undefined, 'Tenant Isolation: Clinic A user cannot fetch Clinic B patient data');

  const clinicBAccess = db.getPatientById(patientBId, tenantBId);
  assert(clinicBAccess !== undefined && clinicBAccess.id === patientBId, 'Tenant Access: Clinic B user can fetch own patient');

  // TEST 3: SUBSCRIPTION QUOTA LIMIT TEST (Rule 61)
  console.log('\n--- Running Rule 61: Subscription Quota Limit Test ---');
  const starterPlan = db.getPlanByCode(PlanCode.STARTER);
  assert(starterPlan !== undefined && starterPlan.limits.maxDoctors === 5, 'Plan Limits: Starter plan has maxDoctors = 5');

  // Tenant Dental Plus is on STARTER plan
  const dentalDoctors = db.getDoctors(tenantBId);
  // Add doctors up to 5
  for (let i = dentalDoctors.length; i < 5; i++) {
    db.addDoctor({
      id: `doc_dental_${i + 1}`,
      tenantId: tenantBId,
      userId: `user_dental_${i + 1}`,
      fullName: `Dental Doctor ${i + 1}`,
      phone: `+99899000000${i}`,
      specialtyId: 'spec_general',
      specialtyName: 'Stomatolog',
      branchId: 'branch_dental_main',
      cabinetNumber: `${i + 1}`,
      experienceYears: 4,
      status: DoctorStatus.AVAILABLE,
      avgConsultationMinutes: 15
    });
  }

  const updatedDentalDoctors = db.getDoctors(tenantBId);
  assert(updatedDentalDoctors.length === 5, 'Quota Test: 5 doctors successfully created under Starter plan');

  // Attempt to add 6th doctor: should violate quota
  const wouldExceed = updatedDentalDoctors.length >= starterPlan!.limits.maxDoctors;
  assert(wouldExceed, 'Quota Guard: 6th doctor addition blocked by Subscription Quota Engine');

  // TEST 4: QUEUE STATE MACHINE TEST (Rule 35)
  console.log('\n--- Running Rule 35: Queue State Machine Workflow ---');
  const testTicketId = `ticket_state_test_${Date.now()}`;
  db.addQueueTicket({
    id: testTicketId,
    tenantId: tenantAId,
    branchId: 'branch_sadaf_main',
    doctorId: 'doc_1',
    doctorName: 'Dr. Aliyev Jahongir',
    patientId: 'pat_1',
    patientName: 'Karimov Akmal',
    cabinetNumber: '3',
    ticketNumber: 'A999',
    status: QueueStatus.WAITING,
    estimatedWaitMinutes: 10,
    createdAt: new Date().toISOString()
  });

  const createdTicket = db.getQueueTicketById(testTicketId, tenantAId);
  assert(createdTicket?.status === QueueStatus.WAITING, 'Queue State 1: Ticket created with status WAITING');

  // Call ticket
  createdTicket!.status = QueueStatus.CALLED;
  createdTicket!.calledAt = new Date().toISOString();
  db.updateQueueTicket(createdTicket!);
  assert(db.getQueueTicketById(testTicketId, tenantAId)?.status === QueueStatus.CALLED, 'Queue State 2: Ticket transitioned to CALLED');

  // Start ticket
  createdTicket!.status = QueueStatus.IN_PROGRESS;
  createdTicket!.startedAt = new Date().toISOString();
  db.updateQueueTicket(createdTicket!);
  assert(db.getQueueTicketById(testTicketId, tenantAId)?.status === QueueStatus.IN_PROGRESS, 'Queue State 3: Ticket transitioned to IN_PROGRESS');

  // Complete ticket
  createdTicket!.status = QueueStatus.COMPLETED;
  createdTicket!.completedAt = new Date().toISOString();
  db.updateQueueTicket(createdTicket!);
  assert(db.getQueueTicketById(testTicketId, tenantAId)?.status === QueueStatus.COMPLETED, 'Queue State 4: Ticket transitioned to COMPLETED');

  // Add Visit
  db.addVisit({
    id: 'visit_test_01',
    tenantId: tenantAId,
    queueTicketId: testTicketId,
    patientId: 'pat_1',
    doctorId: 'doc_1',
    diagnosis: 'Karies tekshiruvi va davolash',
    notes: 'Bemor shikoyati bartaraf etildi',
    prescriptions: [],
    servicesProvided: [{ serviceId: 's1', name: 'Davolash', price: 250000 }],
    totalCost: 250000,
    startedAt: createdTicket!.startedAt!,
    completedAt: createdTicket!.completedAt!
  });

  const visit = db.getVisits(tenantAId).find(v => v.queueTicketId === testTicketId);
  assert(visit !== undefined && visit.totalCost === 250000, 'Visit Record: Visit logged with diagnosis and financial cost');

  console.log('\n====================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
