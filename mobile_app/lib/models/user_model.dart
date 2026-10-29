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

  bool get isCashier =>
      role.toUpperCase().contains('CASHIER') ||
      role.toUpperCase().contains('KASSIR');

  bool get isManager =>
      role.toUpperCase().contains('MANAGER') ||
      role.toUpperCase().contains('ADMIN') ||
      role.toUpperCase().contains('DIRECTOR') ||
      role.toUpperCase().contains('BOSH') ||
      role.toUpperCase().contains('SUPER');

  bool get isDoctor =>
      role.toUpperCase().contains('DOCTOR') ||
      role.toUpperCase().contains('SHIFOKOR') ||
      role.toUpperCase().contains('VRACH') ||
      (!isCashier && !isManager);

  String get roleTitle {
    if (isManager) return 'Menejer';
    if (isCashier) return 'Kassir';
    return specialtyName != null && specialtyName!.isNotEmpty
        ? 'Shifokor ($specialtyName)'
        : 'Shifokor';
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    String rawRole = (json['role'] ??
            json['role_code'] ??
            json['roleCode'] ??
            json['role_name'] ??
            json['roleName'] ??
            '')
        .toString()
        .trim();

    final username = (json['username'] ?? json['login'] ?? '').toString().toLowerCase();

    if (rawRole.isEmpty) {
      if (username.contains('kassir') || username.contains('cashier')) {
        rawRole = 'CASHIER';
      } else if (username.contains('admin') ||
          username.contains('manager') ||
          username.contains('windoxas') ||
          username.contains('direktor')) {
        rawRole = 'MANAGER';
      } else if (username.contains('doc') ||
          username.contains('shifokor') ||
          json['doctorId'] != null ||
          json['doctor_id'] != null) {
        rawRole = 'DOCTOR';
      } else {
        rawRole = 'DOCTOR';
      }
    }

    return UserModel(
      id: (json['id'] ?? json['userId'] ?? json['user_id'])?.toString() ?? '',
      fullName: json['fullName'] ?? json['full_name'] ?? json['name'] ?? 'Foydalanuvchi',
      email: json['email']?.toString(),
      phone: json['phone']?.toString(),
      username: (json['username'] ?? json['login'])?.toString(),
      role: rawRole.toUpperCase(),
      clinicId: (json['clinicId'] ?? json['clinic_id'] ?? json['clinic']?['id'])?.toString(),
      clinicName: json['clinicName'] ?? json['clinic_name'] ?? json['clinic']?['name'] ?? 'SADAF CLINIC',
      doctorId: (json['doctorId'] ?? json['doctor_id'] ?? json['doctor']?['id'])?.toString(),
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

