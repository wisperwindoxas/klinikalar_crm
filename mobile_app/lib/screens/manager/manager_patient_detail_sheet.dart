import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../models/patient_model.dart';

class ManagerPatientDetailSheet extends StatelessWidget {
  final PatientModel patient;
  final VoidCallback onUpdated;

  const ManagerPatientDetailSheet({Key? key, required this.patient, required this.onUpdated}) : super(key: key);

  static void show(BuildContext context, {required PatientModel patient, required VoidCallback onUpdated}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ManagerPatientDetailSheet(patient: patient, onUpdated: onUpdated),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(width: 44, height: 4, decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2))),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              CircleAvatar(
                radius: 26,
                backgroundColor: AppColors.mintLight,
                child: Text(
                  patient.fullName.isNotEmpty ? patient.fullName[0] : 'B',
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.primary),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(patient.fullName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    Text(Formatters.formatPhone(patient.phone), style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    if (patient.patientNumber != null)
                      Text('Bemor ID: #${patient.patientNumber}', style: const TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
              IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => Navigator.pop(context)),
            ],
          ),
          const SizedBox(height: 16),

          // Stats row
          Row(
            children: [
              _buildStatBox('Jami tashriflar', '${patient.totalVisits} marta', AppColors.primary),
              const SizedBox(width: 8),
              _buildStatBox('Umumiy to‘lov', Formatters.formatCurrency(patient.totalSpent), AppColors.success),
              const SizedBox(width: 8),
              _buildStatBox('Oxirgi shifokor', patient.lastDoctorName ?? 'Dr. Rahimov', AppColors.purple),
            ],
          ),
          const SizedBox(height: 18),

          // Patient metadata
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              children: [
                _buildInfoRow('Hudud:', patient.region ?? 'Toshkent shahri'),
                _buildInfoRow('Manzil:', patient.address ?? 'Ko‘rsatilmagan'),
                _buildInfoRow('Jinsi:', patient.gender == 'female' ? 'Ayol' : 'Erkak'),
                _buildInfoRow('Oxirgi qabul sanasi:', Formatters.formatDate(patient.lastVisitDate ?? DateTime.now())),
              ],
            ),
          ),
          const SizedBox(height: 16),

          const Text(
            'Tashriflar & To‘lovlar Tarixi',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 8),

          Expanded(
            child: ListView(
              children: [
                _buildHistoryRow('27.10.2026', 'LOR ko‘rigi', 'Dr. Rahimov', 150000, 'Tugatilgan'),
                _buildHistoryRow('15.09.2026', 'Burun rentgeni', 'Rentgen xonasi', 80000, 'Tugatilgan'),
                _buildHistoryRow('02.08.2026', 'Umumiy qon tahlili', 'Laboratoriya', 60000, 'Tugatilgan'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatBox(String title, String val, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Text(val, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: color), maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 2),
            Text(title, style: const TextStyle(fontSize: 10, color: AppColors.textMuted), maxLines: 1),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
          Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        ],
      ),
    );
  }

  Widget _buildHistoryRow(String date, String service, String doctor, double amount, String status) {
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
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(service, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              Text('$date • $doctor', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(Formatters.formatCurrency(amount), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary)),
              Text(status, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.success)),
            ],
          ),
        ],
      ),
    );
  }
}
