import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

class DoctorOfflineSheet extends StatefulWidget {
  final VoidCallback onBreakStarted;

  const DoctorOfflineSheet({Key? key, required this.onBreakStarted}) : super(key: key);

  static void show(BuildContext context, {required VoidCallback onBreakStarted}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => DoctorOfflineSheet(onBreakStarted: onBreakStarted),
    );
  }

  @override
  State<DoctorOfflineSheet> createState() => _DoctorOfflineSheetState();
}

class _DoctorOfflineSheetState extends State<DoctorOfflineSheet> {
  int _selectedMinutes = 15;
  String _reason = 'Qisqa tanaffus';

  final List<int> _durations = [10, 15, 20, 30, 45, 60];
  final List<String> _reasons = [
    'Qisqa tanaffus',
    'Tushlik vaqti',
    'Shoshilinch konsilium',
    'Bemor ko‘rigi (Statsionar)',
    'Operatsiyada',
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
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
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.warningLight,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.coffee_rounded, color: AppColors.warning, size: 24),
              ),
              const SizedBox(width: 14),
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Tanaffus Rejimi',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  ),
                  Text(
                    'Navbatdagi bemorlar kutish zalida xabardor qilinadi',
                    style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          const Text(
            'Tanaffus davomiyligi:',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _durations.map((mins) {
              final isSel = _selectedMinutes == mins;
              return ChoiceChip(
                label: Text('$mins daqiqa'),
                selected: isSel,
                onSelected: (_) => setState(() => _selectedMinutes = mins),
                selectedColor: AppColors.primary,
                labelStyle: TextStyle(
                  color: isSel ? Colors.white : AppColors.textPrimary,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
                backgroundColor: AppColors.background,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              );
            }).toList(),
          ),
          const SizedBox(height: 18),
          const Text(
            'Sabab:',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _reason,
                isExpanded: true,
                items: _reasons.map((r) {
                  return DropdownMenuItem(value: r, child: Text(r, style: const TextStyle(fontSize: 13)));
                }).toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _reason = val);
                },
              ),
            ),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Bekor qilish'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    widget.onBreakStarted();
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Tanaffus boshlandi ($_selectedMinutes daqiqa)'),
                        backgroundColor: AppColors.warning,
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.warning),
                  child: const Text('Boshlash'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
