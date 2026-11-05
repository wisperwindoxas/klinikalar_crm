import React, { useState, useEffect } from 'react';
import {
  CreditCard, Search, RefreshCw, Calendar, CheckCircle2, AlertTriangle,
  Clock, ShieldAlert, Sparkles, ArrowUpRight, Zap, Check, X, ChevronRight,
  Filter, MoreHorizontal, Layers, Building2, MessageSquare, Shield, Pause, Play,
  Plus, Edit3, Trash2, ArrowRight, DollarSign
} from 'lucide-react';
import { ApiClient } from '../api/client';

export const SubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');

  // Add / Create Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    clinicId: '',
    clinicName: '',
    planCode: 'STANDARD',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'ACTIVE',
    pricePaid: 800000,
    smsBalance: 1000
  });

  // Edit Dates & Plan Modal
  const [editModalSub, setEditModalSub] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    clinicName: '',
    planCode: 'STANDARD',
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
    pricePaid: 0,
    smsBalance: 0
  });

  // SMS Modal
  const [smsModalSub, setSmsModalSub] = useState<any | null>(null);
  const [smsBalanceInput, setSmsBalanceInput] = useState<number>(1000);
  const [smsEnabledInput, setSmsEnabledInput] = useState<boolean>(true);

  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [subRes, planRes, clinicRes] = await Promise.all([
        ApiClient.getSubscriptions().catch(() => ({ data: [] })),
        ApiClient.getPlans().catch(() => ({ data: [] })),
        ApiClient.getClinics().catch(() => ({ data: [] }))
      ]);
      if (subRes.data) setSubscriptions(subRes.data);
      if (planRes.data) setPlans(planRes.data);
      if (clinicRes.data) setClinics(clinicRes.data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open Edit Dates Modal
  const openEditModal = (sub: any) => {
    setEditModalSub(sub);
    const start = sub.start_date ? String(sub.start_date).split('T')[0] : new Date().toISOString().split('T')[0];
    const end = sub.end_date ? String(sub.end_date).split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setEditForm({
      clinicName: sub.clinic_name || '',
      planCode: sub.plan_code || 'STANDARD',
      startDate: start,
      endDate: end,
      status: sub.status || 'ACTIVE',
      pricePaid: Number(sub.price_paid || 0),
      smsBalance: Number(sub.sms_balance || 0)
    });
  };

  // Quick Preset Helper for Dates
  const applyDatePreset = (months: number, isTrial: boolean = false) => {
    const baseDate = editForm.startDate ? new Date(editForm.startDate) : new Date();
    const newEnd = new Date(baseDate);
    if (isTrial) {
      newEnd.setDate(newEnd.getDate() + 14);
    } else {
      newEnd.setMonth(newEnd.getMonth() + months);
    }
    setEditForm(prev => ({
      ...prev,
      endDate: newEnd.toISOString().split('T')[0]
    }));
  };

  const applyAddDatePreset = (months: number, isTrial: boolean = false) => {
    const baseDate = addForm.startDate ? new Date(addForm.startDate) : new Date();
    const newEnd = new Date(baseDate);
    if (isTrial) {
      newEnd.setDate(newEnd.getDate() + 14);
    } else {
      newEnd.setMonth(newEnd.getMonth() + months);
    }
    setAddForm(prev => ({
      ...prev,
      endDate: newEnd.toISOString().split('T')[0]
    }));
  };

  // Handle Save Subscription Dates & Details
  const handleSaveEditDates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalSub) return;

    if (!editForm.startDate || !editForm.endDate) {
      alert('Iltimos, boshlanish va tugash sanalarini to‘liq tanlang!');
      return;
    }

    try {
      setSaving(true);
      const res = await ApiClient.updateSubscriptionDates(editModalSub.id, {
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        status: editForm.status,
        planCode: editForm.planCode,
        pricePaid: editForm.pricePaid,
        smsBalance: editForm.smsBalance,
        clinicName: editForm.clinicName
      });
      showToast(res.message || 'Obuna sanalari muvaffaqiyatli saqlandi');
      setEditModalSub(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  // Handle Create / Add Subscription
  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.clinicId || !addForm.startDate || !addForm.endDate) {
      alert('Klinika, boshlanish va tugash sanalarini kiritish majburiy!');
      return;
    }

    try {
      setSaving(true);
      const res = await ApiClient.createSubscription({
        clinicId: addForm.clinicId,
        clinicName: addForm.clinicName || 'Klinika',
        planCode: addForm.planCode,
        startDate: addForm.startDate,
        endDate: addForm.endDate,
        status: addForm.status,
        pricePaid: addForm.pricePaid,
        smsBalance: addForm.smsBalance
      });
      showToast(res.message || 'Yangi obuna muvaffaqiyatli biriktirildi');
      setIsAddModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Obuna yaratishda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  // Quick Status Toggle
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await ApiClient.updateSubscriptionStatus(id, newStatus);
      showToast(res.message || `Holat yangilandi: ${newStatus}`);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Xatolik yuz berdi');
    }
  };

  // Delete Subscription
  const handleDeleteSubscription = async (sub: any) => {
    const confirmDel = window.confirm(`Haqiqatan ham "${sub.clinic_name}" klinikasining obunasini o‘chirmoqchimisiz?`);
    if (!confirmDel) return;

    try {
      const res = await ApiClient.deleteSubscription(sub.id);
      showToast(res.message || 'Obuna o‘chirildi');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    }
  };

  // Quick SMS Save
  const handleSaveSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsModalSub) return;
    try {
      const res = await ApiClient.updateSubscriptionSms(smsModalSub.id, smsBalanceInput, smsEnabledInput);
      showToast(res.message || 'SMS balansi muvaffaqiyatli yangilandi');
      setSmsModalSub(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Xatolik yuz berdi');
    }
  };

  // Filter subscriptions
  const filtered = subscriptions.filter(sub => {
    const matchesSearch = 
      (sub.clinic_name && sub.clinic_name.toLowerCase().includes(search.toLowerCase())) ||
      (sub.clinic_id && sub.clinic_id.toLowerCase().includes(search.toLowerCase())) ||
      (sub.plan_code && sub.plan_code.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || sub.status === statusFilter;
    const matchesPlan = planFilter === 'ALL' || sub.plan_code === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Calculate Metrics
  const totalCount = subscriptions.length;
  const activeCount = subscriptions.filter(s => s.status === 'ACTIVE').length;
  const trialCount = subscriptions.filter(s => s.status === 'TRIAL').length;
  const expiredCount = subscriptions.filter(s => s.status === 'EXPIRED' || s.status === 'SUSPENDED').length;
  const totalRevenue = subscriptions.reduce((acc, curr) => acc + Number(curr.price_paid || 0), 0);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Klinikalar Obunalari Boshqaruvi</h1>
            <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 font-extrabold text-xs rounded-full border border-teal-200">
              SaaS Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Har bir klinikaga obuna berish, muddatlarni (kerakli kundan kerakli sanagacha) qo‘lda sozlash va nazorat qilish
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (clinics.length > 0) {
                setAddForm(prev => ({
                  ...prev,
                  clinicId: clinics[0].id,
                  clinicName: clinics[0].name
                }));
              }
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-teal-600/30 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Yangi Obuna Biriktirish</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-sm"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Jami Obunalar</span>
            <Building2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{totalCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Barcha klinikalar</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Faol (Active)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">{activeCount}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">To‘liq xizmatda</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Sinov (Trial)</span>
            <Sparkles className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-cyan-600">{trialCount}</div>
          <div className="text-[10px] text-cyan-600 font-semibold mt-1">14 kunlik bepul</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">To‘xtatilgan</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600">{expiredCount}</div>
          <div className="text-[10px] text-rose-600 font-semibold mt-1">Muddati o‘tgan / Blok</div>
        </div>

        <div className="p-4 bg-gradient-to-tr from-teal-900 to-slate-900 text-white rounded-2xl shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-teal-300">
            <span className="text-[11px] font-bold uppercase tracking-wider">Jami Tushum</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="mt-2 text-xl font-black tracking-tight text-white">
            {totalRevenue.toLocaleString('uz-UZ')} <span className="text-xs font-normal text-teal-200">so‘m</span>
          </div>
          <div className="text-[10px] text-teal-200/70 mt-1">To‘langan obunalar</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Klinika nomi, ID yoki tarif qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
            {['ALL', 'ACTIVE', 'TRIAL', 'SUSPENDED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === st
                    ? 'bg-white text-teal-800 shadow-xs font-black'
                    : 'hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'Hammasi' : st === 'ACTIVE' ? 'Faol' : st === 'TRIAL' ? 'Sinov' : 'To‘xtatilgan'}
              </button>
            ))}
          </div>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="ALL">Barcha Tariflar</option>
            {plans.map((p) => (
              <option key={p.code} value={p.code}>{p.name} ({p.code})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Subscriptions List */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3 bg-white rounded-2xl border border-slate-200/80">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
          <span className="text-xs font-bold text-slate-600">Obunalar ma’lumotlari yuklanmoqda...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 p-8">
          <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Obunalar topilmadi</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">Qidiruv mezonlariga mos keladigan obunalar mavjud emas.</p>
          <button
            onClick={() => { setSearch(''); setStatusFilter('ALL'); setPlanFilter('ALL'); }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
          >
            Filtrni tozalash
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((sub) => {
            const isActive = sub.status === 'ACTIVE';
            const isTrial = sub.status === 'TRIAL';
            const isSuspended = sub.status === 'SUSPENDED';
            const isExpired = sub.status === 'EXPIRED';
            const daysLeft = Number(sub.days_remaining ?? 0);

            const startDateFormatted = sub.start_date ? String(sub.start_date).split('T')[0] : '—';
            const endDateFormatted = sub.end_date ? String(sub.end_date).split('T')[0] : '—';

            return (
              <div
                key={sub.id}
                className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                {/* Left: Clinic & Plan info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-sm flex-shrink-0 ${
                    isActive ? 'bg-gradient-to-tr from-teal-600 to-emerald-500 shadow-teal-500/20' :
                    isTrial ? 'bg-gradient-to-tr from-cyan-600 to-blue-500 shadow-cyan-500/20' :
                    'bg-slate-400'
                  }`}>
                    <Building2 className="w-6 h-6 stroke-[2.2]" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-slate-900 tracking-tight">{sub.clinic_name}</h3>
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        {sub.clinic_id}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {/* Plan Tag */}
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-teal-50 text-teal-800 border border-teal-200/60 font-mono">
                        {sub.plan_code}
                      </span>

                      {/* Status Tag */}
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                        isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        isTrial ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                        isSuspended ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {isTrial && <Sparkles className="w-3.5 h-3.5 text-cyan-600" />}
                        {isSuspended && <Pause className="w-3.5 h-3.5 text-amber-600" />}
                        {isExpired && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                        <span>{sub.status}</span>
                      </span>

                      {/* SMS Balance */}
                      <button
                        onClick={() => {
                          setSmsModalSub(sub);
                          setSmsBalanceInput(Number(sub.sms_balance || 0));
                          setSmsEnabledInput(sub.sms_enabled !== false);
                        }}
                        className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 flex items-center gap-1 transition"
                        title="SMS balansini tahrirlash"
                      >
                        <MessageSquare className="w-3 h-3 text-teal-600" />
                        <span>SMS: <b>{sub.sms_balance ?? 0}</b> ta</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Middle: Exact Dates Display */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Boshlanish</span>
                    <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{startDateFormatted}</span>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-300 hidden sm:block flex-shrink-0" />

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tugash sanasi</span>
                    <div className="text-xs font-black text-slate-900 flex items-center gap-1.5 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      <span>{endDateFormatted}</span>
                    </div>
                  </div>

                  <div className="sm:border-l sm:border-slate-200 sm:pl-3 space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Qolgan vaqt</span>
                    <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md inline-block ${
                      daysLeft > 15 ? 'bg-emerald-100 text-emerald-800' :
                      daysLeft > 0 ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {daysLeft > 0 ? `${daysLeft} kun qoldi` : 'Muddati tugagan'}
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end lg:self-auto">
                  {/* Edit exact dates and plan */}
                  <button
                    onClick={() => openEditModal(sub)}
                    className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-sm shadow-teal-600/20 flex items-center gap-2"
                    title="Obuna sanalari va muddatini sozlash"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Muddatni Sozlash</span>
                  </button>

                  {/* Toggle Status */}
                  {sub.status === 'ACTIVE' ? (
                    <button
                      onClick={() => handleUpdateStatus(sub.id, 'SUSPENDED')}
                      className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition"
                      title="Obunani vaqtincha to‘xtatish"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(sub.id, 'ACTIVE')}
                      className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                      title="Obunani faollashtirish"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteSubscription(sub)}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-700 border border-slate-200 hover:border-rose-200 transition"
                    title="Obunani o‘chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ADD / CREATE SUBSCRIPTION */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider">YANGI BIRIKTIRISH</span>
                <h3 className="text-lg font-black text-slate-900">Klinikaga Obuna Qo‘shish</h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubscription} className="space-y-4">
              {/* Select Clinic */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Klinikani tanlang *</label>
                {clinics.length > 0 ? (
                  <select
                    value={addForm.clinicId}
                    onChange={(e) => {
                      const selected = clinics.find(c => c.id === e.target.value);
                      setAddForm({
                        ...addForm,
                        clinicId: e.target.value,
                        clinicName: selected ? selected.name : ''
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                  >
                    {clinics.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="tenant_bed45628"
                    value={addForm.clinicId}
                    onChange={(e) => setAddForm({ ...addForm, clinicId: e.target.value, clinicName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                  />
                )}
              </div>

              {/* Plan & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tarif rejasi *</label>
                  <select
                    value={addForm.planCode}
                    onChange={(e) => {
                      const p = plans.find(plan => plan.code === e.target.value);
                      setAddForm({
                        ...addForm,
                        planCode: e.target.value,
                        pricePaid: p ? Number(p.price || 0) : addForm.pricePaid
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                  >
                    {plans.map(p => (
                      <option key={p.code} value={p.code}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Boshlang‘ich holat</label>
                  <select
                    value={addForm.status}
                    onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                  >
                    <option value="ACTIVE">FAOL (ACTIVE)</option>
                    <option value="TRIAL">SINOV (TRIAL 14 kun)</option>
                    <option value="SUSPENDED">TO‘XTATILGAN (SUSPENDED)</option>
                  </select>
                </div>
              </div>

              {/* Exact Dates */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    <span>Obuna Davri (Sanalarni tanlang)</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => applyAddDatePreset(1)}
                      className="px-2 py-1 bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 text-[10px] font-bold rounded-md border border-slate-200"
                    >
                      +1 oy
                    </button>
                    <button
                      type="button"
                      onClick={() => applyAddDatePreset(6)}
                      className="px-2 py-1 bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 text-[10px] font-bold rounded-md border border-slate-200"
                    >
                      +6 oy
                    </button>
                    <button
                      type="button"
                      onClick={() => applyAddDatePreset(12)}
                      className="px-2 py-1 bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 text-[10px] font-bold rounded-md border border-slate-200"
                    >
                      +1 yil
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Boshlanish sanasi (Start Date) *
                    </label>
                    <input
                      type="date"
                      required
                      value={addForm.startDate}
                      onChange={(e) => setAddForm({ ...addForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Tugash sanasi (End Date) *
                    </label>
                    <input
                      type="date"
                      required
                      value={addForm.endDate}
                      onChange={(e) => setAddForm({ ...addForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Price & SMS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">To‘langan summa (so‘m)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={addForm.pricePaid}
                    onChange={(e) => setAddForm({ ...addForm, pricePaid: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">SMS balansi (ta)</label>
                  <input
                    type="number"
                    min="0"
                    value={addForm.smsBalance}
                    onChange={(e) => setAddForm({ ...addForm, smsBalance: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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
                  <span>Obunani Biriktirish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT DATES & PLAN MODAL */}
      {editModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider">{editModalSub.clinic_id}</span>
                <h3 className="text-lg font-black text-slate-900">{editModalSub.clinic_name} — Obunani Sozlash</h3>
              </div>
              <button 
                onClick={() => setEditModalSub(null)} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDates} className="space-y-4">
              {/* Plan & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tarif rejasi</label>
                  <select
                    value={editForm.planCode}
                    onChange={(e) => setEditForm({ ...editForm, planCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                  >
                    {plans.map(p => (
                      <option key={p.code} value={p.code}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Obuna holati</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                  >
                    <option value="ACTIVE">FAOL (ACTIVE)</option>
                    <option value="TRIAL">SINOV (TRIAL)</option>
                    <option value="SUSPENDED">TO‘XTATILGAN (SUSPENDED)</option>
                    <option value="EXPIRED">MUDDATI O‘TGAN (EXPIRED)</option>
                  </select>
                </div>
              </div>

              {/* Exact Date Range Selector */}
              <div className="p-4 bg-teal-50/50 border border-teal-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    <span>Kerakli chislodan kerakli sanagacha</span>
                  </span>

                  {/* Preset quick buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => applyDatePreset(1)}
                      className="px-2 py-0.5 bg-white hover:bg-teal-100 text-teal-800 text-[10px] font-bold rounded-md border border-teal-200 transition"
                    >
                      +1 oy
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset(3)}
                      className="px-2 py-0.5 bg-white hover:bg-teal-100 text-teal-800 text-[10px] font-bold rounded-md border border-teal-200 transition"
                    >
                      +3 oy
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDatePreset(12)}
                      className="px-2 py-0.5 bg-white hover:bg-teal-100 text-teal-800 text-[10px] font-bold rounded-md border border-teal-200 transition"
                    >
                      +1 yil
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Boshlanish sanasi (Start Date) *
                    </label>
                    <input
                      type="date"
                      required
                      value={editForm.startDate}
                      onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Tugash sanasi (End Date) *
                    </label>
                    <input
                      type="date"
                      required
                      value={editForm.endDate}
                      onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-teal-700 font-medium">
                  Har qanday sanani to‘g‘ridan-to‘g‘ri kalendardan tanlashingiz mumkin.
                </p>
              </div>

              {/* Price Paid & SMS Balance */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">To‘langan summa (so‘m)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={editForm.pricePaid}
                    onChange={(e) => setEditForm({ ...editForm, pricePaid: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">SMS balansi (ta)</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.smsBalance}
                    onChange={(e) => setEditForm({ ...editForm, smsBalance: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditModalSub(null)}
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
                  <span>O‘zgarishlarni Saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SMS BALANCE MODAL */}
      {smsModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider">{smsModalSub.clinic_name}</span>
                <h3 className="text-base font-black text-slate-900">SMS Balansini Sozlash</h3>
              </div>
              <button onClick={() => setSmsModalSub(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveSms} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">SMS balansi (dona)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  required
                  value={smsBalanceInput}
                  onChange={(e) => setSmsBalanceInput(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700">SMS yuborish ruxsati</span>
                <input
                  type="checkbox"
                  checked={smsEnabledInput}
                  onChange={(e) => setSmsEnabledInput(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSmsModalSub(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-teal-600/20"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
