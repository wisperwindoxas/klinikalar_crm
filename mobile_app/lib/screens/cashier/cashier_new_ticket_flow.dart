import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/regions_data.dart';
import '../../core/utils/formatters.dart';
import '../../models/doctor_model.dart';
import '../../models/patient_model.dart';
import '../../models/service_model.dart';
import '../../services/api_service.dart';
import 'cashier_ticket_sheet.dart';

class CashierNewTicketFlow extends StatefulWidget {
  final VoidCallback onFinished;
  final PatientModel? initialPatient;

  const CashierNewTicketFlow({Key? key, required this.onFinished, this.initialPatient}) : super(key: key);

  static void show(BuildContext context, {required VoidCallback onFinished, PatientModel? initialPatient}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => CashierNewTicketFlow(onFinished: onFinished, initialPatient: initialPatient),
    );
  }

  @override
  State<CashierNewTicketFlow> createState() => _CashierNewTicketFlowState();
}

class _CashierNewTicketFlowState extends State<CashierNewTicketFlow> {
  int _currentStep = 0; // 0: Patient, 1: Doctor & Services, 2: Payment
  bool _isLoading = false;

  // Patient fields
  PatientModel? _selectedPatient;
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  String _selectedGender = 'male';
  String _selectedRegion = 'Toshkent shahri';
  String _selectedDistrict = 'Yunusobod tumani';
  final _addressController = TextEditingController();

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
    if (widget.initialPatient != null) {
      _selectExistingPatient(widget.initialPatient!);
      _currentStep = 1;
    }
    _loadInitialData();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _receivedCashController.dispose();
    super.dispose();
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

  void _selectExistingPatient(PatientModel p) {
    setState(() {
      _selectedPatient = p;
      _nameController.text = p.fullName;

      final digits = p.phone.replaceAll(RegExp(r'\D'), '');
      String local9 = digits.length >= 9 ? digits.substring(digits.length - 9) : digits;
      if (local9.length == 9) {
        _phoneController.text = '(${local9.substring(0, 2)}) ${local9.substring(2, 5)}-${local9.substring(5, 7)}-${local9.substring(7, 9)}';
      } else {
        _phoneController.text = local9;
      }

      _selectedGender = (p.gender?.toLowerCase() == 'female') ? 'female' : 'male';

      if (p.region != null && UzbekistanRegionsData.regions.contains(p.region)) {
        _selectedRegion = p.region!;
      }
      final districts = UzbekistanRegionsData.getDistricts(_selectedRegion);
      if (districts.isNotEmpty) {
        _selectedDistrict = districts.first;
      }

      _addressController.text = p.address ?? '';
    });
  }

  void _showExistingPatientPicker() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        final searchCtrl = TextEditingController();
        List<PatientModel> searchResults = [];
        bool searching = false;

