import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
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

  @override
  void initState() {
    super.initState();
    if (widget.doctor != null) {
      _nameController.text = widget.doctor!.fullName;
      _specialtyController.text = widget.doctor!.specialty;
      _roomController.text = widget.doctor!.roomNumber;
      _priceController.text = widget.doctor!.consultationPrice.toInt().toString();
      _phoneController.text = widget.doctor!.phone ?? '+998 ';
    }
  }

  Future<void> _saveDoctor() async {
    if (_nameController.text.trim().isEmpty) return;
    setState(() => _isSaving = true);

    final data = {
      'fullName': _nameController.text.trim(),
      'displayName': _nameController.text.trim(),
      'specialty': _specialtyController.text.trim(),
      'roomNumber': _roomController.text.trim(),
      'cabinetNumber': _roomController.text.trim(),
      'consultationPrice': double.tryParse(_priceController.text) ?? 150000,
      'phone': _phoneController.text.replaceAll(' ', ''),
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
        content: Text(widget.doctor != null ? 'Shifokor ma\'lumotlari yangilandi' : 'Yangi shifokor qo‘shildi!'),
        backgroundColor: AppColors.success,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.doctor != null;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.fromLTRB(20, 12, 20, MediaQuery.of(context).viewInsets.bottom + 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(width: 44, height: 4, decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2))),
          ),
          const SizedBox(height: 16),
          Text(
            isEdit ? 'Shifokorni Tahrirlash' : 'Yangi Shifokor Qo‘shish',
            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 16),
          const Text('F.I.Sh (Ism va Familiya)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
          const SizedBox(height: 6),
          TextFormField(controller: _nameController, decoration: const InputDecoration(hintText: 'Dr. Karimov Bobur')),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Mutaxassislik', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
                    const SizedBox(height: 6),
                    TextFormField(controller: _specialtyController, decoration: const InputDecoration(hintText: 'Terapevt')),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Kabinet raqami', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
                    const SizedBox(height: 6),
                    TextFormField(controller: _roomController, decoration: const InputDecoration(hintText: '105')),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Qabul narxi (so\'m)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
                    const SizedBox(height: 6),
                    TextFormField(controller: _priceController, keyboardType: TextInputType.number, decoration: const InputDecoration(hintText: '150000')),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Telefon', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
                    const SizedBox(height: 6),
                    TextFormField(controller: _phoneController, keyboardType: TextInputType.phone, decoration: const InputDecoration(hintText: '+998 90 ...')),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Tizim Logini', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
                    const SizedBox(height: 6),
                    TextFormField(controller: _loginController, decoration: const InputDecoration(hintText: 'doc_karimov')),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Tizim Paroli', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
                    const SizedBox(height: 6),
                    TextFormField(controller: _passwordController, decoration: const InputDecoration(hintText: 'doctor123')),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _isSaving ? null : _saveDoctor,
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, padding: const EdgeInsets.symmetric(vertical: 14)),
            child: _isSaving
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : Text(isEdit ? 'Saqlash' : 'Shifokorni Ro‘yxatga Olish', style: const TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
