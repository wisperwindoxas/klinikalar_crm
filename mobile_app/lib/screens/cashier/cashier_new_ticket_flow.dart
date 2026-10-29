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

      // Smart address matching for region and district
      String? foundRegion = p.region;
      String? foundDistrict = p.district;

      if ((foundRegion == null || foundRegion.isEmpty) && p.address != null) {
        for (final r in UzbekistanRegionsData.regions) {
          final cleanR = r.replaceAll(' viloyati', '').replaceAll(' shahri', '');
          if (p.address!.toLowerCase().contains(cleanR.toLowerCase())) {
            foundRegion = r;
            break;
          }
        }
      }

      if (foundRegion != null && UzbekistanRegionsData.regions.contains(foundRegion)) {
        _selectedRegion = foundRegion;
      }
      final districts = UzbekistanRegionsData.getDistricts(_selectedRegion);

      if ((foundDistrict == null || foundDistrict.isEmpty) && p.address != null) {
        for (final d in districts) {
          final cleanD = d.replaceAll(' tumani', '').replaceAll(' shahri', '');
          if (p.address!.toLowerCase().contains(cleanD.toLowerCase())) {
            foundDistrict = d;
            break;
          }
        }
      }

      if (foundDistrict != null && districts.contains(foundDistrict)) {
        _selectedDistrict = foundDistrict;
      } else if (districts.isNotEmpty) {
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
        List<PatientModel> allPatients = [];
        List<PatientModel> displayedPatients = [];
        bool isLoading = true;
        bool hasLoadedOnce = false;

        return StatefulBuilder(
          builder: (context, setModalState) {
            if (!hasLoadedOnce) {
              hasLoadedOnce = true;
              ApiService().getPatients().then((list) {
                setModalState(() {
                  allPatients = list;
                  displayedPatients = list;
                  isLoading = false;
                });
              }).catchError((_) {
                setModalState(() {
                  isLoading = false;
                });
              });
            }

            void filterPatients(String q) async {
              final query = q.trim().toLowerCase();
              if (query.isEmpty) {
                setModalState(() {
                  displayedPatients = allPatients;
                });
                return;
              }

              // Fast instant local filter
              final localMatches = allPatients.where((p) {
                final nameMatch = p.fullName.toLowerCase().contains(query);
                final phoneMatch = p.phone.replaceAll(RegExp(r'\D'), '').contains(query.replaceAll(RegExp(r'\D'), ''));
                final cardMatch = (p.patientNumber ?? '').toLowerCase().contains(query);
                final addrMatch = (p.address ?? '').toLowerCase().contains(query);
                return nameMatch || phoneMatch || cardMatch || addrMatch;
              }).toList();

              setModalState(() {
                displayedPatients = localMatches;
              });

              // Query remote backend if query has >= 2 chars
              if (query.length >= 2) {
                final remote = await ApiService().getPatients(search: q.trim());
                if (searchCtrl.text.trim().toLowerCase() == query) {
                  final map = {for (var p in localMatches) p.id: p};
                  for (var p in remote) {
                    map[p.id] = p;
                  }
                  setModalState(() {
                    displayedPatients = map.values.toList();
                  });
                }
              }
            }

            return Container(
              height: MediaQuery.of(context).size.height * 0.82,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
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
                      Row(
                        children: [
                          const Text(
                            'Mavjud bemorlar',
                            style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                          ),
                          if (!isLoading && displayedPatients.isNotEmpty) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withOpacity(0.12),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                '${displayedPatients.length}',
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
                              ),
                            ),
                          ],
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded, size: 22, color: AppColors.textMuted),
                        onPressed: () => Navigator.pop(context),
                        visualDensity: VisualDensity.compact,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: searchCtrl,
                    onChanged: filterPatients,
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.search_rounded, color: AppColors.primary),
                      hintText: 'Ism, telefon yoki karta raqami...',
                      suffixIcon: searchCtrl.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear_rounded, size: 18),
                              onPressed: () {
                                searchCtrl.clear();
                                filterPatients('');
                              },
                            )
                          : null,
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (isLoading)
                    const Expanded(
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            CircularProgressIndicator(color: AppColors.primary),
                            SizedBox(height: 12),
                            Text('Bemorlar ro‘yxati yuklanmoqda...', style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
                          ],
                        ),
                      ),
                    )
                  else if (displayedPatients.isEmpty)
                    Expanded(
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.person_search_rounded, size: 52, color: AppColors.textMuted),
                            const SizedBox(height: 10),
                            Text(
                              searchCtrl.text.isEmpty
                                  ? 'Ro‘yxatda hali bemorlar mavjud emas'
                                  : 'So‘rov bo‘yicha bemor topilmadi',
                              style: const TextStyle(fontSize: 14, color: AppColors.textMuted, fontWeight: FontWeight.w500),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    Expanded(
                      child: ListView.separated(
                        itemCount: displayedPatients.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (context, idx) {
                          final p = displayedPatients[idx];
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
                            borderRadius: BorderRadius.circular(16),
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    radius: 22,
                                    backgroundColor: isFemale ? const Color(0xFFFCE7F3) : const Color(0xFFEFF6FF),
                                    child: Icon(
                                      isFemale ? Icons.female_rounded : Icons.male_rounded,
                                      color: isFemale ? const Color(0xFFDB2777) : const Color(0xFF2563EB),
                                      size: 22,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Expanded(
                                              child: Text(
                                                p.fullName,
                                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary),
                                              ),
                                            ),
                                            if (p.patientNumber != null && p.patientNumber!.isNotEmpty)
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: const Color(0xFFF1F5F9),
                                                  borderRadius: BorderRadius.circular(6),
                                                ),
                                                child: Text(
                                                  '#${p.patientNumber}',
                                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
                                                ),
                                              ),
                                          ],
                                        ),
                                        const SizedBox(height: 3),
                                        Row(
                                          children: [
                                            const Icon(Icons.phone_rounded, size: 12, color: AppColors.textMuted),
                                            const SizedBox(width: 4),
                                            Text(
                                              Formatters.formatPhone(p.phone),
                                              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                            ),
                                            if (p.totalVisits > 0) ...[
                                              const SizedBox(width: 8),
                                              Text('• ${p.totalVisits} tashrif', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                                            ],
                                          ],
                                        ),
                                        if (p.address != null && p.address!.isNotEmpty) ...[
                                          const SizedBox(height: 3),
                                          Row(
                                            children: [
                                              const Icon(Icons.location_on_outlined, size: 12, color: AppColors.textMuted),
                                              const SizedBox(width: 4),
                                              Expanded(
                                                child: Text(
                                                  p.address!,
                                                  style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 8),
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

  // ==================== BOTTOM SHEETS FOR GENDER, REGION, DISTRICT ====================

  void _showGenderBottomSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Jinsni tanlang', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                IconButton(
                  icon: const Icon(Icons.close_rounded, size: 20, color: AppColors.textMuted),
                  onPressed: () => Navigator.pop(ctx),
                  visualDensity: VisualDensity.compact,
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Erkak
            InkWell(
              onTap: () {
                setState(() => _selectedGender = 'male');
                Navigator.pop(ctx);
              },
              borderRadius: BorderRadius.circular(16),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: _selectedGender == 'male' ? const Color(0xFFEFF6FF) : AppColors.background,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: _selectedGender == 'male' ? const Color(0xFF2563EB) : AppColors.border,
                    width: _selectedGender == 'male' ? 1.8 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: const Color(0xFFDBEAFE),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Center(
                        child: Icon(Icons.male_rounded, color: Color(0xFF2563EB), size: 26),
                      ),
                    ),
                    const SizedBox(width: 14),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Erkak', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                          SizedBox(height: 2),
                          Text('Bemor jinsi: Erkak kishi', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                        ],
                      ),
                    ),
                    if (_selectedGender == 'male')
                      const Icon(Icons.check_circle_rounded, color: Color(0xFF2563EB), size: 22)
                    else
                      const Icon(Icons.radio_button_unchecked_rounded, color: AppColors.textMuted, size: 20),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            // Ayol
            InkWell(
              onTap: () {
                setState(() => _selectedGender = 'female');
                Navigator.pop(ctx);
              },
              borderRadius: BorderRadius.circular(16),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: _selectedGender == 'female' ? const Color(0xFFFDF2F8) : AppColors.background,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: _selectedGender == 'female' ? const Color(0xFFDB2777) : AppColors.border,
                    width: _selectedGender == 'female' ? 1.8 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFCE7F3),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Center(
                        child: Icon(Icons.female_rounded, color: Color(0xFFDB2777), size: 26),
                      ),
                    ),
                    const SizedBox(width: 14),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Ayol', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                          SizedBox(height: 2),
                          Text('Bemor jinsi: Ayol kishi', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                        ],
                      ),
                    ),
                    if (_selectedGender == 'female')
                      const Icon(Icons.check_circle_rounded, color: Color(0xFFDB2777), size: 22)
                    else
                      const Icon(Icons.radio_button_unchecked_rounded, color: AppColors.textMuted, size: 20),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  void _showRegionBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        final searchCtrl = TextEditingController();
        List<String> displayedRegions = List.from(UzbekistanRegionsData.regions);

        return StatefulBuilder(
          builder: (context, setModalState) {
            void filter(String q) {
              final query = q.trim().toLowerCase();
              setModalState(() {
                if (query.isEmpty) {
                  displayedRegions = List.from(UzbekistanRegionsData.regions);
                } else {
                  displayedRegions = UzbekistanRegionsData.regions
                      .where((r) => r.toLowerCase().contains(query))
                      .toList();
                }
              });
            }

            return Container(
              height: MediaQuery.of(context).size.height * 0.78,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
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
                        'Viloyatni tanlang',
                        style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded, size: 22, color: AppColors.textMuted),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: searchCtrl,
                    onChanged: filter,
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.search_rounded, color: AppColors.primary),
                      hintText: 'Viloyat nomi bo‘yicha qidirish...',
                      suffixIcon: searchCtrl.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear_rounded, size: 18),
                              onPressed: () {
                                searchCtrl.clear();
                                filter('');
                              },
                            )
                          : null,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: ListView.separated(
                      itemCount: displayedRegions.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 6),
                      itemBuilder: (context, idx) {
                        final region = displayedRegions[idx];
                        final isSel = region == _selectedRegion;

                        return InkWell(
                          onTap: () {
                            setState(() {
                              _selectedRegion = region;
                              final districts = UzbekistanRegionsData.getDistricts(region);
                              _selectedDistrict = districts.isNotEmpty ? districts.first : '';
                            });
                            Navigator.pop(ctx);
                          },
                          borderRadius: BorderRadius.circular(14),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                            decoration: BoxDecoration(
                              color: isSel ? const Color(0xFFEFF6FF) : AppColors.background,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: isSel ? AppColors.primary : AppColors.border,
                                width: isSel ? 1.5 : 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 36,
                                  height: 36,
                                  decoration: BoxDecoration(
                                    color: isSel ? AppColors.primary.withOpacity(0.15) : Colors.white,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Icon(
                                    Icons.location_on_outlined,
                                    size: 19,
                                    color: isSel ? AppColors.primary : AppColors.textSecondary,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    region,
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: isSel ? FontWeight.bold : FontWeight.w500,
                                      color: isSel ? AppColors.primary : AppColors.textPrimary,
                                    ),
                                  ),
                                ),
                                if (isSel)
                                  const Icon(Icons.check_circle_rounded, color: AppColors.primary, size: 20),
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

  void _showDistrictBottomSheet() {
    final allDistricts = UzbekistanRegionsData.getDistricts(_selectedRegion);
    if (allDistricts.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ushbu viloyat uchun tumanlar mavjud emas'), backgroundColor: AppColors.warning),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        final searchCtrl = TextEditingController();
        List<String> displayedDistricts = List.from(allDistricts);

        return StatefulBuilder(
          builder: (context, setModalState) {
            void filter(String q) {
              final query = q.trim().toLowerCase();
              setModalState(() {
                if (query.isEmpty) {
                  displayedDistricts = List.from(allDistricts);
                } else {
                  displayedDistricts = allDistricts
                      .where((d) => d.toLowerCase().contains(query))
                      .toList();
                }
              });
            }

            return Container(
              height: MediaQuery.of(context).size.height * 0.78,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
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
                      Expanded(
                        child: Text(
                          '$_selectedRegion tumanlari',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded, size: 22, color: AppColors.textMuted),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: searchCtrl,
                    onChanged: filter,
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.search_rounded, color: AppColors.primary),
                      hintText: 'Tuman / shahar bo‘yicha qidirish...',
                      suffixIcon: searchCtrl.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear_rounded, size: 18),
                              onPressed: () {
                                searchCtrl.clear();
                                filter('');
                              },
                            )
                          : null,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: ListView.separated(
                      itemCount: displayedDistricts.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 6),
                      itemBuilder: (context, idx) {
                        final dist = displayedDistricts[idx];
                        final isSel = dist == _selectedDistrict;

                        return InkWell(
                          onTap: () {
                            setState(() {
                              _selectedDistrict = dist;
                            });
                            Navigator.pop(ctx);
                          },
                          borderRadius: BorderRadius.circular(14),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                            decoration: BoxDecoration(
                              color: isSel ? const Color(0xFFEFF6FF) : AppColors.background,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: isSel ? AppColors.primary : AppColors.border,
                                width: isSel ? 1.5 : 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 36,
                                  height: 36,
                                  decoration: BoxDecoration(
                                    color: isSel ? AppColors.primary.withOpacity(0.15) : Colors.white,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Icon(
                                    Icons.apartment_rounded,
                                    size: 19,
                                    color: isSel ? AppColors.primary : AppColors.textSecondary,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    dist,
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: isSel ? FontWeight.bold : FontWeight.w500,
                                      color: isSel ? AppColors.primary : AppColors.textPrimary,
                                    ),
                                  ),
                                ),
                                if (isSel)
                                  const Icon(Icons.check_circle_rounded, color: AppColors.primary, size: 20),
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
    try {
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

      // If no existing patient selected, create or find patient in database
      if (patientId == null || patientId.isEmpty) {
        final pRes = await ApiService().createPatient({
          'fullName': fullName,
          'phone': cleanPhone,
          'gender': _selectedGender.toUpperCase(),
          'address': fullAddress,
          'region': _selectedRegion,
        });

        if (pRes['success'] == false && pRes['data'] == null && pRes['patient'] == null) {
          setState(() => _isLoading = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(pRes['message'] ?? 'Bemor qo‘shishda xatolik'), backgroundColor: AppColors.error),
          );
          return;
        }

        final patientData = pRes['data'] is Map<String, dynamic>
            ? pRes['data']
            : (pRes['patient'] is Map<String, dynamic> ? pRes['patient'] : pRes);

        patientId = (patientData['id'] ?? patientData['patient_id'])?.toString();
      }

      if (patientId == null || patientId.isEmpty) {
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
          'doctorId': _selectedDoctor?.id ?? (_doctors.isNotEmpty ? _doctors.first.id : 'doc_01'),
          'serviceId': s.id,
          'price': s.price,
          'paymentMethod': _paymentMethod,
          'serviceName': s.name,
        });
      }

      if (items.isEmpty) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Kamida bitta shifokor yoki xizmat tanlang'), backgroundColor: AppColors.error),
        );
        return;
      }

      final receivedText = _receivedCashController.text.replaceAll(RegExp(r'\D'), '');
      final double receivedAmount = double.tryParse(receivedText) ?? _totalPrice;
      final double paidAmount = (_paymentMethod != 'CASH' || receivedAmount <= 0) ? _totalPrice : receivedAmount;

      final regRes = await ApiService().multiRegister(
        patientId: patientId,
        items: items,
        payment: {
          'method': _paymentMethod == 'ONLINE' ? 'TRANSFER' : _paymentMethod,
          'amountPaid': paidAmount,
        },
      );

      setState(() => _isLoading = false);

      if (!mounted) return;

      if (regRes['success'] != false) {
        Navigator.pop(context);
        final dynamic rawTickets = regRes['data']?['tickets'] ?? regRes['tickets'];
        final tickets = (rawTickets is List) ? rawTickets : [];
        final firstTicket = tickets.isNotEmpty && tickets.first is Map ? tickets.first : {};

        final ticketNumber = firstTicket['full_number'] ?? firstTicket['ticketNumber'] ?? firstTicket['number'] ?? 'T-001';
        final patientDisplayName = firstTicket['patient_name'] ?? fullName;
        final rawDocName = firstTicket['doctor_name'] ?? _selectedDoctor?.fullName;
        final doctorDisplayName = (rawDocName != null && rawDocName.toString().trim().isNotEmpty)
            ? rawDocName.toString().trim()
            : 'Shifokor';
        final rawRoom = firstTicket['cabinet_number'] ?? _selectedDoctor?.roomNumber;
        final roomDisplayName = (rawRoom != null && rawRoom.toString().trim().isNotEmpty)
            ? rawRoom.toString().trim()
            : '1';

        CashierTicketSheet.show(
          context,
          ticketData: {
            'ticketNumber': ticketNumber,
            'patientName': patientDisplayName,
            'doctorName': doctorDisplayName,
            'roomNumber': roomDisplayName,
            'serviceName': _cart.isNotEmpty ? _cart.first.name : 'Konsultatsiya (${_selectedDoctor?.specialty ?? "Umumiy"})',
            'amount': _totalPrice,
          },
          onDone: widget.onFinished,
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(regRes['message'] ?? 'Talon chiqarishda xatolik'), backgroundColor: AppColors.error),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Kutilmagan xatolik: $e'), backgroundColor: AppColors.error),
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
                      if (_receivedCashController.text.trim().isEmpty) {
                        _receivedCashController.text = _totalPrice.toInt().toString();
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

          // Gender and Region (Modern Bottom Sheet Selectors)
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Jinsi', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
                    const SizedBox(height: 6),
                    InkWell(
                      onTap: _showGenderBottomSheet,
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              _selectedGender == 'female' ? Icons.female_rounded : Icons.male_rounded,
                              color: _selectedGender == 'female' ? const Color(0xFFDB2777) : const Color(0xFF2563EB),
                              size: 19,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _selectedGender == 'female' ? 'Ayol' : 'Erkak',
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                              ),
                            ),
                            const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.textMuted, size: 20),
                          ],
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
                    InkWell(
                      onTap: _showRegionBottomSheet,
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.location_on_outlined, color: AppColors.primary, size: 18),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                _selectedRegion.isNotEmpty ? _selectedRegion : 'Viloyatni tanlang',
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.textMuted, size: 20),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // District Bottom Sheet Selector
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Tuman / Shahar', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
              const SizedBox(height: 6),
              InkWell(
                onTap: _showDistrictBottomSheet,
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.apartment_rounded, color: AppColors.primary, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _selectedDistrict.isNotEmpty ? _selectedDistrict : 'Tuman / shaharni tanlang',
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.textMuted, size: 20),
                    ],
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
    final receivedNum = double.tryParse(_receivedCashController.text.replaceAll(RegExp(r'\D'), '')) ?? _totalPrice;
    final change = (receivedNum > _totalPrice) ? (receivedNum - _totalPrice) : 0.0;

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
                  _buildPaymentLine('Konsultatsiya (${_selectedDoctor!.fullName.isNotEmpty ? _selectedDoctor!.fullName : _selectedDoctor!.specialty})', _selectedDoctor!.consultationPrice),
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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Qabul qilingan naqd pul:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
                InkWell(
                  onTap: () {
                    setState(() {
                      _receivedCashController.text = _totalPrice.toInt().toString();
                    });
                  },
                  child: const Text('Aniq summa', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary)),
                ),
              ],
            ),
            const SizedBox(height: 6),
            TextFormField(
              controller: _receivedCashController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                hintText: '${Formatters.formatNumber(_totalPrice)} so‘m',
                suffixText: 'so‘m',
              ),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 10),

            // Quick sum chips
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildQuickCashChip(_totalPrice.toInt()),
                if (_totalPrice < 100000) _buildQuickCashChip(100000),
                if (_totalPrice < 200000) _buildQuickCashChip(200000),
                if (_totalPrice < 500000) _buildQuickCashChip(500000),
              ],
            ),
            const SizedBox(height: 14),

            if (change > 0)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: AppColors.successLight.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.success.withOpacity(0.5)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Qaytim:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.success)),
                    Text(
                      Formatters.formatCurrency(change),
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: AppColors.success),
                    ),
                  ],
                ),
              ),
          ] else ...[
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.mintLight.withOpacity(0.5),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.primary.withOpacity(0.4)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle_outline_rounded, color: AppColors.primary, size: 22),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      _paymentMethod == 'CARD'
                          ? 'Terminal orqali ${Formatters.formatCurrency(_totalPrice)} to‘lov qilinadi'
                          : 'Online (Click/Payme) orqali ${Formatters.formatCurrency(_totalPrice)} to‘lov qilinadi',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildQuickCashChip(int amount) {
    return InkWell(
      onTap: () {
        setState(() {
          _receivedCashController.text = amount.toString();
        });
      },
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.border),
        ),
        child: Text(
          Formatters.formatCurrency(amount.toDouble()),
          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
        ),
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
