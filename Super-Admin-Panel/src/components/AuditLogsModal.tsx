import React, { useState, useEffect } from 'react';
import { X, Shield, Clock, User, Laptop } from 'lucide-react';
import { ApiClient } from '../api/client';

interface AuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogsModal: React.FC<AuditLogsModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-5 bg-gradient-to-r from-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-teal-400" />
            <div>
              <h2 className="text-lg font-bold">Xavfsizlik & Tizim Audit Loglari</h2>
              <p className="text-xs text-slate-300">Barcha administrator harakatlari, status va tarif o‘zgarishlari</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {logs.map(log => (
            <div key={log.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/60 transition flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-md text-[10px] font-bold">
                    {log.action}
                  </span>
                  <span className="text-xs font-bold text-slate-800">{log.userFullName}</span>
                  <span className="text-[10px] text-slate-400">({log.userRole})</span>
                </div>
                <div className="text-xs text-slate-600">
                  Entity: <span className="font-mono text-slate-800">{log.entityType} ({log.entityId})</span>
                </div>
                {log.oldValues && log.newValues && (
                  <div className="text-[11px] text-slate-500 font-mono bg-white p-2 rounded-lg border border-slate-200 mt-1">
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
    </div>
  );
};
