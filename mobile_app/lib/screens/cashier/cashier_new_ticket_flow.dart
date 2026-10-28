import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../models/doctor_model.dart';
import '../../models/patient_model.dart';
import '../../models/service_model.dart';
import '../../services/api_service.dart';
import 'cashier_ticket_sheet.dart';

class CashierNewTicketFlow extends StatefulWidget {
  final VoidCallback onFinished;

  const CashierNewTicketFlow({Key? key, required this.onFinished}) : super(key: key);

  static void show(BuildContext context, {required VoidCallback onFinished}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => CashierNewTicketFlow(onFinished: onFinished),
    );
  }

  @override
  State<CashierNewTicketFlow> createState() => _CashierNewTicketFlowState();
}

class _CashierNewTicketFlowState extends State<CashierNewTicketFlow> {
  int _currentStep = 0; // 0: Patient, 1: Doctor & Services, 2: Payment
  bool _isLoading = false;

  // Step 1: Patient fields
  final _searchController = TextEditingController();
  List<PatientModel> _patientSearchResults = [];
  PatientModel? _selectedPatient;

  // New patient form fields
  bool _isNewPatientForm = false;
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController(text: '+998 ');
  final _addressController = TextEditingController();
  String _selectedGender = 'male';
  String _selectedRegion = 'Toshkent shahri';

  final List<String> _regions = [
    'Toshkent shahri',
    'Toshkent viloyati',
    'Samarqand viloyati',
    'Farg‘ona viloyati',
    'Andijon viloyati',
    'Namangan viloyati',
    'Buxoro viloyati',
    'Qashqadaryo viloyati',
    'Surxondaryo viloyati',
    'Xorazm viloyati',
    'Navoiy viloyati',
    'Jizzax viloyati',
    'Sirdaryo viloyati',
    'Qoraqalpog‘iston Respublikasi',
  ];

  // Step 2: Doctor & Service Selection
  List<DoctorModel> _doctors = [];
  DoctorModel? _selectedDoctor;
  List<ServiceModel> _services = [];
  final List<ServiceModel> _cart = [];

