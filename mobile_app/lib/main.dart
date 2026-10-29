import 'package:flutter/material.dart';
import 'core/constants/api_constants.dart';
import 'core/theme/app_theme.dart';
import 'services/auth_service.dart';
import 'services/security_service.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/pin_lock_screen.dart';
import 'screens/doctor/doctor_main_screen.dart';
import 'screens/cashier/cashier_main_screen.dart';
import 'screens/manager/manager_main_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiConstants.init();
  await AuthService().init();
  await SecurityService().init();
  runApp(const SadafClinicApp());
}

class SadafClinicApp extends StatelessWidget {
  const SadafClinicApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'klinika-admin Mobile',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const RootGateScreen(),
    );
  }
}

class RootGateScreen extends StatelessWidget {
  const RootGateScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final auth = AuthService();
    if (!auth.isAuthenticated) {
      return const LoginScreen();
    }

    final sec = SecurityService();
    // If PIN code is configured and currently locked, show PinLockScreen
    if (sec.hasPin && !sec.isUnlocked) {
      return PinLockScreen(user: auth.currentUser!);
    }

    final user = auth.currentUser!;
    if (user.isManager) {
      return const ManagerMainScreen();
    } else if (user.isCashier) {
      return const CashierMainScreen();
    } else {
      return const DoctorMainScreen();
    }
  }
}
