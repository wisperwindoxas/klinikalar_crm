import 'package:flutter/material.dart';
import 'core/constants/api_constants.dart';
import 'core/theme/app_theme.dart';
import 'services/auth_service.dart';
import 'screens/auth/login_screen.dart';
import 'screens/doctor/doctor_main_screen.dart';
import 'screens/cashier/cashier_main_screen.dart';
import 'screens/manager/manager_main_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiConstants.init();
  await AuthService().init();
  runApp(const SadafClinicApp());
}

class SadafClinicApp extends StatelessWidget {
  const SadafClinicApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SADAF CLINIC Mobile',
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

    final user = auth.currentUser!;
    if (user.isDoctor) {
      return const DoctorMainScreen();
    } else if (user.isCashier) {
      return const CashierMainScreen();
    } else {
      return const ManagerMainScreen();
    }
  }
}
