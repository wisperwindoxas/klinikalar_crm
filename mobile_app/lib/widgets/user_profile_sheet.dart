import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/constants/app_colors.dart';
import '../core/utils/formatters.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/security_service.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/pin_setup_sheet.dart';
import '../screens/auth/pin_lock_screen.dart';
import 'app_update_sheet.dart';

class UserProfileSheet extends StatefulWidget {
  final UserModel user;

  const UserProfileSheet({Key? key, required this.user}) : super(key: key);

  static Future<void> show(BuildContext context) {
    final user = AuthService().currentUser;
    if (user == null) return Future.value();

    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => UserProfileSheet(user: user),
    );
  }

  @override
  State<UserProfileSheet> createState() => _UserProfileSheetState();
}

class _UserProfileSheetState extends State<UserProfileSheet> {
  late bool _biometricsEnabled;

  @override
  void initState() {
    super.initState();
    _biometricsEnabled = SecurityService().biometricsEnabled;
  }

  void _handleLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        title: const Row(
          children: [
            Icon(Icons.logout_rounded, color: AppColors.error, size: 24),
            SizedBox(width: 8),
            Text('Tizimdan chiqish', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
          ],
        ),
        content: const Text(
          'Haqiqatan ham o‘z hisobingizdan chiqmoqchimisiz? Qayta kirish uchun login va parol talab etiladi.',
          style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
        ),
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

    if (confirm == true) {
      final nav = Navigator.of(context, rootNavigator: true);
      await AuthService().logout();
      nav.pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
    }
  }

