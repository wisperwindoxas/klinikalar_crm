import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../models/doctor_model.dart';
import '../../models/patient_model.dart';
import '../../models/ticket_model.dart';
import '../../models/service_model.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/responsive_frame.dart';
import '../auth/login_screen.dart';
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

  final _patientSearchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    final docs = await ApiService().getDoctors();
    final tickets = await ApiService().getTickets();
    final patients = await ApiService().getPatients();
    final services = await ApiService().getServices();
    final stats = await ApiService().getManagerDashboard();

    setState(() {
      _doctors = docs;
      _tickets = tickets;
      _patients = patients;
      _services = services;
      _dashboardStats = stats;
      _isLoading = false;
    });
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
              CircleAvatar(
                radius: 19,
                backgroundColor: AppColors.mintLight,
                child: const Icon(Icons.admin_panel_settings_rounded, color: AppColors.primary, size: 22),
              ),
              const SizedBox(width: 10),
              Expanded(
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
              _buildKpiCard('Tushum', '18.4M', Icons.payments_rounded, AppColors.success, AppColors.successLight),
            ],
          ),
          const SizedBox(height: 18),

          // 2. Real-time clinic load indicator
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withOpacity(0.35),
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
                    const Text('Klinika Umumiy Yuklamasi', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(10)),
                      child: const Text('Normal (68%)', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: const LinearProgressIndicator(
                    value: 0.68,
                    backgroundColor: Colors.white24,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    minHeight: 8,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('18 ta shifokor qabulda', style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 12)),
                    Text('O‘rtacha kutish: 14 daq', style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 12)),
                  ],
                ),
              ],
            ),
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
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Jami ${_doctors.length} ta shifokor', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textMuted)),
              ElevatedButton.icon(
                onPressed: () {
                  ManagerDoctorSheet.show(context, onSaved: _fetchData);
                },
                icon: const Icon(Icons.add, size: 16),
                label: const Text('Shifokor qo‘shish', style: TextStyle(fontSize: 12)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            itemCount: _doctors.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final doc = _doctors[index];
              return Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: AppColors.mintLight,
                      child: Text(doc.fullName.isNotEmpty ? doc.fullName[0] : 'D', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(doc.fullName, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                          Text('${doc.specialty} • ${doc.roomNumber}-xona', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                          Text('Qabul: ${Formatters.formatCurrency(doc.consultationPrice)}', style: const TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.edit_outlined, size: 20, color: AppColors.textMuted),
                      onPressed: () {
                        ManagerDoctorSheet.show(context, doctor: doc, onSaved: _fetchData);
                      },
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

  // ==================== TAB 3: BEMORLAR BAZASI ====================
  Widget _buildPatientsTab() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: TextFormField(
            controller: _patientSearchController,
            onChanged: (q) async {
              final res = await ApiService().getPatients(search: q);
              setState(() => _patients = res);
            },
            decoration: InputDecoration(
              prefixIcon: const Icon(Icons.search_rounded, color: AppColors.textMuted),
              hintText: 'Bemor F.I.Sh yoki telefon raqami...',
              suffixIcon: _patientSearchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, size: 18),
                      onPressed: () {
                        _patientSearchController.clear();
                        _fetchData();
                      },
                    )
                  : null,
            ),
          ),
        ),
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _patients.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final p = _patients[index];
              return Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: AppColors.mintLight,
                      child: Text(p.fullName.isNotEmpty ? p.fullName[0] : 'B', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(p.fullName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                          Text(Formatters.formatPhone(p.phone), style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                          Text('Tashriflar: ${p.totalVisits} marta • ${Formatters.formatCurrency(p.totalSpent)}', style: const TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
                      onPressed: () {
                        ManagerPatientDetailSheet.show(context, patient: p, onUpdated: _fetchData);
                      },
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

  // ==================== TAB 4: TV PULTI & SOZLAMALAR ====================
  Widget _buildTvAndSettingsTab() {
    final user = AuthService().currentUser;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 0. Manager Profile Card
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
                  child: const Icon(Icons.admin_panel_settings_rounded, color: AppColors.primary, size: 30),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user?.fullName ?? 'Menejer', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                      const SizedBox(height: 2),
                      Text('Roli: ${user?.role ?? "MANAGER"} • ${user?.clinicName ?? "SADAF CLINIC"}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                      const SizedBox(height: 2),
                      Text('Aloqa: ${user?.phone ?? "Biriktirilmagan"}', style: const TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 1. TV Display Remote Controller
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.tv_rounded, color: AppColors.primary, size: 22),
                    SizedBox(width: 8),
                    Text('TV Tablo Masofaviy Boshqaruvi', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 8),
                const Text('Kutish zalidagi katta monitorga test chaqiruv yoki bildirishnoma yuborish', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () async {
                      await ApiService().sendTvTestCall('K-015', '104', 'Dr. Azizbek Rahimov');
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('TV Tabloga ovozli test chaqiruvi yuborildi!'), backgroundColor: AppColors.success),
                      );
                    },
                    icon: const Icon(Icons.campaign_rounded),
                    label: const Text('Ovozli Test E\'lon Qilish (TV Tablo)'),
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 2. Clinic Subscription Status (Super Admin connection)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.mintLight,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.primary.withOpacity(0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('SaaS Obuna Holati', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryDark)),
                    Text('FAOL • ENTERPRISE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: AppColors.primary)),
                  ],
                ),
                const SizedBox(height: 6),
                const Text('Keyingi to‘lov sanasi: 23-oktabr, 2027 (Yillik reja)', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                const SizedBox(height: 6),
                const Text('SMS shlyuz: Eskiz.uz (Faol, 2 450 ta SMS qoldiq)', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // 3. Logout
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
        type: BottomNavigationBarType.fixed,
        elevation: 0,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard_rounded), label: 'Boshqaruv'),
          BottomNavigationBarItem(icon: Icon(Icons.format_list_numbered_rounded), label: 'Navbatlar'),
          BottomNavigationBarItem(icon: Icon(Icons.medical_services_rounded), label: 'Shifokorlar'),
          BottomNavigationBarItem(icon: Icon(Icons.people_alt_rounded), label: 'Bemorlar'),
          BottomNavigationBarItem(icon: Icon(Icons.tv_rounded), label: 'TV & Sozlama'),
        ],
      ),
    );
  }
}
