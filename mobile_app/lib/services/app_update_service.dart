import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';

class UpdateInfo {
  final bool hasUpdate;
  final String currentVersion;
  final String latestVersion;
  final String title;
  final String changelog;
  final String apkUrl;
  final double apkSizeMb;
  final String fileName;

  UpdateInfo({
    required this.hasUpdate,
    required this.currentVersion,
    required this.latestVersion,
    required this.title,
    required this.changelog,
    required this.apkUrl,
    required this.apkSizeMb,
    required this.fileName,
  });
}

class AppUpdateService {
  static const String currentAppVersion = '1.0.5';
  static const String githubRepo = 'wisperwindoxas/klinikalar_crm';
  static const MethodChannel _installerChannel = MethodChannel('uz.sadaf.mobile_app/app_installer');

  static int compareVersions(String v1, String v2) {
    final clean1 = v1.replaceAll(RegExp(r'[^0-9.]'), '').split('.').map((e) => int.tryParse(e) ?? 0).toList();
    final clean2 = v2.replaceAll(RegExp(r'[^0-9.]'), '').split('.').map((e) => int.tryParse(e) ?? 0).toList();
    final maxLen = clean1.length > clean2.length ? clean1.length : clean2.length;
    for (int i = 0; i < maxLen; i++) {
      final num1 = i < clean1.length ? clean1[i] : 0;
      final num2 = i < clean2.length ? clean2[i] : 0;
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  }

  static Future<UpdateInfo> checkForUpdate() async {
    Map<String, dynamic>? data;

    // 1. First try GitHub API directly
    try {
      final res = await http.get(
        Uri.parse('https://api.github.com/repos/$githubRepo/releases/latest'),
        headers: {'Accept': 'application/vnd.github.v3+json'},
      ).timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        data = jsonDecode(res.body);
      }
    } catch (_) {}

    // 2. Fallback to production VPS backend
    if (data == null) {
      try {
        final res = await http.get(
          Uri.parse('http://189.74.99.251:5001/api/v1/app/latest-release'),
        ).timeout(const Duration(seconds: 8));

        if (res.statusCode == 200) {
          final json = jsonDecode(res.body);
          if (json['data'] != null && json['data'] is Map) {
            data = Map<String, dynamic>.from(json['data']);
          }
        }
      } catch (_) {}
    }

    if (data == null) {
      return UpdateInfo(
        hasUpdate: false,
        currentVersion: currentAppVersion,
        latestVersion: currentAppVersion,
        title: 'Klinika-admin Mobile',
        changelog: 'Server bilan aloqa o‘rnatilmadi',
        apkUrl: '',
        apkSizeMb: 0,
        fileName: '',
      );
    }

    final rawTag = (data['tag_name'] ?? 'v1.0.5').toString();
    final latestVer = rawTag.replaceAll(RegExp(r'^v', caseSensitive: false), '');
    final title = (data['name'] ?? 'Klinika-admin yangilanishi').toString();
    final body = (data['body'] ?? 'Tizim barqarorligi va tezligi yaxshilandi.').toString();

    // Find .apk asset
    String apkUrl = '';
    double apkSizeMb = 54.0;
    String fileName = 'Sadaf-Klinika-Mobile-$latestVer.apk';

    if (data['assets'] is List) {
      for (final item in data['assets']) {
        if (item is Map) {
          final name = (item['name'] ?? '').toString();
          if (name.toLowerCase().endsWith('.apk')) {
            apkUrl = (item['browser_download_url'] ?? '').toString();
            fileName = name;
            final size = item['size'];
            if (size is num) {
              apkSizeMb = size / (1024 * 1024);
            }
            break;
          }
        }
      }
    }

    // Default download URL if not found in assets
    if (apkUrl.isEmpty) {
      apkUrl = 'https://github.com/$githubRepo/releases/download/$rawTag/$fileName';
    }

    final hasUpdate = compareVersions(latestVer, currentAppVersion) > 0;

    return UpdateInfo(
      hasUpdate: hasUpdate,
      currentVersion: currentAppVersion,
      latestVersion: latestVer,
      title: title,
      changelog: body,
      apkUrl: apkUrl,
      apkSizeMb: apkSizeMb,
      fileName: fileName,
    );
  }

  static Future<File> downloadApk(
    String apkUrl,
    String fileName, {
    required Function(double progress, int receivedBytes, int totalBytes) onProgress,
  }) async {
    final client = http.Client();
    final request = http.Request('GET', Uri.parse(apkUrl));
    final response = await client.send(request);

    if (response.statusCode >= 400) {
      throw HttpException('Server xatosi: ${response.statusCode}');
    }

    final totalBytes = response.contentLength ?? (54 * 1024 * 1024);
    int receivedBytes = 0;

    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/$fileName');
    if (file.existsSync()) {
      try {
        file.deleteSync();
      } catch (_) {}
    }

    final sink = file.openWrite();
    try {
      await response.stream.listen(
        (chunk) {
          receivedBytes += chunk.length;
          sink.add(chunk);
          final p = totalBytes > 0 ? (receivedBytes / totalBytes).clamp(0.0, 1.0) : 0.0;
          onProgress(p, receivedBytes, totalBytes);
        },
        cancelOnError: true,
      ).asFuture();
    } finally {
      await sink.flush();
      await sink.close();
      client.close();
    }

    return file;
  }

  static Future<bool> installApk(String filePath) async {
    try {
      final res = await _installerChannel.invokeMethod('installApk', {'filePath': filePath});
      return res == true;
    } on PlatformException catch (e) {
      throw Exception('O‘rnatishda xatolik: ${e.message}');
    }
  }
}