  // Step 3: Payment
  String _paymentMethod = 'CASH'; // CASH, CARD, ONLINE
  final _receivedCashController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    setState(() => _isLoading = true);
    final docs = await ApiService().getDoctors();
    final srvs = await ApiService().getServices();
    setState(() {
      _doctors = docs;
      _services = srvs;
      if (_doctors.isNotEmpty) {
        _selectedDoctor = _doctors.first;
      }
      _isLoading = false;
    });
  }

  Future<void> _searchPatients(String query) async {
    if (query.length < 2) {
      setState(() => _patientSearchResults = []);
      return;
    }
    final results = await ApiService().getPatients(search: query);
    setState(() => _patientSearchResults = results);
  }

  double get _totalPrice {
    double total = 0;
    if (_selectedDoctor != null) {
      total += _selectedDoctor!.consultationPrice;
    }
    for (var s in _cart) {
      total += s.price;
    }
    return total;
  }

  Future<void> _submitRegistration() async {
    setState(() => _isLoading = true);

    String? patientId = _selectedPatient?.id;

    // If new patient, create in database first
    if (patientId == null || _isNewPatientForm) {
      final cleanPhone = _phoneController.text.replaceAll(' ', '');
      final pRes = await ApiService().createPatient({
        'fullName': _nameController.text.trim(),
        'phone': cleanPhone,
        'gender': _selectedGender,
        'address': _addressController.text.trim(),
        'region': _selectedRegion,
      });

      if (pRes['success'] == false && pRes['patient'] == null) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(pRes['message'] ?? 'Bemor qo‘shishda xatolik'), backgroundColor: AppColors.error),
        );
        return;
      }
      patientId = pRes['patient']?['id']?.toString() ?? pRes['id']?.toString();
    }

    if (patientId == null) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Bemor tanlanmagan'), backgroundColor: AppColors.error),
      );
      return;
    }

    // Build items payload
    final items = <Map<String, dynamic>>[];
    if (_selectedDoctor != null) {
      items.add({
        'doctorId': _selectedDoctor!.id,
        'price': _selectedDoctor!.consultationPrice,
        'paymentMethod': _paymentMethod,
        'serviceName': 'Konsultatsiya: ${_selectedDoctor!.specialty}',
      });
    }

    for (var s in _cart) {
      items.add({
        'doctorId': _selectedDoctor?.id ?? 'doc-1',
        'serviceId': s.id,
        'price': s.price,
        'paymentMethod': _paymentMethod,
        'serviceName': s.name,
      });
    }

    final regRes = await ApiService().multiRegister(
      patientId: patientId,
      items: items,
    );

    setState(() => _isLoading = false);

    if (!mounted) return;

    if (regRes['success'] != false) {
      Navigator.pop(context);
      final tickets = regRes['tickets'] as List? ?? [];
      final firstTicket = tickets.isNotEmpty ? tickets.first : {};

      CashierTicketSheet.show(
        context,
        ticketData: {
          'ticketNumber': firstTicket['ticketNumber'] ?? firstTicket['number'] ?? 'K-020',
          'patientName': _selectedPatient?.fullName ?? _nameController.text,
          'doctorName': _selectedDoctor?.fullName ?? 'Shifokor',
          'roomNumber': _selectedDoctor?.roomNumber ?? '104',
          'serviceName': _cart.isNotEmpty ? _cart.first.name : 'Konsultatsiya',
          'amount': _totalPrice,
        },
        onDone: widget.onFinished,
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(regRes['message'] ?? 'Talon chiqarishda xatolik'), backgroundColor: AppColors.error),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.90,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.fromLTRB(20, 12, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 44,
              height: 4,
              decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2)),
            ),
          ),
          const SizedBox(height: 16),
          // Stepper indicator
          Row(
            children: [
              _buildStepIndicator(0, 'Bemor'),
              _buildStepLine(0),
              _buildStepIndicator(1, 'Shifokor & Xizmat'),
              _buildStepLine(1),
              _buildStepIndicator(2, 'To‘lov'),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(height: 1, color: AppColors.border),
          const SizedBox(height: 16),

          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : _buildStepContent(),
          ),

          // Bottom Action Buttons
          const SizedBox(height: 12),
          Row(
            children: [
              if (_currentStep > 0)
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => setState(() => _currentStep--),
                    child: const Text('Orqaga'),
                  ),
                ),
              if (_currentStep > 0) const SizedBox(width: 10),
              Expanded(
                flex: 2,
                child: ElevatedButton(
                  onPressed: () {
                    if (_currentStep == 0) {
                      if (_selectedPatient == null && !_isNewPatientForm) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Iltimos bemorni tanlang yoki yangisini kiriting')),
                        );
                        return;
                      }
                      if (_isNewPatientForm && _nameController.text.trim().isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Bemorning to‘liq ismini kiriting')),
                        );
                        return;
                      }
                      setState(() => _currentStep = 1);
                    } else if (_currentStep == 1) {
                      if (_selectedDoctor == null && _cart.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Kamida bitta shifokor yoki xizmat tanlang')),
                        );
                        return;
                      }
                      setState(() => _currentStep = 2);
                    } else {
                      _submitRegistration();
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _currentStep == 2 ? AppColors.success : AppColors.primary,
                  ),
                  child: Text(
                    _currentStep == 2
                        ? 'To‘lovni tasdiqlash (${Formatters.formatCurrency(_totalPrice)})'
                        : 'Davom etish',
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStepIndicator(int step, String title) {
    final isActive = _currentStep >= step;
    final isCurrent = _currentStep == step;
    return Row(
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            color: isActive ? AppColors.primary : AppColors.borderLight,
            shape: BoxShape.circle,
            border: Border.all(color: isActive ? AppColors.primary : AppColors.border),
          ),
          child: Center(
            child: Text(
              '${step + 1}',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: isActive ? Colors.white : AppColors.textMuted,
              ),
            ),
          ),
        ),
        const SizedBox(width: 6),
        Text(
          title,
          style: TextStyle(
            fontSize: 11,
            fontWeight: isCurrent ? FontWeight.bold : FontWeight.w500,
            color: isCurrent ? AppColors.primary : AppColors.textMuted,
          ),
        ),
      ],
    );
  }

  Widget _buildStepLine(int afterStep) {
    final isPassed = _currentStep > afterStep;
    return Expanded(
      child: Container(
        height: 2,
        margin: const EdgeInsets.symmetric(horizontal: 6),
        color: isPassed ? AppColors.primary : AppColors.border,
      ),
    );
  }

  Widget _buildStepContent() {
    if (_currentStep == 0) return _buildPatientStep();
    if (_currentStep == 1) return _buildDoctorAndServiceStep();
    return _buildPaymentStep();
  }

  // ==================== STEP 0: PATIENT ====================
  Widget _buildPatientStep() {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _isNewPatientForm ? 'Yangi bemor ma\'lumotlari' : 'Bemor qidirish',
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              TextButton.icon(
                icon: Icon(_isNewPatientForm ? Icons.search : Icons.person_add_alt_1_rounded, size: 16),
                label: Text(_isNewPatientForm ? 'Qidiruvga qaytish' : 'Yangi bemor'),
                onPressed: () {
                  setState(() {
                    _isNewPatientForm = !_isNewPatientForm;
                    _selectedPatient = null;
                  });
                },
              ),
            ],
          ),
          const SizedBox(height: 10),

          if (!_isNewPatientForm) ...[
            TextFormField(
              controller: _searchController,
              onChanged: _searchPatients,
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.search_rounded, color: AppColors.textMuted),
                hintText: 'Telefon raqam yoki F.I.Sh kiriting...',
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _patientSearchResults = []);
                        },
                      )
                    : null,
              ),
            ),
            const SizedBox(height: 12),
            if (_selectedPatient != null) ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.mintLight,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.primary),
                ),
                child: Row(
                  children: [
                    const CircleAvatar(
                      backgroundColor: AppColors.primary,
                      radius: 20,
                      child: Icon(Icons.check, color: Colors.white, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(_selectedPatient!.fullName, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                          Text(Formatters.formatPhone(_selectedPatient!.phone), style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                          if (_selectedPatient!.address != null)
                            Text(_selectedPatient!.address!, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: AppColors.textMuted, size: 18),
                      onPressed: () => setState(() => _selectedPatient = null),
                    ),
                  ],
                ),
              ),
            ] else ...[
              if (_patientSearchResults.isNotEmpty) ...[
                const Text('Qidiruv natijalari:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textMuted)),
                const SizedBox(height: 6),
                ..._patientSearchResults.map((p) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: CircleAvatar(
                        backgroundColor: AppColors.mintLight,
                        child: Text(p.fullName.isNotEmpty ? p.fullName[0] : 'B', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                      ),
                      title: Text(p.fullName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      subtitle: Text('${Formatters.formatPhone(p.phone)} • ${p.totalVisits} ta tashrif', style: const TextStyle(fontSize: 11)),
                      trailing: const Icon(Icons.check_circle_outline, color: AppColors.primary, size: 20),
                      onTap: () {
                        setState(() {
                          _selectedPatient = p;
                          _patientSearchResults = [];
                        });
                      },
                    )),
              ] else ...[
                Container(
                  padding: const EdgeInsets.all(20),
                  child: Center(
                    child: Column(
                      children: [
                        const Icon(Icons.person_search_rounded, size: 40, color: AppColors.textMuted),
                        const SizedBox(height: 8),
                        const Text('Bemorni qidiring yoki yangisini ro‘yxatga oling', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ] else ...[
            // New Patient Form
            const Text('F.I.Sh (To‘liq ismi)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
            const SizedBox(height: 6),
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(hintText: 'Masalan: Olimov Sanjar Rustamovich'),
            ),
            const SizedBox(height: 12),
            const Text('Telefon raqami', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
            const SizedBox(height: 6),
            TextFormField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(hintText: '+998 90 123 45 67'),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Jinsi', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _selectedGender,
                            isExpanded: true,
                            items: const [
                              DropdownMenuItem(value: 'male', child: Text('Erkak', style: TextStyle(fontSize: 12))),
                              DropdownMenuItem(value: 'female', child: Text('Ayol', style: TextStyle(fontSize: 12))),
                            ],
                            onChanged: (val) {
                              if (val != null) setState(() => _selectedGender = val);
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Viloyat', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _selectedRegion,
                            isExpanded: true,
                            items: _regions.map((r) => DropdownMenuItem(value: r, child: Text(r, style: const TextStyle(fontSize: 11), overflow: TextOverflow.ellipsis))).toList(),
                            onChanged: (val) {
                              if (val != null) setState(() => _selectedRegion = val);
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Text('Manzil / Tuman', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
            const SizedBox(height: 6),
            TextFormField(
              controller: _addressController,
              decoration: const InputDecoration(hintText: 'Chilonzor tumani, 9-mavze, 12-uy'),
            ),
          ],
        ],
      ),
    );
  }

  // ==================== STEP 1: DOCTOR & SERVICES ====================
  Widget _buildDoctorAndServiceStep() {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Shifokorni tanlang:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          const SizedBox(height: 8),
          SizedBox(
            height: 105,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _doctors.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (context, index) {
                final doc = _doctors[index];
                final isSelected = _selectedDoctor?.id == doc.id;
                return GestureDetector(
                  onTap: () => setState(() => _selectedDoctor = doc),
                  child: Container(
                    width: 150,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.mintLight : Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: isSelected ? AppColors.primary : AppColors.border, width: isSelected ? 2 : 1),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(doc.fullName, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis),
                        Text(doc.specialty, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary), maxLines: 1),
                        const Spacer(),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('${doc.roomNumber}-xona', style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
                            Text(Formatters.formatCurrency(doc.consultationPrice), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary)),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 18),

          const Text('Qo‘shimcha xizmatlar (Tahlil / UZI / Muolaja):', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          const SizedBox(height: 8),
          ..._services.map((srv) {
            final isInCart = _cart.any((s) => s.id == srv.id);
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: isInCart ? AppColors.mintLight.withOpacity(0.5) : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: isInCart ? AppColors.primary : AppColors.border),
              ),
              child: Row(
                children: [
                  Checkbox(
                    value: isInCart,
                    activeColor: AppColors.primary,
                    onChanged: (val) {
                      setState(() {
                        if (val == true) {
                          _cart.add(srv);
                        } else {
                          _cart.removeWhere((s) => s.id == srv.id);
                        }
                      });
                    },
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(srv.name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                        Text('${srv.category} • ${srv.durationMinutes} daq', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                      ],
                    ),
                  ),
                  Text(
                    Formatters.formatCurrency(srv.price),
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  // ==================== STEP 2: PAYMENT ====================
  Widget _buildPaymentStep() {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Receipt summary
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('To‘lov hisob-kitobi', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                const SizedBox(height: 10),
                if (_selectedDoctor != null)
                  _buildPaymentLine('Konsultatsiya (${_selectedDoctor!.specialty})', _selectedDoctor!.consultationPrice),
                ..._cart.map((s) => _buildPaymentLine(s.name, s.price)),
                const Divider(height: 16, color: AppColors.border),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Jami To‘lov Summasi:', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    Text(
                      Formatters.formatCurrency(_totalPrice),
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.primary),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Payment method choices
          const Text('To‘lov usuli:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          const SizedBox(height: 10),
          Row(
            children: [
              _buildMethodTab('CASH', 'Naqd pul', Icons.payments_outlined),
              const SizedBox(width: 8),
              _buildMethodTab('CARD', 'Plastik karta', Icons.credit_card_outlined),
              const SizedBox(width: 8),
              _buildMethodTab('ONLINE', 'Click / Payme', Icons.qr_code_scanner_rounded),
            ],
          ),
          const SizedBox(height: 18),

          if (_paymentMethod == 'CASH') ...[
            const Text('Qabul qilingan naqd pul:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
            const SizedBox(height: 6),
            TextFormField(
              controller: _receivedCashController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(hintText: '200 000 so\'m'),
              onChanged: (_) => setState(() {}),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPaymentLine(String title, double price) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(child: Text(title, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary), overflow: TextOverflow.ellipsis)),
          Text(Formatters.formatCurrency(price), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        ],
      ),
    );
  }

  Widget _buildMethodTab(String method, String title, IconData icon) {
    final isSelected = _paymentMethod == method;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _paymentMethod = method),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.mintLight : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: isSelected ? AppColors.primary : AppColors.border, width: isSelected ? 1.5 : 1),
          ),
          child: Column(
            children: [
              Icon(icon, color: isSelected ? AppColors.primary : AppColors.textMuted, size: 22),
              const SizedBox(height: 4),
              Text(
                title,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  color: isSelected ? AppColors.primary : AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
