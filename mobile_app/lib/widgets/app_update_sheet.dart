import 'dart:io';
import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';
import '../services/app_update_service.dart';

class AppUpdateSheet extends StatefulWidget {
  final bool autoDownload;

  const AppUpdateSheet({Key? key, this.autoDownload = false}) : super(key: key);

  static Future<void> show(BuildContext context, {bool autoDownload = false}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AppUpdateSheet(autoDownload: autoDownload),
    );
  }

  @override
  State<AppUpdateSheet> createState() => _AppUpdateSheetState();
}

class _AppUpdateSheetState extends State<AppUpdateSheet> {
  bool _isChecking = true;
  String? _errorMessage;
  UpdateInfo? _info;

  bool _isDownloading = false;
  double _downloadProgress = 0.0;
  int _receivedBytes = 0;
  int _totalBytes = 0;
  File? _downloadedFile;
  bool _installTriggered = false;

  @override
  void initState() {
    super.initState();
    _check();
  }

  Future<void> _check() async {
    setState(() {
      _isChecking = true;
      _errorMessage = null;
    });

    try {
      final info = await AppUpdateService.checkForUpdate();
      if (!mounted) return;
      setState(() {
        _info = info;
        _isChecking = false;
      });

      if (info.hasUpdate && widget.autoDownload) {
        _startDownload();
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = 'Yangilanishlarni tekshirishda xatolik yuz berdi: $e';
        _isChecking = false;
      });
    }
  }

  Future<void> _startDownload() async {
    if (_info == null || _info!.apkUrl.isEmpty) return;

    setState(() {
      _isDownloading = true;
      _downloadProgress = 0.0;
      _errorMessage = null;
      _installTriggered = false;
    });

    try {
      final file = await AppUpdateService.downloadApk(
        _info!.apkUrl,
        _info!.fileName,
        onProgress: (p, received, total) {
          if (mounted) {
            setState(() {
              _downloadProgress = p;
              _receivedBytes = received;
              _totalBytes = total;
            });
          }
        },
      );

      if (!mounted) return;
      setState(() {
        _downloadedFile = file;
        _isDownloading = false;
      });

      // Automatically launch the Android OS package installer
      _installDownloadedApk();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = 'Yuklab olishda xatolik: $e';
        _isDownloading = false;
      });
    }
  }

  Future<void> _installDownloadedApk() async {
    if (_downloadedFile == null || !_downloadedFile!.existsSync()) return;

    setState(() => _installTriggered = true);
    try {
      await AppUpdateService.installApk(_downloadedFile!.path);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('O‘rnatuvchini ochishda xatolik: $e'), backgroundColor: AppColors.error),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.fromLTRB(
        24,
        14,
        24,
        MediaQuery.of(context).padding.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 44,
              height: 4.5,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          ),
          const SizedBox(height: 18),

          if (_isChecking) ...[
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 36),
                child: Column(
                  children: [
                    SizedBox(
                      width: 40,
                      height: 40,
                      child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 3),
                    ),
                    SizedBox(height: 16),
                    Text(
                      'Yangilanishlar tekshirilmoqda...',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
            ),
          ] else if (_errorMessage != null) ...[
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.errorLight.withOpacity(0.4),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.errorLight),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline_rounded, color: AppColors.error, size: 24),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _errorMessage!,
                      style: const TextStyle(fontSize: 12, color: AppColors.error, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            ElevatedButton.icon(
              onPressed: _check,
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('Qayta urinish'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ] else if (_info != null && !_info!.hasUpdate) ...[
            // Up to date
            Center(
              child: Container(
                width: 60,
                height: 60,
                decoration: const BoxDecoration(
                  color: AppColors.mintLight,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 36),
              ),
            ),
            const SizedBox(height: 14),
            const Center(
              child: Text(
                'Sizda eng so‘nggi versiya o‘rnatilgan',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
            ),
            const SizedBox(height: 6),
            Center(
              child: Text(
                'Klinika-admin Mobile v${_info!.currentVersion}',
                style: const TextStyle(fontSize: 13, color: AppColors.textMuted, fontWeight: FontWeight.w500),
              ),
            ),
            const SizedBox(height: 22),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Text('Tushunarli', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ] else if (_info != null && _info!.hasUpdate) ...[
            // New update available!
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: AppColors.medicalGradient,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.system_update_rounded, color: Colors.white, size: 26),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Yangi versiya mavjud!',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.border,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'v${_info!.currentVersion}',
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Icon(Icons.arrow_forward_rounded, size: 14, color: AppColors.textMuted),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.mintLight,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'v${_info!.latestVersion}',
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '~${_info!.apkSizeMb.toStringAsFixed(1)} MB',
                            style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),

            // Changelog Box
            Container(
              constraints: const BoxConstraints(maxHeight: 160),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.auto_awesome_rounded, size: 16, color: AppColors.primary),
                        SizedBox(width: 6),
                        Text('Yangi o‘zgarishlar:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _info!.changelog,
                      style: const TextStyle(fontSize: 12, height: 1.45, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Action: Download progress or Install button
            if (_isDownloading) ...[
              Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Yangilanish yuklanmoqda...',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                      ),
                      Text(
                        '${(_downloadProgress * 100).toInt()}%',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primary),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: LinearProgressIndicator(
                      value: _downloadProgress > 0 ? _downloadProgress : null,
                      minHeight: 8,
                      backgroundColor: AppColors.border,
                      valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Center(
                    child: Text(
                      '${(_receivedBytes / (1024 * 1024)).toStringAsFixed(1)} MB / ${(_totalBytes / (1024 * 1024)).toStringAsFixed(1)} MB (Ilovadan chiqmasdan)',
                      style: const TextStyle(fontSize: 10.5, color: AppColors.textMuted),
                    ),
                  ),
                ],
              ),
            ] else if (_downloadedFile != null) ...[
              ElevatedButton.icon(
                onPressed: _installDownloadedApk,
                icon: const Icon(Icons.install_mobile_rounded, size: 20),
                label: Text(_installTriggered ? 'Qayta o‘rnatish oynasini ochish' : 'Ilovani yangilash (Obnovit)'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.success,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
              ),
            ] else ...[
              ElevatedButton.icon(
                onPressed: _startDownload,
                icon: const Icon(Icons.download_rounded, size: 20),
                label: const Text('Yangilashni ko‘chirib olish va o‘rnatish'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }
}