  void _lockAppNow() {
    Navigator.pop(context);
    SecurityService().lock();
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => PinLockScreen(user: widget.user),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.user;
    final sec = SecurityService();

    Color roleColor;
    IconData roleIcon;
    if (user.isManager) {
      roleColor = AppColors.primary;
      roleIcon = Icons.admin_panel_settings_rounded;
    } else if (user.isCashier) {
      roleColor = const Color(0xFF0D9488);
      roleIcon = Icons.point_of_sale_rounded;
    } else {
      roleColor = const Color(0xFF7C3AED);
      roleIcon = Icons.medical_services_rounded;
    }

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.88,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 12),
          Center(
            child: Container(
              width: 44,
              height: 4,
              decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2)),
            ),
          ),
          const SizedBox(height: 12),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Foydalanuvchi Profili',
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, size: 22, color: AppColors.textMuted),
                  onPressed: () => Navigator.pop(context),
                  visualDensity: VisualDensity.compact,
                ),
              ],
            ),
          ),

          const Divider(height: 1),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // 1. User Hero Card
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          roleColor.withOpacity(0.08),
                          roleColor.withOpacity(0.02),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: roleColor.withOpacity(0.2)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 62,
                          height: 62,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: roleColor.withOpacity(0.15),
                            border: Border.all(color: roleColor.withOpacity(0.35), width: 2),
                          ),
                          child: Center(
                            child: Icon(roleIcon, color: roleColor, size: 30),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                user.fullName,
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: roleColor,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      user.roleTitle,
                                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      user.clinicName ?? 'SADAF CLINIC',
                                      style: const TextStyle(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w500),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 18),

                  // 2. Personal Information Section
                  const Text(
                    'Shaxsiy Ma‘lumotlar',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      children: [
                        _buildInfoTile(
                          icon: Icons.account_circle_outlined,
                          label: 'Login / Foydalanuvchi nomi',
                          value: user.username != null && user.username!.isNotEmpty ? user.username! : '-',
                          trailing: user.username != null && user.username!.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.copy_rounded, size: 17, color: AppColors.primary),
                                  onPressed: () {
                                    Clipboard.setData(ClipboardData(text: user.username!));
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('Login nusxalandi'), duration: Duration(seconds: 1)),
                                    );
                                  },
                                )
                              : null,
                        ),
                        const Divider(height: 1, indent: 46),
                        _buildInfoTile(
                          icon: Icons.phone_outlined,
                          label: 'Telefon raqami',
                          value: user.phone != null && user.phone!.isNotEmpty ? Formatters.formatPhone(user.phone) : 'Biriktirilmagan',
                        ),
                        if (user.roomNumber != null && user.roomNumber!.isNotEmpty) ...[
                          const Divider(height: 1, indent: 46),
                          _buildInfoTile(
                            icon: Icons.meeting_room_outlined,
                            label: 'Qabul xonasi',
                            value: '${user.roomNumber}-xona',
                          ),
                        ],
                        if (user.specialtyName != null && user.specialtyName!.isNotEmpty) ...[
                          const Divider(height: 1, indent: 46),
                          _buildInfoTile(
                            icon: Icons.medical_services_outlined,
                            label: 'Mutaxassisligi',
                            value: user.specialtyName!,
                          ),
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(height: 18),

                  // 3. Security & PIN Management Section
                  const Text(
                    'Xavfsizlik va PIN-kod',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      children: [
                        // PIN Code Status & Change
                        ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                          leading: Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: AppColors.primary.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.pin_outlined, color: AppColors.primary, size: 20),
                          ),
                          title: const Text('Tezkor PIN-kod', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                          subtitle: Text(
                            sec.hasPin ? 'PIN-kod faollashtirilgan (••••)' : 'PIN-kod o‘rnatilmagan',
                            style: TextStyle(fontSize: 11, color: sec.hasPin ? AppColors.success : AppColors.warning, fontWeight: FontWeight.w600),
                          ),
                          trailing: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              textStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                            onPressed: () async {
                              Navigator.pop(context);
                              await PinSetupSheet.show(context);
                            },
                            child: Text(sec.hasPin ? 'O‘zgartirish' : 'O‘rnatish'),
                          ),
                        ),

                        // Biometrics Switch
                        if (sec.deviceSupportsBiometrics) ...[
                          const Divider(height: 1, indent: 46),
                          ListTile(
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                            leading: Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                color: const Color(0xFF0D9488).withOpacity(0.12),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(Icons.fingerprint_rounded, color: Color(0xFF0D9488), size: 20),
                            ),
                            title: const Text('Biometrik kirish (Barmoq izi)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                            subtitle: const Text('PIN o‘rniga barmoq izidan foydalanish', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                            trailing: Switch(
                              value: _biometricsEnabled,
                              activeColor: AppColors.primary,
                              onChanged: (val) {
                                setState(() => _biometricsEnabled = val);
                                sec.setBiometricsEnabled(val);
                              },
                            ),
                          ),
                        ],

                        // Quick Lock
                        if (sec.hasPin) ...[
                          const Divider(height: 1, indent: 46),
                          InkWell(
                            onTap: _lockAppNow,
                            borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              child: Row(
                                children: [
                                  Container(
                                    width: 36,
                                    height: 36,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFFEF3C7),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: const Icon(Icons.lock_clock_rounded, color: Color(0xFFD97706), size: 20),
                                  ),
                                  const SizedBox(width: 12),
                                  const Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('Ilovani darhol qulflash', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                                        Text('Dastur ekranini PIN bilan yopish', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                                      ],
                                    ),
                                  ),
                                  const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.textMuted),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(height: 18),

                  // 4. Clinic Information Section
                  const Text(
                    'Klinika va Tizim Haqida',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      children: [
                        _buildInfoTile(
                          icon: Icons.local_hospital_outlined,
                          label: 'Muassasa nomi',
                          value: user.clinicName ?? 'SADAF CLINIC Markazi',
                        ),
                        const Divider(height: 1, indent: 46),
                        _buildInfoTile(
                          icon: Icons.location_city_outlined,
                          label: 'Filial / Bino',
                          value: 'Bosh bino (Markaziy klinika)',
                        ),
                        const Divider(height: 1, indent: 46),
                        _buildInfoTile(
                          icon: Icons.wifi_rounded,
                          label: 'Tarmoq holati',
                          value: 'Ulangan (Online)',
                          customValueWidget: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(color: AppColors.success, shape: BoxShape.circle),
                              ),
                              const SizedBox(width: 6),
                              const Text('Ulangan (Online)', style: TextStyle(color: AppColors.success, fontWeight: FontWeight.bold, fontSize: 12)),
                            ],
                          ),
                        ),
                        const Divider(height: 1, indent: 46),
                        _buildInfoTile(
                          icon: Icons.info_outline_rounded,
                          label: 'Dastur versiyasi',
                          value: 'klinika-admin Mobile v1.0.5',
                          customValueWidget: InkWell(
                            onTap: () {
                              Navigator.pop(context);
                              AppUpdateSheet.show(context);
                            },
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.mintLight,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.system_update_rounded, size: 13, color: AppColors.primary),
                                  SizedBox(width: 4),
                                  Text(
                                    'Yangilash',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 22),

                  // 5. Logout Button
                  OutlinedButton.icon(
                    icon: const Icon(Icons.logout_rounded, color: AppColors.error, size: 18),
                    label: const Text('Hisobdan chiqish (Logout)', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.bold, fontSize: 13)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      side: const BorderSide(color: Color(0xFFFCA5A5)),
                      backgroundColor: const Color(0xFFFEF2F2),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    onPressed: _handleLogout,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoTile({
    required IconData icon,
    required String label,
    required String value,
    Widget? trailing,
    Widget? customValueWidget,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppColors.textSecondary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                const SizedBox(height: 2),
                customValueWidget ??
                    Text(
                      value,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                    ),
              ],
            ),
          ),
          if (trailing != null) trailing,
        ],
      ),
    );
  }
}
