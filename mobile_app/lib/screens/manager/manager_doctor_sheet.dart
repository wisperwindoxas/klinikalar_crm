import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../models/doctor_model.dart';
import '../../services/api_service.dart';

class ManagerDoctorSheet extends StatefulWidget {
  final DoctorModel? doctor;
  final VoidCallback onSaved;

  const ManagerDoctorSheet({Key? key, this.doctor, required this.onSaved}) : super(key: key);

  static void show(BuildContext context, {DoctorModel? doctor, required VoidCallback onSaved}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ManagerDoctorSheet(doctor: doctor, onSaved: onSaved),
    );
  }

  @override
  State<ManagerDoctorSheet> createState() => _ManagerDoctorSheetState();
}

class _ManagerDoctorSheetState extends State<ManagerDoctorSheet> {
  final _nameController = TextEditingController();
  final _specialtyController = TextEditingController();
  final _roomController = TextEditingController();
  final _priceController = TextEditingController(text: '150000');
  final _phoneController = TextEditingController(text: '+998 ');
  final _loginController = TextEditingController();
  final _passwordController = TextEditingController(text: 'doctor123');

  bool _isSaving = false;
  bool _obscurePassword = false; // Default visible for manager as requested!

  @override
  void initState() {
    super.initState();
    if (widget.doctor != null) {
      final doc = widget.doctor!;
      _nameController.text = doc.fullName;
      _specialtyController.text = doc.specialty;
      _roomController.text = doc.roomNumber;
      _priceController.text = doc.consultationPrice.toInt().toString();
      _phoneController.text = (doc.phone != null && doc.phone!.isNotEmpty) ? doc.phone! : '+998 ';
      _loginController.text = doc.username ?? _generateLoginFromName(doc.fullName);
      _passwordController.text = (doc.password != null && doc.password!.isNotEmpty) ? doc.password! : 'doctor123';
    } else {
      _loginController.text = 'doc_${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}';
      _passwordController.text = 'doctor123';
    }
  }

  String _generateLoginFromName(String name) {
    final clean = name.toLowerCase().replaceAll(RegExp(r'dr\.?\s*', caseSensitive: false), '').trim();
    final parts = clean.split(' ');
    if (parts.isNotEmpty && parts.first.isNotEmpty) {
      return 'doc_${parts.first.replaceAll(RegExp(r'[^a-z0-9]'), '')}';
    }
    return 'doc_${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}';
  }

  Future<void> _saveDoctor() async {
    final fullName = _nameController.text.trim();
    if (fullName.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Shifokor ismini kiriting'), backgroundColor: AppColors.error),
      );
      return;
    }

    setState(() => _isSaving = true);

    final data = {
      'fullName': fullName,
      'displayName': fullName,
      'specialty': _specialtyController.text.trim().isNotEmpty ? _specialtyController.text.trim() : 'Umumiy amaliyotchi',
      'roomNumber': _roomController.text.trim().isNotEmpty ? _roomController.text.trim() : '1',
      'cabinetNumber': _roomController.text.trim().isNotEmpty ? _roomController.text.trim() : '1',
      'consultationPrice': double.tryParse(_priceController.text.replaceAll(RegExp(r'\D'), '')) ?? 150000,
      'phone': _phoneController.text.trim(),
      'username': _loginController.text.trim().isNotEmpty ? _loginController.text.trim().toLowerCase() : null,
      'login': _loginController.text.trim().isNotEmpty ? _loginController.text.trim().toLowerCase() : null,
      'password': _passwordController.text.trim().isNotEmpty ? _passwordController.text.trim() : 'doctor123',
    };

    if (widget.doctor != null) {
      await ApiService().updateDoctor(widget.doctor!.id, data);
    } else {
      await ApiService().createDoctor(data);
    }

