import React, { useState, useEffect } from 'react';
import { X, Building2, Search, CheckCircle, AlertTriangle, ShieldAlert, RefreshCw } from 'lucide-react';
import { ApiClient } from '../api/client';

interface ClinicsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const ClinicsListModal: React.FC<ClinicsListModalProps> = ({ isOpen, onClose, onUpdate }) => {
  const [clinics, setClinics] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadClinics();
    }
  }, [isOpen]);

  const loadClinics = async () => {
    setLoading(true);
    try {
      const res = await ApiClient.getClinics();
      setClinics(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await ApiClient.updateClinicStatus(id, status);
      await loadClinics();
      onUpdate();
    } catch (e: any) {
      alert(e.message || 'Xatolik');
    }
  };

  const handlePlanChange = async (id: string, planCode: string) => {
    try {
      await ApiClient.updateClinicPlan(id, planCode);
      await loadClinics();
      onUpdate();
    } catch (e: any) {
      alert(e.message || 'Xatolik');
    }
  };

  if (!isOpen) return null;

  const filtered = clinics.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-5 bg-gradient-to-r from-teal-700 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-teal-200" />
            <div>
              <h2 className="text-lg font-bold">Barcha Klinikalar boshqaruvi</h2>
              <p className="text-xs text-teal-100">Multi-tenant klinikalar, tariflar va ruxsatlar nazorati</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Klinika nomi, kodi yoki telefon bo'yicha qidirish..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <button
            onClick={loadClinics}
            className="p-2 text-slate-600 hover:text-teal-700 hover:bg-white rounded-xl transition"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Klinika</th>
                <th className="py-2.5 px-3">Telefon</th>
                <th className="py-2.5 px-3">Filial / Shifokor</th>
                <th className="py-2.5 px-3">Tarif</th>
                <th className="py-2.5 px-3">Holat</th>
                <th className="py-2.5 px-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-800">{c.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{c.code}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{c.phone || '-'}</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                      {c.branchCount} filial, {c.doctorCount} shifokor
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <select
                      value={c.planCode}
                      onChange={e => handlePlanChange(c.id, e.target.value)}
                      className="text-[11px] font-bold py-1 px-2 rounded-lg border border-slate-200 bg-white text-teal-800 focus:outline-none"
                    >
                      <option value="STARTER">STARTER</option>
                      <option value="PRO">PRO</option>
                      <option value="BUSINESS">BUSINESS</option>
                      <option value="ENTERPRISE">ENTERPRISE</option>
                    </select>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : c.status === 'TRIAL'
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : c.status === 'EXPIRED'
                          ? 'bg-orange-50 text-orange-600 border border-orange-200'
                          : 'bg-red-50 text-red-600 border border-red-200'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right space-x-1">
                    {c.status !== 'ACTIVE' && (
                      <button
                        onClick={() => handleStatusChange(c.id, 'ACTIVE')}
                        className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[10px] font-bold transition"
                      >
                        Faollashtirish
                      </button>
                    )}
                    {c.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleStatusChange(c.id, 'SUSPENDED')}
                        className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-[10px] font-bold transition"
                      >
                        To‘xtatish
                      </button>
                    )}
                    {c.status !== 'BLOCKED' && (
                      <button
                        onClick={() => handleStatusChange(c.id, 'BLOCKED')}
                        className="px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-[10px] font-bold transition"
                      >
                        Bloklash
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
