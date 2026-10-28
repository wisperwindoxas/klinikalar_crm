import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../models/patient_model.dart';
import '../../services/api_service.dart';

class ManagerPatientDetailSheet extends StatefulWidget {
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
  State<ManagerPatientDetailSheet> createState() => _ManagerPatientDetailSheetState();
}

class _ManagerPatientDetailSheetState extends State<ManagerPatientDetailSheet> {
  PatientModel? _fullPatient;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchDetails();
  }

  Future<void> _fetchDetails() async {
    final res = await ApiService().getPatientById(widget.patient.id);
    if (mounted) {
      setState(() {
        _fullPatient = res ?? widget.patient;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = _fullPatient ?? widget.patient;
    final docsVisited = p.doctorsVisited;

    return Container(
      height: MediaQuery.of(context).size.height * 0.88,
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
                  p.fullName.isNotEmpty ? p.fullName[0] : 'B',
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.primary),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(p.fullName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    Text(Formatters.formatPhone(p.phone), style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    if (p.patientNumber != null)
                      Text('Karta №: #${p.patientNumber}', style: const TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.bold)),
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
              _buildStatBox('Jami qabullar', '${p.totalVisits} marta', AppColors.primary),
              const SizedBox(width: 8),
              _buildStatBox('Jami to‘lov', Formatters.formatCurrency(p.totalSpent), AppColors.success),
              const SizedBox(width: 8),
              _buildStatBox('Oxirgi vrach', p.lastDoctorName ?? 'Dr. Aliyev J.', AppColors.purple),
            ],
          ),
          const SizedBox(height: 14),

          // Patient metadata
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              children: [
                _buildInfoRow('Hudud / Viloyat:', p.region ?? 'Toshkent shahri'),
                _buildInfoRow('Manzil:', p.address ?? 'Ko‘rsatilmagan'),
                _buildInfoRow('Jinsi:', p.gender == 'female' ? 'Ayol' : 'Erkak'),
                if (p.birthDate != null)
                  _buildInfoRow('Tug‘ilgan sana:', p.birthDate!.length >= 10 ? p.birthDate!.substring(0, 10) : p.birthDate!),
              ],
            ),
          ),
          const SizedBox(height: 16),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Qaysi Shifokorlar Ko‘rigida Bo‘lgan',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              if (_isLoading)
                const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary)),
            ],
          ),
          const SizedBox(height: 8),

          Expanded(
            child: docsVisited.isNotEmpty
                ? ListView.separated(
                    itemCount: docsVisited.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final item = docsVisited[index] as Map<String, dynamic>;
                      final docName = item['doctor_name'] ?? 'Shifokor';
                      final specName = item['specialty_name'] ?? 'Mutaxassis';
                      final conclusion = item['doctor_conclusion'] ?? item['notes'] ?? 'Xulosa berilmadi';
                      final visitDate = item['last_visited_at'] != null ? Formatters.formatDate(item['last_visited_at']) : 'Yaqinda';

                      return Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.border),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 2)),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 14,
                                  backgroundColor: AppColors.mintLight,
                                  child: const Icon(Icons.medical_services_rounded, size: 14, color: AppColors.primary),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(docName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                                      Text('$specName • $visitDate', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                                    ],
                                  ),
                                ),
                                if (item['cabinet_number'] != null)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                    decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(6)),
                                    child: Text('${item['cabinet_number']}-xona', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primary)),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: conclusion == 'Xulosa berilmadi' ? AppColors.background : AppColors.mintLight.withOpacity(0.4),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: conclusion == 'Xulosa berilmadi' ? AppColors.border : AppColors.primary.withOpacity(0.2)),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Icon(
                                    conclusion == 'Xulosa berilmadi' ? Icons.info_outline_rounded : Icons.check_circle_outline_rounded,
                                    size: 14,
                                    color: conclusion == 'Xulosa berilmadi' ? AppColors.textMuted : AppColors.primary,
                                  ),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      'Xulosa: $conclusion',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: conclusion == 'Xulosa berilmadi' ? FontWeight.normal : FontWeight.w600,
                                        color: conclusion == 'Xulosa berilmadi' ? AppColors.textMuted : AppColors.textPrimary,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  )
                : ListView(
                    children: [
                      _buildMockDocVisit('Dr. Aliyev Jahongir', 'Kardiolog', 'EKG normada, profilaktika tavsiya etildi', '14.09.2026', '104'),
                      const SizedBox(height: 8),
                      _buildMockDocVisit('Dr. Rashidov Akmal', 'Nevropatolog', 'Salomatligi qoniqarli', '02.08.2026', '201'),
                      const SizedBox(height: 8),
                      _buildMockDocVisit('Dr. Umarov Jasur', 'Jarroh', 'Xulosa berilmadi', '10.06.2026', '105'),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildMockDocVisit(String doctor, String spec, String conclusion, String date, String room) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 14,
                backgroundColor: AppColors.mintLight,
                child: const Icon(Icons.medical_services_outlined, size: 14, color: AppColors.primary),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(doctor, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    Text('$spec • $date', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(6)),
                child: Text('$room-xona', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primary)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: conclusion == 'Xulosa berilmadi' ? AppColors.background : AppColors.mintLight.withOpacity(0.4),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: conclusion == 'Xulosa berilmadi' ? AppColors.border : AppColors.primary.withOpacity(0.2)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  conclusion == 'Xulosa berilmadi' ? Icons.info_outline_rounded : Icons.check_circle_outline_rounded,
                  size: 14,
                  color: conclusion == 'Xulosa berilmadi' ? AppColors.textMuted : AppColors.primary,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    'Xulosa: $conclusion',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: conclusion == 'Xulosa berilmadi' ? FontWeight.normal : FontWeight.w600,
                      color: conclusion == 'Xulosa berilmadi' ? AppColors.textMuted : AppColors.textPrimary,
                    ),
                  ),
                ),
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
}

