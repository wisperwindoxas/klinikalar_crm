import 'package:flutter/material.dart';

class AppColors {
  // Signature Medical Brand Colors
  static const Color medicalBlue = Color(0xFF0A84FF);
  static const Color medicalBlueDark = Color(0xFF0061D5);
  static const Color medicalTurquoise = Color(0xFF00E0C3);
  static const Color medicalTurquoiseDark = Color(0xFF00A88F);

  // Signature Medical Gradient (135deg: #0061D5 0%, #0A84FF 50%, #00E0C3 100%)
  static const LinearGradient medicalGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF0061D5), // 0%
      Color(0xFF0A84FF), // 50%
      Color(0xFF00E0C3), // 100%
    ],
  );

  // Brand Teals
  static const Color primary = Color(0xFF0D7A70);
  static const Color primaryDark = Color(0xFF08544D);
  static const Color primaryLight = Color(0xFF149C90);
  static const Color mint = Color(0xFF2DD4BF);
  static const Color mintLight = Color(0xFFE8F5F3);
  static const Color mintBadge = Color(0xFFD1F4EC);

  // Accents & Statuses
  static const Color success = Color(0xFF10B981);
  static const Color successLight = Color(0xFFECFDF5);
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningLight = Color(0xFFFEF3C7);
  static const Color error = Color(0xFFEF4444);
  static const Color errorLight = Color(0xFFFEE2E2);
  static const Color info = Color(0xFF3B82F6);
  static const Color infoLight = Color(0xFFEFF6FF);
  static const Color purple = Color(0xFF8B5CF6);
  static const Color purpleLight = Color(0xFFF3E8FF);

  // Background & Surfaces
  static const Color background = Color(0xFFF8FAFC);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color card = Color(0xFFFFFFFF);
  static const Color border = Color(0xFFE2E8F0);
  static const Color borderLight = Color(0xFFF1F5F9);

  // Text
  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF475569);
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color textOnPrimary = Color(0xFFFFFFFF);

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF0D7A70), Color(0xFF149C90)],
  );

  static const LinearGradient accentGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF2DD4BF), Color(0xFF0D7A70)],
  );

  static const LinearGradient orangeGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFF97316), Color(0xFFEA580C)],
  );

  static const LinearGradient blueGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
  );
}
