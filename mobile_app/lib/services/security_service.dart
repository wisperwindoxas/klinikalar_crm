import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SecurityService extends ChangeNotifier {
  static final SecurityService _instance = SecurityService._internal();
  factory SecurityService() => _instance;
  SecurityService._internal();

  final LocalAuthentication _localAuth = LocalAuthentication();

  static const String _prefPinKey = 'user_security_pin';
  static const String _prefBiometricsEnabledKey = 'user_biometrics_enabled';

  String? _savedPin;
  bool _biometricsEnabled = true;
  bool _deviceSupportsBiometrics = false;
  bool _isUnlocked = false;

  bool get hasPin => _savedPin != null && _savedPin!.length == 4;
  bool get biometricsEnabled => _biometricsEnabled;
  bool get deviceSupportsBiometrics => _deviceSupportsBiometrics;
  bool get isUnlocked => _isUnlocked;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _savedPin = prefs.getString(_prefPinKey);
    _biometricsEnabled = prefs.getBool(_prefBiometricsEnabledKey) ?? true;

    try {
      final canCheck = await _localAuth.canCheckBiometrics;
      final isSupported = await _localAuth.isDeviceSupported();
      _deviceSupportsBiometrics = canCheck || isSupported;
    } catch (e) {
      _deviceSupportsBiometrics = false;
    }

    notifyListeners();
  }

  void unlock() {
    _isUnlocked = true;
    notifyListeners();
  }

  void lock() {
    _isUnlocked = false;
    notifyListeners();
  }

  bool verifyPin(String inputPin) {
    if (_savedPin == null) return false;
    final match = _savedPin == inputPin;
    if (match) {
      _isUnlocked = true;
      notifyListeners();
    }
    return match;
  }

  Future<void> setPin(String newPin) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefPinKey, newPin);
    _savedPin = newPin;
    _isUnlocked = true;
    notifyListeners();
  }

  Future<void> removePin() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_prefPinKey);
    _savedPin = null;
    _isUnlocked = true;
    notifyListeners();
  }

  Future<void> setBiometricsEnabled(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_prefBiometricsEnabledKey, enabled);
    _biometricsEnabled = enabled;
    notifyListeners();
  }

  Future<bool> authenticateBiometric({String reason = 'Dasturga kirish uchun biometriyani tasdiqlang'}) async {
    if (!_deviceSupportsBiometrics || !_biometricsEnabled) return false;

    try {
      final authenticated = await _localAuth.authenticate(
        localizedReason: reason,
        biometricOnly: false,
        persistAcrossBackgrounding: true,
      );

      if (authenticated) {
        _isUnlocked = true;
        notifyListeners();
      }
      return authenticated;
    } on PlatformException catch (e) {
      debugPrint('Biometric auth error: ${e.message}');
      return false;
    } catch (e) {
      debugPrint('Biometric unknown error: $e');
      return false;
    }
  }
}
