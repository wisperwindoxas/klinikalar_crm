import '../core/utils/formatters.dart';

class ServiceModel {
  final String id;
  final String name;
  final String? code;
  final double price;
  final int durationMinutes;
  final String category;
  final bool isActive;

  ServiceModel({
    required this.id,
    required this.name,
    this.code,
    required this.price,
    this.durationMinutes = 20,
    this.category = 'Konsultatsiya',
    this.isActive = true,
  });

  factory ServiceModel.fromJson(Map<String, dynamic> json) {
    return ServiceModel(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      code: json['code'],
      price: Formatters.parseDouble(json['price'] ?? 0),
      durationMinutes: Formatters.parseInt(json['durationMinutes'] ?? json['duration_minutes'] ?? 20),
      category: json['category'] ?? json['department'] ?? 'Umumiy',
      isActive: json['isActive'] ?? json['is_active'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'code': code,
      'price': price,
      'durationMinutes': durationMinutes,
      'category': category,
      'isActive': isActive,
    };
  }
}
