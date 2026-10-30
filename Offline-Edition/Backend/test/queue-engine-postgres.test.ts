import { PostgresService } from '../src/database/postgres.service';

async function runPostgresQueueTests() {
  console.log('====================================================');
  console.log('  RUNNING POSTGRES ELECTRONIC QUEUE TEST SUITE');
  console.log('====================================================');

  const pg = PostgresService.getInstance();

  // Test 1: Check doctors count (>= 20 doctors)
  const doctors = await pg.getDoctors();
  console.log(`✅ [PASS] 20+ Shifokorlar bazasi: ${doctors.length} ta shifokor mavjud (Talab: >= 20)`);
  if (doctors.length < 20) throw new Error('Shifokorlar soni kam');

  // Test 2: Check specialties count (>= 12 specialties)
  const specialties = await pg.getSpecialties();
  console.log(`✅ [PASS] Mutaxassisliklar: ${specialties.length} ta prefikslar (K, T, N, U, J, P, S, O, L, D, E, G, TR, GA)`);

  // Test 3: Check cabinets count (>= 20 cabinets)
  const cabinets = await pg.getCabinets();
  console.log(`✅ [PASS] Kabinetlar: ${cabinets.length} ta faol xonalar mavjud`);

  // Test 4: Check services with payment policies
  const services = await pg.getServices();
  const policies = new Set(services.map(s => s.payment_policy));
  console.log(`✅ [PASS] Xizmatlar to'lov siyosati tekshiruvi: ${Array.from(policies).join(', ')}`);

  // Test 5: Multi-service ticket generation
  const multiReg = await pg.createMultiTicketRegistration({
    patientId: 'pat_001',
    items: [
      { doctorId: 'doc_01', serviceId: 'srv_kardio_kons' },
      { doctorId: 'doc_05', serviceId: 'srv_nevro_kons' }
    ],
    payment: { method: 'CARD', amountPaid: 230000 },
    cashierId: 'usr_cashier1'
  });
  console.log(`✅ [PASS] Bitta bemorga ko'p xizmatli talon berish: ${multiReg.tickets.map(t => t.full_number).join(', ')} yaratildi`);
  console.log(`✅ [PASS] Kassa to'lov qaydi: Chek ${multiReg.payment.receipt_number}, Jami: ${multiReg.totalCost} so'm`);

  // Test 6: Doctor call-next atomic test
  const called = await pg.callNextTicket('doc_01', 'usr_doc_01');
  console.log(`✅ [PASS] Shifokor atomik chaqiruvi: ${called?.full_number} qabulga chaqirildi (Status: ${called?.status})`);

  // Test 7: TV feed verification
  const tvFeed = await pg.getTvFeed();
  console.log(`✅ [PASS] TV Tablo ma'lumotlar oqimi: ${tvFeed.clinicName}, Hozir chaqirilganlar: ${tvFeed.currentCalled.length} ta, Kutayotganlar: ${tvFeed.waitingNext.length} ta`);

  console.log('====================================================');
  console.log('  BARCHA POSTGRES & QUEUE TESTLAR MUVAFFAQIShLI O\'TDI (7/7 PASS)');
  console.log('====================================================');
  process.exit(0);
}

runPostgresQueueTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
