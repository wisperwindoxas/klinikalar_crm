import React, { useState, useEffect } from 'react';
import {
  CreditCard, Search, RefreshCw, Calendar, CheckCircle2, AlertTriangle,
  Clock, ShieldAlert, Sparkles, ArrowUpRight, Zap, Check, X, ChevronRight,
  Filter, MoreHorizontal, Layers, Building2
} from 'lucide-react';
import { ApiClient } from '../api/client';

export const SubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [extendModalSub, setExtendModalSub] = useState<any | null>(null);
  const [extendMonths, setExtendMonths] = useState(1);
  const [changePlanSub, setChangePlanSub] = useState<any | null>(null);
  const [selectedPlanCode, setSelectedPlanCode] = useState('STANDARD');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [subRes, planRes] = await Promise.all([
        ApiClient.getSubscriptions().catch(() => ({ data: [] })),
        ApiClient.getPlans().catch(() => ({ data: [] }))
      ]);
      if (subRes.data) setSubscriptions(subRes.data);
      if (planRes.data) setPlans(planRes.data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExtend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendModalSub) return;
    try {
      const res = await ApiClient.extendSubscription(extendModalSub.id, extendMonths);
      showToast(res.message || 'Obuna muvaffaqiyatli uzaytirildi');
      setExtendModalSub(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Xatolik yuz berdi');
    }
  };

  const handleChangePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changePlanSub) return;
    try {
      const res = await ApiClient.changeSubscriptionPlan(changePlanSub.id, selectedPlanCode);
      showToast(res.message || 'Tarif muvaffaqiyatli o‘zgartirildi');
      setChangePlanSub(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Xatolik yuz berdi');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await ApiClient.updateSubscriptionStatus(id, status);
      showToast(res.message || `Holat yangilandi: ${status}`);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Xatolik yuz berdi');
    }
  };

  // Metrics
  const totalCount = subscriptions.length;
  const activeCount = subscriptions.filter(s => s.status === 'ACTIVE').length;
  const trialCount = subscriptions.filter(s => s.status === 'TRIAL').length;
  const expiredCount = subscriptions.filter(s => s.status === 'EXPIRED' || s.days_remaining <= 0).length;

  const filtered = subscriptions.filter(s => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.clinic_name?.toLowerCase().includes(q) ||
      s.plan_code?.toLowerCase().includes(q) ||
      s.clinic_id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-800">Obunalar Boshqaruvi</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
              Real Tizim
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Barcha ro‘yxatdan o‘tgan klinikalarning faol obunalari, tarif rejalari va qolgan muddatlari nazorati
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition cursor-pointer self-start sm:self-auto flex items-center gap-2 text-xs font-bold shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-800' : ''}`} />
          <span>Yangilash</span>
        </button>
      </div>

      {/* 4 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Jami Obunalar</div>
            <div className="text-xl font-black text-slate-800">{totalCount} <span className="text-xs font-medium text-slate-400">ta</span></div>
            <span className="text-[11px] text-blue-600 font-bold">Platformadagi klinikalar</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Faol Obunalar</div>
            <div className="text-xl font-black text-emerald-700">{activeCount} <span className="text-xs font-medium text-emerald-400">ta</span></div>
            <span className="text-[11px] text-emerald-600 font-bold">To‘liq foydalanmoqda</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Sinov Muddati (Trial)</div>
            <div className="text-xl font-black text-amber-700">{trialCount} <span className="text-xs font-medium text-amber-400">ta</span></div>
            <span className="text-[11px] text-amber-600 font-bold">14 kunlik bepul sinov</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Muddati O'tgan</div>
            <div className="text-xl font-black text-rose-700">{expiredCount} <span className="text-xs font-medium text-rose-400">ta</span></div>
            <span className="text-[11px] text-rose-600 font-bold">To‘lov talab qilinadi</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Klinika nomi yoki tarif bo‘yicha qidirish..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-700 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Barchasi ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'ACTIVE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              Faol ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('TRIAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'TRIAL'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
              }`}
            >
              Sinov ({trialCount})
            </button>
            <button
              onClick={() => setStatusFilter('EXPIRED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'EXPIRED'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
              }`}
            >
              Muddati o‘tgan ({expiredCount})
            </button>
          </div>
        </div>

        {/* SUBSCRIPTIONS TABLE */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Klinika Nomi & ID</th>
                <th className="py-3.5 px-4">Joriy Tarif</th>
                <th className="py-3.5 px-4">Amal Qilish Muddati</th>
                <th className="py-3.5 px-4">Qolgan Vaqt</th>
                <th className="py-3.5 px-4">Holati</th>
                <th className="py-3.5 px-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                    <span className="font-bold text-slate-600">Mos keluvchi obuna topilmadi</span>
                  </td>
                </tr>
              ) : (
                filtered.map(sub => {
                  const daysLeft = sub.days_remaining;
                  const isExp = daysLeft <= 0 || sub.status === 'EXPIRED';

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800 text-xs sm:text-sm">{sub.clinic_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{sub.clinic_id}</div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-wider ${
                            sub.plan_code === 'PREMIUM' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                            sub.plan_code === 'STANDARD' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                            'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {sub.plan_code}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {Number(sub.plan_price || 0).toLocaleString()} so'm/oy
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap font-mono text-slate-600 text-xs">
                        <div>{sub.start_date ? String(sub.start_date).split('T')[0] : '—'} dan</div>
                        <div className="font-bold text-slate-800">{sub.end_date ? String(sub.end_date).split('T')[0] : '—'} gacha</div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        {isExp ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Muddati tugagan</span>
                          </span>
                        ) : daysLeft <= 15 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            <span>{daysLeft} kun qoldi</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{daysLeft} kun qoldi</span>
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          sub.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                          sub.status === 'TRIAL' ? 'bg-amber-100 text-amber-800' :
                          sub.status === 'EXPIRED' ? 'bg-rose-100 text-rose-800' :
                          'bg-slate-200 text-slate-700'
                        }`}>
                          {sub.status === 'ACTIVE' ? 'FAOL' :
                           sub.status === 'TRIAL' ? 'SINOV (14 KUN)' :
                           sub.status === 'EXPIRED' ? 'MUDDATI O‘TGAN' : 'BLOKLANGAN'}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setExtendModalSub(sub);
                              setExtendMonths(1);
                            }}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                            title="Obunani uzaytirish"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Uzaytirish</span>
                          </button>

                          <button
                            onClick={() => {
                              setChangePlanSub(sub);
                              setSelectedPlanCode(sub.plan_code || 'STANDARD');
                            }}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                            title="Tarifni o‘zgartirish"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Tarif</span>
                          </button>

                          {sub.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleUpdateStatus(sub.id, 'BLOCKED')}
                              className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                              title="Klinikani bloklash"
                            >
                              Bloklash
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(sub.id, 'ACTIVE')}
                              className="px-2.5 py-1.5 text-emerald-600 hover:bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer"
                              title="Faollashtirish"
                            >
                              Faol qilish
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: EXTEND SUBSCRIPTION */}
      {extendModalSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black">Obunani Uzaytirish</h3>
                  <p className="text-xs text-teal-100">{extendModalSub.clinic_name}</p>
                </div>
              </div>
              <button onClick={() => setExtendModalSub(null)} className="p-1.5 hover:bg-white/15 rounded-xl text-white/80 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExtend} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Uzaytirish muddati:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 6, 12].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setExtendMonths(m)}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        extendMonths === m
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {m} oy
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span>Joriy tugash sanasi:</span>
                  <span className="font-bold text-slate-800">{extendModalSub.end_date?.split('T')[0]}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Yangi muddat:</span>
                  <span>+{extendMonths} oy qo‘shiladi</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExtendModalSub(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Tasdiqlash va Uzaytirish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE PLAN */}
      {changePlanSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black">Tarif Rejasini O'zgartirish</h3>
                  <p className="text-xs text-blue-100">{changePlanSub.clinic_name}</p>
                </div>
              </div>
              <button onClick={() => setChangePlanSub(null)} className="p-1.5 hover:bg-white/15 rounded-xl text-white/80 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePlan} className="p-6 space-y-4">
              <div className="space-y-2.5">
                {plans.map(p => (
                  <label
                    key={p.code}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition ${
                      selectedPlanCode === p.code
                        ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="plan"
                        checked={selectedPlanCode === p.code}
                        onChange={() => setSelectedPlanCode(p.code)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800">{p.name}</div>
                        <div className="text-[11px] text-slate-500">{p.max_doctors} tagacha shifokor • {p.max_branches} ta filial</div>
                      </div>
                    </div>
                    <span className="text-xs font-black text-blue-600">{Number(p.price).toLocaleString()} so'm</span>
                  </label>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setChangePlanSub(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Tarifni Yangilash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
