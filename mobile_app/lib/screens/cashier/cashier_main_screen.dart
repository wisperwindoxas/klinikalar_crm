import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../models/ticket_model.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/responsive_frame.dart';
import '../auth/login_screen.dart';
import 'cashier_new_ticket_flow.dart';
import 'cashier_ticket_sheet.dart';

class CashierMainScreen extends StatefulWidget {
  const CashierMainScreen({Key? key}) : super(key: key);

  @override
  State<CashierMainScreen> createState() => _CashierMainScreenState();
}

class _CashierMainScreenState extends State<CashierMainScreen> {
  int _currentTabIndex = 0;
  bool _isLoading = true;

  List<TicketModel> _tickets = [];
  List<Map<String, dynamic>> _payments = [];

  double _cashTotal = 0;
  double _cardTotal = 0;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    final tickets = await ApiService().getTickets();
    final payments = await ApiService().getPayments();

    double cash = 0;
    double card = 0;
    for (var p in payments) {
      final amount = (p['amount'] ?? 0).toDouble();
      if ((p['method'] ?? '').toString().toUpperCase() == 'CASH') {
        cash += amount;
      } else {
        card += amount;
      }
    }

    setState(() {
      _tickets = tickets;
      _payments = payments;
      _cashTotal = cash;
      _cardTotal = card;
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
                child: const Icon(Icons.point_of_sale_rounded, color: AppColors.primary, size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      user?.fullName ?? 'Kassir',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    Row(
                      children: [
                        const Icon(Icons.check_circle_rounded, size: 10, color: AppColors.success),
                        const SizedBox(width: 4),
                        Text(user?.phone != null ? 'Smena faol • ${user!.phone}' : 'Smena faol', style: const TextStyle(fontSize: 11, color: AppColors.success, fontWeight: FontWeight.bold)),
                      ],
                    ),
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
        return _buildHomeTab();
      case 1:
        return _buildTicketsTab();
      case 2:
        return _buildPaymentsTab();
      case 3:
        return _buildShiftTab();
      default:
        return _buildHomeTab();
    }
  }

  // ==================== TAB 0: BOSH SAHIFA ====================
  Widget _buildHomeTab() {
    final totalBalance = _cashTotal + _cardTotal;

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 1. Kassa Balansi Card (Matching app_kassir design)
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(22),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withOpacity(0.35),
                  blurRadius: 18,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Bugungi Kassa Tushumi', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(10)),
                      child: const Text('Bugun', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  Formatters.formatCurrency(totalBalance),
                  style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: Colors.white),
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Naqd pul:', style: TextStyle(color: Colors.white70, fontSize: 11)),
                            const SizedBox(height: 2),
                            Text(Formatters.formatCurrency(_cashTotal), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Karta / Payme:', style: TextStyle(color: Colors.white70, fontSize: 11)),
                            const SizedBox(height: 2),
                            Text(Formatters.formatCurrency(_cardTotal), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // 2. Giant Action Button: YANGI TALON BERISH
          SizedBox(
            height: 56,
            child: ElevatedButton(
              onPressed: () {
                CashierNewTicketFlow.show(context, onFinished: _fetchData);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 4,
                shadowColor: AppColors.primary.withOpacity(0.4),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.confirmation_number_rounded, size: 24),
                  SizedBox(width: 10),
                  Text(
                    'YANGI BEMORGA TALON BERISH',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, letterSpacing: 0.5),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // 3. Today's operations overview
          Row(
            children: [
              _buildMetricCard('Chiqarilgan', '${_tickets.length}', Icons.print_rounded, AppColors.info, AppColors.infoLight),
              const SizedBox(width: 10),
              _buildMetricCard('To‘langan', '${_payments.length}', Icons.task_alt_rounded, AppColors.success, AppColors.successLight),
              const SizedBox(width: 10),
              _buildMetricCard('O‘rtacha chek', '180 000', Icons.analytics_outlined, AppColors.purple, AppColors.purpleLight),
            ],
          ),
          const SizedBox(height: 20),

          // 4. Oxirgi chiqarilgan talonlar
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Oxirgi chiqarilgan talonlar', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
              TextButton(
                onPressed: () => setState(() => _currentTabIndex = 1),
                child: const Text('Barchasi', style: TextStyle(fontSize: 12, color: AppColors.primary)),
              ),
            ],
          ),
          const SizedBox(height: 8),

          ..._tickets.take(5).map((t) => _buildRecentTicketItem(t)),
        ],
      ),
    );
  }

