import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../constants/app_colors.dart';

class Formatters {
  static final NumberFormat _currencyFormat = NumberFormat('#,###', 'uz_UZ');

  static String formatCurrency(dynamic amount) {
    if (amount == null) return "0 so'm";
    final num val = (amount is num) ? amount : (num.tryParse(amount.toString()) ?? 0);
    return '${_currencyFormat.format(val).replaceAll(',', ' ')} so\'m';
  }

  static String formatPhone(String? phone) {
    if (phone == null || phone.isEmpty) return '-';
    final clean = phone.replaceAll(RegExp(r'\D'), '');
    if (clean.length == 12 && clean.startsWith('998')) {
      return '+998 (${clean.substring(3, 5)}) ${clean.substring(5, 8)}-${clean.substring(8, 10)}-${clean.substring(10, 12)}';
    }
    return phone;
  }

  static String formatTime(dynamic dateTime) {
    if (dateTime == null) return '--:--';
    DateTime? dt;
    if (dateTime is DateTime) {
      dt = dateTime;
    } else {
      dt = DateTime.tryParse(dateTime.toString());
    }
    if (dt == null) return '--:--';
    return DateFormat('HH:mm').format(dt);
  }

  static String formatDate(dynamic dateTime) {
    if (dateTime == null) return '--.--.----';
    DateTime? dt;
    if (dateTime is DateTime) {
      dt = dateTime;
    } else {
      dt = DateTime.tryParse(dateTime.toString());
    }
    if (dt == null) return '--.--.----';
    return DateFormat('dd.MM.yyyy').format(dt);
  }

  static String statusLabel(String? status) {
    switch (status?.toUpperCase()) {
      case 'WAITING':
        return 'Kutmoqda';
      case 'CALLED':
        return 'Chaqirildi';
      case 'IN_SERVICE':
      case 'IN_PROGRESS':
        return 'Qabulda';
      case 'COMPLETED':
        return 'Tugatildi';
      case 'CANCELLED':
        return 'Bekor qilindi';
      case 'SKIPPED':
        return 'O\'tkazildi';
      default:
        return status ?? 'Noma\'lum';
    }
  }

  static Color statusColor(String? status) {
    switch (status?.toUpperCase()) {
      case 'WAITING':
        return AppColors.warning;
      case 'CALLED':
        return AppColors.purple;
      case 'IN_SERVICE':
      case 'IN_PROGRESS':
        return AppColors.primary;
      case 'COMPLETED':
        return AppColors.success;
      case 'CANCELLED':
      case 'SKIPPED':
        return AppColors.error;
      default:
        return AppColors.textMuted;
    }
  }

  static Color statusBgColor(String? status) {
    switch (status?.toUpperCase()) {
      case 'WAITING':
        return AppColors.warningLight;
      case 'CALLED':
        return AppColors.purpleLight;
      case 'IN_SERVICE':
      case 'IN_PROGRESS':
        return AppColors.mintLight;
      case 'COMPLETED':
        return AppColors.successLight;
      case 'CANCELLED':
      case 'SKIPPED':
        return AppColors.errorLight;
      default:
        return AppColors.borderLight;
    }
  }
}
