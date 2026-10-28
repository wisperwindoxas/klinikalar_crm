import React, { useState, useEffect } from 'react';
import { 
  Sliders, Shield, Clock, AlertTriangle, Key, 
  CheckCircle2, RefreshCw, Save, Database, Lock
} from 'lucide-react';
import { ApiClient } from '../api/client';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedSuccessKey, setSavedSuccessKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.getSystemSettings();
      if (res.data) {
        setSettings(res.data);
      }
    } catch (e: any) {
      setError(e.message || 'Sozlamalarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSetting = async (key: string, value: string) => {
    try {
      setSavingKey(key);
      await ApiClient.updateSystemSetting(key, value);
      setSettings(settings.map(s => s.key === key ? { ...s, value } : s));
      setSavedSuccessKey(key);
      setTimeout(() => setSavedSuccessKey(null), 2500);
    } catch (e: any) {
      alert(e.message || 'Sozlamani saqlashda xatolik');
    } finally {
      setSavingKey(null);
    }
  };

  const handleToggle = (key: string, currentValue: string) => {
    const nextVal = currentValue === 'true' ? 'false' : 'true';
    handleUpdateSetting(key, nextVal);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tizim Sozlamalari (Global SaaS)</h1>
            <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 font-bold text-xs rounded-full border border-teal-200">
              PostgreSQL Real Config
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Xavfsizlik siyosati, sessiya cheklovlari, obuna qoidalari va platforma xulq-atvorini boshqarish
          </p>
        </div>

        <button
          onClick={loadSettings}
          disabled={loading}
          className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-sm self-start sm:self-auto"
          title="Yangilash"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Settings Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Platforma Siyosati & Parametrlari</h2>
              <p className="text-[11px] text-slate-400">Har bir parametr darhol PostgreSQL ma‘lumotlar bazasida yangilanadi</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
            <span className="text-xs font-medium">Sozlamalar yuklanmoqda...</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {settings.map((s) => {
              const isBool = s.value === 'true' || s.value === 'false';
              const isSaving = savingKey === s.key;
              const isSaved = savedSuccessKey === s.key;

              return (
                <div key={s.key} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-900 font-mono tracking-wide">{s.key}</span>
                      {isSaved && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Saqlandi
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{s.description}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {isBool ? (
                      <button
                        onClick={() => handleToggle(s.key, s.value)}
                        disabled={isSaving}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          s.value === 'true' ? 'bg-teal-600' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            s.value === 'true' ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          defaultValue={s.value}
                          onBlur={(e) => {
                            if (e.target.value !== s.value) {
                              handleUpdateSetting(s.key, e.target.value);
                            }
                          }}
                          className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-center focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                        />
                      </div>
                    )}

                    {isSaving && <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Database & Infrastructure Info Card */}
      <div className="p-5 bg-gradient-to-r from-teal-900 to-slate-900 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-teal-300 text-xs font-bold uppercase tracking-wider">
            <Database className="w-4 h-4" />
            <span>PostgreSQL 16 Multi-Tenant Cluster</span>
          </div>
          <h3 className="text-base font-black">Xavfsiz va Markazlashgan Konfiguratsiya</h3>
          <p className="text-xs text-slate-300 max-w-xl">
            Barcha tenantlar va klinikalar uchun amaldagi qoidalar xotirada keshlanadi va o‘zgartirilganda bir zumda sinxronlanadi.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-bold self-start sm:self-auto">
          <Lock className="w-3.5 h-3.5 text-teal-400" />
          <span>SSL 256-bit Shifrlangan</span>
        </div>
      </div>
    </div>
  );
};
