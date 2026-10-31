import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../models/doctor_model.dart';
import '../../models/patient_model.dart';
import '../../models/ticket_model.dart';
import '../../models/service_model.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../services/security_service.dart';
import '../../widgets/responsive_frame.dart';
import '../../widgets/user_profile_sheet.dart';
import '../../widgets/curved_notched_nav_bar.dart';
import '../auth/login_screen.dart';
import '../auth/pin_setup_sheet.dart';
import 'manager_doctor_sheet.dart';
import 'manager_patient_detail_sheet.dart';

class ManagerMainScreen extends StatefulWidget {
  const ManagerMainScreen({Key? key}) : super(key: key);

  @override
  State<ManagerMainScreen> createState() => _ManagerMainScreenState();
}

class _ManagerMainScreenState extends State<ManagerMainScreen> {
  int _currentTabIndex = 0; // 0: Dashboard, 1: Navbatlar, 2: Shifokorlar, 3: Bemorlar, 4: TV & Sozlamalar
  bool _isLoading = true;

  List<DoctorModel> _doctors = [];
  List<TicketModel> _tickets = [];
  List<PatientModel> _patients = [];
  List<ServiceModel> _services = [];
  Map<String, dynamic> _dashboardStats = {};

  Map<String, dynamic> get _statsData {
    if (_dashboardStats.containsKey('data') && _dashboardStats['data'] is Map<String, dynamic>) {
      return _dashboardStats['data'] as Map<String, dynamic>;
    }
    return _dashboardStats;
  }

  double get _todayRevenue {
    final raw = _statsData['todayRevenue'] ?? _statsData['totalRevenue'] ?? 0;
    return Formatters.parseDouble(raw);
  }

  double get _monthlyRevenue {
    final raw = _statsData['monthlyRevenue'] ?? 0;
    return Formatters.parseDouble(raw);
  }

  final _patientSearchController = TextEditingController();
  final _doctorSearchController = TextEditingController();
  int _visiblePatientsCount = 15;

  // TV Tablo Settings & Control Center
  final _tvVoiceTemplateCtrl = TextEditingController();
  final _tvSloganTitleCtrl = TextEditingController();
  final _tvSloganSubtitleCtrl = TextEditingController();
  final _tvCallingTitleCtrl = TextEditingController();
  final _tvStandbyTitleCtrl = TextEditingController();
  final _tvBottomBannerCtrl = TextEditingController();
  final _testTicketCtrl = TextEditingController(text: 'T-001');
  final _testRoomCtrl = TextEditingController(text: '4');
  final _testDoctorCtrl = TextEditingController(text: 'Dr. Azizbek Rahimov');
  bool _tvSoundEnabled = true;
  String _tvVoiceName = 'uz-UZ-MadinaNeural';
  bool _isSavingTv = false;
  bool _isSendingTestCall = false;
  Map<String, dynamic> _clinicSettings = {};

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  @override
  void dispose() {
    _patientSearchController.dispose();
    _doctorSearchController.dispose();
    _tvVoiceTemplateCtrl.dispose();
    _tvSloganTitleCtrl.dispose();
    _tvSloganSubtitleCtrl.dispose();
    _tvCallingTitleCtrl.dispose();
    _tvStandbyTitleCtrl.dispose();
    _tvBottomBannerCtrl.dispose();
    _testTicketCtrl.dispose();
    _testRoomCtrl.dispose();
    _testDoctorCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    final docs = await ApiService().getDoctors();
    final tickets = await ApiService().getTickets();
    final patients = await ApiService().getPatients();
    final services = await ApiService().getServices();
    final stats = await ApiService().getManagerDashboard();
    final settings = await ApiService().getClinicSettings();

    if (mounted) {
      setState(() {
        _doctors = docs;
        _tickets = tickets;
        _patients = patients;
        _services = services;
        _dashboardStats = stats;
        _clinicSettings = settings;

        if (_tvVoiceTemplateCtrl.text.isEmpty) {
          _tvSoundEnabled = settings['tv_sound_enabled'] ?? settings['tvSoundEnabled'] ?? true;
          _tvVoiceName = settings['tv_voice_name'] ?? settings['tvVoiceName'] ?? 'uz-UZ-MadinaNeural';
          _tvVoiceTemplateCtrl.text = settings['tv_voice_template'] ?? settings['tvVoiceTemplate'] ?? 'Talon raqami {letter}{zeros}, {number} raqam egasi, sizni {cabinet} xona, {specialty} xonasiga marhamat!';
          _tvSloganTitleCtrl.text = settings['tv_slogan_title'] ?? settings['tvSloganTitle'] ?? 'Sog‘lig‘ingiz biz uchun muhim!';
          _tvSloganSubtitleCtrl.text = settings['tv_slogan_subtitle'] ?? settings['tvSloganSubtitle'] ?? 'Navbat bilan qabulga marhamat!';
          _tvCallingTitleCtrl.text = settings['tv_calling_title'] ?? settings['tvCallingTitle'] ?? 'Hozir chaqirilmoqda!';
          _tvStandbyTitleCtrl.text = settings['tv_standby_title'] ?? settings['tvStandbyTitle'] ?? 'Qabul kutilmoqda';
          _tvBottomBannerCtrl.text = settings['tv_bottom_banner'] ?? settings['tvBottomBanner'] ?? 'Sizning sog‘lig‘ingiz – bizning ustuvor vazifamiz!';
        }

        _isLoading = false;
      });
    }
  }

