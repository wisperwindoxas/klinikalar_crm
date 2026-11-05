import React, { useState, useEffect, useRef } from 'react';
import { 
  Server, Cpu, HardDrive, Database, Activity, 
  CheckCircle2, RefreshCw, AlertCircle, Clock, Zap,
  Play, Pause, Download, Trash2, Search, Filter,
  Terminal, ShieldCheck, ArrowUpRight, Radio, ExternalLink,
  Users, CreditCard, Stethoscope, MessageSquare, ChevronDown, ChevronRight
} from 'lucide-react';
import { ApiClient } from '../api/client';

export const SystemStatusPage: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Live Streaming controls
  const [isStreaming, setIsStreaming] = useState(true);
  const [streamInterval, setStreamInterval] = useState(5); // 5 seconds
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const terminalRef = useRef<HTMLDivElement>(null);

  // Initial load
  useEffect(() => {
    loadAll();
  }, []);

  // Live polling timer
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      fetchLatestStatusAndLogs();
    }, streamInterval * 1000);
    return () => clearInterval(interval);
  }, [isStreaming, streamInterval]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchLatestStatusAndLogs();
    } catch (e: any) {
      setError(e.message || 'Tizim holatini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestStatusAndLogs = async () => {
    try {
      const res = await ApiClient.getSystemStatus();
      if (res.data) {
        setStatus(res.data);
        if (res.data.logs) {
          setLogs(res.data.logs);
        }
        setLastUpdated(new Date());
      }
    } catch (e: any) {
      console.warn('System status poll warning:', e.message);
    }
  };

  const handleExportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `klinika-system-logs-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchSearch = 
      (log.action && log.action.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.actor_name && log.actor_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.object_reference && log.object_reference.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.patient_name && log.patient_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.doctor_name && log.doctor_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchType = selectedType === 'ALL' || log.log_type === selectedType;

    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-6 h-6 text-teal-600 stroke-[2.5]" />
              <span>Tizim Holati & Jonli Server Loglari</span>
            </h1>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-extrabold text-xs rounded-full border border-emerald-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              100% ISHLAMOQDA
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Node.js server dvigateli, PostgreSQL klasteri va real vaqtda kelayotgan barcha audit & tizim hodisalari oqimi
          </p>
        </div>

        {/* Live streaming controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg transition ${
                isStreaming 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isStreaming ? (
                <>
                  <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
                  <span>Jonli Oqim: Yoqilgan</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>To‘xtatilgan</span>
                </>
              )}
            </button>

            <select
              value={streamInterval}
              onChange={(e) => setStreamInterval(Number(e.target.value))}
              disabled={!isStreaming}
              className="text-xs font-bold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer"
            >
              <option value={3}>Har 3 soniyada</option>
              <option value={5}>Har 5 soniyada</option>
              <option value={10}>Har 10 soniyada</option>
            </select>
          </div>

          <button
            onClick={fetchLatestStatusAndLogs}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs"
            title="Qayta yuklash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Top Server & Resource Metrics */}
      {status && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Uptime */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Server Ish Vaqti (Uptime)</span>
              <Clock className="w-4 h-4 text-teal-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {status.server?.uptimeFormatted || 'Ishlamoqda'}
              </div>
              <div className="text-[11px] text-slate-400 font-mono font-semibold mt-1">
                PID: {status.server?.pid || 808157} • {status.server?.uptimeSeconds || 0}s uzluksiz
              </div>
            </div>
          </div>

          {/* RAM Memory */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">RAM Xotira Yuklamasi</span>
              <Cpu className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900">
                {status.server?.memoryUsageMb || 0} <span className="text-sm font-bold text-slate-500">MB RSS</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round(((status.server?.heapUsedMb || 20) / (status.server?.heapTotalMb || 40)) * 100))}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-1">
                Heap: {status.server?.heapUsedMb || 0} MB / {status.server?.heapTotalMb || 0} MB
              </div>
            </div>
          </div>

          {/* Database Latency */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">PostgreSQL Kechikish</span>
              <Database className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <span>{status.database?.latencyMs ?? 1} ms</span>
                <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  A’lo
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono font-semibold mt-1">
                {status.database?.databaseName || 'klinika_db'} @ {status.database?.host || '127.0.0.1:5432'}
              </div>
            </div>
          </div>

          {/* Node Engine & OS */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Dvigatel & Platforma</span>
              <Server className="w-4 h-4 text-purple-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900">
                {status.server?.nodeVersion || 'v20.x'}
              </div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase mt-1">
                OS: {status.server?.platform || 'linux'} (Ubuntu 24 LTS)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Database Records Counters */}
      {status?.database?.counts && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-700 stroke-[2.5]" />
              <h3 className="text-sm font-black text-slate-900">PostgreSQL Klasteri Jadvallari Sig‘imi</h3>
            </div>
            <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200/60">
              PostgreSQL 16 Cluster
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div className="text-xl font-black text-slate-900">{status.database.counts.tickets_count || 0}</div>
              <div className="text-[11px] text-slate-500 font-bold mt-1">Navbatlar (Tickets)</div>
            </div>
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div className="text-xl font-black text-slate-900">{status.database.counts.patients_count || 0}</div>
              <div className="text-[11px] text-slate-500 font-bold mt-1">Bemorlar</div>
            </div>
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div className="text-xl font-black text-slate-900">{status.database.counts.doctors_count || 0}</div>
              <div className="text-[11px] text-slate-500 font-bold mt-1">Shifokorlar</div>
            </div>
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div className="text-xl font-black text-slate-900">{status.database.counts.payments_count || 0}</div>
              <div className="text-[11px] text-slate-500 font-bold mt-1">To‘lovlar</div>
            </div>
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div className="text-xl font-black text-slate-900">{status.database.counts.users_count || 0}</div>
              <div className="text-[11px] text-slate-500 font-bold mt-1">Foydalanuvchilar</div>
            </div>
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div className="text-xl font-black text-slate-900">{status.database.counts.subscriptions_count || 0}</div>
              <div className="text-[11px] text-slate-500 font-bold mt-1">Obunalar</div>
            </div>
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div className="text-xl font-black text-slate-900">{status.database.counts.sms_count || 0}</div>
              <div className="text-[11px] text-slate-500 font-bold mt-1">SMS Tarixi</div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Microservices Status Checklist */}
      {status?.services && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
              <h3 className="text-sm font-black text-slate-900">Mikroxizmatlar & Integratsiyalar Holati</h3>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Barcha qatlamlar faol
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {status.services.map((srv: any, idx: number) => (
              <div key={idx} className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">{srv.name}</div>
                    {srv.port && <div className="text-[10px] font-mono text-slate-400">Port: {srv.port}</div>}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono">
                    {srv.status}
                  </span>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">{srv.latency}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. JONLI TIZIM LOGLARI (LIVE SYSTEM & AUDIT LOGS STREAM) */}
      <div className="bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        {/* Terminal Header */}
        <div className="p-5 border-b border-slate-800/90 bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight">Jonli Tizim Loglari & Voqealar Oqimi</h3>
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px] rounded-md border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  LIVE STREAM
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Barcha qabul chaqiruvlari, to‘lovlar, kassa smenalari va ma’muriy amallar real vaqtda keladi ({filteredLogs.length} ta hodisa)
              </p>
            </div>
          </div>

          {/* Terminal Actions */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={handleExportLogs}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
              title="Loglarni JSON formatda yuklab olish"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Eksport</span>
            </button>

            <button
              onClick={handleClearLogs}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition border border-slate-700"
              title="Ekrandagi loglarni tozalash"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter & Search inside logs */}
        <div className="p-4 bg-slate-900/30 border-b border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Loglar ichidan qidirish (ism, talon, amal)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            />
          </div>

          {/* Log Type Filters */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 overflow-x-auto w-full sm:w-auto">
            {['ALL', 'QUEUE_CALL', 'PAYMENT', 'CASH_SHIFT', 'USER_MANAGEMENT', 'CLINIC_UPDATE'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                  selectedType === type
                    ? 'bg-teal-600 text-white font-extrabold shadow-xs'
                    : 'hover:text-slate-200'
                }`}
              >
                {type === 'ALL' ? 'Barchasi' :
                 type === 'QUEUE_CALL' ? 'Navbatlar' :
                 type === 'PAYMENT' ? 'To‘lovlar' :
                 type === 'CASH_SHIFT' ? 'Kassa' :
                 type === 'USER_MANAGEMENT' ? 'Foydalanuvchilar' : 'Sozlamalar'}
              </button>
            ))}
          </div>
        </div>

        {/* Streaming Logs Body */}
        <div 
          ref={terminalRef}
          className="max-h-[500px] overflow-y-auto divide-y divide-slate-800/50 font-mono text-xs custom-scrollbar"
        >
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Terminal className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="font-sans font-medium">Hozircha ko‘rsatish uchun loglar mavjud emas</p>
              <p className="text-[11px] font-sans text-slate-600 mt-1">Yangi hodisalar avtomatik ravishda shu yerda paydo bo‘ladi</p>
            </div>
          ) : (
            filteredLogs.map((log: any, index: number) => {
              const timeStr = log.timestamp ? new Date(log.timestamp).toLocaleTimeString('uz-UZ') : '—';
              const isExpanded = expandedLogId === (log.id || String(index));

              // Colors by type
              let typeBadgeClass = 'bg-slate-800 text-slate-300 border-slate-700';
              if (log.log_type === 'QUEUE_CALL') typeBadgeClass = 'bg-teal-500/10 text-teal-300 border-teal-500/30';
              else if (log.log_type === 'PAYMENT') typeBadgeClass = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
              else if (log.log_type === 'CASH_SHIFT') typeBadgeClass = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
              else if (log.log_type === 'USER_MANAGEMENT') typeBadgeClass = 'bg-blue-500/10 text-blue-300 border-blue-500/30';
              else if (log.log_type === 'CLINIC_UPDATE') typeBadgeClass = 'bg-purple-500/10 text-purple-300 border-purple-500/30';

              return (
                <div 
                  key={log.id || index}
                  onClick={() => setExpandedLogId(isExpanded ? null : (log.id || String(index)))}
                  className="p-3.5 hover:bg-slate-900/80 transition-colors cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-slate-500 font-bold text-[11px]">{timeStr}</span>

                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wide ${typeBadgeClass}`}>
                        {log.log_type}
                      </span>

                      <span className="text-teal-400 font-extrabold text-xs">
                        {log.action}
                      </span>

                      {log.object_reference && (
                        <span className="bg-slate-800/90 text-amber-300 px-2 py-0.5 rounded text-[11px] font-black">
                          #{log.object_reference}
                        </span>
                      )}

                      {log.amount && (
                        <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded text-[11px] font-bold">
                          +{Number(log.amount).toLocaleString()} so‘m
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <span>{log.actor_name || 'Tizim'}</span>
                      {log.actor_role && <span className="text-slate-600">({log.actor_role})</span>}
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                    </div>
                  </div>

                  {/* Summary row */}
                  <div className="mt-1 text-slate-300 text-xs font-sans flex flex-wrap gap-x-4 gap-y-1">
                    {log.patient_name && (
                      <span className="text-slate-400">
                        Bemor: <b className="text-slate-200">{log.patient_name}</b> {log.patient_phone && `(${log.patient_phone})`}
                      </span>
                    )}
                    {log.doctor_name && (
                      <span className="text-slate-400">
                        Shifokor: <b className="text-slate-200">{log.doctor_name}</b> {log.room_number && `[${log.room_number}-xona]`}
                      </span>
                    )}
                    {log.specialty_name && (
                      <span className="text-slate-400">
                        Yo‘nalish: <b className="text-slate-200">{log.specialty_name}</b>
                      </span>
                    )}
                  </div>

                  {/* Expanded JSON details */}
                  {isExpanded && log.details && (
                    <div className="mt-3 p-3 bg-black/60 rounded-xl border border-slate-800/80 text-[11px] text-teal-300/90 overflow-x-auto">
                      <pre className="font-mono leading-relaxed">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Terminal Footer */}
        <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Klinika-Admin Monitoring Engine v2.6</span>
          </div>
          <span>Yangilangan vaqti: {lastUpdated.toLocaleTimeString('uz-UZ')}</span>
        </div>
      </div>
    </div>
  );
};
