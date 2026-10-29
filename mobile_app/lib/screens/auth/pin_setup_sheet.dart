import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/constants/app_colors.dart';
import '../../services/security_service.dart';

class PinSetupSheet extends StatefulWidget {
  final VoidCallback? onPinSetSuccess;

  const PinSetupSheet({Key? key, this.onPinSetSuccess}) : super(key: key);

  static Future<void> show(BuildContext context, {VoidCallback? onPinSetSuccess}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => PinSetupSheet(onPinSetSuccess: onPinSetSuccess),
    );
  }

  @override
  State<PinSetupSheet> createState() => _PinSetupSheetState();
}

class _PinSetupSheetState extends State<PinSetupSheet> {
  int _step = 1; // 1: Enter new PIN, 2: Confirm PIN, 3: Success / Settings
  String _firstPin = '';
  String _confirmPin = '';
  String? _error;
  bool _biometricsEnabled = true;

  @override
  void initState() {
    super.initState();
    _biometricsEnabled = SecurityService().biometricsEnabled;
  }

  void _onNumberPressed(String number) {
    HapticFeedback.lightImpact();
    setState(() {
      _error = null;
      if (_step == 1) {
        if (_firstPin.length < 4) {
          _firstPin += number;
          if (_firstPin.length == 4) {
            Future.delayed(const Duration(milliseconds: 150), () {
              if (mounted) setState(() => _step = 2);
            });
          }
        }
      } else if (_step == 2) {
        if (_confirmPin.length < 4) {
          _confirmPin += number;
          if (_confirmPin.length == 4) {
            _checkConfirmation();
          }
        }
      }
    });
  }

  void _onBackspacePressed() {
    HapticFeedback.lightImpact();
    setState(() {
      _error = null;
      if (_step == 1 && _firstPin.isNotEmpty) {
        _firstPin = _firstPin.substring(0, _firstPin.length - 1);
      } else if (_step == 2 && _confirmPin.isNotEmpty) {
        _confirmPin = _confirmPin.substring(0, _confirmPin.length - 1);
      }
    });
  }

  void _checkConfirmation() async {
    if (_firstPin == _confirmPin) {
      final sec = SecurityService();
      await sec.setPin(_firstPin);
      await sec.setBiometricsEnabled(_biometricsEnabled);

      if (mounted) {
        HapticFeedback.mediumImpact();
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('PIN-kod va biometriya muvaffaqiyatli o‘rnatildi!'),
            backgroundColor: AppColors.success,
          ),
        );
        if (widget.onPinSetSuccess != null) {
          widget.onPinSetSuccess!();
        }
      }
    } else {
      HapticFeedback.heavyImpact();
      setState(() {
        _error = 'PIN-kodlar bir-biriga mos kelmadi, qaytadan kiriting';
        _firstPin = '';
        _confirmPin = '';
        _step = 1;
      });
    }
  }

  void _removePin() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: const Text('PIN-kodni o‘chirish', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: const Text('Tezkor PIN-kod va biometriya orqali kirish o‘chirilsinmi? Har safar login va parol so‘raladi.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Bekor qilish')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('O‘chirish'),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      await SecurityService().removePin();
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('PIN-kod o‘chirildi'),
          backgroundColor: AppColors.warning,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final sec = SecurityService();
    final currentPin = _step == 1 ? _firstPin : _confirmPin;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.fromLTRB(24, 14, 24, MediaQuery.of(context).viewInsets.bottom + 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Center(
            child: Container(
              width: 44,
              height: 4,
              decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2)),
            ),
          ),
          const SizedBox(height: 14),

          // Title & Status
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                sec.hasPin ? 'PIN-kod va Xavfsizlik' : 'Yangi PIN-kod o‘rnatish',
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              IconButton(
                icon: const Icon(Icons.close_rounded, size: 22, color: AppColors.textMuted),
                onPressed: () => Navigator.pop(context),
                visualDensity: VisualDensity.compact,
              ),
            ],
          ),

          const SizedBox(height: 10),

          // Biometrics Toggle Card
          if (sec.deviceSupportsBiometrics) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.fingerprint_rounded, color: AppColors.primary, size: 20),
                  ),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Biometrik kirish (Barmoq izi)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                        Text('PIN o‘rniga tezkor kirish', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                      ],
                    ),
                  ),
                  Switch(
                    value: _biometricsEnabled,
                    activeColor: AppColors.primary,
                    onChanged: (val) {
                      setState(() => _biometricsEnabled = val);
                      sec.setBiometricsEnabled(val);
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
          ],

          Text(
            _step == 1 ? 'Yangi 4 xonali PIN-kodni kiriting' : 'PIN-kodni tasdiqlash uchun qayta kiriting',
            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 14),

          // Dots
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(4, (index) {
              final isFilled = index < currentPin.length;
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 8),
                width: 16,
                height: 16,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isFilled
                      ? (_error != null ? AppColors.error : AppColors.primary)
                      : Colors.transparent,
                  border: Border.all(
                    color: isFilled
                        ? (_error != null ? AppColors.error : AppColors.primary)
                        : AppColors.border,
                    width: 2,
                  ),
                ),
              );
            }),
          ),

          const SizedBox(height: 8),
          SizedBox(
            height: 18,
            child: Text(
              _error ?? '',
              style: const TextStyle(fontSize: 11, color: AppColors.error, fontWeight: FontWeight.bold),
            ),
          ),

          const SizedBox(height: 12),

          // Keypad
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              children: [
                _buildRow(['1', '2', '3']),
                const SizedBox(height: 10),
                _buildRow(['4', '5', '6']),
                const SizedBox(height: 10),
                _buildRow(['7', '8', '9']),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    if (_step == 2)
                      IconButton(
                        icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textSecondary),
                        onPressed: () => setState(() {
                          _step = 1;
                          _firstPin = '';
                          _confirmPin = '';
                        }),
                      )
                    else
                      const SizedBox(width: 60, height: 60),
                    _buildBtn('0'),
                    InkWell(
                      onTap: _onBackspacePressed,
                      borderRadius: BorderRadius.circular(30),
                      child: const SizedBox(
                        width: 60,
                        height: 60,
                        child: Center(
                          child: Icon(Icons.backspace_outlined, color: AppColors.textSecondary, size: 22),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          if (sec.hasPin) ...[
            const SizedBox(height: 14),
            TextButton.icon(
              icon: const Icon(Icons.delete_outline_rounded, color: AppColors.error, size: 18),
              label: const Text('PIN-kodni o‘chirib tashlash', style: TextStyle(color: AppColors.error, fontSize: 13)),
              onPressed: _removePin,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildRow(List<String> items) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: items.map((n) => _buildBtn(n)).toList(),
    );
  }

  Widget _buildBtn(String number) {
    return InkWell(
      onTap: () => _onNumberPressed(number),
      borderRadius: BorderRadius.circular(30),
      child: Container(
        width: 64,
        height: 64,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: const Color(0xFFF8FAFC),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Center(
          child: Text(
            number,
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
        ),
      ),
    );
  }
}