  Future<void> _saveTvSettings() async {
    setState(() => _isSavingTv = true);
    final payload = {
      'tvSoundEnabled': _tvSoundEnabled,
      'tvVoiceName': _tvVoiceName,
      'tvVoiceTemplate': _tvVoiceTemplateCtrl.text.trim(),
      'tvSloganTitle': _tvSloganTitleCtrl.text.trim(),
      'tvSloganSubtitle': _tvSloganSubtitleCtrl.text.trim(),
      'tvCallingTitle': _tvCallingTitleCtrl.text.trim(),
      'tvStandbyTitle': _tvStandbyTitleCtrl.text.trim(),
      'tvBottomBanner': _tvBottomBannerCtrl.text.trim(),
    };
    final res = await ApiService().updateClinicSettings(payload);
    if (!mounted) return;
    setState(() => _isSavingTv = false);
    if (res['success'] != false) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('TV Tablo sozlamalari muvaffaqiyatli saqlandi va jonli efirga uzatildi!'),
          backgroundColor: AppColors.success,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? 'Sozlamalarni saqlashda xatolik yuz berdi'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _sendTestCall() async {
    final ticketNum = _testTicketCtrl.text.trim().isNotEmpty ? _testTicketCtrl.text.trim() : 'T-001';
    final roomNum = _testRoomCtrl.text.trim().isNotEmpty ? _testRoomCtrl.text.trim() : '4';
    final docName = _testDoctorCtrl.text.trim().isNotEmpty ? _testDoctorCtrl.text.trim() : 'Dr. Azizbek Rahimov';

    setState(() => _isSendingTestCall = true);
    final res = await ApiService().sendTvTestCall(ticketNum, roomNum, docName);
    if (!mounted) return;
    setState(() => _isSendingTestCall = false);
    if (res['success'] != false) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('TV Tabloga ovozli test chaqiruvi yuborildi ($ticketNum • $roomNum-xona)!'),
          backgroundColor: AppColors.success,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? 'Chaqiruv yuborishda xatolik'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthService().currentUser;

    return ResponsiveFrame(
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          elevation: 0,
          backgroundColor: Colors.white,
          automaticallyImplyLeading: false,
          title: Row(
            children: [
              InkWell(
                onTap: () => UserProfileSheet.show(context),
                borderRadius: BorderRadius.circular(20),
                child: CircleAvatar(
                  radius: 19,
                  backgroundColor: AppColors.mintLight,
                  child: const Icon(Icons.admin_panel_settings_rounded, color: AppColors.primary, size: 22),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: InkWell(
                  onTap: () => UserProfileSheet.show(context),
                  borderRadius: BorderRadius.circular(8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        user?.fullName ?? 'Boshqaruv Markazi',
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                      ),
                      const Text('SADAF CLINIC • Menejer Paneli', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                    ],
                  ),
                ),
              ),
              IconButton(
                icon: Icon(
                  SecurityService().hasPin ? Icons.lock_outline_rounded : Icons.lock_open_rounded,
                  color: AppColors.primary,
                  size: 21,
                ),
                tooltip: 'PIN va Biometriya',
                onPressed: () => PinSetupSheet.show(context),
              ),
              IconButton(
                icon: const Icon(Icons.refresh_rounded, color: AppColors.textSecondary),
                onPressed: _fetchData,
              ),
            ],
          ),
        ),
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

  Widget _buildBody() {
    switch (_currentTabIndex) {
      case 0:
        return _buildDashboardTab();
      case 1:
        return _buildQueuesTab();
      case 2:
        return _buildDoctorsTab();
      case 3:
        return _buildPatientsTab();
      case 4:
        return _buildTvAndSettingsTab();
      default:
        return _buildDashboardTab();
    }
  }

  // ==================== TAB 0: DASHBOARD ====================
  Widget _buildDashboardTab() {
    final waitingTickets = _tickets.where((t) => t.isWaiting).length;
    final activeDoctors = _doctors.where((d) => d.isActive).length;

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 1. KPI Cards Row
          Row(
            children: [
              _buildKpiCard('Bugungi bemor', '${_tickets.length}', Icons.groups_rounded, AppColors.info, AppColors.infoLight),
              const SizedBox(width: 8),
              _buildKpiCard('Faol vrachlar', '$activeDoctors', Icons.medical_services_rounded, AppColors.primary, AppColors.mintLight),
              const SizedBox(width: 8),
              _buildKpiCard('Kutmoqda', '$waitingTickets', Icons.hourglass_top_rounded, AppColors.warning, AppColors.warningLight),
              const SizedBox(width: 8),
              _buildKpiCard(
                'Xizmatlar',
                '${_services.length}',
                Icons.medical_information_rounded,
                AppColors.primary,
                AppColors.mintLight,
              ),
            ],
          ),
          const SizedBox(height: 18),

          // 2. Real-time Daily & Monthly Revenue Cards (Bugungi va Oylik Tushum)
          Row(
            children: [
              // Bugungi Tushum Card
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF1E40AF), Color(0xFF3B82F6)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF2563EB).withOpacity(0.32),
                        blurRadius: 14,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(7),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.account_balance_wallet_rounded, color: Colors.white, size: 18),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.22),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text('Bugun', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Bugungi Tushum',
                        style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 4),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Text(
                          Formatters.formatMoney(_todayRevenue),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            letterSpacing: -0.5,
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '${_statsData['completedCount'] ?? 0} ta qabul yakunlandi',
                        style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 10.5),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Bir Oylik Tushum Card
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF065F46), Color(0xFF10B981)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF10B981).withOpacity(0.32),
                        blurRadius: 14,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(7),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.calendar_month_rounded, color: Colors.white, size: 18),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.22),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text('Bu oy', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Bir Oylik Tushum',
                        style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 4),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Text(
                          Formatters.formatMoney(_monthlyRevenue),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            letterSpacing: -0.5,
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Jami oylik tushum',
                        style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 10.5),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 22),

          // 3. Navigation modules grid
          const Text('Boshqaruv Bo‘limlari', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 1.6,
            children: [
              _buildModuleCard('Jonli Navbatlar', '${_tickets.length} ta talon', Icons.format_list_bulleted_rounded, AppColors.primary, () {
                setState(() => _currentTabIndex = 1);
              }),
              _buildModuleCard('Shifokorlar', '${_doctors.length} nafar', Icons.medical_services_rounded, AppColors.info, () {
                setState(() => _currentTabIndex = 2);
              }),
              _buildModuleCard('Bemorlar Bazasi', '${_patients.length} ta bemor', Icons.people_alt_rounded, AppColors.purple, () {
                setState(() => _currentTabIndex = 3);
              }),
              _buildModuleCard('TV Tablo Pulti', 'Ekranni boshqarish', Icons.tv_rounded, AppColors.warning, () {
                setState(() => _currentTabIndex = 4);
              }),
            ],
          ),
          const SizedBox(height: 20),

          // 4. Oxirgi faol navbatlar
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Jonli Qabullar Holati', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
              TextButton(
                onPressed: () => setState(() => _currentTabIndex = 1),
                child: const Text('Barchasi', style: TextStyle(fontSize: 12, color: AppColors.primary)),
              ),
            ],
          ),
          ..._tickets.take(4).map((t) => _buildLiveQueueRow(t)),
        ],
      ),
    );
  }

  // ==================== TAB 1: JONLI NAVBATLAR ====================
  Widget _buildQueuesTab() {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _tickets.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final t = _tickets[index];
        return _buildLiveQueueRow(t);
      },
    );
  }

  Widget _buildLiveQueueRow(TicketModel t) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
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
              color: Formatters.statusBgColor(t.status),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              t.ticketNumber,
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Formatters.statusColor(t.status)),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(t.patientName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                Text('${t.doctorName ?? "Shifokor"} • ${t.roomNumber ?? "101"}-xona', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Formatters.statusBgColor(t.status),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              Formatters.statusLabel(t.status),
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Formatters.statusColor(t.status)),
            ),
          ),
        ],
      ),
    );
  }

  // ==================== TAB 2: SHIFOKORLAR ====================
  Widget _buildDoctorsTab() {
    final query = _doctorSearchController.text.toLowerCase().trim();
    final filtered = _doctors.where((d) {
      if (query.isEmpty) return true;
      final nameMatches = d.fullName.toLowerCase().contains(query);
      final specMatches = d.specialty.toLowerCase().contains(query);
      final roomMatches = d.roomNumber.toLowerCase().contains(query);
      return nameMatches || specMatches || roomMatches;
    }).toList();

    final activeCount = _doctors.where((d) => d.isActive).length;

    return Column(
      children: [
        // Top Search & Controls Container
        Container(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          color: Colors.white,
          child: Column(
            children: [
              // Search Input
              TextFormField(
                controller: _doctorSearchController,
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.search_rounded, color: AppColors.textMuted),
                  hintText: 'Shifokor ismi yoki mutaxassisligi bo‘yicha...',
                  suffixIcon: _doctorSearchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, size: 18),
                          onPressed: () {
                            _doctorSearchController.clear();
                            setState(() {});
                          },
                        )
                      : null,
                ),
              ),
              const SizedBox(height: 10),
              // Stats & Add Button
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.mintLight,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'Jami: ${_doctors.length} ta',
                          style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: AppColors.primary),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDCFCE7),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            Container(width: 6, height: 6, decoration: const BoxDecoration(color: Color(0xFF16A34A), shape: BoxShape.circle)),
                            const SizedBox(width: 4),
                            Text(
                              'Faol: $activeCount',
                              style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFF15803D)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  ElevatedButton.icon(
                    onPressed: () {
                      ManagerDoctorSheet.show(context, onSaved: _fetchData);
                    },
                    icon: const Icon(Icons.person_add_alt_1_rounded, size: 16),
                    label: const Text('Yangi shifokor', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const Divider(height: 1, color: AppColors.border),

        // Doctors List
        Expanded(
          child: filtered.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.medical_services_outlined, size: 48, color: AppColors.textMuted),
                      const SizedBox(height: 8),
                      const Text('Shifokorlar topilmadi', style: TextStyle(color: AppColors.textMuted)),
                    ],
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final doc = filtered[index];
                    final isFemale = _isDoctorFemale(doc.fullName);

                    return InkWell(
                      onTap: () {
                        ManagerDoctorSheet.show(context, doctor: doc, onSaved: _fetchData);
                      },
                      borderRadius: BorderRadius.circular(18),
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.025),
                              blurRadius: 8,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Avatar with status indicator
                                Stack(
                                  children: [
                                    Container(
                                      width: 48,
                                      height: 48,
                                      decoration: BoxDecoration(
                                        gradient: LinearGradient(
                                          colors: isFemale
                                              ? [const Color(0xFF0D9488), const Color(0xFF14B8A6)]
                                              : [const Color(0xFF0284C7), const Color(0xFF0369A1)],
                                          begin: Alignment.topLeft,
                                          end: Alignment.bottomRight,
                                        ),
                                        borderRadius: BorderRadius.circular(14),
                                      ),
                                      child: Center(
                                        child: Icon(
                                          isFemale ? Icons.face_3_rounded : Icons.face_6_rounded,
                                          color: Colors.white,
                                          size: 28,
                                        ),
                                      ),
                                    ),
                                    Positioned(
                                      bottom: 0,
                                      right: 0,
                                      child: Container(
                                        width: 12,
                                        height: 12,
                                        decoration: BoxDecoration(
                                          color: doc.isActive ? const Color(0xFF16A34A) : Colors.amber.shade700,
                                          shape: BoxShape.circle,
                                          border: Border.all(color: Colors.white, width: 2),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(width: 12),

                                // Doctor Main Info
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        doc.fullName,
                                        style: const TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.textPrimary,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 3),
                                      Row(
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: AppColors.mintLight,
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: Text(
                                              doc.specialty,
                                              style: const TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.w600,
                                                color: AppColors.primary,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 6),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFF1F5F9),
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: Text(
                                              '${doc.roomNumber}-xona',
                                              style: const TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.bold,
                                                color: Color(0xFF475569),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),

                                // Status Badge
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: doc.isActive ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    doc.isActive ? 'Faol' : 'Damda',
                                    style: TextStyle(
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.bold,
                                      color: doc.isActive ? const Color(0xFF15803D) : const Color(0xFFB45309),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            const Divider(height: 1, color: Color(0xFFF1F5F9)),
                            const SizedBox(height: 10),

                            // Footer: Price & Edit Button
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    const Icon(Icons.payments_outlined, size: 14, color: AppColors.textMuted),
                                    const SizedBox(width: 4),
                                    Text(
                                      Formatters.formatCurrency(doc.consultationPrice),
                                      style: const TextStyle(
                                        fontSize: 12.5,
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.primary,
                                      ),
                                    ),
                                  ],
                                ),
                                OutlinedButton.icon(
                                  onPressed: () {
                                    ManagerDoctorSheet.show(context, doctor: doc, onSaved: _fetchData);
                                  },
                                  icon: const Icon(Icons.edit_note_rounded, size: 16),
                                  label: const Text('Tahrirlash & Parol', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: AppColors.primary,
                                    side: const BorderSide(color: Color(0xFFCBD5E1)),
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                    minimumSize: Size.zero,
                                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                  ),
                                ),
                              ],
                            ),
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

  bool _isDoctorFemale(String name) {
    final clean = name.toLowerCase().trim();
    if (RegExp(r'(ova|yeva|qizi)\b', caseSensitive: false).hasMatch(clean)) return true;
    const femaleNames = ['malika', 'dilnoza', 'nilufar', 'gulnoza', 'umida', 'shahlo', 'zulayho', 'nargiza', 'madina', 'dildora', 'nodira', 'munisa', 'rayhon', 'feruza'];
    return femaleNames.any((f) => clean.contains(f));
  }

  // ==================== TAB 3: BEMORLAR BAZASI ====================
  Widget _buildPatientsTab() {
    final query = _patientSearchController.text.toLowerCase().trim();
    final filtered = _patients.where((p) {
      if (query.isEmpty) return true;
      final nameMatches = p.fullName.toLowerCase().contains(query);
      final phoneMatches = p.phone.contains(query) || Formatters.cleanPhone(p.phone).contains(query);
      final cardMatches = (p.cardNumber ?? '').toLowerCase().contains(query);
      return nameMatches || phoneMatches || cardMatches;
    }).toList();

    final visibleCount = _visiblePatientsCount.clamp(0, filtered.length);
    final displayed = filtered.take(visibleCount).toList();

    return Column(
      children: [
        // Top Search Header
        Container(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          color: Colors.white,
          child: Column(
            children: [
              TextFormField(
                controller: _patientSearchController,
                onChanged: (_) {
                  setState(() {
                    _visiblePatientsCount = 15;
                  });
                },
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.search_rounded, color: AppColors.textMuted),
                  hintText: 'Bemor F.I.Sh yoki telefon raqami...',
                  suffixIcon: _patientSearchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, size: 18),
                          onPressed: () {
                            _patientSearchController.clear();
                            setState(() {});
                          },
                        )
                      : null,
                ),
              ),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Bemorlar: ${displayed.length} / ${filtered.length} ta',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textMuted),
                  ),
                  const Text(
                    '15 tadan yuklanadi (Scroll)',
                    style: TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ],
          ),
        ),
        const Divider(height: 1, color: AppColors.border),

        // Patients List
        Expanded(
          child: displayed.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.people_outline_rounded, size: 48, color: AppColors.textMuted),
                      const SizedBox(height: 8),
                      const Text('Bemorlar topilmadi', style: TextStyle(color: AppColors.textMuted)),
                    ],
                  ),
                )
              : NotificationListener<ScrollNotification>(
                  onNotification: (scrollInfo) {
                    if (scrollInfo.metrics.pixels >= scrollInfo.metrics.maxScrollExtent - 100) {
                      if (_visiblePatientsCount < filtered.length) {
                        setState(() {
                          _visiblePatientsCount += 15;
                        });
                      }
                    }
                    return false;
                  },
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: displayed.length + (_visiblePatientsCount < filtered.length ? 1 : 0),
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      if (index >= displayed.length) {
                        return Center(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            child: OutlinedButton.icon(
                              onPressed: () {
                                setState(() {
                                  _visiblePatientsCount += 15;
                                });
                              },
                              icon: const Icon(Icons.arrow_downward_rounded, size: 16),
                              label: const Text('Yana 15 ta yuklash'),
                            ),
                          ),
                        );
                      }

                      final p = displayed[index];
                      final isFemale = (p.gender ?? '').toLowerCase() == 'female';

                      return InkWell(
                        onTap: () {
                          ManagerPatientDetailSheet.show(context, patient: p, onUpdated: _fetchData);
                        },
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.02),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: isFemale
                                        ? [const Color(0xFFFCE7F3), const Color(0xFFFBCFE8)]
                                        : [const Color(0xFFEFF6FF), const Color(0xFFDBEAFE)],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Center(
                                  child: Icon(
                                    isFemale ? Icons.face_3_rounded : Icons.face_6_rounded,
                                    color: isFemale ? const Color(0xFFDB2777) : const Color(0xFF2563EB),
                                    size: 24,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Flexible(
                                          child: Text(
                                            p.fullName,
                                            style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        if (p.patientNumber != null) ...[
                                          const SizedBox(width: 6),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFF1F5F9),
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: Text(
                                              '#${p.patientNumber}',
                                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primary),
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                    const SizedBox(height: 3),
                                    Row(
                                      children: [
                                        const Icon(Icons.phone_rounded, size: 12, color: AppColors.textMuted),
                                        const SizedBox(width: 4),
                                        Text(
                                          Formatters.formatPhone(p.phone),
                                          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        Text(
                                          'Tashriflar: ${p.totalVisits} marta',
                                          style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                                        ),
                                        const Text(' • ', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                                        Text(
                                          Formatters.formatCurrency(p.totalSpent),
                                          style: const TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.bold),
                                        ),
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
        ),
      ],
    );
  }

  // ==================== TAB 4: TV TABLO & SOZLAMALAR MARKAZI ====================
  Widget _buildTvAndSettingsTab() {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 1. TV JONLI MONITOR PREVIEW & STATUS CARD
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(color: const Color(0xFF0F172A).withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 5)),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.tv_rounded, color: Colors.white, size: 22),
                        SizedBox(width: 8),
                        Text(
                          'Markaziy TV Tablo',
                          style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF16A34A).withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFF22C55E)),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.fiber_manual_record_rounded, size: 8, color: Color(0xFF22C55E)),
                          SizedBox(width: 4),
                          Text('Jonli Efirda (Online)', style: TextStyle(color: Color(0xFF22C55E), fontSize: 11, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Text(
                  'Kutish zalidagi katta ekranda navbatlar, ovozli e\'lonlar va bannerlar real-vaqtda boshqariladi.',
                  style: TextStyle(color: Colors.white70, fontSize: 11.5),
                ),
                const SizedBox(height: 14),

                // Test Chaqiruv Inputlari
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Tezkor Sinov Chaqiruvi (Test Call):', style: TextStyle(color: Colors.white, fontSize: 11.5, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            flex: 2,
                            child: TextFormField(
                              controller: _testTicketCtrl,
                              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                              decoration: InputDecoration(
                                hintText: 'Talon (T-001)',
                                hintStyle: const TextStyle(color: Colors.white38, fontSize: 11),
                                filled: true,
                                fillColor: Colors.black26,
                                contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            flex: 2,
                            child: TextFormField(
                              controller: _testRoomCtrl,
                              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                              decoration: InputDecoration(
                                hintText: 'Xona (4)',
                                hintStyle: const TextStyle(color: Colors.white38, fontSize: 11),
                                filled: true,
                                fillColor: Colors.black26,
                                contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      SizedBox(
                        width: double.infinity,
                        height: 38,
                        child: ElevatedButton.icon(
                          onPressed: _isSendingTestCall ? null : _sendTestCall,
                          icon: _isSendingTestCall
                              ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                              : const Icon(Icons.campaign_rounded, size: 16),
                          label: const Text('TV Tabloga Ovozli Test Chaqiruv Yuborish', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0284C7),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 2. OVOZ VA DIKTANT SOZLAMALARI CARD
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.record_voice_over_rounded, color: AppColors.primary, size: 20),
                        SizedBox(width: 8),
                        Text('Ovozli Chaqiruv (TTS)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    Switch(
                      value: _tvSoundEnabled,
                      activeColor: AppColors.primary,
                      onChanged: (val) => setState(() => _tvSoundEnabled = val),
                    ),
                  ],
                ),
                const Text(
                  'Bemor chaqirilganda sun\'iy intellekt orqali o‘zbek tilida tabiiy diktor ovozida e\'lon qilinadi.',
                  style: TextStyle(fontSize: 11.5, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 14),

                // Ovoz Tanlash (Madina vs Sardor)
                const Text('Diktant Ovozi:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: InkWell(
                        onTap: () => setState(() => _tvVoiceName = 'uz-UZ-MadinaNeural'),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: _tvVoiceName == 'uz-UZ-MadinaNeural' ? AppColors.mintLight : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: _tvVoiceName == 'uz-UZ-MadinaNeural' ? AppColors.primary : const Color(0xFFE2E8F0),
                              width: 1.5,
                            ),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.face_3_rounded, size: 20, color: _tvVoiceName == 'uz-UZ-MadinaNeural' ? AppColors.primary : AppColors.textMuted),
                              const SizedBox(width: 6),
                              const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Madina', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                    Text('Ayol ovozi', style: TextStyle(fontSize: 10, color: AppColors.textMuted)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: InkWell(
                        onTap: () => setState(() => _tvVoiceName = 'uz-UZ-SardorNeural'),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: _tvVoiceName == 'uz-UZ-SardorNeural' ? AppColors.mintLight : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: _tvVoiceName == 'uz-UZ-SardorNeural' ? AppColors.primary : const Color(0xFFE2E8F0),
                              width: 1.5,
                            ),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.face_6_rounded, size: 20, color: _tvVoiceName == 'uz-UZ-SardorNeural' ? AppColors.primary : AppColors.textMuted),
                              const SizedBox(width: 6),
                              const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Sardor', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                    Text('Erkak ovozi', style: TextStyle(fontSize: 10, color: AppColors.textMuted)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // Chaqiruv Shabloni
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Ovozli Chaqiruv Matni Shabloni:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    InkWell(
                      onTap: () {
                        setState(() {
                          _tvVoiceTemplateCtrl.text = 'Talon raqami {letter}{zeros}, {number} raqam egasi, sizni {cabinet} xona, {specialty} xonasiga marhamat!';
                        });
                      },
                      child: const Text('Asliga qaytarish', style: TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _tvVoiceTemplateCtrl,
                  maxLines: 3,
                  style: const TextStyle(fontSize: 12),
                  decoration: InputDecoration(
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    contentPadding: const EdgeInsets.all(12),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
                  ),
                ),
                const SizedBox(height: 6),
                // Quick Tags Chips
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: [
                    _buildTemplateTagChip('{number}', 'Raqam'),
                    _buildTemplateTagChip('{cabinet}', 'Xona'),
                    _buildTemplateTagChip('{specialty}', 'Mutaxassislik'),
                    _buildTemplateTagChip('{letter}', 'Harf'),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 3. TV MATNLARI VA YUGURUVCHI SATR CARD
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.subtitles_rounded, color: AppColors.primary, size: 20),
                    SizedBox(width: 8),
                    Text('TV Ekran Matnlari va Bannerlar', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 12),

                // Slogan Title
                const Text('Klinika Shiori (Slogan):', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                const SizedBox(height: 5),
                TextFormField(
                  controller: _tvSloganTitleCtrl,
                  style: const TextStyle(fontSize: 12.5),
                  decoration: InputDecoration(
                    hintText: 'Sog‘lig‘ingiz biz uchun muhim!',
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                  ),
                ),
                const SizedBox(height: 10),

                // Slogan Subtitle
                const Text('Qo‘shimcha Shior Matni:', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                const SizedBox(height: 5),
                TextFormField(
                  controller: _tvSloganSubtitleCtrl,
                  style: const TextStyle(fontSize: 12.5),
                  decoration: InputDecoration(
                    hintText: 'Navbat bilan qabulga marhamat!',
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                  ),
                ),
                const SizedBox(height: 10),

                // Calling Title
                const Text('Chaqirilganda Ko‘rinadigan Matn:', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                const SizedBox(height: 5),
                TextFormField(
                  controller: _tvCallingTitleCtrl,
                  style: const TextStyle(fontSize: 12.5),
                  decoration: InputDecoration(
                    hintText: 'Hozir chaqirilmoqda!',
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                  ),
                ),
                const SizedBox(height: 10),

                // Bottom Running Banner (Yuguruvchi Satr)
                const Text('Pastki Yuguruvchi Satr (Ticker Banner):', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                const SizedBox(height: 5),
                TextFormField(
                  controller: _tvBottomBannerCtrl,
                  maxLines: 2,
                  style: const TextStyle(fontSize: 12.5),
                  decoration: InputDecoration(
                    hintText: 'Sizning sog‘lig‘ingiz – bizning ustuvor vazifamiz!',
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    contentPadding: const EdgeInsets.all(12),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          // 4. SAQLASH TUGMASI (JONLI EFIRGA QO'LLASH)
          SizedBox(
            height: 50,
            child: ElevatedButton.icon(
              onPressed: _isSavingTv ? null : _saveTvSettings,
              icon: _isSavingTv
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.cloud_upload_rounded),
              label: const Text(
                'TV Tablo Sozlamalarini Saqlash (Jonli Yangilash)',
                style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 3,
              ),
            ),
          ),
          const SizedBox(height: 20),

          // 5. Tizimdan Chiqish
          SizedBox(
            width: double.infinity,
            height: 46,
            child: OutlinedButton(
              onPressed: () async {
                await AuthService().logout();
                if (!mounted) return;
                Navigator.of(context, rootNavigator: true).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
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
                  Text('Tizimdan chiqish (Logout)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildTemplateTagChip(String tag, String label) {
    return InkWell(
      onTap: () {
        setState(() {
          _tvVoiceTemplateCtrl.text += ' $tag';
        });
      },
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
        decoration: BoxDecoration(
          color: const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: const Color(0xFFCBD5E1)),
        ),
        child: Text(
          '$tag ($label)',
          style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
        ),
      ),
    );
  }

  Widget _buildKpiCard(String title, String value, IconData icon, Color color, Color bg) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Container(padding: const EdgeInsets.all(6), decoration: BoxDecoration(color: bg, shape: BoxShape.circle), child: Icon(icon, size: 16, color: color)),
            const SizedBox(height: 6),
            Text(value, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: color)),
            const SizedBox(height: 2),
            Text(title, style: const TextStyle(fontSize: 10, color: AppColors.textMuted), maxLines: 1),
          ],
        ),
      ),
    );
  }

  Widget _buildModuleCard(String title, String subtitle, IconData icon, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 22),
            const Spacer(),
            Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            Text(subtitle, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomNav() {
    return CurvedNotchedNavBar(
      currentIndex: _currentTabIndex,
      onTap: (index) => setState(() => _currentTabIndex = index),
      selectedColor: AppColors.primary,
      items: const [
        CurvedNotchedNavItem(icon: Icons.grid_view_rounded, label: 'Boshqaruv'),
        CurvedNotchedNavItem(icon: Icons.receipt_long_rounded, label: 'Navbatlar'),
        CurvedNotchedNavItem(icon: Icons.medical_services_rounded, label: 'Shifokorlar'),
        CurvedNotchedNavItem(icon: Icons.people_alt_rounded, label: 'Bemorlar'),
        CurvedNotchedNavItem(icon: Icons.tv_rounded, label: 'TV & Sozlama'),
      ],
    );
  }
}
