import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';

class CashierTicketSheet extends StatelessWidget {
  final Map<String, dynamic> ticketData;
  final VoidCallback onDone;

  const CashierTicketSheet({Key? key, required this.ticketData, required this.onDone}) : super(key: key);

  static void show(BuildContext context, {required Map<String, dynamic> ticketData, required VoidCallback onDone}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => CashierTicketSheet(ticketData: ticketData, onDone: onDone),
    );
  }

  @override
  Widget build(BuildContext context) {
    final ticketNumber = ticketData['ticketNumber'] ?? ticketData['number'] ?? 'K-019';
    final patientName = ticketData['patientName'] ?? 'Bemor';
    final doctorName = ticketData['doctorName'] ?? 'Shifokor';
    final roomNumber = ticketData['roomNumber'] ?? '104';
    final serviceName = ticketData['serviceName'] ?? 'Konsultatsiya';
    final amount = ticketData['amount'] ?? 150000;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 44,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Center(
            child: Icon(Icons.check_circle_rounded, color: AppColors.success, size: 54),
          ),
          const SizedBox(height: 8),
          const Center(
            child: Text(
              'Talon Muvaffaqiyatli Chiqarildi!',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
            ),
          ),
          const SizedBox(height: 18),

          // Printable Ticket Design (Receipt style)
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              children: [
                const Text(
                  'SADAF CLINIC',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, letterSpacing: 1, color: AppColors.primary),
                ),
                const Text(
                  'Elektron Navbat Taloni',
                  style: TextStyle(fontSize: 11, color: AppColors.textMuted),
                ),
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.primary, width: 2),
                  ),
                  child: Text(
                    ticketNumber,
                    style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: AppColors.primary),
                  ),
                ),
                const SizedBox(height: 14),
                _buildReceiptRow('Bemor:', patientName),
                _buildReceiptRow('Shifokor:', doctorName),
                _buildReceiptRow('Kabinet:', '$roomNumber-xona'),
                _buildReceiptRow('Xizmat turi:', serviceName),
                _buildReceiptRow('To‘lov summasi:', Formatters.formatCurrency(amount)),
                _buildReceiptRow('Sana & Vaqt:', Formatters.formatDate(DateTime.now())),
                const SizedBox(height: 12),
                const Divider(height: 1, color: AppColors.border),
                const SizedBox(height: 12),
                const Text(
                  'Iltimos, navbatingizni ekranda kuzating',
                  style: TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: AppColors.textMuted),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Actions
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Talon printerga yuborildi'), backgroundColor: AppColors.info),
                    );
                  },
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.print_rounded, size: 18),
                      SizedBox(width: 6),
                      Text('Chop etish'),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    onDone();
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                  child: const Text('Tayyor'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildReceiptRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
          Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        ],
      ),
    );
  }
}
