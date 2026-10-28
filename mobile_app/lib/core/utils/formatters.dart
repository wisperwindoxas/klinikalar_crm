import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../constants/app_colors.dart';

class Formatters {
  static final NumberFormat _currencyFormat = NumberFormat('#,###', 'uz_UZ');

  static String cleanPhone(String? phone) {
    if (phone == null) return '';
    return phone.replaceAll(RegExp(r'\D'), '');
  }

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

/// Avtomatik O'zbekiston telefon raqamini formatlovchi TextInputFormatter (+998 (XX) XXX-XX-XX)
class UzbekPhoneInputFormatter extends TextInputFormatter {
  final bool allowEmpty;
  const UzbekPhoneInputFormatter({this.allowEmpty = true});

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final text = newValue.text;

    // Agar foydalanuvchi to'liq o'chirsa
    if (text.isEmpty && allowEmpty) {
      return const TextEditingValue(
        text: '',
        selection: TextSelection.collapsed(offset: 0),
      );
    }

    // Faqat raqamlarni ajratib olish
    var digits = text.replaceAll(RegExp(r'\D'), '');

    // Agar bo'sh bo'lsa
    if (digits.isEmpty) {
      return const TextEditingValue(
        text: '',
        selection: TextSelection.collapsed(offset: 0),
      );
    }

    // Agar 998 bilan boshlanmasa va uzunligi 9 yoki undan kam bo'lsa
    if (!digits.startsWith('998') && digits.length <= 9) {
      digits = '998$digits';
    }

    // Maksimal 12 ta raqam (998 XX XXX XX XX)
    if (digits.length > 12) {
      digits = digits.substring(0, 12);
    }

    final buffer = StringBuffer();
    // +998
    if (digits.length >= 3) {
      buffer.write('+${digits.substring(0, 3)}');
    } else {
      buffer.write('+$digits');
    }

    // (XX)
    if (digits.length > 3) {
      final codeEnd = digits.length >= 5 ? 5 : digits.length;
      final code = digits.substring(3, codeEnd);
      buffer.write(' ($code');
      if (digits.length >= 5) {
        buffer.write(') ');
      }
    }

    // XXX
    if (digits.length > 5) {
      final part1End = digits.length >= 8 ? 8 : digits.length;
      buffer.write(digits.substring(5, part1End));
    }

    // -XX
    if (digits.length > 8) {
      final part2End = digits.length >= 10 ? 10 : digits.length;
      buffer.write('-${digits.substring(8, part2End)}');
    }

    // -XX
    if (digits.length > 10) {
      buffer.write('-${digits.substring(10, digits.length)}');
    }

    final formatted = buffer.toString();
    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}
