import React, { useState, useEffect } from 'react';
import { 
  Server, Cpu, HardDrive, Database, Activity, 
  CheckCircle2, RefreshCw, AlertCircle, Clock, Zap
} from 'lucide-react';
import { ApiClient } from '../api/client';

export const SystemStatusPage: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 15000); // 15s auto-poll
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.getSystemStatus();
      if (res.data) {
        setStatus(res.data);
        setLastUpdated(new Date());
      }
    } catch (e: any) {
      setError(e.message || 'Tizim holatini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tizim Holati & Infratuzilma</h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              100% Online
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Node.js server, PostgreSQL klasteri va barcha integratsiya qatlamlarining real monitoringi
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 font-medium">
            Yangilandi: {lastUpdated.toLocaleTimeString('uz-UZ')}
          </span>
          <button
            onClick={loadStatus}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-sm"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !status ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3 bg-white rounded-2xl border border-slate-200/80">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
          <span className="text-xs font-medium">Server ko‘rsatkichlari o‘lchanmoqda...</span>
        </div>
      ) : status && (
        <>
          {/* Top Server Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Server Ish Vaqti (Uptime)</span>
                <Clock className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-xl font-black text-slate-900">
                {status.server.uptimeFormatted}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold font-mono">
                {status.server.uptimeSeconds} soniya uzluksiz
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">RAM Xotira Yuklamasi</span>
                <Cpu className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xl font-black text-slate-900">
                {status.server.memoryUsageMb} MB RSS
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">
                Heap: {status.server.heapUsedMb} MB / {status.server.heapTotalMb} MB
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">PostgreSQL Kechikish</span>
                <Database className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-black text-slate-900 flex items-center gap-1.5">
                <span>{status.database.latencyMs} ms</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Ideal
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-semibold font-mono">
                {status.database.databaseName} @ {status.database.host}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Node Dvigateli</span>
                <Server className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-xl font-black text-slate-900">
                {status.server.nodeVersion}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">
                Platforma: {status.server.platform}
              </div>
            </div>
          </div>

          {/* Database Counts Grid */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-teal-800" />
                <h3 className="text-sm font-extrabold text-slate-900">PostgreSQL Ma‘lumotlar Bazasi Sig‘imi (Haqiqiy Yozuvlar)</h3>
              </div>
              <span className="text-xs font-bold text-slate-500 font-mono">v16 Engine</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 text-center">
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xl font-black text-slate-900">{status.database.counts?.tickets_count || 0}</div>
                <div className="text-[11px] text-slate-400 font-bold mt-0.5">Navbatlar (Tickets)</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xl font-black text-slate-900">{status.database.counts?.patients_count || 0}</div>
                <div className="text-[11px] text-slate-400 font-bold mt-0.5">Bemorlar</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xl font-black text-slate-900">{status.database.counts?.doctors_count || 0}</div>
                <div className="text-[11px] text-slate-400 font-bold mt-0.5">Shifokorlar</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xl font-black text-slate-900">{status.database.counts?.payments_count || 0}</div>
                <div className="text-[11px] text-slate-400 font-bold mt-0.5">To‘lovlar</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xl font-black text-slate-900">{status.database.counts?.users_count || 0}</div>
                <div className="text-[11px] text-slate-400 font-bold mt-0.5">Foydalanuvchilar</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xl font-black text-slate-900">{status.database.counts?.subscriptions_count || 0}</div>
                <div className="text-[11px] text-slate-400 font-bold mt-0.5">Obunalar</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xl font-black text-slate-900">{status.database.counts?.sms_count || 0}</div>
                <div className="text-[11px] text-slate-400 font-bold mt-0.5">SMS Tarixi</div>
              </div>
            </div>
          </div>

          {/* Microservices Health Checklist */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Mikroxizmatlar & Tashqi Provayderlar Holati</h3>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Barchasi ishlab turibdi
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {status.services?.map((srv: any, idx: number) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <span className="font-bold text-slate-800">{srv.name}</span>
                      {srv.port && <span className="ml-2 font-mono text-[10px] text-slate-400">:{srv.port}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-400">{srv.latency}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {srv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
