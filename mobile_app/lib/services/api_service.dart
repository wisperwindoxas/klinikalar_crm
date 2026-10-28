import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/constants/api_constants.dart';
import '../models/doctor_model.dart';
import '../models/patient_model.dart';
import '../models/ticket_model.dart';
import '../models/service_model.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String? _authToken;

  void setToken(String? token) {
    _authToken = token;
  }

  Map<String, String> _headers() {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (_authToken != null && _authToken!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $_authToken';
    }
    return headers;
  }

  // ==================== AUTH ====================
  Future<Map<String, dynamic>> login(String login, String password) async {
    try {
      final cleanLogin = login.trim();
      final response = await http.post(
        Uri.parse(ApiConstants.login),
        headers: _headers(),
        body: jsonEncode({
          'login': cleanLogin,
          'identifier': cleanLogin,
          'username': cleanLogin,
          'phone': cleanLogin,
          'password': password.trim(),
        }),
      ).timeout(const Duration(seconds: 12));

      final data = jsonDecode(response.body);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        // Backend returns: {"success": true, "data": {"token": "...", "user": {...}}}
        Map<String, dynamic> payload = {};
        if (data is Map<String, dynamic>) {
          if (data['data'] is Map<String, dynamic>) {
            payload = Map<String, dynamic>.from(data['data']);
          } else {
            payload = Map<String, dynamic>.from(data);
          }
        }

        final token = payload['token']?.toString() ?? (data is Map ? data['token']?.toString() : null);
        if (token != null && token.isNotEmpty) {
          setToken(token);
        }
        return {'success': true, 'data': payload};
      }
      return {'success': false, 'message': (data is Map ? data['message'] : null) ?? 'Login yoki parol xato'};
    } on TimeoutException {
      return {
        'success': false,
        'message': 'Serverdan javob kelmadi (Timeout). Wi-Fi aloqasini tekshiring: ${ApiConstants.baseUrl}',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Serverga ulanishda xatolik: $e\n(Server: ${ApiConstants.baseUrl})',
      };
    }
  }

  // ==================== TICKETS & QUEUES ====================
  Future<List<TicketModel>> getTickets({String? status, String? doctorId, String? date}) async {
    try {
      var uri = Uri.parse(ApiConstants.tickets);
      final queryParams = <String, String>{};
      if (status != null && status.isNotEmpty) queryParams['status'] = status;
      if (doctorId != null && doctorId.isNotEmpty) queryParams['doctorId'] = doctorId;
      if (date != null && date.isNotEmpty) queryParams['date'] = date;
      if (queryParams.isNotEmpty) {
        uri = uri.replace(queryParameters: queryParams);
      }

      final response = await http.get(uri, headers: _headers());
      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        final List list = (decoded is List) ? decoded : (decoded['data'] ?? []);
        return list.map((item) => TicketModel.fromJson(item)).toList();
      }
      return [];
    } catch (e) {
      print('getTickets error: $e');
      return [];
    }
  }

  Future<Map<String, dynamic>> callNext(String doctorId) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConstants.callNext),
        headers: _headers(),
        body: jsonEncode({'doctorId': doctorId}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': '$e'};
    }
  }

  Future<Map<String, dynamic>> recallTicket(String ticketId) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConstants.recallTicket(ticketId)),
        headers: _headers(),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': '$e'};
    }
  }

  Future<Map<String, dynamic>> startTicket(String ticketId) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConstants.startTicket(ticketId)),
        headers: _headers(),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': '$e'};
    }
  }

  Future<Map<String, dynamic>> completeTicket(String ticketId, {String? notes}) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConstants.completeTicket(ticketId)),
        headers: _headers(),
        body: jsonEncode({'notes': notes}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': '$e'};
    }
  }

  Future<Map<String, dynamic>> cancelTicket(String ticketId, {String? reason}) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConstants.cancelTicket(ticketId)),
        headers: _headers(),
        body: jsonEncode({'reason': reason ?? 'Bemor kelmadi'}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': '$e'};
    }
  }

  Future<Map<String, dynamic>> multiRegister({
    required String patientId,
    required List<Map<String, dynamic>> items,
  }) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConstants.multiRegister),
        headers: _headers(),
        body: jsonEncode({
          'patientId': patientId,
          'items': items,
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': '$e'};
    }
  }

  // ==================== DOCTORS ====================
  Future<List<DoctorModel>> getDoctors() async {
    try {
      final response = await http.get(Uri.parse(ApiConstants.doctors), headers: _headers());
      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        final List list = (decoded is List) ? decoded : (decoded['data'] ?? []);
        return list.map((item) => DoctorModel.fromJson(item)).toList();
      }
      return [];
    } catch (e) {
      print('getDoctors error: $e');
      return [];
    }
  }

  Future<Map<String, dynamic>> createDoctor(Map<String, dynamic> data) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConstants.doctors),
        headers: _headers(),
        body: jsonEncode(data),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': '$e'};
    }
  }

  Future<Map<String, dynamic>> updateDoctor(String id, Map<String, dynamic> data) async {
    try {
      final response = await http.put(
        Uri.parse('${ApiConstants.doctors}/$id'),
        headers: _headers(),
        body: jsonEncode(data),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': '$e'};
    }
  }

  // ==================== PATIENTS ====================
  Future<List<PatientModel>> getPatients({String? search}) async {
    try {
      var uri = Uri.parse(ApiConstants.patients);
      if (search != null && search.isNotEmpty) {
        uri = uri.replace(queryParameters: {'search': search});
      }
      final response = await http.get(uri, headers: _headers());
      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        final List list = (decoded is List) ? decoded : (decoded['data'] ?? []);
        return list.map((item) => PatientModel.fromJson(item)).toList();
      }
      return [];
    } catch (e) {
      print('getPatients error: $e');
      return [];
    }
  }

  Future<PatientModel?> getPatientById(String id) async {
    try {
      final response = await http.get(Uri.parse(ApiConstants.patientDetails(id)), headers: _headers());
      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        final data = (decoded is Map<String, dynamic> && decoded['data'] != null) ? decoded['data'] : decoded;
        return PatientModel.fromJson(data);
      }
      return null;
    } catch (e) {
      print('getPatientById error: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>> createPatient(Map<String, dynamic> data) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConstants.patients),
        headers: _headers(),
        body: jsonEncode(data),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': '$e'};
    }
  }

  Future<Map<String, dynamic>> updatePatient(String id, Map<String, dynamic> data) async {
    try {
      final response = await http.put(
        Uri.parse('${ApiConstants.patients}/$id'),
        headers: _headers(),
        body: jsonEncode(data),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': '$e'};
    }
  }

  // ==================== SERVICES & CATALOGS ====================
  Future<List<ServiceModel>> getServices() async {
    try {
      final response = await http.get(Uri.parse(ApiConstants.services), headers: _headers());
      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        final List list = (decoded is List) ? decoded : (decoded['data'] ?? []);
        return list.map((item) => ServiceModel.fromJson(item)).toList();
      }
      return [];
    } catch (e) {
      print('getServices error: $e');
      return [];
    }
  }

  Future<Map<String, dynamic>> createService(Map<String, dynamic> data) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConstants.services),
        headers: _headers(),
        body: jsonEncode(data),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': '$e'};
    }
  }

  Future<List<Map<String, dynamic>>> getCabinets() async {
    try {
      final response = await http.get(Uri.parse(ApiConstants.cabinets), headers: _headers());
      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        final List list = (decoded is List) ? decoded : (decoded['data'] ?? []);
        return list.cast<Map<String, dynamic>>();
      }
      return [];
    } catch (e) {
      print('getCabinets error: $e');
      return [];
    }
  }

  // ==================== CASH SHIFTS & PAYMENTS ====================
  Future<Map<String, dynamic>> getCurrentShift() async {
    try {
      final response = await http.get(Uri.parse(ApiConstants.currentShift), headers: _headers());
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return {};
    } catch (e) {
      return {};
    }
  }

  Future<Map<String, dynamic>> openShift({double openingBalance = 0, String? notes, String? cashierName}) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConstants.openShift),
        headers: _headers(),
        body: jsonEncode({
          'openingBalance': openingBalance,
          'notes': notes ?? 'Mobil ilovadan ochildi',
          if (cashierName != null) 'cashierName': cashierName,
        }),
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      }
      return {'success': false, 'message': 'Smenani ochishda xatolik (${response.statusCode})'};
    } catch (e) {
      return {'success': false, 'message': 'Ulanish xatosi: $e'};
    }
  }

  Future<Map<String, dynamic>> closeShift(String shiftId, {double closingBalance = 0}) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConstants.closeShift(shiftId)),
        headers: _headers(),
        body: jsonEncode({
          'closingBalance': closingBalance,
        }),
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      }
      return {'success': false, 'message': 'Smenani yopishda xatolik (${response.statusCode})'};
    } catch (e) {
      return {'success': false, 'message': 'Ulanish xatosi: $e'};
    }
  }

  Future<List<Map<String, dynamic>>> getPayments() async {
    try {
      final response = await http.get(Uri.parse(ApiConstants.payments), headers: _headers());
      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        final List list = (decoded is List) ? decoded : (decoded['data'] ?? []);
        return list.cast<Map<String, dynamic>>();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  // ==================== MANAGER DASHBOARD ====================
  Future<Map<String, dynamic>> getManagerDashboard() async {
    try {
      final response = await http.get(Uri.parse(ApiConstants.managerDashboard), headers: _headers());
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return {};
    } catch (e) {
      return {};
    }
  }

  // ==================== TV REMOTE TEST ====================
  Future<Map<String, dynamic>> sendTvTestCall(String ticketNumber, String roomNumber, String doctorName) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConstants.testCall),
        headers: _headers(),
        body: jsonEncode({
          'ticketNumber': ticketNumber,
          'roomNumber': roomNumber,
          'doctorName': doctorName,
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'message': '$e'};
    }
  }
}
