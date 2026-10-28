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
  });

  bool get isActive => status.toUpperCase() == 'ACTIVE';

  factory DoctorModel.fromJson(Map<String, dynamic> json) {
    return DoctorModel(
      id: json['id']?.toString() ?? '',
      fullName: json['fullName'] ?? json['full_name'] ?? json['name'] ?? '',
      specialty: json['specialty'] ?? json['speciality'] ?? 'Umumiy amaliyotchi',
      roomNumber: json['roomNumber'] ?? json['room_number'] ?? json['cabinetNumber'] ?? json['cabinet_number'] ?? '101',
      cabinetId: json['cabinetId'] ?? json['cabinet_id'],
      status: json['status'] ?? 'ACTIVE',
      consultationPrice: (json['consultationPrice'] ?? json['consultation_price'] ?? 150000).toDouble(),
      experienceYears: json['experienceYears'] ?? json['experience_years'] ?? 5,
      phone: json['phone'],
      currentQueueCount: json['currentQueueCount'] ?? json['current_queue_count'] ?? json['waiting_count'] ?? 0,
      todayCompletedCount: json['todayCompletedCount'] ?? json['today_completed_count'] ?? 0,
      avatarUrl: json['avatarUrl'] ?? json['avatar_url'],
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
