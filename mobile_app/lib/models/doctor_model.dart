import '../core/utils/formatters.dart';

class DoctorModel {
  final String id;
  final String fullName;
  final String specialty;
  final String roomNumber;
  final String? cabinetId;
  final String status;
  final double consultationPrice;
  final int experienceYears;
  final String? phone;
  final int currentQueueCount;
  final int todayCompletedCount;
  final String? avatarUrl;
  final String? username;
  final String? password;

  DoctorModel({
    required this.id,
    required this.fullName,
    required this.specialty,
    required this.roomNumber,
    this.cabinetId,
    this.status = 'ACTIVE',
    this.consultationPrice = 150000,
    this.experienceYears = 5,
    this.phone,
    this.currentQueueCount = 0,
    this.todayCompletedCount = 0,
    this.avatarUrl,
    this.username,
    this.password,
  });

  bool get isActive => status.toUpperCase() == 'ACTIVE';

  factory DoctorModel.fromJson(Map<String, dynamic> json) {
    final rawName = json['display_name'] ??
        json['displayName'] ??
        json['fullName'] ??
        json['full_name'] ??
        json['name'] ??
        '';
    final rawSpecialty = json['specialty_name'] ??
        json['specialtyName'] ??
        json['specialty'] ??
        json['speciality'] ??
        'Umumiy amaliyotchi';

    return DoctorModel(
      id: json['id']?.toString() ?? '',
      fullName: rawName.toString().trim().isNotEmpty ? rawName.toString().trim() : 'Shifokor',
      specialty: rawSpecialty.toString().trim().isNotEmpty ? rawSpecialty.toString().trim() : 'Umumiy amaliyotchi',
      roomNumber: (json['room_number'] ?? json['roomNumber'] ?? json['cabinet_number'] ?? json['cabinetNumber'] ?? '1').toString(),
      cabinetId: (json['cabinet_id'] ?? json['cabinetId'])?.toString(),
      status: json['status'] ?? (json['is_active'] == false ? 'INACTIVE' : 'ACTIVE'),
      consultationPrice: Formatters.parseDouble(json['consultationPrice'] ?? json['consultation_price'] ?? json['price'] ?? 150000),
      experienceYears: Formatters.parseInt(json['experienceYears'] ?? json['experience_years'] ?? 5),
      phone: json['phone']?.toString() ?? json['user_phone']?.toString(),
      currentQueueCount: Formatters.parseInt(json['currentQueueCount'] ?? json['current_queue_count'] ?? json['waiting_count'] ?? 0),
      todayCompletedCount: Formatters.parseInt(json['todayCompletedCount'] ?? json['today_completed_count'] ?? 0),
      avatarUrl: json['avatarUrl'] ?? json['avatar_url'],
      username: (json['username'] ?? json['login'])?.toString(),
      password: (json['password'] ?? json['raw_password'])?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'specialty': specialty,
      'roomNumber': roomNumber,
      'cabinetId': cabinetId,
      'status': status,
      'consultationPrice': consultationPrice,
      'experienceYears': experienceYears,
      'phone': phone,
    };
  }
}