        return StatefulBuilder(
          builder: (context, setModalState) {
            void performSearch(String q) async {
              if (q.trim().length < 2) {
                setModalState(() => searchResults = []);
                return;
              }
              setModalState(() => searching = true);
              final res = await ApiService().getPatients(search: q.trim());
              setModalState(() {
                searchResults = res;
                searching = false;
              });
            }

            return Container(
              height: MediaQuery.of(context).size.height * 0.75,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              padding: EdgeInsets.fromLTRB(20, 14, 20, MediaQuery.of(context).viewInsets.bottom + 16),
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
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Mavjud bemorni tanlash',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, size: 20, color: AppColors.textMuted),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  TextFormField(
                    controller: searchCtrl,
                    autofocus: true,
                    onChanged: performSearch,
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.search_rounded, color: AppColors.primary),
                      hintText: 'Bemor ismi yoki telefon raqami...',
                      suffixIcon: searchCtrl.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, size: 18),
                              onPressed: () {
                                searchCtrl.clear();
                                setModalState(() => searchResults = []);
                              },
                            )
                          : null,
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (searching)
                    const Padding(
                      padding: EdgeInsets.all(20),
                      child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
                    )
                  else if (searchResults.isEmpty)
                    Expanded(
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.person_search_rounded, size: 48, color: AppColors.textMuted),
                            const SizedBox(height: 10),
                            Text(
                              searchCtrl.text.isEmpty
                                  ? 'Bemorni topish uchun ism yoki telefon raqamini yozing'
                                  : 'Bemor topilmadi',
                              style: const TextStyle(fontSize: 13, color: AppColors.textMuted),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    Expanded(
                      child: ListView.separated(
                        itemCount: searchResults.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (context, idx) {
                          final p = searchResults[idx];
                          final isFemale = (p.gender ?? '').toLowerCase() == 'female';

                          return InkWell(
                            onTap: () {
                              _selectExistingPatient(p);
                              Navigator.pop(context);
                              ScaffoldMessenger.of(this.context).showSnackBar(
                                SnackBar(
                                  content: Text('Bemor ma‘lumotlari to‘ldirildi: ${p.fullName}'),
                                  backgroundColor: AppColors.success,
                                ),
                              );
                            },
                            borderRadius: BorderRadius.circular(14),
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    backgroundColor: isFemale ? const Color(0xFFFCE7F3) : const Color(0xFFEFF6FF),
                                    child: Icon(
                                      isFemale ? Icons.face_3_rounded : Icons.face_6_rounded,
                                      color: isFemale ? const Color(0xFFDB2777) : const Color(0xFF2563EB),
                                      size: 20,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(p.fullName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                        const SizedBox(height: 2),
                                        Text(Formatters.formatPhone(p.phone), style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                        if (p.address != null && p.address!.isNotEmpty)
                                          Text(p.address!, style: const TextStyle(fontSize: 11, color: AppColors.textMuted), maxLines: 1, overflow: TextOverflow.ellipsis),
                                      ],
                                    ),
                                  ),
                                  const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.textMuted),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                ],
              ),
            );
          },
        );
      },
    );
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

    // Validate name
    final fullName = _nameController.text.trim();
    if (fullName.isEmpty) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Bemorning to‘liq ismini kiriting'), backgroundColor: AppColors.error),
      );
      return;
    }

    // Validate phone (9 digits)
    final digits = _phoneController.text.replaceAll(RegExp(r'\D'), '');
    if (digits.length != 9) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Iltimos, telefon raqamini to‘liq kiriting (9 ta raqam)'), backgroundColor: AppColors.error),
      );
      return;
    }
    final cleanPhone = '+998$digits';

    final fullAddress = '$_selectedRegion, $_selectedDistrict${_addressController.text.trim().isNotEmpty ? ", " + _addressController.text.trim() : ""}';

    // If no existing patient selected, create new patient in database
    if (patientId == null) {
      final pRes = await ApiService().createPatient({
        'fullName': fullName,
        'phone': cleanPhone,
        'gender': _selectedGender,
        'address': fullAddress,
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
        const SnackBar(content: Text('Bemor ID aniqlanmadi'), backgroundColor: AppColors.error),
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
          'patientName': fullName,
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
                      if (_nameController.text.trim().isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Bemorning to‘liq ismini kiriting'), backgroundColor: AppColors.error),
                        );
                        return;
                      }
                      final digits = _phoneController.text.replaceAll(RegExp(r'\D'), '');
                      if (digits.length != 9) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Iltimos, telefon raqamini 9 ta raqam shaklida kiriting'), backgroundColor: AppColors.error),
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
    final availableDistricts = UzbekistanRegionsData.getDistricts(_selectedRegion);

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 1. Prominent "Mavjud bemorlarni tanlash" button at the very top
          InkWell(
            onTap: _showExistingPatientPicker,
            borderRadius: BorderRadius.circular(14),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.mintLight.withOpacity(0.5),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.primary, width: 1.5),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.person_search_rounded, color: Colors.white, size: 20),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Mavjud bemorlarni tanlash',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primary),
                        ),
                        Text(
                          'Baza orqali avtomatik to‘ldirish',
                          style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: AppColors.primary),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),

          // If a patient was picked from the database, show indicator banner
          if (_selectedPatient != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.successLight.withOpacity(0.5),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.success.withOpacity(0.5)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Baza bemori: ${_selectedPatient!.fullName}',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.success),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  InkWell(
                    onTap: () {
                      setState(() {
                        _selectedPatient = null;
                        _nameController.clear();
                        _phoneController.clear();
                        _addressController.clear();
                      });
                    },
                    child: const Padding(
                      padding: EdgeInsets.all(4),
                      child: Text('Tozalash', style: TextStyle(fontSize: 11, color: AppColors.error, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],

          const Text(
            'Bemor Ma‘lumotlarini Kiritish',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 10),

          // Full Name
          const Text('F.I.Sh (To‘liq ismi)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
          const SizedBox(height: 6),
          TextFormField(
            controller: _nameController,
            decoration: const InputDecoration(
              hintText: 'Masalan: Olimov Sanjar Rustamovich',
              prefixIcon: Icon(Icons.person_outline_rounded, color: AppColors.primary, size: 20),
            ),
          ),
          const SizedBox(height: 12),

          // Phone Number (Formatted 9 digits with Uzbekistan flag and static +998, safe backspace)
          const Text('Telefon raqami', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
          const SizedBox(height: 6),
          TextFormField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            inputFormatters: [Uzbek9DigitPhoneFormatter()],
            decoration: InputDecoration(
              prefixIcon: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                child: const Text(
                  '🇺🇿 +998',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              hintText: '(90) 123-45-67',
              suffixIcon: _phoneController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, size: 18),
                      onPressed: () {
                        _phoneController.clear();
                        setState(() {});
                      },
                    )
                  : null,
            ),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 12),

          // Gender and Region
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
                          value: UzbekistanRegionsData.regions.contains(_selectedRegion)
                              ? _selectedRegion
                              : UzbekistanRegionsData.regions.first,
                          isExpanded: true,
                          items: UzbekistanRegionsData.regions
                              .map((r) => DropdownMenuItem(
                                    value: r,
                                    child: Text(r, style: const TextStyle(fontSize: 11), overflow: TextOverflow.ellipsis),
                                  ))
                              .toList(),
                          onChanged: (val) {
                            if (val != null) {
                              setState(() {
                                _selectedRegion = val;
                                final districts = UzbekistanRegionsData.getDistricts(val);
                                _selectedDistrict = districts.isNotEmpty ? districts.first : '';
                              });
                            }
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

          // District Dropdown (dynamically populated based on selected region)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Tuman / Shahar', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
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
                    value: availableDistricts.contains(_selectedDistrict)
                        ? _selectedDistrict
                        : (availableDistricts.isNotEmpty ? availableDistricts.first : null),
                    isExpanded: true,
                    items: availableDistricts
                        .map((d) => DropdownMenuItem(
                              value: d,
                              child: Text(d, style: const TextStyle(fontSize: 12), overflow: TextOverflow.ellipsis),
                            ))
                        .toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => _selectedDistrict = val);
                    },
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Additional address
          const Text('Qo‘shimcha manzil (Mahalla, ko‘cha, uy)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
          const SizedBox(height: 6),
          TextFormField(
            controller: _addressController,
            decoration: const InputDecoration(
              hintText: 'Masalan: Bog‘ishamol MFY, 15-uy',
              prefixIcon: Icon(Icons.location_on_outlined, color: AppColors.textMuted, size: 20),
            ),
          ),
          const SizedBox(height: 10),
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Shifokorni tanlang:', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
              if (_doctors.isNotEmpty)
                Text('${_doctors.length} nafar shifokor', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
            ],
          ),
          const SizedBox(height: 10),

          if (_doctors.isEmpty)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
              ),
              child: Center(
                child: Column(
                  children: [
                    const Icon(Icons.medical_services_outlined, size: 36, color: AppColors.textMuted),
                    const SizedBox(height: 8),
                    const Text('Shifokorlar ro‘yxati yuklanmoqda yoki topilmadi', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                    const SizedBox(height: 8),
                    TextButton.icon(
                      onPressed: _loadInitialData,
                      icon: const Icon(Icons.refresh, size: 16),
                      label: const Text('Qayta yuklash'),
                    ),
                  ],
                ),
              ),
            )
          else ...[
            // Doctor cards list
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _doctors.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final doc = _doctors[index];
                final isSelected = _selectedDoctor?.id == doc.id;

                return InkWell(
                  onTap: () => setState(() => _selectedDoctor = doc),
                  borderRadius: BorderRadius.circular(14),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.mintLight.withOpacity(0.6) : Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isSelected ? AppColors.primary : AppColors.border,
                        width: isSelected ? 2 : 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 20,
                          backgroundColor: isSelected ? AppColors.primary : AppColors.mintLight,
                          child: Icon(
                            Icons.person_rounded,
                            color: isSelected ? Colors.white : AppColors.primary,
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(doc.fullName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                              const SizedBox(height: 2),
                              Text('${doc.specialty} • ${doc.roomNumber}-xona', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              Formatters.formatCurrency(doc.consultationPrice),
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
                            ),
                            const SizedBox(height: 4),
                            Icon(
                              isSelected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                              color: isSelected ? AppColors.primary : AppColors.textMuted,
                              size: 20,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ],

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
