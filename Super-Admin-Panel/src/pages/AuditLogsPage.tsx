import React, { useState, useEffect } from 'react';
import { Shield, Clock, Laptop, RefreshCw } from 'lucide-react';
import { ApiClient } from '../api/client';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await ApiClient.getAuditLogs();
      setLogs(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Xavfsizlik & Audit Loglari</h1>
          <p className="text-xs text-slate-500 mt-0.5">Platformadagi barcha muhim ma‘muriy amallar, statuslar va ruxsat o‘zgarishlari</p>
        </div>
        <button
          onClick={loadLogs}
          className="p-2 text-slate-500 hover:text-teal-800 hover:bg-slate-100 rounded-xl transition"
          title="Yangilash"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-3">
        {logs.map(log => (
          <div key={log.id} className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-md text-[10px] font-bold">
                  {log.action}
                </span>
                <span className="text-xs font-bold text-slate-800">{log.userFullName}</span>
                <span className="text-[10px] text-slate-400">({log.userRole})</span>
              </div>
              <div className="text-xs text-slate-600">
                Entity: <span className="font-mono text-slate-800">{log.entityType} ({log.entityId})</span>
              </div>
              {log.oldValues && log.newValues && (
                <div className="text-[11px] text-slate-600 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-1.5">
                  Old: {JSON.stringify(log.oldValues)} ➔ New: {JSON.stringify(log.newValues)}
                </div>
              )}
            </div>
            <div className="text-right text-[10px] text-slate-400 space-y-0.5 whitespace-nowrap">
              <div className="flex items-center justify-end gap-1">
                <Clock className="w-3 h-3" />
                {log.createdAt.replace('T', ' ').substring(0, 19)}
              </div>
              <div className="flex items-center justify-end gap-1">
                <Laptop className="w-3 h-3" />
                IP: {log.ipAddress}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
