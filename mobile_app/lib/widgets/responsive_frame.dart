import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';

class ResponsiveFrame extends StatelessWidget {
  final Widget child;
  final double maxWidth;

  const ResponsiveFrame({
    Key? key,
    required this.child,
    this.maxWidth = 440,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;

    // On mobile devices or narrow screens, render directly
    if (screenWidth <= maxWidth + 40) {
      return child;
    }

    // On wide desktop/web screen, wrap in a premium device frame
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: Center(
        child: Container(
          width: maxWidth,
          height: MediaQuery.of(context).size.height * 0.94,
          margin: const EdgeInsets.symmetric(vertical: 20),
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.circular(40),
            border: Border.all(color: const Color(0xFF334155), width: 8),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.5),
                blurRadius: 40,
                spreadRadius: 8,
                offset: const Offset(0, 20),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Stack(
            children: [
              child,
              // Top notch / dynamic island indicator
              PositionCenter(
                child: Container(
                  width: 120,
                  height: 24,
                  decoration: const BoxDecoration(
                    color: Color(0xFF1E293B),
                    borderRadius: BorderRadius.vertical(bottom: Radius.circular(16)),
                  ),
                  child: Center(
                    child: Container(
                      width: 10,
                      height: 10,
                      decoration: const BoxDecoration(
                        color: Color(0xFF0F172A),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class PositionCenter extends StatelessWidget {
  final Widget child;
  const PositionCenter({Key? key, required this.child}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: Center(child: child),
    );
  }
}
