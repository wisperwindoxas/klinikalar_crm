import '../core/utils/formatters.dart';

class TicketModel {
  final String id;
  final String ticketNumber;
  final String status;
  final String? patientId;
  final String patientName;
  final String? patientPhone;
  final String? doctorId;
  final String? doctorName;
  final String? doctorSpecialty;
  final String? roomNumber;
  final String? serviceName;
  final double price;
  final String? paymentStatus;
  final String? paymentMethod;
  final String? createdAt;
  final String? calledAt;
  final String? startedAt;
  final String? completedAt;
  final int waitTimeMinutes;

  TicketModel({
    required this.id,
    required this.ticketNumber,
    required this.status,
    this.patientId,
    required this.patientName,
    this.patientPhone,
    this.doctorId,
    this.doctorName,
    this.doctorSpecialty,
    this.roomNumber,
    this.serviceName,
    this.price = 0,
    this.paymentStatus = 'PAID',
    this.paymentMethod = 'CASH',
    this.createdAt,
    this.calledAt,
    this.startedAt,
    this.completedAt,
    this.waitTimeMinutes = 0,
  });

  bool get isWaiting => status.toUpperCase() == 'WAITING';
  bool get isCalled => status.toUpperCase() == 'CALLED';
  bool get isInService => status.toUpperCase() == 'IN_SERVICE' || status.toUpperCase() == 'IN_PROGRESS';
  bool get isCompleted => status.toUpperCase() == 'COMPLETED';

  factory TicketModel.fromJson(Map<String, dynamic> json) {
    return TicketModel(
      id: json['id']?.toString() ?? '',
      ticketNumber: json['full_number'] ?? json['fullNumber'] ?? json['ticketNumber'] ?? json['ticket_number'] ?? json['number'] ?? 'T-000',
      status: json['status'] ?? 'WAITING',
      patientId: json['patientId'] ?? json['patient_id'],
      patientName: json['patientName'] ?? json['patient_name'] ?? json['patient']?['name'] ?? 'Bemor',
      patientPhone: json['patientPhone'] ?? json['patient_phone'] ?? json['patient']?['phone'],
      doctorId: json['doctorId'] ?? json['doctor_id'],
      doctorName: json['doctorName'] ?? json['doctor_name'] ?? json['doctor']?['name'],
      doctorSpecialty: json['doctorSpecialty'] ?? json['specialty_name'] ?? json['doctor_specialty'] ?? json['doctor']?['specialty'],
      roomNumber: (json['cabinet_number'] ?? json['cabinetNumber'] ?? json['roomNumber'] ?? json['room_number'] ?? json['doctor']?['room_number'] ?? '1').toString(),
      serviceName: json['serviceName'] ?? json['service_name'] ?? json['service']?['name'],
      price: Formatters.parseDouble(json['price'] ?? json['amount'] ?? json['service_price'] ?? 0),
      paymentStatus: json['paymentStatus'] ?? json['payment_status'] ?? 'PAID',
      paymentMethod: json['paymentMethod'] ?? json['payment_method'] ?? 'CASH',
      createdAt: json['createdAt'] ?? json['created_at'],
      calledAt: json['calledAt'] ?? json['called_at'],
      startedAt: json['startedAt'] ?? json['started_at'],
      completedAt: json['completedAt'] ?? json['completed_at'],
      waitTimeMinutes: Formatters.parseInt(json['waitTimeMinutes'] ?? json['wait_time_minutes'] ?? json['estimated_wait_minutes'] ?? 0),
    );
  }
}
