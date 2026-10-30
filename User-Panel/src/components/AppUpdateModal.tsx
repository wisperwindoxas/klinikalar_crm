import React, { useState, useEffect } from 'react';
import {
  Download, RefreshCw, CheckCircle2, AlertCircle,
  Sparkles, X, ShieldCheck, ArrowRight, Tag, Calendar, FileText, Play, Rocket
} from 'lucide-react';
import { APP_VERSION, GITHUB_REPO } from '../utils/brand';

interface GithubAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

interface GithubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
  assets: GithubAsset[];
}

interface AppUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoCheck?: boolean;
}

const getApiBaseUrl = () => {
  const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
  return `http://${host}:5001/api/v1`;
};

// Compare semantic versions (returns >0 if v1 > v2, <0 if v1 < v2, 0 if equal)
const compareVersions = (v1: string, v2: string): number => {
  const clean1 = v1.replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
  const clean2 = v2.replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(clean1.length, clean2.length); i++) {
    const num1 = clean1[i] || 0;
    const num2 = clean2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
};

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({ isOpen, onClose, autoCheck = true }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [release, setRelease] = useState<GithubRelease | null>(null);
  const [hasUpdate, setHasUpdate] = useState<boolean | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [downloadedFilePath, setDownloadedFilePath] = useState<string | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  const checkUpdates = async () => {
    setLoading(true);
    setError(null);
    setDownloadProgress(null);
    setDownloadSuccess(null);
    setDownloadedFilePath(null);
    setIsInstalling(false);

    try {
      let data: GithubRelease | null = null;
      try {
        const localRes = await fetch(`${getApiBaseUrl()}/app/latest-release`);
        if (localRes.ok) {
          const json = await localRes.json();
          if (json.data && json.data.tag_name) {
            data = json.data;
          }
        }
      } catch (_) {}

      if (!data) {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
          headers: {
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        if (!res.ok) {
          if (res.status === 404) {
            setError("Hozircha yangi rasmiy yangilanishlar topilmadi.");
            setHasUpdate(false);
            return;
          }
          throw new Error(`Yangilanish serveri javob bermadi (Status: ${res.status})`);
        }

        data = await res.json();
      }

      if (!data) {
        setError("Yangilanish ma'lumotlarini yuklab bo'lmadi.");
        setHasUpdate(false);
        return;
      }

      setRelease(data);

      const isNewer = compareVersions(data.tag_name, APP_VERSION) > 0;
      setHasUpdate(isNewer);
    } catch (err: any) {
      console.warn('Check update error:', err);
      setError(err?.message || "Internet bilan aloqa yo'q yoki server mavjud emas");
      setHasUpdate(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && autoCheck) {
      checkUpdates();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Detect platform
  const isMac = typeof window !== 'undefined' && (
    (window as any).electronAPI?.platform === 'darwin' ||
    navigator.platform?.toUpperCase().includes('MAC')
  );

  // Find relevant asset for current OS
  const getRelevantAsset = (): GithubAsset | null => {
    if (!release?.assets || release.assets.length === 0) return null;
    if (isMac) {
      return release.assets.find(a => a.name.endsWith('.dmg')) ||
             release.assets.find(a => a.name.endsWith('.zip')) ||
             release.assets[0];
    } else {
      return release.assets.find(a => a.name.endsWith('.exe')) ||
             release.assets.find(a => a.name.endsWith('.zip')) ||
             release.assets[0];
    }
  };

  const relevantAsset = getRelevantAsset();

  const handleDownload = async () => {
    if (!relevantAsset) {
      if (release?.html_url) {
        window.open(release.html_url, '_blank');
      }
      return;
    }

    const electronAPI = (window as any).electronAPI;
    if (electronAPI && typeof electronAPI.downloadUpdate === 'function') {
      try {
        setDownloadProgress(5);
        const unsubscribe = electronAPI.onUpdateDownloadProgress?.((percent: number) => {
          setDownloadProgress(percent);
        });

        const res = await electronAPI.downloadUpdate({
          url: relevantAsset.browser_download_url,
          fileName: relevantAsset.name
        });

        if (unsubscribe) unsubscribe();

        if (res?.success) {
          setDownloadProgress(100);
          setDownloadedFilePath(res.filePath);
          setDownloadSuccess(res.fileName || "Fayl muvaffaqiyatli yuklab olindi");
        } else {
          throw new Error(res?.message || 'Yuklab olishda xatolik yuz berdi');
        }
      } catch (e: any) {
        console.error('Desktop download error, fallback to browser link:', e);
        const a = document.createElement('a');
        a.href = relevantAsset.browser_download_url;
        a.download = relevantAsset.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setDownloadSuccess("Fayl brauzer yuklamalariga uzatildi.");
        setDownloadProgress(100);
      }
    } else {
      // Browser environment: trigger direct download
      const a = document.createElement('a');
      a.href = relevantAsset.browser_download_url;
      a.download = relevantAsset.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloadSuccess("Fayl brauzer yuklamalariga yuborildi. Yuklab olish tugagach, uni ishga tushiring.");
      setDownloadProgress(100);
    }
  };

  const handleInstallNow = async () => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI && typeof electronAPI.installUpdate === 'function' && downloadedFilePath) {
      setIsInstalling(true);
      try {
        await electronAPI.installUpdate(downloadedFilePath);
      } catch (err: any) {
        console.error('Install error:', err);
        setError("O'rnatishda xatolik: " + (err?.message || 'Noma\'lum xatolik'));
        setIsInstalling(false);
      }
    } else {
      // Browser or no path: open downloaded asset directly
      if (relevantAsset) {
        window.open(relevantAsset.browser_download_url, '_blank');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-medical-blue to-teal-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Dastur Yangilanishi</h3>
              <p className="text-xs text-white/80 font-medium">
                Joriy versiya: <span className="font-bold underline">v{APP_VERSION}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <RefreshCw className="w-9 h-9 text-medical-blue animate-spin" />
              <p className="text-sm font-bold text-slate-700">Yangilanishlar tekshirilmoqda...</p>
              <p className="text-xs text-slate-400">Rasmiy yangilanishlar bazasi bilan solishtirilmoqda</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <h4 className="text-xs font-bold">Tekshirishda eslatma</h4>
              </div>
              <p className="text-xs text-amber-700 leading-relaxed">{error}</p>
              <div className="pt-2 flex justify-end">
                <button
                  onClick={checkUpdates}
                  className="px-3 py-1.5 rounded-xl bg-amber-200/60 hover:bg-amber-200 text-xs font-bold text-amber-900 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Qayta urinish
                </button>
              </div>
            </div>
          ) : hasUpdate === false ? (
            <div className="py-8 flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border-2 border-emerald-200">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">Sizda eng so'nggi versiya o'rnatilgan</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Klinika-admin <span className="font-bold text-emerald-600">v{APP_VERSION}</span> a'lo darajada ishlamoqda.
                </p>
              </div>
              <div className="w-full pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Manba: Rasmiy yangilanish tizimi</span>
                <button
                  onClick={checkUpdates}
                  className="text-medical-blue hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Qayta tekshirish
                </button>
              </div>
            </div>
          ) : release ? (
            <div className="space-y-4">
              {/* Release Header Badge */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-200/60 text-emerald-800 text-[10px] font-black uppercase tracking-wider mb-0.5">
                      Yangi Versiya
                    </span>
                    <h4 className="text-sm font-black text-slate-900">{release.name || release.tag_name}</h4>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-emerald-700">{release.tag_name}</div>
                  {release.published_at && (
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 justify-end mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(release.published_at).toLocaleDateString('uz-UZ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Release Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-medical-blue" />
                  O'zgarishlar va Yangiliklar
                </label>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed font-sans">
                  {release.body || "Yangi imkoniyatlar qo'shildi va tizim barqarorligi oshirildi."}
                </div>
              </div>

              {/* Progress Bar & Installation Prompt */}
              {downloadProgress !== null && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                    <span>{downloadProgress === 100 ? "Yuklab olish yakunlandi!" : "Yuklab olinmoqda..."}</span>
                    <span>{downloadProgress}%</span>
                  </div>
                  <div className="w-full bg-blue-200/60 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-medical-blue h-full transition-all duration-300 rounded-full"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>

                  {downloadProgress === 100 && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-1 animate-fade-in">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-xs font-black">Yangilanish o'rnatishga tayyor!</span>
                      </div>
                      <p className="text-[11px] text-emerald-700 leading-snug">
                        Fayl muvaffaqiyatli saqlandi: <b>{downloadSuccess}</b>. Hozir o'rnatish oynasiga o'tishni xohlaysizmi?
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl border border-slate-300 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            {downloadProgress === 100 ? 'Keyinroq' : 'Yopish'}
          </button>

          <div className="flex items-center gap-2">
            {hasUpdate && downloadProgress !== 100 && (
              <button
                onClick={handleDownload}
                disabled={downloadProgress !== null && downloadProgress < 100}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-medical-blue to-teal-600 hover:opacity-95 text-white font-black text-xs transition shadow-lg shadow-medical-blue/20 flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>
                  {downloadProgress !== null
                    ? `${downloadProgress}% Yuklanmoqda...`
                    : relevantAsset
                      ? `${relevantAsset.name.endsWith('.dmg') ? 'macOS DMG' : relevantAsset.name.endsWith('.exe') ? 'Windows EXE' : 'Faylni'} Yuklab olish`
                      : 'Yangilashni olish'}
                </span>
              </button>
            )}

            {downloadProgress === 100 && (
              <button
                onClick={handleInstallNow}
                disabled={isInstalling}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-black text-xs transition shadow-lg shadow-emerald-600/25 flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer animate-pulse"
              >
                <Rocket className="w-4 h-4" />
                <span>{isInstalling ? "O'rnatuvchi ochilmoqda..." : "Hoziroq O'rnatish"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

