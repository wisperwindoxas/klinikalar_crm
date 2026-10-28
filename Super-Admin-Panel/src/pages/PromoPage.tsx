import React, { useState, useEffect } from 'react';
import { 
  Gift, Plus, Search, Tag, Calendar, Users, 
  CheckCircle2, XCircle, RefreshCw, AlertCircle, Percent
} from 'lucide-react';
import { ApiClient } from '../api/client';

export const PromoPage: React.FC = () => {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: '',
    discountPercent: 15,
    validUntil: '2026-12-31',
    maxUsage: 100
  });

  useEffect(() => {
    loadPromos();
  }, []);

  const loadPromos = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.getPromoCodes();
      if (res.data) {
        setPromos(res.data);
      }
    } catch (e: any) {
      setError(e.message || 'Promo kodlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (promo: any) => {
    try {
      const nextStatus = !promo.is_active;
      await ApiClient.togglePromoCode(promo.id, nextStatus);
      setPromos(promos.map(p => p.id === promo.id ? { ...p, is_active: nextStatus } : p));
    } catch (e: any) {
      alert(e.message || 'Holatni o‘zgartirishda xatolik');
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) return;

    try {
      setSaving(true);
      const res = await ApiClient.createPromoCode(form);
      if (res.data) {
        setPromos([res.data, ...promos]);
        setShowAddModal(false);
        setForm({ code: '', discountPercent: 15, validUntil: '2026-12-31', maxUsage: 100 });
      }
    } catch (e: any) {
      alert(e.message || 'Promo kod yaratishda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const filteredPromos = promos.filter(p =>
    (p.code || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reklama & Promo Kodlar</h1>
            <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 font-bold text-xs rounded-full border border-teal-200">
              {promos.length} ta vaucher
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Yangi klinikalar uchun aksiya kuponlari, chegirmalar va marketing takliflari
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadPromos}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-sm"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition shadow-md shadow-teal-800/20"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi promo kod</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Kupon kodi bo‘yicha qidiruv..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
          />
        </div>
      </div>

      {/* Promo Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3 bg-white rounded-2xl border border-slate-200/80">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
          <span className="text-xs font-medium">Promo kodlar yuklanmoqda...</span>
        </div>
      ) : filteredPromos.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80">
          <Gift className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-600">Promo kodlar mavjud emas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredPromos.map((p) => (
            <div
              key={p.id}
              className={`p-5 rounded-2xl border flex flex-col justify-between transition shadow-sm ${
                p.is_active ? 'bg-white border-slate-200/80' : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 text-teal-800 rounded-lg text-xs font-black font-mono tracking-wider border border-teal-200">
                    <Tag className="w-3.5 h-3.5" />
                    <span>{p.code}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    p.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {p.is_active ? 'Faol' : 'To‘xtatilgan'}
                  </span>
                </div>

                <div className="pt-2">
                  <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1">
                    <span>{p.discount_percent}%</span>
                    <span className="text-xs text-slate-400 font-bold uppercase">chegirma</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span>Amal qilish:</span>
                    <strong className="text-slate-800">{p.valid_until ? new Date(p.valid_until).toLocaleDateString('uz-UZ') : 'Cheksiz'}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Ishlatildi:</span>
                    <strong className="text-slate-800">{p.used_count || 0} / {p.max_usage || 100}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleToggleStatus(p)}
                  className={`w-full py-1.5 rounded-xl text-xs font-bold transition ${
                    p.is_active
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {p.is_active ? 'Bekor qilish' : 'Qayta faollashtirish'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900">Yangi Promo Kod Yaratish</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreatePromo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Kupon kodi *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: NAVBAT2026"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Chegirma (%) *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={form.discountPercent}
                    onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Maksimal limit</label>
                  <input
                    type="number"
                    min="1"
                    value={form.maxUsage}
                    onChange={(e) => setForm({ ...form, maxUsage: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Amal qilish muddati *</label>
                <input
                  type="date"
                  required
                  value={form.validUntil}
                  onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition shadow-md shadow-teal-800/20 flex items-center gap-2"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Kuponni saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
