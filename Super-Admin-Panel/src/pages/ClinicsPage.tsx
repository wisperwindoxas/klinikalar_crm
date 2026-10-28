import React, { useState, useEffect } from 'react';
import { Building2, Search, Plus, RefreshCw, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { ApiClient } from '../api/client';
import { AddClinicModal } from '../components/AddClinicModal';

export const ClinicsPage: React.FC = () => {
  const [clinics, setClinics] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    loadClinics();
  }, []);

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
    } catch (e: any) {
      alert(e.message || 'Xatolik');
    }
  };

  const handlePlanChange = async (id: string, planCode: string) => {
    try {
      await ApiClient.updateClinicPlan(id, planCode);
      await loadClinics();
    } catch (e: any) {
      alert(e.message || 'Xatolik');
    }
  };

  const filtered = clinics.filter(c => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Klinikalar boshqaruvi</h1>
          <p className="text-xs text-slate-500 mt-0.5">Platformadagi barcha tenant klinikalar, filiallar va tariflar nazorati</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-800/20 flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi klinika qo‘shish</span>
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Klinika nomi, kodi yoki telefon bo‘yicha qidirish..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <div className="flex items-center gap-2">
            {['ALL', 'ACTIVE', 'TRIAL', 'EXPIRED', 'BLOCKED'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  statusFilter === st
                    ? 'bg-teal-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {st === 'ALL' ? 'Barchasi' : st}
              </button>
            ))}
            <button
              onClick={loadClinics}
              className="p-2 text-slate-500 hover:text-teal-800 hover:bg-slate-100 rounded-xl transition"
              title="Yangilash"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Clinics Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400">
                <th className="pb-3">Klinika nomi</th>
                <th className="pb-3">Kodi</th>
                <th className="pb-3">Telefon</th>
                <th className="pb-3">Filial / Shifokor</th>
                <th className="pb-3">Tarif</th>
                <th className="pb-3">Holat</th>
                <th className="pb-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 font-bold text-slate-800 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center font-bold text-xs">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <div>{c.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{c.address || 'Toshkent sh.'}</div>
                    </div>
                  </td>
                  <td className="py-3.5 font-mono text-slate-500 font-bold">{c.code}</td>
                  <td className="py-3.5 text-slate-600">{c.phone || '-'}</td>
                  <td className="py-3.5 text-slate-700 font-semibold">
                    {c.branchCount} filial, {c.doctorCount} shifokor
                  </td>
                  <td className="py-3.5">
                    <select
                      value={c.planCode}
                      onChange={e => handlePlanChange(c.id, e.target.value)}
                      className="text-xs font-bold py-1 px-2.5 rounded-lg border border-slate-200 bg-white text-teal-800 focus:outline-none"
                    >
                      <option value="STARTER">STARTER</option>
                      <option value="PRO">PRO</option>
                      <option value="BUSINESS">BUSINESS</option>
                      <option value="ENTERPRISE">ENTERPRISE</option>
                    </select>
                  </td>
                  <td className="py-3.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      c.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : c.status === 'TRIAL'
                        ? 'bg-cyan-50 text-cyan-600 border border-cyan-200'
                        : c.status === 'EXPIRED'
                        ? 'bg-orange-50 text-orange-600 border border-orange-200'
                        : 'bg-red-50 text-red-600 border border-red-200'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-right space-x-1.5">
                    {c.status !== 'ACTIVE' && (
                      <button
                        onClick={() => handleStatusChange(c.id, 'ACTIVE')}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition"
                      >
                        Faollashtirish
                      </button>
                    )}
                    {c.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleStatusChange(c.id, 'SUSPENDED')}
                        className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-bold transition"
                      >
                        To‘xtatish
                      </button>
                    )}
                    {c.status !== 'BLOCKED' && (
                      <button
                        onClick={() => handleStatusChange(c.id, 'BLOCKED')}
                        className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-bold transition"
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

      <AddClinicModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => loadClinics()}
      />
    </div>
  );
};
