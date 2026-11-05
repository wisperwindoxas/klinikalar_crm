import React, { useState, useEffect } from 'react';
import { 
  Layers, Check, Sliders, Shield, RefreshCw, AlertCircle, 
  DollarSign, Sparkles, Plus, Trash2, Edit3, X, CheckCircle2,
  Calendar, Eye, EyeOff
} from 'lucide-react';
import { ApiClient } from '../api/client';

export const PlansPage: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit/Create form
  const [form, setForm] = useState({
    code: '',
    name: '',
    price: 0,
    billing_cycle: 'MONTHLY',
    features: '',
    trial_days: 14,
    is_active: true
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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
      setError(e.message || 'Tariflarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setIsCreating(true);
    setEditingPlan(null);
    setForm({
      code: '',
      name: '',
      price: 500000,
      billing_cycle: 'MONTHLY',
      features: 'Elektron Navbat Tizimi\nShifokor Kabinetlari (Cheksiz)\nKassa va Hisobotlar\nSMS Xabarnomalar',
      trial_days: 14,
      is_active: true
    });
  };

  const openEditModal = (plan: any) => {
    setIsCreating(false);
    setEditingPlan(plan);
    const feats = Array.isArray(plan.features) ? plan.features.join('\n') : '';
    setForm({
      code: plan.code,
      name: plan.name,
      price: Number(plan.price || 0),
      billing_cycle: plan.billing_cycle || 'MONTHLY',
      features: feats,
      trial_days: plan.trial_days || 14,
      is_active: plan.is_active !== false
    });
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      const featArray = form.features
        .split('\n')
        .map(f => f.trim())
        .filter(Boolean);

      if (isCreating) {
        if (!form.code.trim()) {
          alert('Tarif kodi (masalan, PREMIUM) majburiy!');
          return;
        }
        const res = await ApiClient.createPlan({
          code: form.code.trim().toUpperCase(),
          name: form.name.trim(),
          price: form.price,
          billing_cycle: form.billing_cycle,
          features: featArray,
          trial_days: form.trial_days
        });
        showToast(res.message || 'Yangi tarif muvaffaqiyatli yaratildi');
        setIsCreating(false);
      } else if (editingPlan) {
        const res = await ApiClient.updatePlan(editingPlan.code, {
          name: form.name.trim(),
          price: form.price,
          billing_cycle: form.billing_cycle,
          features: featArray,
          is_active: form.is_active
        });
        showToast(res.message || 'Tarif muvaffaqiyatli yangilandi');
        setEditingPlan(null);
      }

      await loadPlans();
    } catch (e: any) {
      alert(e.message || 'Tarifni saqlashda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (plan: any) => {
    const confirmDelete = window.confirm(
      `Haqiqatan ham "${plan.name}" (${plan.code}) tarifini o'chirmoqchimisiz?\n\nAgar biror klinika bu tarifdan foydalanayotgan bo'lsa, xavfsizlik uchun tarif nofaol (arxiv) holatiga o'tkaziladi.`
    );
    if (!confirmDelete) return;

    try {
      setDeletingCode(plan.code);
      const res = await ApiClient.deletePlan(plan.code);
      showToast(res.message || 'Tarif o\'chirildi');
      await loadPlans();
    } catch (e: any) {
      alert(e.message || 'Tarifni o\'chirishda xatolik');
    } finally {
      setDeletingCode(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">SaaS Tariflari & Limitlari</h1>
            <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 font-extrabold text-xs rounded-full border border-teal-200">
              PostgreSQL Baza
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Platformaning barcha obuna rejalari, narx siyosati, imkoniyatlar va limitlar boshqaruvi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-teal-600/30 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Yangi Tarif Qo‘shish</span>
          </button>

          <button
            onClick={loadPlans}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-sm"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3 bg-white rounded-2xl border border-slate-200/80">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
          <span className="text-xs font-bold text-slate-600">Tariflar bazadan yuklanmoqda...</span>
        </div>
      ) : plans.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 p-8">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Tariflar topilmadi</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">Hozirda tizimda birorta ham tarif mavjud emas.</p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl"
          >
            Birinchi tarifni qo‘shish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isHighlighted = p.code === 'STANDARD';
            const isActive = p.is_active !== false;
            const features = Array.isArray(p.features) ? p.features : [];

            return (
              <div
                key={p.code}
                className={`p-6 rounded-3xl bg-white border flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-md relative overflow-hidden ${
                  !isActive 
                    ? 'opacity-70 bg-slate-50/80 border-dashed border-slate-300' 
                    : isHighlighted 
                      ? 'border-2 border-teal-600 ring-4 ring-teal-500/10' 
                      : 'border-slate-200/90'
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-teal-700 tracking-wider font-mono uppercase bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200/50">
                        {p.code}
                      </span>
                      {!isActive && (
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-md text-[10px] font-bold">
                          Arxiv / Nofaol
                        </span>
                      )}
                    </div>

                    {isHighlighted && isActive && (
                      <span className="px-2.5 py-0.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-full text-[10px] font-extrabold flex items-center gap-1 shadow-xs">
                        <Sparkles className="w-3 h-3" />
                        Ommabop
                      </span>
                    )}
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-lg font-black text-slate-900 mt-3">{p.name}</h3>

                  {/* Pricing */}
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {Number(p.price || 0).toLocaleString('uz-UZ')}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">so‘m / {p.billing_cycle === 'MONTHLY' ? 'oy' : 'yil'}</span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-medium mt-1">
                    Yillik to‘lov: {(Number(p.price || 0) * 10).toLocaleString('uz-UZ')} so‘m (2 oy chegirma)
                  </div>

                  {/* Features list */}
                  <div className="mt-6 pt-5 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                      Tarif imkoniyatlari ({features.length}):
                    </p>
                    <ul className="space-y-2.5 text-xs text-slate-700">
                      {features.length > 0 ? (
                        features.map((f: string, i: number) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span className="font-semibold leading-relaxed">{f}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-slate-400 italic text-[11px]">Qo‘shimcha imkoniyatlar kiritilmagan</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Actions: Edit & Delete */}
                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(p)}
                    className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200/80 hover:border-teal-300"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Tahrirlash</span>
                  </button>

                  <button
                    onClick={() => handleDeletePlan(p)}
                    disabled={deletingCode === p.code}
                    className="p-2.5 rounded-xl text-xs font-bold transition bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 disabled:opacity-50"
                    title="Tarifni o'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit or Create Plan Modal */}
      {(editingPlan || isCreating) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] text-teal-700 font-mono font-black uppercase">
                  {isCreating ? 'YANGI TARIF' : editingPlan?.code}
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {isCreating ? 'Yangi SaaS Tarifini Yaratish' : 'Tarif Parametrlarini Tahrirlash'}
                </h3>
              </div>
              <button 
                onClick={() => { setEditingPlan(null); setIsCreating(false); }} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              {isCreating && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tarif kodi (Unique ID) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ENTERPRISE_VIP"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Lotin harflarida, masalan: STARTER, PRO, VIP</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tarif nomi *</label>
                <input
                  type="text"
                  required
                  placeholder="Professional Plan"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Narx (so‘m) *</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">To‘lov davri</label>
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

              {!isCreating && (
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <span className="text-xs font-bold text-slate-800">Tarif holati</span>
                    <p className="text-[11px] text-slate-500">Nofaol qilinsa, yangi klinikalar bu tarifni tanlay olmaydi</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Xususiyatlar va imkoniyatlar (Har biri yangi qatorda)
                </label>
                <textarea
                  rows={6}
                  value={form.features}
                  placeholder="Elektron navbat tizimi&#10;Kassir qabulxonasi&#10;SMS xabarnomalar"
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => { setEditingPlan(null); setIsCreating(false); }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-teal-600/20 flex items-center gap-2 disabled:opacity-60"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  <span>{isCreating ? 'Tarifni Yaratish' : 'O‘zgarishlarni Saqlash'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
