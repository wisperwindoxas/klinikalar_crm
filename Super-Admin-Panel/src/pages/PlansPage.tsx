import React, { useState, useEffect } from 'react';
import { 
  Layers, Check, Sliders, Shield, RefreshCw, AlertCircle, 
  DollarSign, Sparkles
} from 'lucide-react';
import { ApiClient } from '../api/client';

export const PlansPage: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit form
  const [form, setForm] = useState({
    name: '',
    price: 0,
    billing_cycle: 'MONTHLY',
    features: ''
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.getPlans();
      if (res.data) {
        setPlans(res.data);
      }
    } catch (e: any) {
      setError(e.message || 'Tariflarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (plan: any) => {
    setEditingPlan(plan);
    const feats = Array.isArray(plan.features) ? plan.features.join('\n') : '';
    setForm({
      name: plan.name,
      price: Number(plan.price),
      billing_cycle: plan.billing_cycle || 'MONTHLY',
      features: feats
    });
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      setSaving(true);
      const featArray = form.features
        .split('\n')
        .map(f => f.trim())
        .filter(Boolean);

      const res = await ApiClient.updatePlan(editingPlan.code, {
        name: form.name,
        price: form.price,
        billing_cycle: form.billing_cycle,
        features: featArray
      });

      if (res.data) {
        setPlans(plans.map(p => p.code === editingPlan.code ? res.data : p));
        setEditingPlan(null);
      }
    } catch (e: any) {
      alert(e.message || 'Tarifni saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">SaaS Tariflari & Limitlari</h1>
            <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 font-bold text-xs rounded-full border border-teal-200">
              PostgreSQL Baza
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Platformaning barcha obuna rejalari, narx siyosati va texnik chegaralari
          </p>
        </div>

        <button
          onClick={loadPlans}
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

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3 bg-white rounded-2xl border border-slate-200/80">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
          <span className="text-xs font-medium">Tariflar yuklanmoqda...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isHighlighted = p.code === 'STANDARD';
            const features = Array.isArray(p.features) ? p.features : [];

            return (
              <div
                key={p.code}
                className={`p-6 rounded-2xl bg-white border flex flex-col justify-between transition shadow-sm hover:shadow-md ${
                  isHighlighted ? 'border-2 border-teal-700 ring-4 ring-teal-500/10' : 'border-slate-200/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-teal-800 tracking-wider font-mono uppercase">
                      {p.code}
                    </span>
                    {isHighlighted && (
                      <span className="px-2.5 py-0.5 bg-teal-800 text-white rounded-full text-[10px] font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Ommabop
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 mt-2">{p.name}</h3>

                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">
                      {Number(p.price || 0).toLocaleString('uz-UZ')}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">so‘m / {p.billing_cycle === 'MONTHLY' ? 'oy' : 'yil'}</span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-medium mt-1">
                    Yillik: {(Number(p.price || 0) * 10).toLocaleString('uz-UZ')} so‘m (2 oy bepul)
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
                    {features.map((f: string, i: number) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-teal-600 flex-shrink-0" />
                        <span className="font-medium">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => openEditModal(p)}
                  className={`w-full mt-8 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    isHighlighted
                      ? 'bg-teal-800 hover:bg-teal-900 text-white shadow-md shadow-teal-800/20'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Tarif va Limitlarni Tahrirlash</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] text-teal-800 font-mono font-black">{editingPlan.code}</span>
                <h3 className="text-base font-black text-slate-900">Tarifni Tahrirlash</h3>
              </div>
              <button onClick={() => setEditingPlan(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tarif nomi *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Oylik narx (so‘m) *</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Davriylik</label>
                  <select
                    value={form.billing_cycle}
                    onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                  >
                    <option value="MONTHLY">Oylik (Monthly)</option>
                    <option value="YEARLY">Yillik (Yearly)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Xususiyatlar va imkoniyatlar (Har biri yangi qatorda)
                </label>
                <textarea
                  rows={5}
                  value={form.features}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition shadow-md shadow-teal-800/20 flex items-center gap-2"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>O‘zgarishlarni saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
