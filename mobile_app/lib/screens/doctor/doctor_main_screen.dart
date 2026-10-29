import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants/api_constants.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../models/doctor_model.dart';
import '../../models/patient_model.dart';
import '../../models/ticket_model.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/responsive_frame.dart';
import '../../services/security_service.dart';
import '../../widgets/user_profile_sheet.dart';
import '../auth/login_screen.dart';
import '../auth/pin_setup_sheet.dart';
import '../manager/manager_patient_detail_sheet.dart';
import 'doctor_offline_sheet.dart';
import 'doctor_patient_sheet.dart';

class DoctorMainScreen extends StatefulWidget {
  const DoctorMainScreen({Key? key}) : super(key: key);

  @override
  State<DoctorMainScreen> createState() => _DoctorMainScreenState();
}

class _DoctorMainScreenState extends State<DoctorMainScreen> {
  int _currentTabIndex = 0;
  bool _isLoading = true;
  bool _isCallingNext = false;
  bool _isDoctorActive = true;

  List<DoctorModel> _allDoctors = [];
  DoctorModel? _selectedDoctor;

  List<TicketModel> _tickets = [];
  List<PatientModel> _patients = [];
  final _patientSearchCtrl = TextEditingController();
  final _historySearchCtrl = TextEditingController();
  int _visiblePatientsCount = 15;

  TicketModel? _currentInServiceTicket;
  TicketModel? _nextWaitingTicket;

  // Live timer for active consultation
  Timer? _consultationTimer;
  int _consultationSeconds = 0;

  String _queueFilter = 'ALL'; // ALL, WAITING, IN_SERVICE, COMPLETED, SKIPPED

  @override
  void initState() {
    super.initState();
    _fetchData();
    _startTimer();
  }

  @override
  void dispose() {
    _consultationTimer?.cancel();
    _patientSearchCtrl.dispose();
    _historySearchCtrl.dispose();
    super.dispose();
  }

