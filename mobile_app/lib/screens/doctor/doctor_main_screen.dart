import 'dart:async';
import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../models/ticket_model.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/responsive_frame.dart';
import '../auth/login_screen.dart';
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
  bool _isDoctorActive = true;
  List<TicketModel> _tickets = [];
  TicketModel? _currentInServiceTicket;
  TicketModel? _nextWaitingTicket;

  // Live timer for active consultation
  Timer? _consultationTimer;
  int _consultationSeconds = 485; // 08:05 elapsed demo start

  String _queueFilter = 'ALL'; // ALL, WAITING, IN_SERVICE, COMPLETED

  @override
  void initState() {
    super.initState();
    _fetchData();
    _startTimer();
  }

  @override
  void dispose() {
    _consultationTimer?.cancel();
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
    final user = AuthService().currentUser;
    final doctorId = user?.doctorId;

    final tickets = await ApiService().getTickets(doctorId: doctorId);
    setState(() {
      _tickets = tickets;
      _currentInServiceTicket = tickets.cast<TicketModel?>().firstWhere(
            (t) => t?.isInService == true,
            orElse: () => null,
          );
      _nextWaitingTicket = tickets.cast<TicketModel?>().firstWhere(
            (t) => t?.isWaiting == true,
            orElse: () => null,
          );
      _isLoading = false;
    });
  }

  Future<void> _callNextPatient() async {
    setState(() => _isLoading = true);
    final user = AuthService().currentUser;
    final doctorId = user?.doctorId ?? 'doc-1';
    final res = await ApiService().callNext(doctorId);

    await _fetchData();

    if (!mounted) return;
    if (res['success'] != false) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Bemor chaqirildi: ${res['ticketNumber'] ?? 'Navbatdagi bemor'}'),
          backgroundColor: AppColors.primary,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res['message'] ?? 'Kutayotgan bemor topilmadi'), backgroundColor: AppColors.warning),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthService().currentUser;

    return ResponsiveFrame(
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: _buildAppBar(user),
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

  PreferredSizeWidget _buildAppBar(user) {
    return AppBar(
      elevation: 0,
      backgroundColor: Colors.white,
      automaticallyImplyLeading: false,
      title: Row(
        children: [
          CircleAvatar(
            radius: 19,
            backgroundColor: AppColors.mintLight,
            child: const Icon(Icons.person, color: AppColors.primary, size: 22),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  user?.fullName ?? 'Shifokor',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
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
                      '${user?.roomNumber ?? "1"}-xona',
                      style: const TextStyle(fontSize: 11, color: AppColors.textMuted, fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Break / Offline Button
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
      ),
    );
  }

  Widget _buildBody() {
    switch (_currentTabIndex) {
      case 0:
        return _buildHomeTab();
      case 1:
        return _buildQueueTab();
      case 2:
        return _buildStatsTab();
      case 3:
        return _buildSettingsTab();
      default:
        return _buildHomeTab();
    }
  }

  // ==================== TAB 1: BOSH SAHIFA ====================
  Widget _buildHomeTab() {
    final waitingCount = _tickets.where((t) => t.isWaiting).length;
    final completedCount = _tickets.where((t) => t.isCompleted).length;

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 1. KPI Stats Cards Row
          Row(
            children: [
              _buildKpiCard('Jami bemor', '${_tickets.length}', Icons.groups_rounded, AppColors.info, AppColors.infoLight),
              const SizedBox(width: 8),
              _buildKpiCard('Qabulda', '${_currentInServiceTicket != null ? 1 : 0}', Icons.medical_services_rounded, AppColors.primary, AppColors.mintLight),
              const SizedBox(width: 8),
              _buildKpiCard('Kutmoqda', '$waitingCount', Icons.hourglass_top_rounded, AppColors.warning, AppColors.warningLight),
              const SizedBox(width: 8),
              _buildKpiCard('Tugatildi', '$completedCount', Icons.check_circle_rounded, AppColors.success, AppColors.successLight),
            ],
          ),
          const SizedBox(height: 16),

          // 2. Next Patient Banner / Call Action
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withOpacity(0.3),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
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
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.notifications_active_rounded, color: Colors.white, size: 14),
                          SizedBox(width: 6),
                          Text('Navbatdagi Bemor', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                    Text(
                      '$waitingCount ta navbatda',
                      style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 12, fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                if (_nextWaitingTicket != null) ...[
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          _nextWaitingTicket!.ticketNumber,
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.primary),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _nextWaitingTicket!.patientName,
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              _nextWaitingTicket!.serviceName ?? 'Birlamchi ko‘rik',
                              style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.8)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ] else ...[
                  const Text(
                    'Kutish zalida hozircha bemor yo‘q',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white),
                  ),
                ],
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: ElevatedButton(
                    onPressed: _callNextPatient,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppColors.primaryDark,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.campaign_rounded, size: 20),
                        SizedBox(width: 8),
                        Text(
                          'KEYINGI BEMORNI CHAQIRISH',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, letterSpacing: 0.5),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // 3. Current In-Service Card (Matching app_doctor K-015 card)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Hozirgi qabuldagi bemor',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              if (_currentInServiceTicket != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.mintLight,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.mint),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.timer_outlined, size: 14, color: AppColors.primary),
                      const SizedBox(width: 4),
                      Text(
                        _formatTimer(_consultationSeconds),
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),

          if (_currentInServiceTicket != null) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.border),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          _currentInServiceTicket!.ticketNumber,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.white),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _currentInServiceTicket!.patientName,
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                            ),
                            Text(
                              _currentInServiceTicket!.serviceName ?? 'Birlamchi qabul',
                              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.info_outline_rounded, color: AppColors.primary),
                        onPressed: () => DoctorPatientSheet.show(
                          context,
                          ticket: _currentInServiceTicket!,
                          onUpdated: _fetchData,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () async {
                            await ApiService().recallTicket(_currentInServiceTicket!.id);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Qayta e\'lon qilindi'), backgroundColor: AppColors.purple),
                            );
                          },
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.volume_up_outlined, size: 16),
                              SizedBox(width: 6),
                              Text('Qayta chaqirish', style: TextStyle(fontSize: 12)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () => DoctorPatientSheet.show(
                            context,
                            ticket: _currentInServiceTicket!,
                            onUpdated: _fetchData,
                          ),
                          style: ElevatedButton.styleFrom(backgroundColor: AppColors.success),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.check_rounded, size: 16),
                              SizedBox(width: 6),
                              Text('Yakunlash', style: TextStyle(fontSize: 12)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ] else ...[
            Container(
              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  const Icon(Icons.medical_services_outlined, size: 36, color: AppColors.textMuted),
                  const SizedBox(height: 8),
                  const Text('Hozirda qabulda hech kim yo‘q', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
                  const SizedBox(height: 4),
                  const Text('Yuqoridagi tugma orqali navbatdagi bemorni chaqiring', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                ],
              ),
            ),
          ],
          const SizedBox(height: 20),

          // 4. Quick Actions
          const Text(
            'Tezkor Harakatlar',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              _buildActionTile('Navbatlar', Icons.format_list_numbered_rounded, () => setState(() => _currentTabIndex = 1)),
              const SizedBox(width: 10),
              _buildActionTile('Tanaffus', Icons.free_breakfast_outlined, () {
                DoctorOfflineSheet.show(context, onBreakStarted: () => setState(() => _isDoctorActive = false));
              }),
              const SizedBox(width: 10),
              _buildActionTile('Hisobot', Icons.bar_chart_rounded, () => setState(() => _currentTabIndex = 2)),
            ],
          ),
        ],
      ),
    );
  }

  // ==================== TAB 2: MENING NAVBATIM ====================
  Widget _buildQueueTab() {
    List<TicketModel> filtered = _tickets;
    if (_queueFilter == 'WAITING') {
      filtered = _tickets.where((t) => t.isWaiting).toList();
    } else if (_queueFilter == 'IN_SERVICE') {
      filtered = _tickets.where((t) => t.isInService).toList();
    } else if (_queueFilter == 'COMPLETED') {
      filtered = _tickets.where((t) => t.isCompleted).toList();
    }

    return Column(
      children: [
        // Filter tabs
        Container(
          color: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            children: [
              _buildFilterChip('ALL', 'Barchasi (${_tickets.length})'),
              const SizedBox(width: 8),
              _buildFilterChip('WAITING', 'Kutayotgan'),
              const SizedBox(width: 8),
              _buildFilterChip('IN_SERVICE', 'Qabulda'),
              const SizedBox(width: 8),
              _buildFilterChip('COMPLETED', 'Tugatilgan'),
            ],
          ),
        ),
        const Divider(height: 1, color: AppColors.border),
        Expanded(
          child: filtered.isEmpty
              ? const Center(
                  child: Text('Talonlar topilmadi', style: TextStyle(color: AppColors.textMuted)),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final ticket = filtered[index];
                    return _buildTicketCard(ticket);
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildFilterChip(String key, String label) {
    final isSelected = _queueFilter == key;
    return GestureDetector(
      onTap: () => setState(() => _queueFilter = key),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.background,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: isSelected ? AppColors.primary : AppColors.border),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? Colors.white : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildTicketCard(TicketModel ticket) {
    return Container(
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
                Text(
                  '${ticket.serviceName ?? "Ko‘rik"} • ${Formatters.formatTime(ticket.createdAt)}',
                  style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: AppColors.textMuted),
            onPressed: () => DoctorPatientSheet.show(
              context,
              ticket: ticket,
              onUpdated: _fetchData,
            ),
          ),
        ],
      ),
    );
  }

  // ==================== TAB 3: KUNLIK TAHLIL ====================
  Widget _buildStatsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Bugungi ko‘riklar grafigi', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Container(
            height: 180,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildBar('09:00', 0.4),
                _buildBar('10:00', 0.8),
                _buildBar('11:00', 1.0),
                _buildBar('12:00', 0.6),
                _buildBar('13:00', 0.2),
                _buildBar('14:00', 0.7),
                _buildBar('15:00', 0.9),
                _buildBar('16:00', 0.5),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Text('Qabul qilingan xizmatlar taqsimoti', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          _buildStatRow('LOR birlamchi ko‘rik', '12 ta bemor', '1 800 000 so\'m'),
          _buildStatRow('Quloq yuvish muolajasi', '6 ta bemor', '480 000 so\'m'),
          _buildStatRow('Burun tamponadasi', '4 ta bemor', '400 000 so\'m'),
          _buildStatRow('Konsilium xulosasi', '2 ta bemor', '300 000 so\'m'),
        ],
      ),
    );
  }

  Widget _buildBar(String time, double heightFactor) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Container(
          width: 22,
          height: 110 * heightFactor,
          decoration: BoxDecoration(
            color: heightFactor >= 0.8 ? AppColors.primary : AppColors.mint,
            borderRadius: BorderRadius.circular(6),
          ),
        ),
        const SizedBox(height: 6),
        Text(time, style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
      ],
    );
  }

  Widget _buildStatRow(String title, String count, String sum) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          Row(
            children: [
              Text(count, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
              const SizedBox(width: 8),
              Text(sum, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primary)),
            ],
          ),
        ],
      ),
    );
  }

  // ==================== TAB 4: SHAXSIY SOZLAMALAR ====================
  Widget _buildSettingsTab() {
    final user = AuthService().currentUser;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: AppColors.mintLight,
                  child: const Icon(Icons.person, color: AppColors.primary, size: 32),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user?.fullName ?? 'Shifokor', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      Text(user?.specialtyName ?? 'Mutaxassis shifokor', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                      const SizedBox(height: 4),
                      Text('Kabinet: ${user?.roomNumber ?? "1"}-xona', style: const TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _buildSettingsItem(Icons.meeting_room_outlined, 'Kabinet raqami', '${user?.roomNumber ?? "1"}-xona'),
          _buildSettingsItem(Icons.medical_services_outlined, 'Mutaxassislik', user?.specialtyName ?? 'Mutaxassis'),
          _buildSettingsItem(Icons.phone_outlined, 'Telefon raqam', user?.phone ?? 'Mavjud emas'),
          _buildSettingsItem(Icons.badge_outlined, 'Shifokor ID', user?.doctorId ?? user?.id ?? ''),
          _buildSettingsItem(Icons.volume_up_outlined, 'Ovozli e\'lon tili', 'O‘zbekcha (Aziz TTS)'),
          _buildSettingsItem(Icons.notifications_outlined, 'Navbat bildirishnomalari', 'Yoniq'),
          _buildSettingsItem(Icons.security_outlined, 'Xavfsizlik & PIN kod', 'O‘zgartirish'),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: OutlinedButton(
              onPressed: () async {
                await AuthService().logout();
                if (!mounted) return;
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              },
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.error,
                side: const BorderSide(color: AppColors.errorLight),
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
        ],
      ),
    );
  }

  Widget _buildSettingsItem(IconData icon, String title, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppColors.textSecondary),
          const SizedBox(width: 12),
          Expanded(child: Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500))),
          Text(value, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
        ],
      ),
    );
  }

  // ==================== WIDGET HELPERS ====================
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

  Widget _buildActionTile(String title, IconData icon, VoidCallback onTap) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            children: [
              Icon(icon, color: AppColors.primary, size: 22),
              const SizedBox(height: 6),
              Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
            ],
          ),
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
          BottomNavigationBarItem(icon: Icon(Icons.dashboard_rounded), label: 'Bosh sahifa'),
          BottomNavigationBarItem(icon: Icon(Icons.list_alt_rounded), label: 'Navbatim'),
          BottomNavigationBarItem(icon: Icon(Icons.analytics_rounded), label: 'Tahlil'),
          BottomNavigationBarItem(icon: Icon(Icons.person_rounded), label: 'Profil'),
        ],
      ),
    );
  }
}
