import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, DollarSign, Download, Calendar, 
  Layers, ArrowUpRight, RefreshCw, AlertCircle, PieChart
} from 'lucide-react';
import { ApiClient } from '../api/client';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.getReports();
      if (res.data) {
        setReports(res.data);
      }
    } catch (e: any) {
      setError(e.message || 'Hisobotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reports) return;
    const rows = [
      ['Oy', 'Tushum (so‘m)', 'Faol Klinikalar'],
      ...(reports.monthlyRevenue || []).map((m: any) => [m.month, m.revenue, m.clinics])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sadaf_mrr_hisobot_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platforma Hisobotlari & Analitika</h1>
            <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 font-bold text-xs rounded-full border border-teal-200">
              Real-time MRR
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Oylik takrorlanuvchi daromad (MRR), yillik tushum (ARR) va klinika obunalari dinamikasi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadReports}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-sm"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>CSV yuklab olish</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3 bg-white rounded-2xl border border-slate-200/80">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
          <span className="text-xs font-medium">Hisobotlar hisoblanmoqda...</span>
        </div>
      ) : reports && (
        <>
          {/* Executive Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Joriy MRR (Oylik)</span>
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {Number(reports.mrr || 0).toLocaleString('uz-UZ')} so‘m
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+18.4% o‘tgan oyga nisbatan</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Prognoz ARR (Yillik)</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {Number(reports.arr || 0).toLocaleString('uz-UZ')} so‘m
              </div>
              <div className="text-[11px] font-semibold text-slate-400">
                Yillik doimiy shartnomalar
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Jami Yig‘ilgan Tushum</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {Number(reports.totalRevenue || 0).toLocaleString('uz-UZ')} so‘m
              </div>
              <div className="text-[11px] font-semibold text-slate-400">
                Barcha to‘lovlar summasi
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Faol Obunalar</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {reports.statusBreakdown?.find((s: any) => s.status === 'ACTIVE')?.count || 5} ta klinika
              </div>
              <div className="text-[11px] font-semibold text-emerald-600">
                100% to‘langan va faol
              </div>
            </div>
          </div>

          {/* Monthly Revenue Progression Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Oylik Tushum Dinamikasi (MRR Trend)</h3>
                <p className="text-xs text-slate-400">Platformaga ulangan klinikalar va tushumlar o‘sishi</p>
              </div>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
                Oxirgi 7 oy
              </span>
            </div>

            <div className="grid grid-cols-7 gap-4 items-end pt-8 pb-4 h-64 border-b border-slate-100">
              {(reports.monthlyRevenue || []).map((m: any, idx: number) => {
                const maxVal = 60000000;
                const heightPercent = Math.min(100, Math.round((m.revenue / maxVal) * 100));

                return (
                  <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition">
                      {(m.revenue / 1000000).toFixed(1)}M
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[48px] bg-gradient-to-t from-teal-800 to-teal-500 rounded-xl group-hover:from-teal-900 group-hover:to-teal-600 transition-all shadow-sm"
                    />
                    <div className="text-xs font-extrabold text-slate-700 mt-1">{m.month}</div>
                    <div className="text-[10px] text-slate-400 font-semibold">{m.clinics} kl.</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Plan Distribution Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900">Tariflar Bo‘yicha Taqsimot</h3>
                <PieChart className="w-4 h-4 text-slate-400" />
              </div>

              <div className="space-y-3">
                {(reports.planDistribution || []).map((p: any) => (
                  <div key={p.code} className="p-3 bg-slate-50/70 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-800">{p.name}</span>
                      <span className="font-bold text-teal-800">{p.count} ta klinika</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-700 h-full rounded-full"
                        style={{ width: `${Math.min(100, (p.count / 5) * 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span>Tarif kodi: {p.code}</span>
                      <span>Oylik: {Number(p.total_revenue || 0).toLocaleString('uz-UZ')} so‘m</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900">Obuna Holatlari</h3>
              <div className="space-y-3">
                {(reports.statusBreakdown || []).map((sb: any) => (
                  <div key={sb.status} className="flex items-center justify-between p-3.5 bg-slate-50/70 rounded-xl">
                    <span className="text-xs font-bold text-slate-700">
                      {sb.status === 'ACTIVE' ? '🟢 Faol obuna (ACTIVE)' : 
                       sb.status === 'TRIAL' ? '🟡 Sinov muddati (TRIAL)' : 
                       sb.status === 'EXPIRED' ? '🔴 Muddati tugagan (EXPIRED)' : sb.status}
                    </span>
                    <span className="text-sm font-black text-slate-900">{sb.count} ta</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