  void _startTimer() {
    _consultationTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_currentInServiceTicket != null && mounted) {
        setState(() {
          _consultationSeconds++;
        });
      }
    });
  }

  String _formatTimer(int totalSecs) {
    final m = (totalSecs ~/ 60).toString().padLeft(2, '0');
    final s = (totalSecs % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedDocId = prefs.getString('active_doctor_id');

      final doctors = await ApiService().getDoctors();
      _allDoctors = doctors;

      final user = AuthService().currentUser;
      DoctorModel? matchedDoctor;

      if (savedDocId != null && savedDocId.isNotEmpty) {
        matchedDoctor = doctors.cast<DoctorModel?>().firstWhere(
              (d) => d?.id == savedDocId,
              orElse: () => null,
            );
      }

      if (matchedDoctor == null && user?.doctorId != null) {
        matchedDoctor = doctors.cast<DoctorModel?>().firstWhere(
              (d) => d?.id == user!.doctorId,
              orElse: () => null,
            );
      }

      if (matchedDoctor == null && user?.id != null) {
        matchedDoctor = doctors.cast<DoctorModel?>().firstWhere(
              (d) => d?.id == user!.id,
              orElse: () => null,
            );
      }

      if (matchedDoctor == null && doctors.isNotEmpty) {
        matchedDoctor = doctors.first;
      }

      _selectedDoctor = matchedDoctor;
      final doctorId = _selectedDoctor?.id ?? user?.doctorId;

      final tickets = await ApiService().getTickets(doctorId: doctorId);
      final patients = await ApiService().getPatients();

      // Find active ticket (CALLED, IN_PROGRESS, or IN_SERVICE)
      final active = tickets.cast<TicketModel?>().firstWhere(
            (t) => t?.isActive == true,
            orElse: () => null,
          );

      // Find next waiting ticket
      final nextWaiting = tickets.cast<TicketModel?>().firstWhere(
            (t) => t?.isWaiting == true,
            orElse: () => null,
          );

      // Calculate elapsed time if active ticket has start/call timestamp
      if (active != null) {
        final startIso = active.startedAt ?? active.calledAt;
        if (startIso != null) {
          try {
            final parsed = DateTime.parse(startIso).toLocal();
            final diff = DateTime.now().difference(parsed).inSeconds;
            _consultationSeconds = diff > 0 ? diff : 0;
          } catch (_) {
            _consultationSeconds = 0;
          }
        }
      } else {
        _consultationSeconds = 0;
      }

      setState(() {
        _tickets = tickets;
        _patients = patients;
        _currentInServiceTicket = active;
        _nextWaitingTicket = nextWaiting;
        _isLoading = false;
      });
    } catch (e) {
      print('DoctorMainScreen _fetchData error: $e');
      setState(() => _isLoading = false);
    }
  }

  // 1. Keyingi bemorni chaqirish (Call Next)
  Future<void> _callNextPatient() async {
    final doctorId = _selectedDoctor?.id ?? AuthService().currentUser?.doctorId;
    if (doctorId == null || doctorId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Shifokor profili aniqlanmadi'), backgroundColor: AppColors.error),
      );
      return;
    }

    setState(() => _isCallingNext = true);
    final res = await ApiService().callNext(doctorId);
    setState(() => _isCallingNext = false);

    if (res['success'] != false) {
      final ticketNumber = res['ticketNumber'] ??
          (res['data'] is Map ? (res['data']['full_number'] ?? res['data']['fullNumber']) : null) ??
          'Navbatdagi bemor';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('$ticketNumber raqamli bemor chaqirildi! TV monitoriga e\'lon uzatildi.'),
          backgroundColor: AppColors.primary,
        ),
      );
      _consultationSeconds = 0;
      await _fetchData();
    } else {
      await _fetchData();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res['message'] ?? 'Navbatda kutayotgan bemor yo‘q'), backgroundColor: AppColors.warning),
      );
    }
  }

  // 2. Qayta chaqirish (Recall)
  Future<void> _recallPatient() async {
    if (_currentInServiceTicket == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Qayta chaqirish uchun faol bemor yo‘q'), backgroundColor: AppColors.warning),
      );
      return;
    }
    final res = await ApiService().recallTicket(_currentInServiceTicket!.id);
    if (!mounted) return;
    if (res['success'] != false) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${_currentInServiceTicket!.ticketNumber} qayta chaqirildi! TV monitorida ovozli e\'lon yangradi.'),
          backgroundColor: const Color(0xFF0284C7),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res['message'] ?? 'Xatolik yuz berdi'), backgroundColor: AppColors.warning),
      );
    }
  }

  // 3. Oldingi bemorni ko'rish (Previous Patient)
  void _showPreviousPatient() {
    final completed = _tickets.where((t) => t.isCompleted).toList();
    if (completed.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Avvalgi yakunlangan bemorlar mavjud emas'), backgroundColor: AppColors.warning),
      );
      return;
    }

    // Sort descending by completedAt / calledAt so the most recently completed patient is FIRST
    completed.sort((a, b) {
      if (a.completedAt != null && b.completedAt != null) {
        return b.completedAt!.compareTo(a.completedAt!);
      }
      if (a.calledAt != null && b.calledAt != null) {
        return b.calledAt!.compareTo(a.calledAt!);
      }
      return 0;
    });

    // If timestamps were null or identical, reverse the original list order to pick latest
    final sortedCompleted = (completed.first.completedAt != null || completed.first.calledAt != null)
        ? completed
        : _tickets.where((t) => t.isCompleted).toList().reversed.toList();

    int selectedIdx = 0;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          final patient = sortedCompleted[selectedIdx];
          final hasConclusion = (patient.doctorConclusion != null && patient.doctorConclusion!.trim().isNotEmpty) ||
              (patient.notes != null && patient.notes!.trim().isNotEmpty);

          return Container(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.82,
            ),
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
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
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.history_rounded, size: 15, color: Color(0xFFD97706)),
                          const SizedBox(width: 4),
                          Text(
                            selectedIdx == 0 ? 'Oldingi Bemor (Oxirgi)' : 'Oldingi Bemor #${selectedIdx + 1}',
                            style: const TextStyle(color: Color(0xFFD97706), fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, color: AppColors.textMuted),
                      onPressed: () => Navigator.pop(ctx),
                      visualDensity: VisualDensity.compact,
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // If multiple completed patients, show quick horizontal selector pills
                if (sortedCompleted.length > 1) ...[
                  SizedBox(
                    height: 36,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: sortedCompleted.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (c, idx) {
                        final isSel = idx == selectedIdx;
                        final t = sortedCompleted[idx];
                        return InkWell(
                          onTap: () => setModalState(() => selectedIdx = idx),
                          borderRadius: BorderRadius.circular(10),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: isSel ? AppColors.primary : AppColors.background,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: isSel ? AppColors.primary : AppColors.border),
                            ),
                            child: Row(
                              children: [
                                Text(
                                  t.ticketNumber,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: isSel ? Colors.white : AppColors.textPrimary,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  idx == 0 ? '(Oxirgi)' : '#${idx + 1}',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: isSel ? Colors.white.withOpacity(0.9) : AppColors.textMuted,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 14),
                ],

                // Patient Details Card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 46,
                            height: 46,
                            decoration: BoxDecoration(
                              color: AppColors.primary.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Center(
                              child: Text(
                                patient.ticketNumber,
                                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primary),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  patient.patientName,
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                                ),
                                const SizedBox(height: 3),
                                Row(
                                  children: [
                                    if (patient.patientPhone != null && patient.patientPhone!.isNotEmpty) ...[
                                      const Icon(Icons.phone_rounded, size: 12, color: AppColors.textMuted),
                                      const SizedBox(width: 4),
                                      Text(
                                        patient.patientPhone!,
                                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                      ),
                                      const SizedBox(width: 10),
                                    ],
                                    if (patient.roomNumber != null) ...[
                                      const Icon(Icons.meeting_room_outlined, size: 12, color: AppColors.textMuted),
                                      const SizedBox(width: 3),
                                      Text('${patient.roomNumber}-xona', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                    ],
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Divider(height: 1),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Xizmat: ${patient.serviceName ?? "Ko‘rik"}',
                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFFECFDF5),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text('Yakunlangan', style: TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.bold, fontSize: 11)),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                // Conclusion Box
                const Text('Shifokor xulosasi / Tashxis:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                const SizedBox(height: 6),
                Container(
                  width: double.infinity,
                  constraints: const BoxConstraints(minHeight: 60, maxHeight: 120),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: hasConclusion ? const Color(0xFFF8FAFC) : AppColors.background,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: SingleChildScrollView(
                    child: Text(
                      hasConclusion
                          ? (patient.doctorConclusion ?? patient.notes ?? '')
                          : 'Ushbu bemor uchun shifokor xulosasi kiritilmagan.',
                      style: TextStyle(
                        fontSize: 13,
                        color: hasConclusion ? AppColors.textPrimary : AppColors.textMuted,
                        fontStyle: hasConclusion ? FontStyle.normal : FontStyle.italic,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 18),

                // Action buttons: Qayta chaqirish & Yopish
                Row(
                  children: [
                    Expanded(
                      flex: 1,
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(ctx),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        child: const Text('Yopish'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 2,
                      child: ElevatedButton.icon(
                        icon: const Icon(Icons.campaign_rounded, size: 18),
                        label: const Text('Qayta chaqirish'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        onPressed: () async {
                          Navigator.pop(ctx);
                          final res = await ApiService().recallTicket(patient.id);
                          if (mounted) {
                            if (res['success'] == true) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('${patient.ticketNumber} (${patient.patientName}) qayta chaqirildi'),
                                  backgroundColor: AppColors.success,
                                ),
                              );
                              _fetchData();
                            } else {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(res['message'] ?? 'Qayta chaqirishda xatolik'),
                                  backgroundColor: AppColors.error,
                                ),
                              );
                            }
                          }
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  // 4. Kelmadi deb belgilash (Skip)
  Future<void> _skipPatient() async {
    if (_currentInServiceTicket == null) return;
    final ticket = _currentInServiceTicket!;
    final doctorId = _selectedDoctor?.id ?? AuthService().currentUser?.doctorId;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: const Row(
          children: [
            Icon(Icons.person_off_rounded, color: AppColors.error),
            SizedBox(width: 8),
            Text('Kelmadi deb belgilash', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Text('${ticket.ticketNumber} (${ticket.patientName}) kelmadi deb belgilansinmi? Navbatdan o\'tkazib yuboriladi.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Bekor qilish'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Ha, kelmadi'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    final res = await ApiService().skipTicket(ticket.id, doctorId: doctorId);
    if (!mounted) return;
    if (res['success'] != false) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${ticket.ticketNumber} o‘tkazib yuborildi'), backgroundColor: AppColors.error),
      );
      await _fetchData();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res['message'] ?? 'Xatolik yuz berdi'), backgroundColor: AppColors.warning),
      );
    }
  }

  // 5. Qabulni yakunlash (Complete visit modal sheet)
  void _completePatient() {
    if (_currentInServiceTicket == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Qabulni yakunlash uchun faol bemor yo‘q'), backgroundColor: AppColors.warning),
      );
      return;
    }
    DoctorPatientSheet.show(
      context,
      ticket: _currentInServiceTicket!,
      doctorId: _selectedDoctor?.id,
      onUpdated: _fetchData,
    );
  }

  // 6. Shifokorni almashtirish modali
  void _showDoctorSwitcherSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        String filter = '';
        return StatefulBuilder(
          builder: (context, setModalState) {
            final filtered = _allDoctors.where((d) {
              if (filter.isEmpty) return true;
              final q = filter.toLowerCase();
              return d.fullName.toLowerCase().contains(q) ||
                  d.specialty.toLowerCase().contains(q) ||
                  d.roomNumber.contains(q);
            }).toList();

            return Container(
              height: MediaQuery.of(context).size.height * 0.75,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2)),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Shifokorni tanlash',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    onChanged: (val) => setModalState(() => filter = val),
                    decoration: InputDecoration(
                      hintText: 'Shifokor ismi yoki mutaxassislik...',
                      prefixIcon: const Icon(Icons.search_rounded, size: 20, color: AppColors.textMuted),
                      contentPadding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: ListView.separated(
                      itemCount: filtered.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final doc = filtered[index];
                        final isSelected = _selectedDoctor?.id == doc.id;
                        return InkWell(
                          onTap: () async {
                            final prefs = await SharedPreferences.getInstance();
                            await prefs.setString('active_doctor_id', doc.id);
                            setState(() {
                              _selectedDoctor = doc;
                            });
                            Navigator.pop(ctx);
                            _fetchData();
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('${doc.fullName} profiliga o‘tildi'), backgroundColor: AppColors.primary),
                            );
                          },
                          borderRadius: BorderRadius.circular(14),
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: isSelected ? AppColors.mintLight.withOpacity(0.5) : Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: isSelected ? AppColors.primary : AppColors.border,
                                width: isSelected ? 1.5 : 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                _buildDoctorAvatar(doc.fullName, radius: 20),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        doc.fullName,
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.bold,
                                          color: isSelected ? AppColors.primary : AppColors.textPrimary,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        '${doc.specialty} • ${doc.roomNumber}-kabinet',
                                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                      ),
                                    ],
                                  ),
                                ),
                                if (isSelected)
                                  const Icon(Icons.check_circle_rounded, color: AppColors.primary, size: 22)
                                else
                                  const Icon(Icons.arrow_forward_ios_rounded, color: AppColors.textMuted, size: 14),
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

  @override
  Widget build(BuildContext context) {
    return ResponsiveFrame(
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: _buildAppBar(),
        body: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
            : RefreshIndicator(
                onRefresh: _fetchData,
                color: AppColors.primary,
                child: _buildBody(),
              ),
        bottomNavigationBar: _buildBottomNav(),
      ),
    );
  }

  bool _isFemaleDoctor(String? name) {
    if (name == null || name.isEmpty) return false;
    final clean = name.toLowerCase().trim();
    if (RegExp(r'(ova|yeva|qizi)\b', caseSensitive: false).hasMatch(clean)) return true;
    const femaleKeywords = [
      'malika', 'dilnoza', 'nilufar', 'gulnoza', 'umida', 'shahlo',
      'zulayho', 'nargiza', 'madina', 'dildora', 'nodira', 'munisa',
      'rayhon', 'feruza', 'zuhra', 'fotima', 'kamola', 'gulbahor',
      'mohira', 'nafisa', 'aziza', 'shaxnoza', 'shahnoza', 'sevara',
      'surayyo', 'lobar', 'yulduz', 'nozima', 'guli', 'zarnigor',
      'barno', 'iroda', 'rano', 'saodat', 'muxlisa'
    ];
    return femaleKeywords.any((fn) => clean.contains(fn));
  }

  Widget _buildDoctorAvatar(String? name, {double radius = 19}) {
    final isFemale = _isFemaleDoctor(name);
    final bgGradient = isFemale
        ? const LinearGradient(
            colors: [Color(0xFF2DD4BF), Color(0xFF0D9488)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          )
        : const LinearGradient(
            colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          );

    return Container(
      width: radius * 2,
      height: radius * 2,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: bgGradient,
        boxShadow: [
          BoxShadow(
            color: (isFemale ? const Color(0xFF0D9488) : const Color(0xFF1D4ED8)).withOpacity(0.28),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Center(
        child: Icon(
          isFemale ? Icons.face_3_rounded : Icons.face_6_rounded,
          color: Colors.white,
          size: radius * 1.15,
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    final docName = _selectedDoctor?.fullName ?? AuthService().currentUser?.fullName ?? 'Shifokor';
    final docSpecialty = _selectedDoctor?.specialty ?? AuthService().currentUser?.specialtyName ?? 'Klinika';
    final room = _selectedDoctor?.roomNumber ?? AuthService().currentUser?.roomNumber ?? '1';

    return AppBar(
      elevation: 0,
      backgroundColor: Colors.white,
      automaticallyImplyLeading: false,
      title: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 2),
        child: Row(
          children: [
            InkWell(
              onTap: () => UserProfileSheet.show(context),
              borderRadius: BorderRadius.circular(20),
              child: _buildDoctorAvatar(docName, radius: 19),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: InkWell(
                onTap: _showDoctorSwitcherSheet,
                borderRadius: BorderRadius.circular(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            docName,
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(Icons.arrow_drop_down_rounded, size: 20, color: AppColors.primary),
                      ],
                    ),
                    Row(
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: _isDoctorActive ? AppColors.success : AppColors.warning,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _isDoctorActive ? 'Faol qabul' : 'Tanaffusda',
                          style: TextStyle(
                            fontSize: 11,
                            color: _isDoctorActive ? AppColors.success : AppColors.warning,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const Text(' • ', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                        Text(
                          '$room-xona ($docSpecialty)',
                          style: const TextStyle(fontSize: 11, color: AppColors.textMuted, fontWeight: FontWeight.w500),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
      actions: [
        IconButton(
          tooltip: 'PIN va Biometriya',
          icon: Icon(
            SecurityService().hasPin ? Icons.lock_outline_rounded : Icons.lock_open_rounded,
            color: AppColors.primary,
            size: 21,
          ),
          onPressed: () => PinSetupSheet.show(context),
        ),
        IconButton(
          tooltip: 'Tanaffus olish',
          icon: Icon(
            Icons.coffee_rounded,
            color: _isDoctorActive ? AppColors.textSecondary : AppColors.warning,
            size: 22,
          ),
          onPressed: () {
            DoctorOfflineSheet.show(
              context,
              onBreakStarted: () {
                setState(() => _isDoctorActive = false);
              },
            );
          },
        ),
        IconButton(
          tooltip: 'Yangilash',
          icon: const Icon(Icons.refresh_rounded, color: AppColors.textSecondary, size: 22),
          onPressed: _fetchData,
        ),
      ],
    );
  }

  Widget _buildBody() {
    switch (_currentTabIndex) {
      case 0:
        return _buildHomeTab();
      case 1:
        return _buildPatientsTab();
      case 2:
        return _buildHistoryTab();
      case 3:
        return _buildSettingsTab();
      default:
        return _buildHomeTab();
    }
  }

  // ==================== TAB 0: NAVBATIM (REAL KPI & WORKFLOW) ====================
  Widget _buildHomeTab() {
    final waitingCount = _tickets.where((t) => t.isWaiting).length;
    final completedCount = _tickets.where((t) => t.isCompleted).length;
    final hasActive = _currentInServiceTicket != null;

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 1. Real KPI Stats Cards Row
          Row(
            children: [
              _buildKpiCard('Jami bemor', '${_tickets.length}', Icons.groups_rounded, AppColors.info, AppColors.infoLight),
              const SizedBox(width: 8),
              _buildKpiCard('Qabulda', '${hasActive ? 1 : 0}', Icons.medical_services_rounded, AppColors.primary, AppColors.mintLight),
              const SizedBox(width: 8),
              _buildKpiCard('Kutmoqda', '$waitingCount', Icons.hourglass_top_rounded, AppColors.warning, AppColors.warningLight),
              const SizedBox(width: 8),
              _buildKpiCard('Tugatildi', '$completedCount', Icons.check_circle_rounded, AppColors.success, AppColors.successLight),
            ],
          ),
          const SizedBox(height: 16),

          // 2. Active Patient Consultation Card (Matching User-Panel DoctorView)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: hasActive ? AppColors.primary.withOpacity(0.3) : AppColors.border, width: hasActive ? 1.5 : 1),
              boxShadow: [
                BoxShadow(
                  color: hasActive ? AppColors.primary.withOpacity(0.08) : Colors.black.withOpacity(0.03),
                  blurRadius: 14,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Card Header: Status + Timer
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    if (hasActive) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: _currentInServiceTicket!.isCalled ? const Color(0xFFE0F2FE) : const Color(0xFFD1FAE5),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: _currentInServiceTicket!.isCalled ? const Color(0xFFBAE6FD) : const Color(0xFFA7F3D0),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 7,
                              height: 7,
                              decoration: BoxDecoration(
                                color: _currentInServiceTicket!.isCalled ? const Color(0xFF0284C7) : const Color(0xFF059669),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              _currentInServiceTicket!.isCalled ? 'CHAQIRILDI (TV)' : 'QABULDA (FAOL)',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w900,
                                color: _currentInServiceTicket!.isCalled ? const Color(0xFF0284C7) : const Color(0xFF059669),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.timer_outlined, size: 14, color: AppColors.textSecondary),
                            const SizedBox(width: 4),
                            Text(
                              _formatTimer(_consultationSeconds),
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary, fontFamily: 'monospace'),
                            ),
                          ],
                        ),
                      ),
                    ] else ...[
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: const BoxDecoration(color: Color(0xFFD1FAE5), shape: BoxShape.circle),
                            child: const Icon(Icons.medical_services_outlined, size: 16, color: Color(0xFF059669)),
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'Navbatdagi qabul',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.warningLight,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '$waitingCount ta kutmoqda',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.warning),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 14),

                // Patient Details or Empty Prompt
                if (hasActive) ...[
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(color: AppColors.primary.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 3)),
                          ],
                        ),
                        child: Text(
                          _currentInServiceTicket!.ticketNumber,
                          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _currentInServiceTicket!.patientName,
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(Icons.phone_outlined, size: 13, color: AppColors.textMuted),
                                const SizedBox(width: 4),
                                Text(
                                  Formatters.formatPhone(_currentInServiceTicket!.patientPhone ?? ''),
                                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              _currentInServiceTicket!.serviceName ?? 'Birlamchi ko‘rik va konsultatsiya',
                              style: const TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w600),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ] else ...[
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Column(
                      children: [
                        const Icon(Icons.medical_services_outlined, size: 40, color: Color(0xFF059669)),
                        const SizedBox(height: 8),
                        const Text(
                          'Hozirda qabulda faol bemor yo‘q',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          waitingCount > 0
                              ? 'Navbatda $waitingCount ta bemor kutmoqda. Qabulni boshlash uchun quyidagi "Keyingi bemor" tugmasini bosing.'
                              : 'Bugungi smena bo‘yicha barcha kutayotgan bemorlar qabul qilib bo‘lingan.',
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 16),

                // ==================== WORKFLOW ACTION BUTTONS ====================
                // 1. Big Green Button: Keyingi Bemor
                SizedBox(
                  height: 48,
                  child: ElevatedButton(
                    onPressed: (_isCallingNext || waitingCount == 0) ? null : _callNextPatient,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF00965E),
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: Colors.grey.shade300,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.volume_up_rounded, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          _isCallingNext ? 'Chaqirilmoqda...' : 'Keyingi bemor',
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(width: 4),
                        const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),

                // 2. 3 Secondary Action Buttons: Qayta chaqirish, Oldingi bemor, Kelmadi
                Row(
                  children: [
                    // Qayta chaqirish
                    Expanded(
                      child: SizedBox(
                        height: 42,
                        child: ElevatedButton(
                          onPressed: hasActive ? _recallPatient : null,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFE0F2FE),
                            foregroundColor: const Color(0xFF0284C7),
                            disabledBackgroundColor: Colors.grey.shade100,
                            disabledForegroundColor: Colors.grey.shade400,
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.replay_rounded, size: 16),
                              SizedBox(width: 4),
                              Text('Qayta chaqirish', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),

                    // Oldingi bemor
                    Expanded(
                      child: SizedBox(
                        height: 42,
                        child: ElevatedButton(
                          onPressed: completedCount > 0 ? _showPreviousPatient : null,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFFEF3C7),
                            foregroundColor: const Color(0xFFD97706),
                            disabledBackgroundColor: Colors.grey.shade100,
                            disabledForegroundColor: Colors.grey.shade400,
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.skip_previous_rounded, size: 16),
                              SizedBox(width: 4),
                              Text('Oldingi bemor', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),

                    // Kelmadi
                    Expanded(
                      child: SizedBox(
                        height: 42,
                        child: ElevatedButton(
                          onPressed: hasActive ? _skipPatient : null,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFFEE2E2),
                            foregroundColor: const Color(0xFFDC2626),
                            disabledBackgroundColor: Colors.grey.shade100,
                            disabledForegroundColor: Colors.grey.shade400,
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.person_off_rounded, size: 16),
                              SizedBox(width: 4),
                              Text('Kelmadi', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // 3. Bottom Wide Button: Qabulni yakunlash
                SizedBox(
                  height: 46,
                  child: ElevatedButton(
                    onPressed: hasActive ? _completePatient : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFD1FAE5),
                      foregroundColor: const Color(0xFF059669),
                      disabledBackgroundColor: Colors.grey.shade100,
                      disabledForegroundColor: Colors.grey.shade400,
                      side: BorderSide(
                        color: hasActive ? const Color(0xFFA7F3D0) : Colors.transparent,
                      ),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.check_circle_outline_rounded, size: 18),
                        SizedBox(width: 8),
                        Text(
                          'Qabulni yakunlash',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // 3. Queue List Filter Tabs
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Bugungi Navbatlar',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              Text(
                'Jami: ${_tickets.length}',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
              ),
            ],
          ),
          const SizedBox(height: 10),

          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildQueueFilterChip('ALL', 'Barchasi (${_tickets.length})'),
                const SizedBox(width: 6),
                _buildQueueFilterChip('WAITING', 'Kutayotgan ($waitingCount)'),
                const SizedBox(width: 6),
                _buildQueueFilterChip('IN_SERVICE', 'Qabulda (${hasActive ? 1 : 0})'),
                const SizedBox(width: 6),
                _buildQueueFilterChip('COMPLETED', 'Tugatilgan ($completedCount)'),
                const SizedBox(width: 6),
                _buildQueueFilterChip('SKIPPED', 'Kelmadi (${_tickets.where((t) => t.isSkipped).length})'),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // 4. Filtered Ticket List
          _buildQueueList(),
        ],
      ),
    );
  }

  Widget _buildQueueFilterChip(String key, String label) {
    final isSelected = _queueFilter == key;
    return InkWell(
      onTap: () => setState(() => _queueFilter = key),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: isSelected ? AppColors.primary : AppColors.border),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? Colors.white : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildQueueList() {
    List<TicketModel> filtered = _tickets;
    if (_queueFilter == 'WAITING') {
      filtered = _tickets.where((t) => t.isWaiting).toList();
    } else if (_queueFilter == 'IN_SERVICE') {
      filtered = _tickets.where((t) => t.isActive).toList();
    } else if (_queueFilter == 'COMPLETED') {
      filtered = _tickets.where((t) => t.isCompleted).toList();
    } else if (_queueFilter == 'SKIPPED') {
      filtered = _tickets.where((t) => t.isSkipped).toList();
    }

    if (filtered.isEmpty) {
      return Container(
        padding: const EdgeInsets.symmetric(vertical: 30),
        alignment: Alignment.center,
        child: const Text('Bu toifada talonlar mavjud emas', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: filtered.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final ticket = filtered[index];
        return _buildTicketCard(ticket);
      },
    );
  }

  Widget _buildTicketCard(TicketModel ticket) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: Formatters.statusBgColor(ticket.status),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              ticket.ticketNumber,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w900,
                color: Formatters.statusColor(ticket.status),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  ticket.patientName,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 2),
                Text(
                  '${ticket.serviceName ?? "Ko‘rik"} • ${Formatters.formatTime(ticket.createdAt)}',
                  style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Formatters.statusBgColor(ticket.status),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              Formatters.statusLabel(ticket.status),
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Formatters.statusColor(ticket.status)),
            ),
          ),
        ],
      ),
    );
  }

  // ==================== TAB 1: BEMORLAR EMR ====================
  Widget _buildPatientsTab() {
    final query = _patientSearchCtrl.text.toLowerCase().trim();
    final filtered = _patients.where((p) {
      if (query.isEmpty) return true;
      return p.fullName.toLowerCase().contains(query) ||
          p.phone.contains(query) ||
          (p.patientNumber != null && p.patientNumber!.contains(query));
    }).toList();

    return Column(
      children: [
        Container(
          color: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Bemorlar Kartotekasi (EMR)', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(color: AppColors.mintLight, borderRadius: BorderRadius.circular(10)),
                    child: Text('Jami: ${_patients.length}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary)),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _patientSearchCtrl,
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.search_rounded, size: 20, color: AppColors.textMuted),
                  hintText: 'Bemor F.I.Sh yoki telefon raqami...',
                  contentPadding: const EdgeInsets.symmetric(vertical: 10),
                  suffixIcon: _patientSearchCtrl.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, size: 18),
                          onPressed: () {
                            _patientSearchCtrl.clear();
                            setState(() {});
                          },
                        )
                      : null,
                ),
              ),
            ],
          ),
        ),
        const Divider(height: 1, color: AppColors.border),
        Expanded(
          child: filtered.isEmpty
              ? const Center(child: Text('Mos keluvchi bemorlar topilmadi', style: TextStyle(color: AppColors.textMuted)))
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: (filtered.length > _visiblePatientsCount ? _visiblePatientsCount + 1 : filtered.length),
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    if (index == _visiblePatientsCount && filtered.length > _visiblePatientsCount) {
                      return Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: Center(
                          child: OutlinedButton(
                            onPressed: () => setState(() => _visiblePatientsCount += 15),
                            child: Text('Yana 15 ta bemor yuklash (${_visiblePatientsCount}/${filtered.length}) ↓'),
                          ),
                        ),
                      );
                    }
                    final patient = filtered[index];
                    return InkWell(
                      onTap: () {
                        ManagerPatientDetailSheet.show(
                          context,
                          patient: patient,
                          onUpdated: _fetchData,
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
                              radius: 20,
                              backgroundColor: AppColors.mintLight,
                              child: Text(
                                patient.fullName.isNotEmpty ? patient.fullName[0].toUpperCase() : 'B',
                                style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    patient.fullName,
                                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                                  ),
                                  const SizedBox(height: 2),
                                  Row(
                                    children: [
                                      Text(Formatters.formatPhone(patient.phone), style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                                      const Text(' • ', style: TextStyle(color: AppColors.textMuted)),
                                      Text('${patient.totalVisits} ta qabul', style: const TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.bold)),
                                    ],
                                  ),
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
    );
  }

  // ==================== TAB 2: TARIX (REAL SHIFOKOR QABULLARI) ====================
  Widget _buildHistoryTab() {
    final completedTickets = _tickets.where((t) => t.isCompleted).toList();
    final query = _historySearchCtrl.text.toLowerCase().trim();

    final filtered = completedTickets.where((t) {
      if (query.isEmpty) return true;
      return t.patientName.toLowerCase().contains(query) ||
          t.ticketNumber.toLowerCase().contains(query) ||
          (t.patientPhone != null && t.patientPhone!.contains(query)) ||
          (t.doctorConclusion != null && t.doctorConclusion!.toLowerCase().contains(query));
    }).toList();

    return Column(
      children: [
        Container(
          color: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Mening Qabul Tarixim', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(color: const Color(0xFFD1FAE5), borderRadius: BorderRadius.circular(10)),
                    child: Text(
                      'Tugatilgan: ${completedTickets.length} ta',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF059669)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _historySearchCtrl,
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.search_rounded, size: 20, color: AppColors.textMuted),
                  hintText: 'Bemor ismi, talon raqami yoki xulosa...',
                  contentPadding: const EdgeInsets.symmetric(vertical: 10),
                  suffixIcon: _historySearchCtrl.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, size: 18),
                          onPressed: () {
                            _historySearchCtrl.clear();
                            setState(() {});
                          },
                        )
                      : null,
                ),
              ),
            ],
          ),
        ),
        const Divider(height: 1, color: AppColors.border),
        Expanded(
          child: filtered.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.history_edu_rounded, size: 48, color: AppColors.textMuted),
                      const SizedBox(height: 12),
                      const Text(
                        'Yakunlangan qabullar mavjud emas',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        query.isNotEmpty
                            ? 'Qidiruv bo‘yicha natija topilmadi'
                            : 'Siz tomondan yakunlangan bemorlar qabuli shu yerda aks etadi',
                        style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                      ),
                    ],
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final t = filtered[index];
                    return Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 6, offset: const Offset(0, 2)),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFD1FAE5),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  t.ticketNumber,
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF059669)),
                                ),
                              ),
                              Row(
                                children: [
                                  const Icon(Icons.access_time_rounded, size: 13, color: AppColors.textMuted),
                                  const SizedBox(width: 4),
                                  Text(
                                    Formatters.formatTime(t.completedAt ?? t.createdAt),
                                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Text(
                            t.patientName,
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                          ),
                          const SizedBox(height: 2),
                          Row(
                            children: [
                              Text(Formatters.formatPhone(t.patientPhone ?? ''), style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                              if (t.serviceName != null) ...[
                                const Text(' • ', style: TextStyle(color: AppColors.textMuted)),
                                Expanded(
                                  child: Text(
                                    t.serviceName!,
                                    style: const TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 10),

                          // Shifokor xulosasi / Tashxis
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Row(
                                  children: [
                                    Icon(Icons.assignment_turned_in_outlined, size: 14, color: AppColors.primary),
                                    SizedBox(width: 6),
                                    Text(
                                      'Shifokor Xulosasi:',
                                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  (t.doctorConclusion != null && t.doctorConclusion!.trim().isNotEmpty)
                                      ? t.doctorConclusion!.trim()
                                      : 'Xulosa kiritilmagan',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: (t.doctorConclusion != null && t.doctorConclusion!.trim().isNotEmpty)
                                        ? AppColors.textPrimary
                                        : AppColors.textMuted,
                                    height: 1.3,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  // ==================== TAB 3: SHAXSIY PROFIL & SOZLAMALAR ====================
  Widget _buildSettingsTab() {
    final docName = _selectedDoctor?.fullName ?? AuthService().currentUser?.fullName ?? 'Shifokor';
    final docSpecialty = _selectedDoctor?.specialty ?? AuthService().currentUser?.specialtyName ?? 'Mutaxassis';
    final room = _selectedDoctor?.roomNumber ?? AuthService().currentUser?.roomNumber ?? '1';
    final phone = _selectedDoctor?.phone ?? AuthService().currentUser?.phone ?? '+998 90 123 45 67';
    final docId = _selectedDoctor?.id ?? AuthService().currentUser?.doctorId ?? 'doc_01';

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Modern Doctor Profile Header Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.border),
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4)),
              ],
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    _buildDoctorAvatar(docName, radius: 28),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(docName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                          const SizedBox(height: 2),
                          Text(docSpecialty, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(color: AppColors.mintLight, borderRadius: BorderRadius.circular(6)),
                            child: Text(
                              'Kabinet: $room-xona',
                              style: const TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                const Divider(height: 1, color: AppColors.border),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: _isDoctorActive ? AppColors.success : AppColors.warning,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          _isDoctorActive ? 'Qabul holati: Faol' : 'Qabul holati: Tanaffus',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: _isDoctorActive ? AppColors.success : AppColors.warning,
                          ),
                        ),
                      ],
                    ),
                    Switch.adaptive(
                      value: _isDoctorActive,
                      activeColor: AppColors.primary,
                      onChanged: (val) {
                        setState(() => _isDoctorActive = val);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(val ? 'Qabul holati faollashtirildi' : 'Tanaffus holati yoqildi'),
                            backgroundColor: val ? AppColors.success : AppColors.warning,
                            duration: const Duration(seconds: 2),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 2. Doctor Switcher Tile (Quick Switch)
          InkWell(
            onTap: _showDoctorSwitcherSheet,
            borderRadius: BorderRadius.circular(16),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFBFDBFE)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(color: Color(0xFF3B82F6), shape: BoxShape.circle),
                    child: const Icon(Icons.swap_horiz_rounded, size: 20, color: Colors.white),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Shifokor profilini almashtirish', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1E40AF))),
                        Text('Boshqa shifokor navbatlarini boshqarish', style: TextStyle(fontSize: 11, color: Color(0xFF3B82F6))),
                      ],
                    ),
                  ),
                  const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Color(0xFF3B82F6)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // 3. Kabinet & Mutaxassislik Section
          const Text('KABINET VA MUTAXASSISLIK', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textMuted, letterSpacing: 0.5)),
          const SizedBox(height: 8),
          _buildSettingsCard([
            _buildSettingsRow(Icons.meeting_room_outlined, 'Kabinet raqami', '$room-xona'),
            _buildSettingsRow(Icons.medical_services_outlined, 'Mutaxassislik', docSpecialty),
            _buildSettingsRow(Icons.phone_outlined, 'Telefon raqam', Formatters.formatPhone(phone)),
            _buildSettingsRow(Icons.badge_outlined, 'Tizimdagi ID', docId),
          ]),
          const SizedBox(height: 20),

          // 4. TV & Ovoz sozlamalari
          const Text('TV MONITOR VA OVOZ SOZLAMALARI', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textMuted, letterSpacing: 0.5)),
          const SizedBox(height: 8),
          _buildSettingsCard([
            _buildSettingsRow(Icons.volume_up_outlined, 'Ovozli e\'lon tili', 'O‘zbekcha (Aziz TTS)'),
            _buildSettingsRow(Icons.repeat_rounded, 'E\'lon takrorlanishi', '2 marta ovoz berish'),
            _buildSettingsRow(Icons.tv_rounded, 'TV Monitor holati', 'Jonli efirda faol'),
          ]),
          const SizedBox(height: 20),

          // 5. Server va Tizim
          const Text('SERVER VA ALOQA', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textMuted, letterSpacing: 0.5)),
          const SizedBox(height: 8),
          _buildSettingsCard([
            _buildSettingsRow(
              Icons.dns_outlined,
              'Server manzili',
              ApiConstants.baseUrl.replaceAll('/api/v1', ''),
              trailingBadge: 'Bog‘langan',
              badgeColor: AppColors.success,
            ),
            _buildSettingsRow(
              Icons.sync_rounded,
              'Tizimni yangilash',
              'Ma\'lumotlarni qayta yuklash',
              onTap: () async {
                await _fetchData();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Ma\'lumotlar muvaffaqiyatli yangilandi!'), backgroundColor: AppColors.primary),
                );
              },
            ),
          ]),
          const SizedBox(height: 20),

          // Clinic Branding Footer
          Center(
            child: Column(
              children: [
                SizedBox(
                  width: 48,
                  height: 48,
                  child: Image.asset(
                    'assets/images/logo.png',
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => const Icon(Icons.local_hospital_rounded, color: AppColors.medicalBlue, size: 24),
                  ),
                ),
                const SizedBox(height: 6),
                const Text('klinika-admin', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                const Text('Elektron Navbat & Boshqaruv Tizimi', style: TextStyle(fontSize: 10, color: AppColors.textMuted)),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // 6. Logout Button
          SizedBox(
            width: double.infinity,
            height: 48,
            child: OutlinedButton(
              onPressed: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    title: const Text('Tizimdan chiqish'),
                    content: const Text('Haqiqatan ham shifokor tizimidan chiqmoqchimisiz?'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Bekor qilish')),
                      ElevatedButton(
                        onPressed: () => Navigator.pop(ctx, true),
                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
                        child: const Text('Chiqish'),
                      ),
                    ],
                  ),
                );

                if (confirm == true) {
                  await AuthService().logout();
                  if (!mounted) return;
                  Navigator.of(context).pushReplacement(
                    MaterialPageRoute(builder: (_) => const LoginScreen()),
                  );
                }
              },
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.error,
                side: const BorderSide(color: AppColors.errorLight),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.logout_rounded, size: 18),
                  SizedBox(width: 8),
                  Text('Tizimdan chiqish', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildSettingsCard(List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(children: children),
    );
  }

  Widget _buildSettingsRow(
    IconData icon,
    String title,
    String value, {
    String? trailingBadge,
    Color? badgeColor,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
        child: Row(
          children: [
            Icon(icon, size: 19, color: AppColors.primary),
            const SizedBox(width: 12),
            Expanded(child: Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.textPrimary))),
            if (trailingBadge != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: (badgeColor ?? AppColors.primary).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  trailingBadge,
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: badgeColor ?? AppColors.primary),
                ),
              )
            else
              Text(value, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
            if (onTap != null) ...[
              const SizedBox(width: 6),
              const Icon(Icons.arrow_forward_ios_rounded, size: 13, color: AppColors.textMuted),
            ],
          ],
        ),
      ),
    );
  }

  // ==================== WIDGET HELPERS ====================
  Widget _buildKpiCard(String title, String value, IconData icon, Color color, Color bg) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
              child: Icon(icon, size: 16, color: color),
            ),
            const SizedBox(height: 6),
            Text(value, style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: color)),
            const SizedBox(height: 2),
            Text(title, style: const TextStyle(fontSize: 10, color: AppColors.textMuted, fontWeight: FontWeight.w500), maxLines: 1),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomNav() {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: AppColors.border, width: 1)),
      ),
      child: BottomNavigationBar(
        currentIndex: _currentTabIndex,
        onTap: (index) => setState(() => _currentTabIndex = index),
        backgroundColor: Colors.white,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textMuted,
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
        unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.normal, fontSize: 11),
        type: BottomNavigationBarType.fixed,
        elevation: 0,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard_rounded), label: 'Navbatim'),
          BottomNavigationBarItem(icon: Icon(Icons.people_alt_rounded), label: 'Bemorlar'),
          BottomNavigationBarItem(icon: Icon(Icons.history_edu_rounded), label: 'Tarix'),
          BottomNavigationBarItem(icon: Icon(Icons.person_rounded), label: 'Profil'),
        ],
      ),
    );
  }
}
