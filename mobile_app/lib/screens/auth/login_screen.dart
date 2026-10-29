import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/utils/formatters.dart';
import '../../services/auth_service.dart';
import '../../services/security_service.dart';
import '../doctor/doctor_main_screen.dart';
import '../cashier/cashier_main_screen.dart';
import '../manager/manager_main_screen.dart';
import 'pin_lock_screen.dart';
import 'pin_setup_sheet.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _isLoading = false;
  bool _autoFormatPhone = true; // By default: 🇺🇿 +998 (XX) XXX-XX-XX

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final rawPassword = _passwordController.text;
    String rawLogin;

    if (_autoFormatPhone) {
      final clean = Formatters.cleanPhone(_phoneController.text);
      if (clean.length < 9) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('9 xonali telefon raqamingizni to‘liq kiriting'),
            backgroundColor: AppColors.error,
          ),
        );
        return;
      }
      rawLogin = '+998$clean';
    } else {
      rawLogin = _phoneController.text.trim();
    }

    if (rawLogin.isEmpty || rawPassword.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Login va parolni kiriting'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    final result = await AuthService().login(rawLogin, rawPassword);

    setState(() => _isLoading = false);

    if (!mounted) return;

    if (result['success'] == true) {
      final sec = SecurityService();
      if (!sec.hasPin) {
        _promptPinSetup();
      } else {
        sec.unlock();
        _navigateToRole();
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message'] ?? 'Login yoki parol noto‘g‘ri'),
          backgroundColor: AppColors.error,
          duration: const Duration(seconds: 7),
          action: SnackBarAction(
            label: 'Server IP',
            textColor: Colors.white,
            onPressed: _showServerConfigDialog,
          ),
        ),
      );
    }
  }

  void _promptPinSetup() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        title: const Row(
          children: [
            Icon(Icons.fingerprint_rounded, color: AppColors.primary, size: 28),
            SizedBox(width: 10),
            Text('Tezkor Kirish', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
          ],
        ),
        content: const Text(
          'Har safar login va parol kiritmaslik uchun 4 xonali PIN-kod va barmoq izi orqali kirishni yoqishni xohlaysizmi?',
          style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              _navigateToRole();
            },
            child: const Text('Keyinroq', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () {
              Navigator.pop(ctx);
              PinSetupSheet.show(context, onPinSetSuccess: _navigateToRole);
            },
            child: const Text('PIN-kod o‘rnatish'),
          ),
        ],
      ),
    );
  }

  void _navigateToRole() {
    final user = AuthService().currentUser;
    if (user == null) return;

    Widget targetScreen;
    if (user.isManager) {
      targetScreen = const ManagerMainScreen();
    } else if (user.isCashier) {
      targetScreen = const CashierMainScreen();
    } else {
      targetScreen = const DoctorMainScreen();
    }

    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => targetScreen),
      (route) => false,
    );
  }

  void _showServerConfigDialog() {
    final ipCtrl = TextEditingController(text: ApiConstants.baseUrl);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Server Manzili (API URL)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Agar telefoningiz Wi-Fi orqali serverga ulansa, kompyuter IP manzilini kiriting:',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: ipCtrl,
              decoration: const InputDecoration(
                hintText: 'http://192.168.1.7:5001/api/v1',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Bekor qilish')),
          ElevatedButton(
            onPressed: () async {
              await ApiConstants.updateBaseUrl(ipCtrl.text.trim());
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Server manzili saqlandi: ${ApiConstants.baseUrl}')),
              );
            },
            child: const Text('Saqlash'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Align(
                alignment: Alignment.topRight,
                child: IconButton(
                  icon: const Icon(Icons.settings_outlined, color: AppColors.textMuted, size: 22),
                  tooltip: 'Server IP sozlamalari',
                  onPressed: _showServerConfigDialog,
                ),
              ),
              // App Brand & Logo
              Center(
                child: Container(
                  width: 90,
                  height: 90,
                  color: Colors.transparent,
                  child: Image.asset(
                    'assets/images/logo.png',
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) => const Icon(
                      Icons.local_hospital_rounded,
                      size: 40,
                      color: AppColors.medicalBlue,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              const Center(
                child: Text(
                  'klinika-admin',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              const Center(
                child: Text(
                  'Elektron Navbat & Boshqaruv Tizimi',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textMuted,
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Form
              Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _autoFormatPhone ? 'Telefon raqam' : 'Foydalanuvchi logini',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        InkWell(
                          onTap: () {
                            setState(() {
                              _autoFormatPhone = !_autoFormatPhone;
                              _phoneController.clear();
                            });
                          },
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: _autoFormatPhone ? AppColors.mintLight : AppColors.background,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: _autoFormatPhone ? AppColors.primary : AppColors.border),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  _autoFormatPhone ? Icons.phone_android_rounded : Icons.person_outline_rounded,
                                  size: 13,
                                  color: _autoFormatPhone ? AppColors.primary : AppColors.textMuted,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  _autoFormatPhone ? '🇺🇿 +998 Raqam' : 'Matnli Login',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: _autoFormatPhone ? AppColors.primary : AppColors.textMuted,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: _autoFormatPhone ? TextInputType.phone : TextInputType.text,
                      inputFormatters: _autoFormatPhone ? [const Uzbek9DigitPhoneFormatter()] : [],
                      onChanged: (_) => setState(() {}),
                      decoration: InputDecoration(
                        prefixIcon: _autoFormatPhone
                            ? Container(
                                padding: const EdgeInsets.only(left: 14, right: 10),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Text('🇺🇿', style: TextStyle(fontSize: 22)),
                                    const SizedBox(width: 8),
                                    const Text(
                                      '+998',
                                      style: TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Container(
                                      width: 1.2,
                                      height: 22,
                                      color: AppColors.border,
                                    ),
                                  ],
                                ),
                              )
                            : const Icon(Icons.person_outline_rounded, size: 20, color: AppColors.textMuted),
                        hintText: _autoFormatPhone ? '(90) 123-45-67' : 'Masalan: alisher_alimov',
                        suffixIcon: _phoneController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, size: 18, color: AppColors.textMuted),
                                onPressed: () => setState(() => _phoneController.clear()),
                              )
                            : null,
                      ),
                    ),
                    const SizedBox(height: 18),
                    const Text(
                      'Parol',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      decoration: InputDecoration(
                        prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20, color: AppColors.textMuted),
                        hintText: '••••••••',
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                            size: 20,
                            color: AppColors.textMuted,
                          ),
                          onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            SizedBox(
                              width: 20,
                              height: 20,
                              child: Checkbox(
                                value: true,
                                onChanged: (val) {},
                                activeColor: AppColors.primary,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Text('Eslab qolish', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                          ],
                        ),
                        TextButton(
                          onPressed: () {},
                          child: const Text('Parolni unutdingizmi?', style: TextStyle(fontSize: 12, color: AppColors.primary)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Container(
                      width: double.infinity,
                      height: 52,
                      decoration: BoxDecoration(
                        gradient: AppColors.medicalGradient,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.medicalBlue.withOpacity(0.35),
                            blurRadius: 16,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _handleLogin,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                              )
                            : const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    'Tizimga kirish',
                                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                                  ),
                                  SizedBox(width: 8),
                                  Icon(Icons.arrow_forward_rounded, size: 18, color: Colors.white),
                                ],
                              ),
                      ),
                    ),
                    if (SecurityService().hasPin && AuthService().currentUser != null) ...[
                      const SizedBox(height: 14),
                      OutlinedButton.icon(
                        icon: const Icon(Icons.fingerprint_rounded, color: AppColors.primary, size: 22),
                        label: Text(
                          '${AuthService().currentUser!.fullName} (PIN / Barmoq izi)',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.primary),
                          overflow: TextOverflow.ellipsis,
                        ),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
                          side: const BorderSide(color: AppColors.primary, width: 1.5),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        onPressed: () {
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(
                              builder: (_) => PinLockScreen(user: AuthService().currentUser!),
                            ),
                          );
                        },
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
