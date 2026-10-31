package uz.sadaf.mobile_app

import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.core.content.FileProvider
import io.flutter.embedding.android.FlutterFragmentActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.File

class MainActivity : FlutterFragmentActivity() {
    private val CHANNEL = "uz.sadaf.mobile_app/app_installer"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            if (call.method == "installApk") {
                val filePath = call.argument<String>("filePath")
                if (filePath != null) {
                    try {
                        installApk(filePath)
                        result.success(true)
                    } catch (e: Exception) {
                        result.error("INSTALL_ERROR", e.message, null)
                    }
                } else {
                    result.error("INVALID_PATH", "File path is null", null)
                }
            } else {
                result.notImplemented()
            }
        }
    }

    private fun installApk(filePath: String) {
        val file = File(filePath)
        if (!file.exists()) {
            throw IllegalArgumentException("Fayl topilmadi: $filePath")
        }

        val intent = Intent(Intent.ACTION_VIEW).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }

        val uri: Uri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            FileProvider.getUriForFile(this, "${applicationContext.packageName}.fileprovider", file)
        } else {
            Uri.fromFile(file)
        }

        intent.setDataAndType(uri, "application/vnd.android.package-archive")
        startActivity(intent)
    }
}