  Widget _buildRecentTicketItem(TicketModel t) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Formatters.statusBgColor(t.status),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              t.ticketNumber,
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Formatters.statusColor(t.status)),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(t.patientName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                Text('${t.doctorName ?? "Shifokor"} • ${Formatters.formatTime(t.createdAt)}', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.print_outlined, size: 18, color: AppColors.textMuted),
            onPressed: () {
              CashierTicketSheet.show(
                context,
                ticketData: {
                  'ticketNumber': t.ticketNumber,
                  'patientName': t.patientName,
                  'doctorName': t.doctorName,
                  'roomNumber': t.roomNumber,
                  'serviceName': t.serviceName,
                  'amount': t.price,
                },
                onDone: () {},
              );
            },
          ),
        ],
      ),
    );
  }

  // ==================== TAB 1: TALONLAR ====================
  Widget _buildTicketsTab() {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _tickets.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final t = _tickets[index];
        return _buildRecentTicketItem(t);
      },
    );
  }

  // ==================== TAB 2: TO'LOVLAR ====================
  Widget _buildPaymentsTab() {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _payments.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final p = _payments[index];
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
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(color: AppColors.mintLight, shape: BoxShape.circle),
                child: const Icon(Icons.payment_rounded, color: AppColors.primary, size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(p['patient_name'] ?? p['description'] ?? 'Tibbiy xizmat uchun to‘lov', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                    Text('${p['method'] ?? "Naqd"} • ${Formatters.formatTime(p['created_at'])}', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                  ],
                ),
              ),
              Text(
                Formatters.formatCurrency(p['amount'] ?? 150000),
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primary),
              ),
            ],
          ),
        );
      },
    );
  }

  // ==================== TAB 3: SMENA & PROFIL ====================
  Widget _buildShiftTab() {
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
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Joriy Kassa Smenasi #14', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                    Text('OCHIQ', style: TextStyle(color: AppColors.success, fontWeight: FontWeight.bold, fontSize: 12)),
                  ],
                ),
                const SizedBox(height: 12),
                _buildShiftRow('Holati:', 'Faol smena'),
                _buildShiftRow('Kassir:', user?.fullName ?? 'Kassir'),
                _buildShiftRow('Telefon:', user?.phone ?? 'Biriktirilmagan'),
                _buildShiftRow('Jami naqd tushum:', Formatters.formatCurrency(_cashTotal)),
                _buildShiftRow('Jami karta tushum:', Formatters.formatCurrency(_cardTotal)),
                const Divider(height: 16, color: AppColors.border),
                _buildShiftRow('Kassada jami summa:', Formatters.formatCurrency(_cashTotal + _cardTotal), isBold: true),
              ],
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Smena hisoboti chop etildi va yopildi'), backgroundColor: AppColors.success),
                );
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.warning),
              child: const Text('Smenani Yopish va X-Hisobot'),
            ),
          ),
          const SizedBox(height: 12),
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
              child: const Text('Chiqish'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShiftRow(String label, String value, {bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 12, color: isBold ? AppColors.textPrimary : AppColors.textSecondary, fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
          Text(value, style: TextStyle(fontSize: 12, fontWeight: isBold ? FontWeight.w900 : FontWeight.bold, color: isBold ? AppColors.primary : AppColors.textPrimary)),
        ],
      ),
    );
  }

  Widget _buildMetricCard(String title, String value, IconData icon, Color color, Color bg) {
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
            Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: color)),
            const SizedBox(height: 2),
            Text(title, style: const TextStyle(fontSize: 10, color: AppColors.textMuted), maxLines: 1),
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
          BottomNavigationBarItem(icon: Icon(Icons.dashboard_rounded), label: 'Bosh sahifa'),
          BottomNavigationBarItem(icon: Icon(Icons.receipt_long_rounded), label: 'Talonlar'),
          BottomNavigationBarItem(icon: Icon(Icons.payment_rounded), label: 'To‘lovlar'),
          BottomNavigationBarItem(icon: Icon(Icons.point_of_sale_rounded), label: 'Kassa'),
        ],
      ),
    );
  }
}