    setState(() => _isSaving = false);
    if (!mounted) return;
    Navigator.pop(context);
    widget.onSaved();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(widget.doctor != null ? 'Shifokor va parol ma\'lumotlari yangilandi' : 'Yangi shifokor muvaffaqiyatli qo‘shildi!'),
        backgroundColor: AppColors.success,
      ),
    );
  }

  void _copyToClipboard(String text, String label) {
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
    final isEdit = widget.doctor != null;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.92,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.fromLTRB(20, 12, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Drag Handle
          Center(
            child: Container(
              width: 44,
              height: 4,
              decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2)),
            ),
          ),
          const SizedBox(height: 14),

          // Header
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF0284C7), Color(0xFF0369A1)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(color: const Color(0xFF0284C7).withOpacity(0.25), blurRadius: 8, offset: const Offset(0, 3)),
                  ],
                ),
                child: const Icon(Icons.medical_services_rounded, color: Colors.white, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isEdit ? 'Shifokorni Tahrirlash' : 'Yangi Shifokor Qo‘shish',
                      style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 2),
                    const Text(
                      'Meneger boshqaruv paneli • Maxfiy ma\'lumotlar',
                      style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
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

          // Scrollable Form Content
          Expanded(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // CARD 1: ASOSIY MA'LUMOTLAR
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.person_outline_rounded, size: 18, color: Color(0xFF0284C7)),
                            SizedBox(width: 6),
                            Text(
                              'Shifokor Ma\'lumotlari',
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // Full Name
                        const Text('F.I.Sh (To‘liq ismi)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _nameController,
                          decoration: InputDecoration(
                            hintText: 'Masalan: Dr. Alisher Alimov',
                            filled: true,
                            fillColor: Colors.white,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF0284C7), width: 1.5)),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Specialty & Cabinet
                        Row(
                          children: [
                            Expanded(
                              flex: 3,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Mutaxassislik', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                                  const SizedBox(height: 6),
                                  TextFormField(
                                    controller: _specialtyController,
                                    decoration: InputDecoration(
                                      hintText: 'Stomatolog',
                                      filled: true,
                                      fillColor: Colors.white,
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF0284C7), width: 1.5)),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              flex: 2,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Kabinet №', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                                  const SizedBox(height: 6),
                                  TextFormField(
                                    controller: _roomController,
                                    decoration: InputDecoration(
                                      hintText: '4',
                                      filled: true,
                                      fillColor: Colors.white,
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF0284C7), width: 1.5)),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // Consultation Price & Phone
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Qabul narxi (so‘m)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                                  const SizedBox(height: 6),
                                  TextFormField(
                                    controller: _priceController,
                                    keyboardType: TextInputType.number,
                                    decoration: InputDecoration(
                                      hintText: '150 000',
                                      filled: true,
                                      fillColor: Colors.white,
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF0284C7), width: 1.5)),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Telefon raqami', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                                  const SizedBox(height: 6),
                                  TextFormField(
                                    controller: _phoneController,
                                    keyboardType: TextInputType.phone,
                                    decoration: InputDecoration(
                                      hintText: '+998 90 123 45 67',
                                      filled: true,
                                      fillColor: Colors.white,
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF0284C7), width: 1.5)),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // CARD 2: TIZIM LOGIN VA PAROLI (FAQAT MENEGERGA KO'RSATILADI)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [const Color(0xFFF0FDF4), const Color(0xFFDCFCE7).withOpacity(0.5)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFF86EFAC)),
                      boxShadow: [
                        BoxShadow(color: const Color(0xFF16A34A).withOpacity(0.06), blurRadius: 10, offset: const Offset(0, 4)),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: const Color(0xFF16A34A),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(Icons.vpn_key_rounded, size: 16, color: Colors.white),
                            ),
                            const SizedBox(width: 8),
                            const Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Tizimga Kirish Ma\'lumotlari',
                                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF15803D)),
                                  ),
                                  Text(
                                    'Faqat Meneger ko‘ra oladigan maxfiy parol',
                                    style: TextStyle(fontSize: 10.5, color: Color(0xFF166534)),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFF16A34A).withOpacity(0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text(
                                'Menegerga ochiq',
                                style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF15803D)),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),

                        // Login
                        const Text('Shifokor Tizim Logini', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF166534))),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _loginController,
                          decoration: InputDecoration(
                            prefixIcon: const Icon(Icons.alternate_email_rounded, color: Color(0xFF16A34A), size: 18),
                            hintText: 'doc_alimov',
                            filled: true,
                            fillColor: Colors.white,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF86EFAC))),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF86EFAC))),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF16A34A), width: 1.5)),
                            suffixIcon: IconButton(
                              icon: const Icon(Icons.copy_rounded, size: 18, color: Color(0xFF16A34A)),
                              tooltip: 'Loginni nusxalash',
                              onPressed: () => _copyToClipboard(_loginController.text.trim(), 'Login'),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Password (WITH EYE TOGGLE & COPY BUTTON)
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Shifokor Paroli', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF166534))),
                            InkWell(
                              onTap: () {
                                setState(() {
                                  _passwordController.text = 'doctor123';
                                });
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Parol "doctor123" ga tiklandi'), duration: Duration(seconds: 1)),
                                );
                              },
                              child: const Text('doctor123 ga tiklash', style: TextStyle(fontSize: 11, color: Color(0xFF15803D), fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _passwordController,
                          obscureText: _obscurePassword,
                          style: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 0.5),
                          decoration: InputDecoration(
                            prefixIcon: const Icon(Icons.lock_outline_rounded, color: Color(0xFF16A34A), size: 18),
                            hintText: 'doctor123',
                            filled: true,
                            fillColor: Colors.white,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF86EFAC))),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF86EFAC))),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF16A34A), width: 1.5)),
                            suffixIcon: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(
                                  icon: Icon(
                                    _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                    size: 19,
                                    color: const Color(0xFF16A34A),
                                  ),
                                  tooltip: _obscurePassword ? 'Parolni ko‘rsatish' : 'Parolni yashirish',
                                  onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.copy_rounded, size: 18, color: Color(0xFF16A34A)),
                                  tooltip: 'Parolni nusxalash',
                                  onPressed: () => _copyToClipboard(_passwordController.text.trim(), 'Parol'),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            const Icon(Icons.info_outline_rounded, size: 13, color: Color(0xFF16A34A)),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                'Shifokor ushbu login va parol orqali mobil yoki veb ilovaga kiradi.',
                                style: TextStyle(fontSize: 10.5, color: Colors.grey.shade700),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),

          // Bottom Action Button
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: _isSaving ? null : _saveDoctor,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0284C7),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              elevation: 2,
            ),
            child: _isSaving
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.save_rounded, size: 18),
                      const SizedBox(width: 8),
                      Text(
                        isEdit ? 'Shifokor Ma\'lumotlarini Saqlash' : 'Shifokorni Ro‘yxatga Olish',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}
