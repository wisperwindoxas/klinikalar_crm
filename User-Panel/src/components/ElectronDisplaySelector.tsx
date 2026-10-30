import React, { useState, useEffect } from 'react';
import { Tv, Monitor, CheckCircle, ExternalLink, RefreshCw, Power } from 'lucide-react';
import { ElectronDisplay } from '../electron';

interface Props {
  onNotification?: (title: string, message: string, type: 'success' | 'error' | 'info') => void;
  className?: string;
}

export const ElectronDisplaySelector: React.FC<Props> = ({ onNotification, className = '' }) => {
  const isElectron = !!window.electronAPI;
  const [displays, setDisplays] = useState<ElectronDisplay[]>([]);
  const [selectedDisplayId, setSelectedDisplayId] = useState<number | null>(null);
  const [isTvActive, setIsTvActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [loading, setLoading] = useState(false);

  // Load connected displays
  const loadDisplays = async () => {
    if (!window.electronAPI) return;
    try {
      const list = await window.electronAPI.getDisplays();
      setDisplays(list);

      const savedDisplayId = localStorage.getItem('sadaf_selected_tv_display');
      if (savedDisplayId && list.some(d => String(d.id) === savedDisplayId)) {
        setSelectedDisplayId(Number(savedDisplayId));
      } else {
        // Auto select the secondary monitor (HDMI TV) if available
        const secondary = list.find(d => !d.isPrimary);
        if (secondary) {
          setSelectedDisplayId(secondary.id);
        } else if (list.length > 0) {
          setSelectedDisplayId(list[0].id);
        }
      }

      const active = await window.electronAPI.isTvOpen();
      setIsTvActive(active);
    } catch (e) {
      console.warn('Failed to load displays:', e);
    }
  };

  useEffect(() => {
    loadDisplays();

    // Listen to HDMI plug / unplug events
    if (window.electronAPI?.onDisplaysChanged) {
      const unsubscribe = window.electronAPI.onDisplaysChanged((updatedDisplays) => {
        setDisplays(updatedDisplays);
        if (onNotification) {
          onNotification('Ekranlar yangilandi', 'Yangi monitor/televizor ulandi yoki uzildi', 'info');
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const handleLaunchTv = async () => {
    if (!window.electronAPI || selectedDisplayId === null) return;
    setLoading(true);
    try {
      const res = await window.electronAPI.openTvOnDisplay(selectedDisplayId, isFullscreen);
      if (res.success) {
        setIsTvActive(true);
        localStorage.setItem('sadaf_selected_tv_display', String(selectedDisplayId));
        if (onNotification) {
          onNotification('TV Tablo Yoqildi', res.message || "TV Tablo tanlangan ekranda to'liq ekranda ochildi!", 'success');
        }
      } else {
        if (onNotification) onNotification('Xatolik', res.message || 'TV oynasini ochib bo‘lmadi', 'error');
      }
    } catch (err: any) {
      if (onNotification) onNotification('Xatolik', err.message || 'TV oynasini ochishda xatolik yuz berdi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTv = async () => {
    if (!window.electronAPI) return;
    setLoading(true);
    try {
      await window.electronAPI.closeTvDisplay();
      setIsTvActive(false);
      if (onNotification) {
        onNotification('TV Tablo Yopildi', 'Televizordagi TV Tablo oynasi yopildi', 'info');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // If not running in Electron, provide quick browser launch
  if (!isElectron) {
    return (
      <div className={`p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Katta TV Tablo (Brauzer rejimi)</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              HDMI televizor yoki Smart TV uchun <code className="text-blue-700 font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200">http://localhost:3002</code> manzilidan foydalaning.
            </p>
          </div>
        </div>
        <a
          href="http://localhost:3002"
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition shrink-0 active:scale-95"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>TV Tabloni ochish (3002)</span>
        </a>
      </div>
    );
  }

  return (
    <div className={`p-5 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0 transition-colors ${
            isTvActive ? 'bg-emerald-600' : 'bg-blue-600'
          }`}>
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black text-slate-800">HDMI TV Tablo Boshqaruvi (Desktop)</h4>
              {isTvActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  TV Ekranda Faol
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                  Kutilmoqda
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Kompyuterga ulangan televizorni tanlang va bitta tugma bilan TV Tabloni ishga tushiring
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadDisplays}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition cursor-pointer self-end sm:self-auto"
          title="Ekranlarni qayta tekshirish"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Display selector dropdown */}
        <div className="md:col-span-6 space-y-1">
          <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-blue-600" />
            <span>TV Tablo uchun ekranni tanlang:</span>
          </label>
          <select
            value={selectedDisplayId || ''}
            onChange={(e) => setSelectedDisplayId(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
          >
            {displays.map((disp) => (
              <option key={disp.id} value={disp.id}>
                {disp.label} ({disp.resolution}) {disp.isPrimary ? '— [Asosiy Kassa Monitori]' : '— [Tashqi HDMI TV / 2-Ekran]'}
              </option>
            ))}
          </select>
        </div>

        {/* Fullscreen checkbox */}
        <div className="md:col-span-3 flex items-center gap-2 pt-4">
          <input
            type="checkbox"
            id="fullscreen-toggle"
            checked={isFullscreen}
            onChange={(e) => setIsFullscreen(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
          />
          <label htmlFor="fullscreen-toggle" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
            To'liq ekran (Fullscreen)
          </label>
        </div>

        {/* Action buttons */}
        <div className="md:col-span-3 flex items-center gap-2 pt-2 md:pt-4 justify-end">
          {isTvActive ? (
            <button
              type="button"
              onClick={handleCloseTv}
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Power className="w-3.5 h-3.5 text-rose-600" />
              <span>TV ni Yopish</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLaunchTv}
              disabled={loading || selectedDisplayId === null}
              className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5 text-white" />
              <span>TV ni Ekranga Chiqarish</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

