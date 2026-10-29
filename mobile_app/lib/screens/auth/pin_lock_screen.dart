import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/constants/app_colors.dart';
import '../../models/user_model.dart';
import '../../services/auth_service.dart';
import '../../services/security_service.dart';
import '../../widgets/responsive_frame.dart';
import '../doctor/doctor_main_screen.dart';
import '../cashier/cashier_main_screen.dart';
import '../manager/manager_main_screen.dart';
import 'login_screen.dart';

class PinLockScreen extends StatefulWidget {
  final UserModel user;
  final VoidCallback? onUnlocked;

  const PinLockScreen({
    Key? key,
    required this.user,
    this.onUnlocked,
  }) : super(key: key);

  @override
  State<PinLockScreen> createState() => _PinLockScreenState();
}

class _PinLockScreenState extends State<PinLockScreen> with SingleTickerProviderStateMixin {
  String _enteredPin = '';
  String? _errorMessage;
  late AnimationController _shakeController;
  late Animation<double> _shakeAnimation;

  @override
  void initState() {
    super.initState();
    _shakeController = AnimationController(
      duration: const Duration(milliseconds: 350),
      vsync: this,
    );
    _shakeAnimation = Tween<double>(begin: 0, end: 12)
        .chain(CurveTween(curve: Curves.elasticIn))
        .animate(_shakeController);

    // Auto-trigger biometric authentication on screen load
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _tryBiometricAuth();
    });
  }

  @override
  void dispose() {
    _shakeController.dispose();
    super.dispose();
  }

  Future<void> _tryBiometricAuth() async {
    final sec = SecurityService();
    if (!sec.deviceSupportsBiometrics || !sec.biometricsEnabled) return;

    final success = await sec.authenticateBiometric(
      reason: 'klinika-admin tizimiga kirish',
    );
    if (!mounted) return;

    if (success) {
      _unlockApp();
    }
  }

  void _onNumberPressed(String number) {
    if (_enteredPin.length >= 4) return;
    HapticFeedback.lightImpact();

    setState(() {
      _errorMessage = null;
      _enteredPin += number;
    });

    if (_enteredPin.length == 4) {
      _verifyPin();
    }
  }

  void _onBackspacePressed() {
    if (_enteredPin.isEmpty) return;
    HapticFeedback.lightImpact();
    setState(() {
      _errorMessage = null;
      _enteredPin = _enteredPin.substring(0, _enteredPin.length - 1);
    });
  }

  void _verifyPin() {
    final sec = SecurityService();
    final isValid = sec.verifyPin(_enteredPin);

    if (isValid) {
      HapticFeedback.mediumImpact();
      _unlockApp();
    } else {
      HapticFeedback.heavyImpact();
      _shakeController.forward(from: 0.0);
      setState(() {
        _errorMessage = 'PIN-kod noto‘g‘ri kiritildi';
        _enteredPin = '';
      });
    }
  }

  void _unlockApp() {
    if (widget.onUnlocked != null) {
      widget.onUnlocked!();
      return;
    }

    final user = widget.user;
    Widget destination;
    if (user.isManager) {
      destination = const ManagerMainScreen();
    } else if (user.isCashier) {
      destination = const CashierMainScreen();
    } else {
      destination = const DoctorMainScreen();
    }

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => destination),
    );
  }

  void _logoutAndSwitchUser() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Hisobdan chiqish', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: const Text('Haqiqatan ham boshqa hisob orqali tizimga kirmoqchimisiz?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Bekor qilish'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Chiqish'),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      await AuthService().logout();
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final sec = SecurityService();

    return ResponsiveFrame(
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Column(
            children: [
              const SizedBox(height: 16),
              // Header & Clinic Info
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            gradient: AppColors.primaryGradient,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Center(
                            child: Icon(Icons.local_hospital_rounded, color: Colors.white, size: 22),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'klinika-admin',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                            ),
                            Text(
                              widget.user.clinicName ?? 'Tibbiyot Markazi',
                              style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                            ),
                          ],
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.logout_rounded, color: AppColors.textMuted, size: 22),
                      tooltip: 'Boshqa hisobdan kirish',
                      onPressed: _logoutAndSwitchUser,
                    ),
                  ],
                ),
              ),

              const Spacer(flex: 1),

              // User Avatar & Greeting
              Container(
                width: 76,
                height: 76,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.primary.withOpacity(0.12),
                  border: Border.all(color: AppColors.primary.withOpacity(0.3), width: 2),
                ),
                child: Center(
                  child: Text(
                    widget.user.fullName.isNotEmpty ? widget.user.fullName[0].toUpperCase() : 'U',
                    style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: AppColors.primary),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                widget.user.fullName,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.border),
                ),
                child: Text(
                  widget.user.roleTitle,
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                ),
              ),

              const SizedBox(height: 24),

              // PIN dots
              AnimatedBuilder(
                animation: _shakeAnimation,
                builder: (context, child) {
                  return Transform.translate(
                    offset: Offset(_shakeAnimation.value, 0),
                    child: child,
                  );
                },
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(4, (index) {
                    final isFilled = index < _enteredPin.length;
                    return Container(
                      margin: const EdgeInsets.symmetric(horizontal: 10),
                      width: 18,
                      height: 18,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isFilled
                            ? (_errorMessage != null ? AppColors.error : AppColors.primary)
                            : Colors.transparent,
                        border: Border.all(
                          color: isFilled
                              ? (_errorMessage != null ? AppColors.error : AppColors.primary)
                              : AppColors.border,
                          width: 2,
                        ),
                      ),
                    );
                  }),
                ),
              ),

              const SizedBox(height: 12),
              SizedBox(
                height: 20,
                child: Text(
                  _errorMessage ?? 'PIN-kodni kiriting',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: _errorMessage != null ? FontWeight.bold : FontWeight.normal,
                    color: _errorMessage != null ? AppColors.error : AppColors.textMuted,
                  ),
                ),
              ),

              const Spacer(flex: 2),

              // Keypad
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 36),
                child: Column(
                  children: [
                    _buildKeypadRow(['1', '2', '3']),
                    const SizedBox(height: 14),
                    _buildKeypadRow(['4', '5', '6']),
                    const SizedBox(height: 14),
                    _buildKeypadRow(['7', '8', '9']),
                    const SizedBox(height: 14),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Biometric button
                        sec.deviceSupportsBiometrics && sec.biometricsEnabled
                            ? _buildIconButton(
                                icon: Icons.fingerprint_rounded,
                                color: AppColors.primary,
                                onPressed: _tryBiometricAuth,
                              )
                            : const SizedBox(width: 72, height: 72),
                        // 0
                        _buildNumberButton('0'),
                        // Backspace
                        _buildIconButton(
                          icon: Icons.backspace_outlined,
                          color: AppColors.textSecondary,
                          onPressed: _onBackspacePressed,
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const Spacer(flex: 2),

              // Bottom secondary options
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: TextButton(
                  onPressed: _logoutAndSwitchUser,
                  child: const Text(
                    'Login va parol orqali kirish',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primary,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildKeypadRow(List<String> numbers) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: numbers.map((n) => _buildNumberButton(n)).toList(),
    );
  }

  Widget _buildNumberButton(String number) {
    return InkWell(
      onTap: () => _onNumberPressed(number),
      borderRadius: BorderRadius.circular(36),
      child: Container(
        width: 72,
        height: 72,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: const Color(0xFFF8FAFC),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Center(
          child: Text(
            number,
            style: const TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildIconButton({
    required IconData icon,
    required Color color,
    required VoidCallback onPressed,
  }) {
    return InkWell(
      onTap: () {
        HapticFeedback.lightImpact();
        onPressed();
      },
      borderRadius: BorderRadius.circular(36),
      child: SizedBox(
        width: 72,
        height: 72,
        child: Center(
          child: Icon(icon, color: color, size: 30),
        ),
      ),
    );
  }
}
