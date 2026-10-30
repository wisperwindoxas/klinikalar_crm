import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../models/patient_model.dart';
import '../../services/api_service.dart';

class ManagerPatientDetailSheet extends StatefulWidget {
  final PatientModel patient;
  final VoidCallback onUpdated;

  const ManagerPatientDetailSheet({Key? key, required this.patient, required this.onUpdated}) : super(key: key);

  static Future<void> show(BuildContext context, {required PatientModel patient, required VoidCallback onUpdated}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withOpacity(0.55),
      builder: (sheetCtx) => AnimatedPadding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(sheetCtx).viewInsets.bottom),
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOutCubic,
        child: ManagerPatientDetailSheet(patient: patient, onUpdated: onUpdated),
      ),
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
        if (res != null) {
          _fullPatient = PatientModel(
            id: res.id.isNotEmpty ? res.id : widget.patient.id,
            patientNumber: res.patientNumber ?? widget.patient.patientNumber,
            fullName: res.fullName.trim().isNotEmpty ? res.fullName : widget.patient.fullName,
            phone: res.phone.trim().isNotEmpty ? res.phone : widget.patient.phone,
            birthDate: res.birthDate ?? widget.patient.birthDate,
            gender: res.gender ?? widget.patient.gender,
            address: res.address ?? widget.patient.address,
            region: res.region ?? widget.patient.region,
            district: res.district ?? widget.patient.district,
            totalVisits: res.totalVisits > 0 ? res.totalVisits : widget.patient.totalVisits,
            totalSpent: res.totalSpent > 0 ? res.totalSpent : widget.patient.totalSpent,
            lastVisitDate: res.lastVisitDate ?? widget.patient.lastVisitDate,
            lastDoctorName: res.lastDoctorName ?? widget.patient.lastDoctorName,
            doctorsVisited: res.doctorsVisited.isNotEmpty ? res.doctorsVisited : widget.patient.doctorsVisited,
          );
        } else {
          _fullPatient = widget.patient;
        }
        _isLoading = false;
      });
    }
  }

  void _copy(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label nusxalandi: $text'),
        backgroundColor: AppColors.primary,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final p = _fullPatient ?? widget.patient;
    final displayFullName = p.fullName.trim().isNotEmpty ? p.fullName.trim() : widget.patient.fullName.trim();
    final displayPhone = p.phone.trim().isNotEmpty ? p.phone.trim() : widget.patient.phone.trim();
    final displayPatientNumber = p.patientNumber ?? widget.patient.patientNumber;
    final docsVisited = p.doctorsVisited;
    final isFemale = (p.gender ?? widget.patient.gender ?? '').toLowerCase() == 'female';

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.90,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Drag Handle
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
          const SizedBox(height: 14),

          // Header Profile Card
          Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isFemale
                        ? [const Color(0xFFF472B6), const Color(0xFFDB2777)]
                        : [const Color(0xFF38BDF8), const Color(0xFF0284C7)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: (isFemale ? const Color(0xFFDB2777) : const Color(0xFF0284C7)).withOpacity(0.25),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Center(
                  child: Icon(
                    isFemale ? Icons.face_3_rounded : Icons.face_6_rounded,
                    color: Colors.white,
                    size: 30,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      displayFullName.isNotEmpty ? displayFullName : 'Noma\'lum Bemor',
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                    Row(
                      children: [
                        Flexible(
                          child: InkWell(
                            onTap: () => _copy(displayPhone, 'Telefon raqami'),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.phone_rounded, size: 13, color: AppColors.primary),
                                const SizedBox(width: 4),
                                Flexible(
                                  child: Text(
                                    displayPhone.isNotEmpty ? Formatters.formatPhone(displayPhone) : 'Telefon kiritilmagan',
                                    style: const TextStyle(
                                      fontSize: 12.5,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.primary,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        if (displayPatientNumber != null) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.mintLight,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              '#$displayPatientNumber',
                              style: const TextStyle(
                                fontSize: 10.5,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close_rounded, color: AppColors.textMuted),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Divider(height: 1, color: AppColors.border),
          const SizedBox(height: 14),

          // Scrollable Body
          Expanded(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // KPI Stats Row
                  Row(
                    children: [
                      _buildStatBox(
                        'Jami tashrif',
                        '${p.totalVisits} marta',
                        Icons.repeat_rounded,
                        const Color(0xFF0284C7),
                        const Color(0xFFE0F2FE),
                      ),
                      const SizedBox(width: 8),
                      _buildStatBox(
                        'Jami to‘lov',
                        Formatters.formatCurrency(p.totalSpent),
                        Icons.payments_rounded,
                        const Color(0xFF16A34A),
                        const Color(0xFFDCFCE7),
                      ),
                      const SizedBox(width: 8),
                      _buildStatBox(
                        'Oxirgi vrach',
                        p.lastDoctorName ?? 'Dr. Aliyev',
                        Icons.medical_services_rounded,
                        const Color(0xFF7C3AED),
                        const Color(0xFFEDE9FE),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // CARD 1: SHAXSIY MA'LUMOTLAR
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.badge_rounded, size: 16, color: Color(0xFF0284C7)),
                            SizedBox(width: 6),
                            Text(
                              'Bemor Shaxsiy Ma\'lumotlari',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        _buildInfoRow('Jinsi', isFemale ? 'Ayol' : 'Erkak', Icons.transgender_rounded),
                        if (p.birthDate != null && p.birthDate!.isNotEmpty)
                          _buildInfoRow(
                            'Tug‘ilgan sana',
                            p.birthDate!.length >= 10 ? p.birthDate!.substring(0, 10) : p.birthDate!,
                            Icons.cake_rounded,
                          ),
                        _buildInfoRow('Viloyat / Hudud', p.region ?? 'Toshkent shahri', Icons.location_city_rounded),
                        _buildInfoRow('Yashash manzili', p.address ?? 'Ko‘rsatilmagan', Icons.home_rounded),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // CARD 2: TASHRIFLAR VA SHIFOKORLAR XULOSASI
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.history_edu_rounded, size: 18, color: AppColors.primary),
                          SizedBox(width: 6),
                          Text(
                            'Shifokor Ko‘riklari va Xulosalari',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                          ),
                        ],
                      ),
                      if (_isLoading)
                        const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                        ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  if (docsVisited.isNotEmpty)
                    ...docsVisited.map((itemRaw) {
                      final item = itemRaw as Map<String, dynamic>;
                      final docName = item['doctor_name'] ?? 'Shifokor';
                      final specName = item['specialty_name'] ?? 'Mutaxassis';
                      final rawConclusion = item['doctor_conclusion'] ?? item['notes'];
                      final hasRealConclusion = rawConclusion != null &&
                          rawConclusion.toString().trim().isNotEmpty &&
                          rawConclusion.toString().trim() != 'Xulosa berilmadi' &&
                          rawConclusion.toString().trim() != 'null';
                      final conclusion = hasRealConclusion
                          ? rawConclusion.toString().trim()
                          : 'Tibbiy xulosa yozilmagan';
                      final visitDate = item['last_visited_at'] != null ? Formatters.formatDate(item['last_visited_at']) : 'Yaqinda';
                      final cabNum = item['cabinet_number'] ?? '1';

                      return _buildDocVisitItem(docName, specName, conclusion, visitDate, cabNum, hasRealConclusion);
                    })
                  else
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        children: [
                          Icon(Icons.assignment_late_outlined, size: 36, color: AppColors.textMuted.withOpacity(0.6)),
                          const SizedBox(height: 8),
                          const Text(
                            'Hozircha ko‘riklar o‘tkazilmagan',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Bemor shifokor qabulida ko‘rikdan o‘tgach, haqiqiy tashxis va xulosalar shu yerda ko‘rinadi',
                            style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),

          // Bottom Action
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            height: 46,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Text('Yopish', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDocVisitItem(String doctor, String spec, String conclusion, String date, String room, bool hasRealConclusion) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: AppColors.mintLight,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.medical_services_rounded, size: 16, color: AppColors.primary),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      doctor,
                      style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    Text(
                      '$spec • $date',
                      style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '$room-xona',
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: hasRealConclusion ? const Color(0xFFF0FDF4) : const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: hasRealConclusion ? const Color(0xFFBBF7D0) : const Color(0xFFE2E8F0),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  hasRealConclusion ? Icons.verified_rounded : Icons.info_outline_rounded,
                  size: 15,
                  color: hasRealConclusion ? const Color(0xFF16A34A) : AppColors.textMuted,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    hasRealConclusion ? 'Tibbiy xulosa: $conclusion' : conclusion,
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: hasRealConclusion ? FontWeight.w600 : FontWeight.normal,
                      color: hasRealConclusion ? const Color(0xFF15803D) : AppColors.textMuted,
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

  Widget _buildStatBox(String title, String val, IconData icon, Color color, Color bg) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: bg.withOpacity(0.5),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withOpacity(0.25)),
        ),
        child: Column(
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(height: 4),
            Text(
              val,
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: color),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            Text(
              title,
              style: const TextStyle(fontSize: 10, color: AppColors.textSecondary),
              maxLines: 1,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 14, color: AppColors.textMuted),
          const SizedBox(width: 6),
          Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
          const Spacer(),
          Flexible(
            child: Text(
              value,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
