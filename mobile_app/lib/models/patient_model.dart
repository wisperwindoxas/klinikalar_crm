import '../core/utils/formatters.dart';

class PatientModel {
  final String id;
  final String? patientNumber;
  String? get cardNumber => patientNumber;
  final String fullName;
  final String phone;
  final String? birthDate;
  final String? gender;
  final String? address;
  final String? region;
  final String? district;
  final int totalVisits;
  final double totalSpent;
  final String? lastVisitDate;
  final String? lastDoctorName;
  final List<dynamic> doctorsVisited;

  PatientModel({
    required this.id,
    this.patientNumber,
    required this.fullName,
    required this.phone,
    this.birthDate,
    this.gender,
    this.address,
    this.region,
    this.district,
    this.totalVisits = 0,
    this.totalSpent = 0,
    this.lastVisitDate,
    this.lastDoctorName,
    this.doctorsVisited = const [],
  });

  factory PatientModel.fromJson(Map<String, dynamic> rawJson) {
    final Map<String, dynamic> json = (rawJson['patient'] is Map<String, dynamic>)
        ? Map<String, dynamic>.from(rawJson['patient'])
        : rawJson;
    return PatientModel(
      id: json['id']?.toString() ?? '',
      patientNumber: json['patientNumber']?.toString() ?? json['patient_number']?.toString(),
      fullName: json['fullName'] ?? json['full_name'] ?? json['name'] ?? '',
      phone: json['phone'] ?? '',
      birthDate: json['birthDate'] ?? json['birth_date'],
      gender: json['gender'] ?? 'male',
      address: json['address'],
      region: json['region'],
      district: json['district'],
      totalVisits: Formatters.parseInt(json['totalVisits'] ?? json['total_visits'] ?? json['visits_count'] ?? 0),
      totalSpent: Formatters.parseDouble(json['totalSpent'] ?? json['total_spent'] ?? json['total_paid'] ?? 0),
      lastVisitDate: json['lastVisitDate'] ?? json['last_visit_date'],
      lastDoctorName: json['lastDoctorName'] ?? json['last_doctor_name'],
      doctorsVisited: json['doctors_visited'] ?? json['doctor_visits'] ?? json['doctorsVisited'] ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'phone': phone,
      'birthDate': birthDate,
      'gender': gender,
      'address': address,
      'region': region,
      'district': district,
    };
  }
}
