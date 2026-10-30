import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';

class CurvedNotchedNavItem {
  final IconData icon;
  final String label;
  final int? badgeCount;

  const CurvedNotchedNavItem({
    required this.icon,
    required this.label,
    this.badgeCount,
  });
}

class CurvedNotchedNavBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  final List<CurvedNotchedNavItem> items;
  final Color selectedColor;
  final Color unselectedColor;
  final Color backgroundColor;
  final double height;

  const CurvedNotchedNavBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
    required this.items,
    this.selectedColor = AppColors.primary,
    this.unselectedColor = const Color(0xFF64748B),
    this.backgroundColor = Colors.white,
    this.height = 68.0,
  });

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).padding.bottom;
    final totalHeight = height + bottomPadding;
    final centerIndex = items.length ~/ 2;

    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        final notchCenter = width * 0.5; // Always dead-center for balanced symmetry
        final centerItem = items[centerIndex];
        final isCenterSelected = currentIndex == centerIndex;

        return SizedBox(
          width: width,
          height: totalHeight + 18, // extra room for elevated floating button
          child: Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.bottomCenter,
            children: [
              // 1. Notched Custom Painter Background Bar
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                height: totalHeight,
                child: CustomPaint(
                  painter: _CurvedNotchPainter(
                    notchCenter: notchCenter,
                    backgroundColor: backgroundColor,
                    notchDepth: 22.0,
                    notchSmoothWidth: 44.0,
                    cornerRadius: 24.0,
                  ),
                ),
              ),

              // 2. Tab Items Row (Side items + Center Label)
              Positioned(
                left: 0,
                right: 0,
                bottom: bottomPadding,
                height: height,
                child: Row(
                  children: List.generate(items.length, (index) {
                    final item = items[index];
                    final isSelected = index == currentIndex;

                    if (index == centerIndex) {
                      // Center item space: only show label at bottom, icon is in floating circle
                      return Expanded(
                        child: GestureDetector(
                          behavior: HitTestBehavior.opaque,
                          onTap: () => onTap(index),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              Padding(
                                padding: const EdgeInsets.only(bottom: 8.0),
                                child: Text(
                                  item.label,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: isCenterSelected ? FontWeight.w700 : FontWeight.w600,
                                    color: isCenterSelected ? selectedColor : const Color(0xFF64748B),
                                    letterSpacing: -0.2,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }

                    // Regular side items
                    return Expanded(
                      child: GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTap: () => onTap(index),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const SizedBox(height: 6),
                            Icon(
                              item.icon,
                              size: 24,
                              color: isSelected ? selectedColor : unselectedColor,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              item.label,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                color: isSelected ? selectedColor : const Color(0xFF64748B),
                                letterSpacing: -0.2,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
                ),
              ),

              // 3. Floating Elevated Center Circle
              Positioned(
                left: notchCenter - 27.0,
                bottom: totalHeight - 38.0, // floats ~16dp above the top edge
                child: GestureDetector(
                  onTap: () => onTap(centerIndex),
                  child: Container(
                    width: 54,
                    height: 54,
                    decoration: BoxDecoration(
                      color: selectedColor,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: selectedColor.withValues(alpha: isCenterSelected ? 0.38 : 0.25),
                          blurRadius: isCenterSelected ? 12 : 8,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Center(
                      child: Icon(
                        centerItem.icon,
                        color: Colors.white,
                        size: 27,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _CurvedNotchPainter extends CustomPainter {
  final double notchCenter;
  final Color backgroundColor;
  final double notchDepth;
  final double notchSmoothWidth;
  final double cornerRadius;

  _CurvedNotchPainter({
    required this.notchCenter,
    required this.backgroundColor,
    required this.notchDepth,
    required this.notchSmoothWidth,
    required this.cornerRadius,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = backgroundColor
      ..style = PaintingStyle.fill;

    final shadowPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.06)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 12);

    final path = Path();

    // Top-left rounded corner
    path.moveTo(0, cornerRadius);
    path.quadraticBezierTo(0, 0, cornerRadius, 0);

    // Left flat top edge before notch
    final startNotch = notchCenter - notchSmoothWidth;
    final endNotch = notchCenter + notchSmoothWidth;

    path.lineTo(startNotch, 0);

    // Smooth organic curved dip (Cubic Bezier curve down to center and back up)
    path.cubicTo(
      startNotch + 14.0,
      0,
      notchCenter - 22.0,
      notchDepth,
      notchCenter,
      notchDepth,
    );
    path.cubicTo(
      notchCenter + 22.0,
      notchDepth,
      endNotch - 14.0,
      0,
      endNotch,
      0,
    );

    // Right flat top edge after notch
    path.lineTo(size.width - cornerRadius, 0);

    // Top-right rounded corner
    path.quadraticBezierTo(size.width, 0, size.width, cornerRadius);

    // Bottom-right and bottom-left
    path.lineTo(size.width, size.height);
    path.lineTo(0, size.height);
    path.close();

    // Draw shadow first
    canvas.save();
    canvas.translate(0, -3);
    canvas.drawPath(path, shadowPaint);
    canvas.restore();

    // Draw solid background
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _CurvedNotchPainter oldDelegate) {
    return oldDelegate.notchCenter != notchCenter ||
        oldDelegate.backgroundColor != backgroundColor ||
        oldDelegate.notchDepth != notchDepth;
  }
}
