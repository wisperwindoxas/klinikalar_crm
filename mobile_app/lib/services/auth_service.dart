import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import 'api_service.dart';

class AuthService extends ChangeNotifier {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  UserModel? _currentUser;
  bool _isLoading = false;

  UserModel? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;
  bool get isLoading => _isLoading;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString('cached_user');
    final token = prefs.getString('auth_token');

    if (token != null && userJson != null) {
      try {
        _currentUser = UserModel.fromJson(jsonDecode(userJson));
        ApiService().setToken(token);
        notifyListeners();
      } catch (e) {
        await logout();
      }
    }
  }

  Future<Map<String, dynamic>> login(String login, String password) async {
    _isLoading = true;
    notifyListeners();

    final result = await ApiService().login(login, password);
    _isLoading = false;

    if (result['success'] == true) {
      final data = result['data'];
      final userMap = data['user'] ?? data;

      _currentUser = UserModel.fromJson(userMap);
      final token = data['token'] ?? '';
      ApiService().setToken(token);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('cached_user', jsonEncode(_currentUser!.toJson()));
      await prefs.setString('auth_token', token);

      notifyListeners();
      return {'success': true, 'user': _currentUser};
    } else {
      notifyListeners();
      return result;
    }
  }

  // Quick switch for testing and previewing roles
  Future<void> switchDemoRole(String role) async {
    if (role == 'DOCTOR') {
      _currentUser = UserModel(
        id: 'doc-1',
        fullName: 'Dr. Azizbek Rahimov',
        role: 'DOCTOR',
        doctorId: 'doc-1',
        roomNumber: '104',
        clinicName: 'SADAF CLINIC',
        phone: '+998 90 123 45 67',
      );
    } else if (role == 'CASHIER') {
      _currentUser = UserModel(
        id: 'cashier-1',
        fullName: 'Malika Karimova',
        role: 'CASHIER',
        clinicName: 'SADAF CLINIC',
        phone: '+998 90 765 43 21',
      );
    } else {
      _currentUser = UserModel(
        id: 'mgr-1',
        fullName: 'Bosh Menejer Jasur',
        role: 'MANAGER',
        clinicName: 'SADAF CLINIC',
        phone: '+998 90 999 88 77',
      );
    }
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('cached_user', jsonEncode(_currentUser!.toJson()));
    notifyListeners();
  }

  Future<void> logout() async {
    _currentUser = null;
    ApiService().setToken(null);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('cached_user');
    await prefs.remove('auth_token');
    notifyListeners();
  }
}
