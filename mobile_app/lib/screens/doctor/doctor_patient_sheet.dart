import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../models/ticket_model.dart';
import '../../services/api_service.dart';

class DoctorPatientSheet extends StatefulWidget {
  final TicketModel ticket;
  final VoidCallback onUpdated;

  const DoctorPatientSheet({Key? key, required this.ticket, required this.onUpdated}) : super(key: key);

  static void show(BuildContext context, {required TicketModel ticket, required VoidCallback onUpdated}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => DoctorPatientSheet(ticket: ticket, onUpdated: onUpdated),
    );
  }

  @override
  State<DoctorPatientSheet> createState() => _DoctorPatientSheetState();
}

class _DoctorPatientSheetState extends State<DoctorPatientSheet> {
  final _diagnosisController = TextEditingController();
  final _notesController = TextEditingController();
  bool _isSaving = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.88,
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
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      widget.ticket.ticketNumber,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    Formatters.statusLabel(widget.ticket.status),
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Formatters.statusColor(widget.ticket.status),
                    ),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.close_rounded, size: 22, color: AppColors.textMuted),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Patient summary card
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
                Row(
                  children: [
                    CircleAvatar(
                      radius: 22,
                      backgroundColor: AppColors.mintLight,
                      child: Text(
                        widget.ticket.patientName.isNotEmpty ? widget.ticket.patientName[0] : 'B',
                        style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary, fontSize: 16),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.ticket.patientName,
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            Formatters.formatPhone(widget.ticket.patientPhone ?? '+998 90 *** ** **'),
                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Divider(height: 1, color: AppColors.border),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildMeta('Xizmat', widget.ticket.serviceName ?? 'Birlamchi ko‘rik'),
                    _buildMeta('Kabinet', widget.ticket.roomNumber ?? '104-xona'),
                    _buildMeta('To‘lov', Formatters.formatCurrency(widget.ticket.price)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Medical forms
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Shifokor Tashxisi (Diagnoz)',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 6),
                  TextFormField(
                    controller: _diagnosisController,
                    decoration: const InputDecoration(
                      hintText: 'Masalan: O‘tkir rinit, kataral faza...',
                    ),
                  ),
                  const SizedBox(height: 14),
                  const Text(
                    'Davolash Rejasi & Retsept',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 6),
                  TextFormField(
                    controller: _notesController,
                    maxLines: 4,
                    decoration: const InputDecoration(
                      hintText: 'Dori vositalari, qabul qilish tartibi va tavsiyalar...',
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Previous Visits Log
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.history_edu_rounded, size: 16, color: AppColors.primary),
                            SizedBox(width: 6),
                            Text(
                              'Oldingi Tashriflar Tarixi',
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        _buildHistoryItem('14.09.2026', 'LOR ko‘rigi', 'Dr. Rahimov', 'Tugatilgan'),
                        _buildHistoryItem('02.08.2026', 'Umumiy qon tahlili', 'Laboratoriya', 'Norma'),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Action Buttons
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () async {
                    setState(() => _isSaving = true);
                    await ApiService().recallTicket(widget.ticket.id);
                    setState(() => _isSaving = false);
                    if (!mounted) return;
                    Navigator.pop(context);
                    widget.onUpdated();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Bemor qayta chaqirildi'), backgroundColor: AppColors.purple),
                    );
                  },
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.volume_up_outlined, size: 16),
                      SizedBox(width: 6),
                      Text('Qayta chaqirish'),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton(
                  onPressed: _isSaving
                      ? null
                      : () async {
                          setState(() => _isSaving = true);
                          await ApiService().completeTicket(
                            widget.ticket.id,
                            notes: '${_diagnosisController.text}\n${_notesController.text}',
                          );
                          setState(() => _isSaving = false);
                          if (!mounted) return;
                          Navigator.pop(context);
                          widget.onUpdated();
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Qabul muvaffaqiyatli yakunlandi!'), backgroundColor: AppColors.success),
                          );
                        },
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.success),
                  child: _isSaving
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.check_circle_outline_rounded, size: 16),
                            SizedBox(width: 6),
                            Text('Yakunlash'),
                          ],
                        ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMeta(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
        const SizedBox(height: 2),
        Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
      ],
    );
  }

  Widget _buildHistoryItem(String date, String title, String doctor, String status) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
              Text('$date • $doctor', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
            ],
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(color: AppColors.successLight, borderRadius: BorderRadius.circular(4)),
            child: Text(status, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.success)),
          ),
        ],
      ),
    );
  }
}
