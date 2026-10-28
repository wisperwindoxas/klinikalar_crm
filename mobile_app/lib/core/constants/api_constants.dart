import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiConstants {
  // Default development backend URL
  // On Web: localhost:5001
  // On Android/Mobile APK: 192.168.1.7:5001 (host machine Wi-Fi IP)
  static String baseUrl = kIsWeb 
      ? 'http://localhost:5001/api/v1' 
      : 'http://192.168.1.7:5001/api/v1';

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final savedUrl = prefs.getString('custom_server_url');
    if (savedUrl != null && savedUrl.isNotEmpty) {
      baseUrl = savedUrl;
    }
  }

  static Future<void> updateBaseUrl(String newUrl) async {
    baseUrl = newUrl;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('custom_server_url', newUrl);
  }

  // Auth
  static String get login => '$baseUrl/auth/login';
  static String get me => '$baseUrl/auth/me';

  // Queues & Tickets
  static String get tickets => '$baseUrl/queues/tickets';
  static String get multiRegister => '$baseUrl/queues/multi-register';
  static String get callNext => '$baseUrl/queues/call-next';
  static String recallTicket(String id) => '$baseUrl/queues/tickets/$id/recall';
  static String callTicket(String id) => '$baseUrl/queues/tickets/$id/call';
  static String startTicket(String id) => '$baseUrl/queues/tickets/$id/start';
  static String completeTicket(String id) => '$baseUrl/queues/tickets/$id/complete';
  static String skipTicket(String id) => '$baseUrl/queues/tickets/$id/skip';
  static String cancelTicket(String id) => '$baseUrl/queues/tickets/$id/cancel';

  // Doctors
  static String get doctors => '$baseUrl/doctors';
  static String doctorPerformance(String id) => '$baseUrl/doctors/$id/performance';

  // Patients
  static String get patients => '$baseUrl/patients';
  static String patientDetails(String id) => '$baseUrl/patients/$id';

  // Catalogs
  static String get specialties => '$baseUrl/specialties';
  static String get cabinets => '$baseUrl/cabinets';
  static String get services => '$baseUrl/services';

  // Cash Shifts & Payments
  static String get currentShift => '$baseUrl/cash-shifts/current';
  static String get openShift => '$baseUrl/cash-shifts/open';
  static String closeShift(String id) => '$baseUrl/cash-shifts/$id/close';
  static String get payments => '$baseUrl/payments';

  // Manager & Reports
  static String get managerDashboard => '$baseUrl/reports/manager-dashboard';
  static String get clinicSettings => '$baseUrl/clinic/settings';
  static String get clinicAuditLogs => '$baseUrl/clinic/audit-logs';
  static String get users => '$baseUrl/users';

  // TV & Voice
  static String get tvFeed => '$baseUrl/tv/feed';
  static String get testCall => '$baseUrl/tv/test-call';
}
