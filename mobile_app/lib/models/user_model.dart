enum UserRole { doctor, cashier, manager, superAdmin }

class UserModel {
  final String id;
  final String fullName;
  final String? email;
  final String? phone;
  final String? username;
  final String role;
  final String? clinicId;
  final String? clinicName;
  final String? doctorId;
  final String? roomNumber;
  final String? specialtyName;
  final String? avatarUrl;

  UserModel({
    required this.id,
    required this.fullName,
    this.email,
    this.phone,
    this.username,
    required this.role,
    this.clinicId,
    this.clinicName,
    this.doctorId,
    this.roomNumber,
    this.specialtyName,
    this.avatarUrl,
  });

  bool get isDoctor => role.toUpperCase().contains('DOCTOR');
  bool get isCashier => role.toUpperCase().contains('CASHIER');
  bool get isManager => role.toUpperCase().contains('MANAGER') || role.toUpperCase().contains('ADMIN');

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      fullName: json['fullName'] ?? json['full_name'] ?? json['name'] ?? 'Foydalanuvchi',
      email: json['email'],
      phone: json['phone'],
      username: json['username'] ?? json['login'],
      role: json['role'] ?? 'DOCTOR',
      clinicId: json['clinicId'] ?? json['clinic_id'],
      clinicName: json['clinicName'] ?? json['clinic_name'] ?? 'SADAF CLINIC',
      doctorId: json['doctorId'] ?? json['doctor_id'] ?? json['doctor']?['id'],
      roomNumber: (json['roomNumber'] ?? json['room_number'] ?? json['cabinet_number'] ?? json['doctor']?['room_number'])?.toString(),
      specialtyName: json['specialtyName'] ?? json['specialty_name'] ?? json['specialty'],
      avatarUrl: json['avatarUrl'] ?? json['avatar_url'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'email': email,
      'phone': phone,
      'username': username,
      'role': role,
      'clinicId': clinicId,
      'clinicName': clinicName,
      'doctorId': doctorId,
      'roomNumber': roomNumber,
      'specialtyName': specialtyName,
      'avatarUrl': avatarUrl,
    };
  }
}

