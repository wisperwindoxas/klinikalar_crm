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

class CurvedNotchedNavBar extends StatefulWidget {
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
    this.unselectedColor = const Color(0xFF94A3B8),
    this.backgroundColor = Colors.white,
    this.height = 68.0,
  });

  @override
  State<CurvedNotchedNavBar> createState() => _CurvedNotchedNavBarState();
}

class _CurvedNotchedNavBarState extends State<CurvedNotchedNavBar>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;
  double _currentFraction = 0.5;

  @override
  void initState() {
    super.initState();
    _currentFraction = _indexToFraction(widget.currentIndex);
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 320),
    );
    _animation = Tween<double>(
      begin: _currentFraction,
      end: _currentFraction,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOutCubic,
    ));
  }

  double _indexToFraction(int index) {
    if (widget.items.isEmpty) return 0.5;
    return (index + 0.5) / widget.items.length;
  }

  @override
  void didUpdateWidget(CurvedNotchedNavBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.currentIndex != widget.currentIndex) {
      final newFraction = _indexToFraction(widget.currentIndex);
      _animation = Tween<double>(
        begin: _animation.value,
        end: newFraction,
      ).animate(CurvedAnimation(
        parent: _controller,
        curve: Curves.easeInOutCubic,
      ));
      _controller.forward(from: 0.0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).padding.bottom;
    final totalHeight = widget.height + bottomPadding;

    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return LayoutBuilder(
          builder: (context, constraints) {
            final width = constraints.maxWidth;
            final notchCenter = width * _animation.value;

            return SizedBox(
              width: width,
              height: totalHeight + 18, // extra room for the elevated floating circle
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
                        backgroundColor: widget.backgroundColor,
                        notchRadius: 29.0,
                        notchDepth: 20.0,
                        notchSmoothWidth: 42.0,
                        cornerRadius: 24.0,
                      ),
                    ),
                  ),

                  // 2. Tab Items (Icons & Labels)
                  Positioned(
                    left: 0,
                    right: 0,
                    bottom: bottomPadding,
                    height: widget.height,
                    child: Row(
                      children: List.generate(widget.items.length, (index) {
                        final item = widget.items[index];
                        final isSelected = index == widget.currentIndex;

                        return Expanded(
                          child: GestureDetector(
                            behavior: HitTestBehavior.opaque,
                            onTap: () => widget.onTap(index),
                            child: SizedBox(
                              height: widget.height,
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  // Inactive Icon slot (when selected, icon is inside the floating circle)
                                  if (!isSelected)
                                    Padding(
                                      padding: const EdgeInsets.only(bottom: 4.0),
                                      child: Icon(
                                        item.icon,
                                        size: 24,
                                        color: widget.unselectedColor,
                                      ),
                                    )
                                  else
                                    const SizedBox(height: 28), // spacer under the floating circle

                                  // Label
                                  Padding(
                                    padding: const EdgeInsets.only(bottom: 10.0),
                                    child: Text(
                                      item.label,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                        color: isSelected ? widget.selectedColor : const Color(0xFF64748B),
                                        letterSpacing: -0.2,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      }),
                    ),
                  ),

                  // 3. Floating Elevated Green Circle
                  Positioned(
                    left: notchCenter - 27.0,
                    bottom: totalHeight - 39.0, // floats ~16dp above the top edge
                    child: GestureDetector(
                      onTap: () => widget.onTap(widget.currentIndex),
                      child: Container(
                        width: 54,
                        height: 54,
                        decoration: BoxDecoration(
                          color: widget.selectedColor,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: widget.selectedColor.withValues(alpha: 0.35),
                              blurRadius: 12,
                              offset: const Offset(0, 5),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Icon(
                            widget.items[widget.currentIndex].icon,
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
      },
    );
  }
}

class _CurvedNotchPainter extends CustomPainter {
  final double notchCenter;
  final Color backgroundColor;
  final double notchRadius;
  final double notchDepth;
  final double notchSmoothWidth;
  final double cornerRadius;

  _CurvedNotchPainter({
    required this.notchCenter,
    required this.backgroundColor,
    required this.notchRadius,
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
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 10);

    final path = Path();

    // Top-left rounded corner
    path.moveTo(0, cornerRadius);
    path.quadraticBezierTo(0, 0, cornerRadius, 0);

    // Left flat top edge before notch
    final startNotch = (notchCenter - notchSmoothWidth).clamp(cornerRadius, size.width - cornerRadius);
    final endNotch = (notchCenter + notchSmoothWidth).clamp(cornerRadius, size.width - cornerRadius);

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
    canvas.translate(0, -2);
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
