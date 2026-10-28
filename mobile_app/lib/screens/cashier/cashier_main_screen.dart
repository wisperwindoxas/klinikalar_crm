import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../models/patient_model.dart';
import '../../models/ticket_model.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/responsive_frame.dart';
import '../auth/login_screen.dart';
import '../manager/manager_patient_detail_sheet.dart';
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
  List<PatientModel> _patients = [];
  Map<String, dynamic>? _currentShift;

  // Tickets tab filters
  final _ticketSearchCtrl = TextEditingController();
  String _selectedTicketStatus = 'ALL'; // ALL, WAITING, IN_PROGRESS, COMPLETED, CANCELLED

  // Patients tab filters
  final _patientSearchCtrl = TextEditingController();
  int _visiblePatientsCount = 15;

  // Payments tab filters
  final _paymentSearchCtrl = TextEditingController();
  String _selectedPaymentMethod = 'ALL'; // ALL, CASH, CARD, ONLINE

  double _cashTotal = 0;
  double _cardTotal = 0;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  @override
  void dispose() {
    _ticketSearchCtrl.dispose();
    _patientSearchCtrl.dispose();
    _paymentSearchCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    final tickets = await ApiService().getTickets();
    final payments = await ApiService().getPayments();
    final patients = await ApiService().getPatients();
    final shiftRes = await ApiService().getCurrentShift();

    double cash = 0;
    double card = 0;
    for (var p in payments) {
      final amount = (p['amount'] ?? 0).toDouble();
      final method = (p['method'] ?? '').toString().toUpperCase();
      if (method == 'CASH' || method == 'NAQD') {
        cash += amount;
      } else {
        card += amount;
      }
    }

    setState(() {
      _tickets = tickets;
      _payments = payments;
      _patients = patients;
      _currentShift = (shiftRes['data'] is Map<String, dynamic>)
          ? shiftRes['data']
          : (shiftRes.isNotEmpty ? shiftRes : null);
      _cashTotal = cash;
      _cardTotal = card;
      _isLoading = false;
    });
  }

  Future<void> _callTicket(TicketModel t) async {
    final res = await ApiService().recallTicket(t.id);
    if (!mounted) return;
    if (res['success'] != false) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${t.ticketNumber} navbatga chaqirildi!'),
          backgroundColor: AppColors.success,
        ),
      );
      _fetchData();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? 'Chaqirishda xatolik'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _cancelTicketConfirm(TicketModel t) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('${t.ticketNumber} talonini bekor qilish'),
        content: Text('${t.patientName} uchun olingan ushbu talonni bekor qilishni xohlaysizmi?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Yo‘q, qolsin'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Ha, bekor qilinsin'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final res = await ApiService().cancelTicket(t.id);
      if (!mounted) return;
      if (res['success'] != false) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${t.ticketNumber} taloni bekor qilindi'),
            backgroundColor: AppColors.warning,
          ),
        );
        _fetchData();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res['message'] ?? 'Bekor qilishda xatolik'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _openShiftDialog() async {
    final user = AuthService().currentUser;
    final balanceCtrl = TextEditingController(text: '0');
    final notesCtrl = TextEditingController();

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: EdgeInsets.fromLTRB(20, 16, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2))),
            ),
            const SizedBox(height: 16),
            const Text('Yangi Kassa Smenasini Ochish', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            const Text('Smena boshidagi kassa qoldig‘i va izohlarni kiriting.', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
            const SizedBox(height: 16),
            const Text('Boshlang‘ich qoldiq (so‘m)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            TextFormField(
              controller: balanceCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                hintText: '0',
                suffixText: 'UZS',
                prefixIcon: Icon(Icons.account_balance_wallet_outlined, color: AppColors.primary),
              ),
            ),
            const SizedBox(height: 12),
            const Text('Izoh / Eslatma', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            TextFormField(
              controller: notesCtrl,
              decoration: const InputDecoration(
                hintText: 'Masalan: Ertalabki smena',
                prefixIcon: Icon(Icons.note_alt_outlined, color: AppColors.textMuted),
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(ctx);
                setState(() => _isLoading = true);
                final res = await ApiService().openShift(
                  openingBalance: double.tryParse(balanceCtrl.text.replaceAll(RegExp(r'\D'), '')) ?? 0,
                  notes: notesCtrl.text.trim().isNotEmpty ? notesCtrl.text.trim() : null,
                  cashierName: user?.fullName,
                );
                if (res['success'] != false) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Kassa smenasi muvaffaqiyatli ochildi!'), backgroundColor: AppColors.success),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(res['message'] ?? 'Xatolik yuz berdi'), backgroundColor: AppColors.error),
                  );
                }
                _fetchData();
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.success),
              child: const Text('Smenani Ochish'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _closeShiftDialog() async {
    final shiftId = _currentShift?['id']?.toString() ?? '1';
    final totalExpected = (_cashTotal + _cardTotal + ((_currentShift?['opening_balance'] ?? 0).toDouble()));
    final closingCtrl = TextEditingController(text: totalExpected.toInt().toString());

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: EdgeInsets.fromLTRB(20, 16, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2))),
            ),
            const SizedBox(height: 16),
            const Text('Kassa Smenasini Yopish (Z-Hisobot)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            const Text(
              'Joriy smenadagi kassa qoldig‘i va umumiy hisobot yakunlanadi.',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(12)),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Jami hisoblangan tushum:', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                      Text(Formatters.formatCurrency(totalExpected), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const Text('Yakuniy qoldiq (so‘m)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            TextFormField(
              controller: closingCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                suffixText: 'UZS',
                prefixIcon: Icon(Icons.point_of_sale_rounded, color: AppColors.warning),
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(ctx);
                setState(() => _isLoading = true);
                final res = await ApiService().closeShift(
                  shiftId,
                  closingBalance: double.tryParse(closingCtrl.text.replaceAll(RegExp(r'\D'), '')) ?? totalExpected,
                );
                if (res['success'] != false) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Kassa smenasi yopildi va hisobot saqlandi'), backgroundColor: AppColors.success),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(res['message'] ?? 'Xatolik yuz berdi'), backgroundColor: AppColors.error),
                  );
                }
                _fetchData();
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.warning),
              child: const Text('Smenani Yopish va Tasdiqlash'),
            ),
          ],
        ),
      ),
    );
  }

  void _showPaymentDetail(Map<String, dynamic> p) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2))),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                const CircleAvatar(
                  backgroundColor: AppColors.mintLight,
                  radius: 20,
                  child: Icon(Icons.receipt_long_rounded, color: AppColors.primary, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('To‘lov Cheki Tafsilotlari', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      Text('Chek ID: ${p['id'] ?? "CH-001"}', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                    ],
                  ),
                ),
                IconButton(icon: const Icon(Icons.close, size: 20), onPressed: () => Navigator.pop(ctx)),
              ],
            ),
            const Divider(height: 24, color: AppColors.border),
            _buildShiftRow('Bemor / To‘lovchi:', p['patient_name'] ?? 'Bemor', isBold: true),
            _buildShiftRow('Xizmat tavsifi:', p['description'] ?? 'Tibbiy xizmat'),
            _buildShiftRow('To‘lov usuli:', (p['method'] ?? 'NAQD').toString().toUpperCase()),
            _buildShiftRow('Sana & Vaqt:', Formatters.formatDateTime(p['created_at'])),
            const Divider(height: 20, color: AppColors.border),
            _buildShiftRow('Jami to‘langan summa:', Formatters.formatCurrency(p['amount'] ?? 0), isBold: true),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Chek printerga yuborildi'), backgroundColor: AppColors.success),
                );
              },
              icon: const Icon(Icons.print_rounded, size: 18),
              label: const Text('Chekni Chop Etish'),
            ),
          ],
        ),
      ),
    );
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
        return _buildPatientsTab();
      case 3:
        return _buildPaymentsTab();
      case 4:
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

  // ==================== TAB 1: TALONLAR (REAL) ====================
  Widget _buildTicketsTab() {
    final query = _ticketSearchCtrl.text.toLowerCase().trim();
    final filtered = _tickets.where((t) {
      if (query.isNotEmpty) {
        final numMatches = t.ticketNumber.toLowerCase().contains(query);
        final nameMatches = t.patientName.toLowerCase().contains(query);
        final docMatches = (t.doctorName ?? '').toLowerCase().contains(query);
        if (!numMatches && !nameMatches && !docMatches) return false;
      }

      if (_selectedTicketStatus != 'ALL') {
        final s = t.status.toUpperCase();
        if (_selectedTicketStatus == 'WAITING' && s != 'WAITING' && s != 'PENDING') return false;
        if (_selectedTicketStatus == 'IN_PROGRESS' && s != 'IN_PROGRESS' && s != 'SERVING') return false;
        if (_selectedTicketStatus == 'COMPLETED' && s != 'COMPLETED' && s != 'DONE') return false;
        if (_selectedTicketStatus == 'CANCELLED' && s != 'CANCELLED' && s != 'CANCELED') return false;
      }
      return true;
    }).toList();

    final waitingCount = _tickets.where((t) => t.status.toUpperCase() == 'WAITING' || t.status.toUpperCase() == 'PENDING').length;
    final inProgressCount = _tickets.where((t) => t.status.toUpperCase() == 'IN_PROGRESS' || t.status.toUpperCase() == 'SERVING').length;
    final completedCount = _tickets.where((t) => t.status.toUpperCase() == 'COMPLETED' || t.status.toUpperCase() == 'DONE').length;
    final cancelledCount = _tickets.where((t) => t.status.toUpperCase() == 'CANCELLED' || t.status.toUpperCase() == 'CANCELED').length;

    return Column(
      children: [
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
          child: Column(
            children: [
              TextFormField(
                controller: _ticketSearchCtrl,
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.search_rounded, color: AppColors.textMuted),
                  hintText: 'Talon raqami, bemor yoki shifokor...',
                  suffixIcon: _ticketSearchCtrl.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, size: 18),
                          onPressed: () {
                            _ticketSearchCtrl.clear();
                            setState(() {});
                          },
                        )
                      : null,
                ),
              ),
              const SizedBox(height: 10),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildFilterChip('ALL', 'Barchasi (${_tickets.length})'),
                    const SizedBox(width: 6),
                    _buildFilterChip('WAITING', 'Kutmoqda ($waitingCount)'),
                    const SizedBox(width: 6),
                    _buildFilterChip('IN_PROGRESS', 'Qabulda ($inProgressCount)'),
                    const SizedBox(width: 6),
                    _buildFilterChip('COMPLETED', 'Tugatildi ($completedCount)'),
                    const SizedBox(width: 6),
                    _buildFilterChip('CANCELLED', 'Bekor ($cancelledCount)'),
                  ],
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
                      const Icon(Icons.confirmation_number_outlined, size: 48, color: AppColors.textMuted),
                      const SizedBox(height: 8),
                      Text(
                        _ticketSearchCtrl.text.isNotEmpty || _selectedTicketStatus != 'ALL'
                            ? 'Filtr bo‘yicha talonlar topilmadi'
                            : 'Bugun chiqarilgan talonlar mavjud emas',
                        style: const TextStyle(fontSize: 13, color: AppColors.textMuted),
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
                    final isWaiting = t.status.toUpperCase() == 'WAITING' || t.status.toUpperCase() == 'PENDING';

                    return Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: Formatters.statusBgColor(t.status),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  t.ticketNumber,
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w900,
                                    color: Formatters.statusColor(t.status),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Formatters.statusBgColor(t.status).withOpacity(0.5),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  Formatters.formatStatus(t.status),
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: Formatters.statusColor(t.status),
                                  ),
                                ),
                              ),
                              const Spacer(),
                              Text(
                                Formatters.formatTime(t.createdAt),
                                style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              const Icon(Icons.person_outline_rounded, size: 14, color: AppColors.textMuted),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  t.patientName,
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                                ),
                              ),
                              Text(
                                Formatters.formatCurrency(t.price),
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primary),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(Icons.medical_information_outlined, size: 14, color: AppColors.textMuted),
                              const SizedBox(width: 4),
                              Text(
                                '${t.doctorName ?? "Shifokor"} • ${t.roomNumber ?? "104"}-xona',
                                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                              ),
                              if (t.serviceName != null && t.serviceName!.isNotEmpty) ...[
                                const Text(' • ', style: TextStyle(color: AppColors.textMuted)),
                                Expanded(
                                  child: Text(
                                    t.serviceName!,
                                    style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const Divider(height: 18, color: AppColors.border),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              if (isWaiting) ...[
                                OutlinedButton.icon(
                                  onPressed: () => _cancelTicketConfirm(t),
                                  icon: const Icon(Icons.cancel_outlined, size: 14, color: AppColors.error),
                                  label: const Text('Bekor qilish', style: TextStyle(color: AppColors.error, fontSize: 11)),
                                  style: OutlinedButton.styleFrom(
                                    side: const BorderSide(color: AppColors.errorLight),
                                    visualDensity: VisualDensity.compact,
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                ElevatedButton.icon(
                                  onPressed: () => _callTicket(t),
                                  icon: const Icon(Icons.campaign_rounded, size: 14),
                                  label: const Text('Chaqirish', style: TextStyle(fontSize: 11)),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primary,
                                    visualDensity: VisualDensity.compact,
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  ),
                                ),
                                const SizedBox(width: 8),
                              ],
                              IconButton(
                                icon: const Icon(Icons.print_rounded, size: 18, color: AppColors.textSecondary),
                                tooltip: 'Chek chiqarish',
                                onPressed: () {
                                  CashierTicketSheet.show(
                                    context,
                                    ticketData: {
                                      'ticketNumber': t.ticketNumber,
                                      'patientName': t.patientName,
                                      'doctorName': t.doctorName ?? 'Shifokor',
                                      'roomNumber': t.roomNumber ?? '104',
                                      'serviceName': t.serviceName ?? 'Konsultatsiya',
                                      'amount': t.price,
                                    },
                                    onDone: _fetchData,
                                  );
                                },
                              ),
                            ],
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

  Widget _buildFilterChip(String status, String label) {
    final isSelected = _selectedTicketStatus == status;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => setState(() => _selectedTicketStatus = status),
      labelStyle: TextStyle(
        fontSize: 11,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
        color: isSelected ? Colors.white : AppColors.textSecondary,
      ),
      selectedColor: AppColors.primary,
      backgroundColor: AppColors.background,
      visualDensity: VisualDensity.compact,
      padding: const EdgeInsets.symmetric(horizontal: 4),
    );
  }

  // ==================== TAB 2: TO'LOVLAR (REAL) ====================
  Widget _buildPaymentsTab() {
    final query = _paymentSearchCtrl.text.toLowerCase().trim();
    final filtered = _payments.where((p) {
      if (query.isNotEmpty) {
        final name = (p['patient_name'] ?? '').toString().toLowerCase();
        final desc = (p['description'] ?? '').toString().toLowerCase();
        if (!name.contains(query) && !desc.contains(query)) return false;
      }
      if (_selectedPaymentMethod != 'ALL') {
        final m = (p['method'] ?? '').toString().toUpperCase();
        if (_selectedPaymentMethod == 'CASH' && m != 'CASH' && m != 'NAQD') return false;
        if (_selectedPaymentMethod == 'CARD' && m != 'CARD' && m != 'KARTA' && m != 'HUMO' && m != 'UZCARD') return false;
        if (_selectedPaymentMethod == 'ONLINE' && m != 'ONLINE' && m != 'PAYME' && m != 'CLICK') return false;
      }
      return true;
    }).toList();

    return Column(
      children: [
        // Summary Cards
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          child: Column(
            children: [
              Row(
                children: [
                  _buildPaymentSummaryCard('Jami tushum', Formatters.formatCurrency(_cashTotal + _cardTotal), AppColors.primary, AppColors.mintLight),
                  const SizedBox(width: 8),
                  _buildPaymentSummaryCard('Naqd pul', Formatters.formatCurrency(_cashTotal), AppColors.success, AppColors.successLight),
                  const SizedBox(width: 8),
                  _buildPaymentSummaryCard('Karta / Onlayn', Formatters.formatCurrency(_cardTotal), AppColors.info, AppColors.infoLight),
                ],
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _paymentSearchCtrl,
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.search_rounded, color: AppColors.textMuted),
                  hintText: 'Bemor ismi yoki xizmat nomi...',
                  suffixIcon: _paymentSearchCtrl.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, size: 18),
                          onPressed: () {
                            _paymentSearchCtrl.clear();
                            setState(() {});
                          },
                        )
                      : null,
                ),
              ),
              const SizedBox(height: 8),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildPaymentMethodChip('ALL', 'Barchasi (${_payments.length})'),
                    const SizedBox(width: 6),
                    _buildPaymentMethodChip('CASH', 'Naqd pul'),
                    const SizedBox(width: 6),
                    _buildPaymentMethodChip('CARD', 'Karta (UzCard/Humo)'),
                    const SizedBox(width: 6),
                    _buildPaymentMethodChip('ONLINE', 'Onlayn (Payme/Click)'),
                  ],
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
                      const Icon(Icons.receipt_long_outlined, size: 48, color: AppColors.textMuted),
                      const SizedBox(height: 8),
                      const Text('To‘lovlar topilmadi', style: TextStyle(color: AppColors.textMuted)),
                    ],
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final p = filtered[index];
                    final method = (p['method'] ?? 'NAQD').toString().toUpperCase();
                    final isCash = method == 'CASH' || method == 'NAQD';

                    return InkWell(
                      onTap: () => _showPaymentDetail(p),
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: isCash ? AppColors.mintLight : const Color(0xFFEFF6FF),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                isCash ? Icons.payments_rounded : Icons.credit_card_rounded,
                                color: isCash ? AppColors.primary : const Color(0xFF2563EB),
                                size: 18,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    p['patient_name'] ?? p['description'] ?? 'Tibbiy xizmat uchun to‘lov',
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                                  ),
                                  const SizedBox(height: 2),
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: isCash ? AppColors.mintLight : const Color(0xFFEFF6FF),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          method,
                                          style: TextStyle(
                                            fontSize: 9,
                                            fontWeight: FontWeight.bold,
                                            color: isCash ? AppColors.primary : const Color(0xFF2563EB),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        Formatters.formatTime(p['created_at']),
                                        style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  Formatters.formatCurrency(p['amount'] ?? 0),
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primary),
                                ),
                                const SizedBox(height: 2),
                                const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: AppColors.textMuted),
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

  Widget _buildPaymentSummaryCard(String title, String value, Color color, Color bg) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: bg.withOpacity(0.4),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: color),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentMethodChip(String method, String label) {
    final isSelected = _selectedPaymentMethod == method;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => setState(() => _selectedPaymentMethod = method),
      labelStyle: TextStyle(
        fontSize: 11,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
        color: isSelected ? Colors.white : AppColors.textSecondary,
      ),
      selectedColor: AppColors.primary,
      backgroundColor: AppColors.background,
      visualDensity: VisualDensity.compact,
      padding: const EdgeInsets.symmetric(horizontal: 4),
    );
  }

  // ==================== TAB 3: SMENA (REAL) ====================
  Widget _buildShiftTab() {
    final user = AuthService().currentUser;
    final isShiftOpen = _currentShift != null && (_currentShift!['status'] == 'OPEN' || _currentShift!['status'] == 'active');
    final shiftNumber = _currentShift?['id']?.toString() ?? '1';
    final openedAt = _currentShift?['opened_at'];
    final openingBalance = (_currentShift?['opening_balance'] ?? 0).toDouble();
    final totalCashShift = (_currentShift?['total_received'] ?? _cashTotal).toDouble();
    final totalBalance = openingBalance + totalCashShift + _cardTotal;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Shift status card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.border),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.02),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Kassa Smenasi #$shiftNumber',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: isShiftOpen ? AppColors.mintLight : const Color(0xFFFEE2E2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        isShiftOpen ? 'OCHIQ' : 'YOPIQ',
                        style: TextStyle(
                          color: isShiftOpen ? AppColors.success : AppColors.error,
                          fontWeight: FontWeight.w900,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                _buildShiftRow('Kassir:', _currentShift?['cashier_name'] ?? user?.fullName ?? 'Kassir'),
                _buildShiftRow('Telefon:', user?.phone ?? 'Biriktirilmagan'),
                if (openedAt != null)
                  _buildShiftRow('Ochilgan vaqti:', Formatters.formatDateTime(openedAt)),
                _buildShiftRow('Boshlang‘ich qoldiq:', Formatters.formatCurrency(openingBalance)),
                _buildShiftRow('Jami naqd tushum:', Formatters.formatCurrency(totalCashShift)),
                _buildShiftRow('Jami karta tushum:', Formatters.formatCurrency(_cardTotal)),
                if (_currentShift?['notes'] != null && _currentShift!['notes'].toString().isNotEmpty)
                  _buildShiftRow('Izoh:', _currentShift!['notes'].toString()),
                const Divider(height: 20, color: AppColors.border),
                _buildShiftRow('Kassadagi jami summa:', Formatters.formatCurrency(totalBalance), isBold: true),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Actions
          if (isShiftOpen) ...[
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                onPressed: _closeShiftDialog,
                icon: const Icon(Icons.lock_clock_rounded, size: 20),
                label: const Text('Smenani Yopish va X-Hisobot'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.warning,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),
          ] else ...[
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                onPressed: _openShiftDialog,
                icon: const Icon(Icons.point_of_sale_rounded, size: 20),
                label: const Text('Yangi Smena Ochish'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.success,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),
          ],

          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: OutlinedButton.icon(
              onPressed: () async {
                await AuthService().logout();
                if (!mounted) return;
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              },
              icon: const Icon(Icons.logout_rounded, size: 18),
              label: const Text('Tizimdan Chiqish'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.error,
                side: const BorderSide(color: AppColors.errorLight),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
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

  // ==================== TAB 2: BEMORLAR BAZASI ====================
  Widget _buildPatientsTab() {
    final query = _patientSearchCtrl.text.toLowerCase().trim();
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
        Container(
          padding: const EdgeInsets.all(16),
          color: Colors.white,
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _patientSearchCtrl,
                      onChanged: (val) {
                        setState(() {
                          _visiblePatientsCount = 15;
                        });
                      },
                      decoration: InputDecoration(
                        prefixIcon: const Icon(Icons.search_rounded, color: AppColors.textMuted),
                        hintText: 'Bemor F.I.Sh yoki telefon raqami...',
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
                  ),
                  const SizedBox(width: 10),
                  ElevatedButton.icon(
                    onPressed: () {
                      CashierNewTicketFlow.show(context, onFinished: _fetchData);
                    },
                    icon: const Icon(Icons.person_add_rounded, size: 16),
                    label: const Text('Yangi'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                  ),
                ],
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
        Expanded(
          child: displayed.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.people_outline_rounded, size: 48, color: AppColors.textMuted),
                      const SizedBox(height: 8),
                      const Text('Bemorlar topilmadi', style: TextStyle(color: AppColors.textMuted)),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: () {
                          CashierNewTicketFlow.show(context, onFinished: _fetchData);
                        },
                        child: const Text('Yangi bemor ro‘yxatga olish'),
                      ),
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

                      return Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.02),
                              blurRadius: 4,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 20,
                                  backgroundColor: isFemale ? const Color(0xFFFCE7F3) : const Color(0xFFEFF6FF),
                                  child: Icon(
                                    isFemale ? Icons.face_3_rounded : Icons.face_6_rounded,
                                    color: isFemale ? const Color(0xFFDB2777) : const Color(0xFF2563EB),
                                    size: 22,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        p.fullName,
                                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                                      ),
                                      const SizedBox(height: 2),
                                      Row(
                                        children: [
                                          const Icon(Icons.phone_outlined, size: 12, color: AppColors.textMuted),
                                          const SizedBox(width: 4),
                                          Text(
                                            Formatters.formatPhone(p.phone),
                                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppColors.mintLight,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    '${p.totalVisits} ta tashrif',
                                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary),
                                  ),
                                ),
                              ],
                            ),
                            if (p.address != null && p.address!.isNotEmpty) ...[
                              const SizedBox(height: 8),
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
                            const SizedBox(height: 12),
                            const Divider(height: 1, color: AppColors.border),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                TextButton.icon(
                                  onPressed: () {
                                    ManagerPatientDetailSheet.show(context, patient: p, onUpdated: _fetchData);
                                  },
                                  icon: const Icon(Icons.history_edu_rounded, size: 16),
                                  label: const Text('Tarix & Xulosalar'),
                                  style: TextButton.styleFrom(
                                    foregroundColor: AppColors.primary,
                                    visualDensity: VisualDensity.compact,
                                  ),
                                ),
                                ElevatedButton.icon(
                                  onPressed: () {
                                    CashierNewTicketFlow.show(context, initialPatient: p, onFinished: _fetchData);
                                  },
                                  icon: const Icon(Icons.confirmation_number_outlined, size: 16),
                                  label: const Text('Qabulga yo‘naltirish'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primary,
                                    visualDensity: VisualDensity.compact,
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
        ),
      ],
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
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
        unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.normal, fontSize: 11),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard_rounded), label: 'Bosh sahifa'),
          BottomNavigationBarItem(icon: Icon(Icons.receipt_long_rounded), label: 'Talonlar'),
          BottomNavigationBarItem(icon: Icon(Icons.people_alt_rounded), label: 'Bemorlar'),
          BottomNavigationBarItem(icon: Icon(Icons.payment_rounded), label: 'To‘lovlar'),
          BottomNavigationBarItem(icon: Icon(Icons.point_of_sale_rounded), label: 'Smena'),
        ],
      ),
    );
  }
}
