import React, { useState, useEffect } from 'react';
import { 
  DollarSign, CreditCard, Search, ArrowUpRight, RefreshCw, 
  AlertCircle, Receipt, Filter, Wallet, Smartphone, CheckCircle2
} from 'lucide-react';
import { ApiClient } from '../api/client';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [activePayment, setActivePayment] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.getPayments(150);
      if (res.data) {
        setPayments(res.data);
      }
    } catch (e: any) {
      setError(e.message || 'To‘lovlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchSearch =
      (p.receipt_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.patient_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.patient_phone || '').includes(search) ||
      (p.cashier_name || '').toLowerCase().includes(search.toLowerCase());
    const matchMethod = methodFilter === 'ALL' || p.method === methodFilter;
    return matchSearch && matchMethod;
  });

  const totalSum = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const cashSum = payments.filter(p => p.method === 'CASH').reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const cardSum = payments.filter(p => p.method === 'CARD').reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const onlineSum = payments.filter(p => p.method === 'ONLINE' || p.method === 'TRANSFER').reduce((acc, p) => acc + Number(p.amount || 0), 0);

  const getMethodBadge = (m: string) => {
    switch (m) {
      case 'CASH':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Naqd pul</span>;
      case 'CARD':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Plastik karta</span>;
      case 'ONLINE':
      case 'TRANSFER':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Online / Payme / Click</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">{m}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Kassa & Obuna To‘lovlari (Global)</h1>
            <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 font-bold text-xs rounded-full border border-teal-200">
              {payments.length} ta real tranzaksiya
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Klinika kassalari va obuna to‘lovlarining yagona real vaqt tranzaksiyalar reyestri
          </p>
        </div>

        <button
          onClick={loadPayments}
          disabled={loading}
          className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-sm self-start sm:self-auto"
          title="Yangilash"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Jami Tushum</span>
            <DollarSign className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-xl font-black text-slate-900">
            {totalSum.toLocaleString('uz-UZ')} so‘m
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">{payments.length} ta chek</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Naqd Pul</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900">
            {cashSum.toLocaleString('uz-UZ')} so‘m
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">
            {totalSum > 0 ? Math.round((cashSum / totalSum) * 100) : 0}% ulush
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Plastik Karta</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-slate-900">
            {cardSum.toLocaleString('uz-UZ')} so‘m
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">
            {totalSum > 0 ? Math.round((cardSum / totalSum) * 100) : 0}% ulush
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Online To‘lovlar</span>
            <Smartphone className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-black text-slate-900">
            {onlineSum.toLocaleString('uz-UZ')} so‘m
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">
            {totalSum > 0 ? Math.round((onlineSum / totalSum) * 100) : 0}% ulush
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Chek raqami, bemor yoki kassir..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Usul:</span>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-teal-600"
          >
            <option value="ALL">Barchasi</option>
            <option value="CASH">Naqd pul</option>
            <option value="CARD">Plastik karta</option>
            <option value="ONLINE">Online to‘lov</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
            <span className="text-xs font-medium">To‘lovlar yuklanmoqda...</span>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">To‘lovlar topilmadi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Chek / ID</th>
                  <th className="py-3 px-4">Bemor</th>
                  <th className="py-3 px-4">Summa</th>
                  <th className="py-3 px-4">To‘lov usuli</th>
                  <th className="py-3 px-4">Kassir</th>
                  <th className="py-3 px-4">Holat</th>
                  <th className="py-3 px-4 text-right">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredPayments.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setActivePayment(p)}
                    className="hover:bg-slate-50/70 transition cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-800">
                      {p.receipt_number || p.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{p.patient_name || 'Bemor'}</div>
                      <div className="text-[10px] text-slate-400">{p.patient_phone || ''}</div>
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      {Number(p.amount || 0).toLocaleString('uz-UZ')} so‘m
                    </td>
                    <td className="py-3.5 px-4">{getMethodBadge(p.method)}</td>
                    <td className="py-3.5 px-4 text-slate-600">{p.cashier_name}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> To‘landi
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500 font-mono text-[11px]">
                      {p.created_at ? new Date(p.created_at).toLocaleString('uz-UZ') : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Receipt Modal */}
      {activePayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-teal-800" />
                <h3 className="text-base font-black text-slate-900">Elektron Kassa Cheki</h3>
              </div>
              <button onClick={() => setActivePayment(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 font-mono text-xs bg-slate-50 p-4 rounded-xl">
              <div className="flex justify-between">
                <span className="text-slate-400">Chek raqami:</span>
                <span className="font-bold text-slate-900">{activePayment.receipt_number || activePayment.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bemor:</span>
                <span className="font-bold text-slate-900">{activePayment.patient_name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Telefon:</span>
                <span className="font-bold text-slate-900">{activePayment.patient_phone || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kassir:</span>
                <span className="font-bold text-slate-900">{activePayment.cashier_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Usul:</span>
                <span className="font-bold text-teal-800">{activePayment.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sana:</span>
                <span className="font-bold text-slate-900">
                  {activePayment.created_at ? new Date(activePayment.created_at).toLocaleString('uz-UZ') : ''}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm">
                <span className="font-black text-slate-900">JAMI SUMMA:</span>
                <span className="font-black text-teal-800">
                  {Number(activePayment.amount || 0).toLocaleString('uz-UZ')} so‘m
                </span>
              </div>
            </div>

            <button
              onClick={() => setActivePayment(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
            >
              Yopish
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
