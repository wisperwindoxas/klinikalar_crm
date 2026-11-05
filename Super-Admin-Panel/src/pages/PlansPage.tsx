import React, { useState, useEffect } from 'react';
import { 
  Layers, Check, RefreshCw, AlertCircle, Sparkles, Plus, Trash2, 
  Edit3, X, CheckCircle2, Building2, Send, Tag, FileText, CheckCheck,
  ChevronRight, Calendar, Info
} from 'lucide-react';
import { ApiClient } from '../api/client';

export const PlansPage: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'CUSTOM' | 'STANDARD'>('ALL');

  // Modals
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [isCreatingStandard, setIsCreatingStandard] = useState(false);
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [assigningPlan, setAssigningPlan] = useState<any | null>(null);

  const [saving, setSaving] = useState(false);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Standard/Edit form
  const [form, setForm] = useState({
    code: '',
    name: '',
    price: 500000,
    billing_cycle: 'MONTHLY',
    features: '',
    trial_days: 14,
    is_active: true,
    is_custom: false,
    clinic_id: '',
    clinic_name: '',
    notes: '',
    applyToClinic: true
  });

  // Assign to clinic form
  const [assignForm, setAssignForm] = useState({
    clinicId: '',
    clinicName: '',
    months: 12,
    price: 0
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [plansRes, clinicsRes] = await Promise.all([
        ApiClient.getPlans(),
        ApiClient.getClinics().catch(() => ({ data: [] }))
      ]);

      if (plansRes.data) {
        setPlans(plansRes.data);
      }
      if (clinicsRes.data) {
        setClinics(clinicsRes.data);
      }
    } catch (e: any) {
      setError(e.message || 'Tariflarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // Open Standard Plan modal
  const openCreateStandardModal = () => {
    setIsCreatingStandard(true);
    setIsCreatingCustom(false);
    setEditingPlan(null);
    setForm({
      code: '',
      name: '',
      price: 500000,
      billing_cycle: 'MONTHLY',
      features: 'Elektron Navbat Tizimi\nShifokor Kabinetlari (Cheksiz)\nKassa va Hisobotlar\nSMS Xabarnomalar',
      trial_days: 14,
      is_active: true,
      is_custom: false,
      clinic_id: '',
      clinic_name: '',
      notes: '',
      applyToClinic: false
    });
  };

  // Open Individual / Custom Plan modal
  const openCreateCustomModal = (defaultClinic?: any) => {
    setIsCreatingCustom(true);
    setIsCreatingStandard(false);
    setEditingPlan(null);

    const targetClinic = defaultClinic || (clinics.length > 0 ? clinics[0] : null);
    const clinicId = targetClinic?.id || '';
    const clinicName = targetClinic?.name || '';
    const shortCode = clinicId.replace('tenant_', '').slice(0, 8).toUpperCase() || 'CUSTOM';

    setForm({
      code: `IND_${shortCode}`,
      name: clinicName ? `${clinicName} - Individual Tarif` : 'Maxsus Individual Tarif',
      price: 400000,
      billing_cycle: 'MONTHLY',
      features: 'Klinika uchun maxsus moslashtirilgan tarif\nElektron Navbat Tizimi\nCheksiz shifokor va kabinetlar\nSMS va Telegram integratsiyasi\nShaxsiy menejer va 24/7 VIP qo‘llab-quvvatlash',
      trial_days: 14,
      is_active: true,
      is_custom: true,
      clinic_id: clinicId,
      clinic_name: clinicName,
      notes: 'Direktor bilan kelishilgan individual tarif shartlari',
      applyToClinic: true
    });
  };

  const openEditModal = (plan: any) => {
    setIsCreatingStandard(false);
    setIsCreatingCustom(false);
    setEditingPlan(plan);
    const feats = Array.isArray(plan.features) ? plan.features.join('\n') : '';
    setForm({
      code: plan.code,
      name: plan.name,
      price: Number(plan.price || 0),
      billing_cycle: plan.billing_cycle || 'MONTHLY',
      features: feats,
      trial_days: plan.trial_days || 14,
      is_active: plan.is_active !== false,
      is_custom: Boolean(plan.is_custom || plan.clinic_id),
      clinic_id: plan.clinic_id || '',
      clinic_name: plan.clinic_name || plan.target_clinic_name || '',
      notes: plan.notes || '',
      applyToClinic: false
    });
  };

  const handleClinicSelectForCustom = (selectedClinicId: string) => {
    const c = clinics.find(item => item.id === selectedClinicId);
    if (!c) return;
    const shortCode = c.id.replace('tenant_', '').slice(0, 8).toUpperCase();
    setForm(prev => ({
      ...prev,
      clinic_id: c.id,
      clinic_name: c.name,
      code: prev.code.startsWith('IND_') ? `IND_${shortCode}` : prev.code,
      name: prev.name.includes(' - Individual') ? `${c.name} - Individual Tarif` : prev.name
    }));
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      const featArray = form.features
        .split('\n')
        .map(f => f.trim())
        .filter(Boolean);

      if (isCreatingStandard || isCreatingCustom) {
        if (!form.code.trim()) {
          alert('Tarif kodi majburiy!');
          return;
        }

        const res = await ApiClient.createPlan({
          code: form.code.trim().toUpperCase(),
          name: form.name.trim(),
          price: form.price,
          billing_cycle: form.billing_cycle,
          features: featArray,
          trial_days: form.trial_days,
          clinic_id: form.clinic_id || undefined,
          clinic_name: form.clinic_name || undefined,
          is_custom: form.is_custom,
          notes: form.notes || undefined,
          applyToClinic: form.applyToClinic
        });

        showToast(res.message || 'Yangi tarif muvaffaqiyatli saqlandi');
        setIsCreatingStandard(false);
        setIsCreatingCustom(false);
      } else if (editingPlan) {
        const res = await ApiClient.updatePlan(editingPlan.code, {
          name: form.name.trim(),
          price: form.price,
          billing_cycle: form.billing_cycle,
          features: featArray,
          is_active: form.is_active,
          clinic_id: form.clinic_id || undefined,
          clinic_name: form.clinic_name || undefined,
          is_custom: form.is_custom,
          notes: form.notes || undefined,
          applyToClinic: form.applyToClinic
        });
        showToast(res.message || 'Tarif muvaffaqiyatli yangilandi');
        setEditingPlan(null);
      }

      await loadData();
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
      showToast(res.message || 'Tarif holati yangilandi');
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Tarifni o\'chirishda xatolik');
    } finally {
      setDeletingCode(null);
    }
  };

  // Open Quick Assign modal
  const openAssignModal = (plan: any) => {
    setAssigningPlan(plan);
    const defaultClinicId = plan.clinic_id || (clinics.length > 0 ? clinics[0].id : '');
    const defaultClinic = clinics.find(c => c.id === defaultClinicId);
    setAssignForm({
      clinicId: defaultClinicId,
      clinicName: defaultClinic?.name || plan.clinic_name || '',
      months: 12,
      price: Number(plan.price || 0)
    });
  };

  const handleAssignToClinicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningPlan || !assignForm.clinicId) {
      alert('Iltimos, klinikani tanlang');
      return;
    }

    try {
      setSaving(true);
      const targetClinic = clinics.find(c => c.id === assignForm.clinicId);
      const res = await ApiClient.assignPlanToClinic(assigningPlan.code, {
        clinicId: assignForm.clinicId,
        clinicName: targetClinic?.name || assignForm.clinicName,
        price: assignForm.price,
        months: Number(assignForm.months)
      });
      showToast(res.message || 'Tarif klinikaga muvaffaqiyatli biriktirildi');
      setAssigningPlan(null);
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Tarifni biriktirishda xatolik');
    } finally {
      setSaving(false);
    }
  };

  // Filter plans
  const filteredPlans = plans.filter(p => {
    const isCustom = Boolean(p.is_custom || p.clinic_id);
    if (activeTab === 'CUSTOM') return isCustom;
    if (activeTab === 'STANDARD') return !isCustom;
    return true;
  });

  const customPlansCount = plans.filter(p => Boolean(p.is_custom || p.clinic_id)).length;
  const standardPlansCount = plans.length - customPlansCount;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">SaaS Tariflari & Individual Rejalar</h1>
            <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 font-extrabold text-xs rounded-full border border-teal-200">
              PostgreSQL Baza
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Umumiy ommaviy tariflar hamda har bir klinika uchun alohida kelishilgan maxsus individual tariflar boshqaruvi
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => openCreateCustomModal()}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
          >
            <Building2 className="w-4 h-4 stroke-[2.2]" />
            <span>Klinikaga Individual Tarif Berish</span>
          </button>

          <button
            onClick={openCreateStandardModal}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-teal-600/30 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Yangi Standart Tarif</span>
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

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Barcha Tariflar</span>
          <span className={`px-2 py-0.2 rounded-full text-[10px] ${activeTab === 'ALL' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
            {plans.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CUSTOM')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'CUSTOM'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Individual (Maxsus) Tariflar</span>
          <span className={`px-2 py-0.2 rounded-full text-[10px] ${activeTab === 'CUSTOM' ? 'bg-purple-900 text-white' : 'bg-purple-100 text-purple-700 font-black'}`}>
            {customPlansCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('STANDARD')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'STANDARD'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-teal-50 border border-slate-200/80'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Umumiy (Standart) Tariflar</span>
          <span className={`px-2 py-0.2 rounded-full text-[10px] ${activeTab === 'STANDARD' ? 'bg-teal-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
            {standardPlansCount}
          </span>
        </button>
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
      ) : filteredPlans.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 p-8">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Ushbu bo‘limda tariflar topilmadi</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {activeTab === 'CUSTOM' 
              ? 'Hozircha birorta ham klinikaga individual tarif berilmagan. Yuqoridagi tugma orqali yarating.' 
              : 'Tariflar mavjud emas.'}
          </p>
          {activeTab === 'CUSTOM' ? (
            <button
              onClick={() => openCreateCustomModal()}
              className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl"
            >
              Klinikaga birinchi individual tarifni berish
            </button>
          ) : (
            <button
              onClick={openCreateStandardModal}
              className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl"
            >
              Standart tarif qo‘shish
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((p) => {
            const isCustom = Boolean(p.is_custom || p.clinic_id);
            const isHighlighted = p.code === 'STANDARD' && !isCustom;
            const isActive = p.is_active !== false;
            const features = Array.isArray(p.features) ? p.features : [];
            const activeSubs = p.active_subscribers_count || 0;

            return (
              <div
                key={p.code}
                className={`p-6 rounded-3xl bg-white border flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-md relative overflow-hidden ${
                  !isActive 
                    ? 'opacity-70 bg-slate-50/80 border-dashed border-slate-300' 
                    : isCustom
                      ? 'border-2 border-purple-300 ring-4 ring-purple-500/10'
                      : isHighlighted 
                        ? 'border-2 border-teal-600 ring-4 ring-teal-500/10' 
                        : 'border-slate-200/90'
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-black tracking-wider font-mono uppercase px-2.5 py-0.5 rounded-lg border ${
                        isCustom 
                          ? 'bg-purple-50 text-purple-700 border-purple-200' 
                          : 'bg-teal-50 text-teal-700 border-teal-200/50'
                      }`}>
                        {p.code}
                      </span>
                      {!isActive && (
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-md text-[10px] font-bold">
                          Arxiv / Nofaol
                        </span>
                      )}
                    </div>

                    {isCustom ? (
                      <span className="px-2.5 py-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full text-[10px] font-black flex items-center gap-1 shadow-xs">
                        <Building2 className="w-3 h-3" />
                        Individual
                      </span>
                    ) : isHighlighted && isActive ? (
                      <span className="px-2.5 py-0.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-full text-[10px] font-extrabold flex items-center gap-1 shadow-xs">
                        <Sparkles className="w-3 h-3" />
                        Ommabop
                      </span>
                    ) : null}
                  </div>

                  {/* Target Clinic banner for Individual Plans */}
                  {isCustom && (
                    <div className="mt-3.5 p-3 bg-purple-50/80 border border-purple-200/70 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-purple-200/70 text-purple-800 flex items-center justify-center">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-black text-purple-950">
                              {p.target_clinic_name || p.clinic_name || 'Biriktirilgan Klinika'}
                            </div>
                            <div className="text-[10px] text-purple-600 font-mono">
                              ID: {p.clinic_id || 'Umumiy biriktirilmagan'}
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-purple-200/70 text-purple-900 rounded-md text-[10px] font-bold">
                          {activeSubs > 0 ? `${activeSubs} ta faol obuna` : 'Alohida kelishuv'}
                        </span>
                      </div>

                      {p.notes && (
                        <div className="mt-2 pt-2 border-t border-purple-200/60 text-[11px] text-purple-800/90 font-medium">
                          <span className="font-bold">Izoh: </span>{p.notes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Plan Name */}
                  <h3 className="text-lg font-black text-slate-900 mt-3">{p.name}</h3>

                  {/* Pricing */}
                  <div className="mt-2.5 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {Number(p.price || 0).toLocaleString('uz-UZ')}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">so‘m / {p.billing_cycle === 'MONTHLY' ? 'oy' : 'yil'}</span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-medium mt-1">
                    Yillik to‘lov: {(Number(p.price || 0) * 10).toLocaleString('uz-UZ')} so‘m (2 oy bepul)
                  </div>

                  {/* Features list */}
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                      Tarif imkoniyatlari ({features.length}):
                    </p>
                    <ul className="space-y-2 text-xs text-slate-700">
                      {features.length > 0 ? (
                        features.map((f: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${isCustom ? 'text-purple-600' : 'text-emerald-600'}`} />
                            <span className="font-semibold leading-relaxed">{f}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-slate-400 italic text-[11px]">Qo‘shimcha imkoniyatlar kiritilmagan</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Actions: Assign to Clinic, Edit & Delete */}
                <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                  <button
                    onClick={() => openAssignModal(p)}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                      isCustom
                        ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                        : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Klinikaga Biriktirish / Obuna</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(p)}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Tahrirlash</span>
                    </button>

                    <button
                      onClick={() => handleDeletePlan(p)}
                      disabled={deletingCode === p.code}
                      className="p-2 rounded-xl text-xs font-bold transition bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 disabled:opacity-50"
                      title="Tarifni o'chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: CREATE INDIVIDUAL / CUSTOM PLAN FOR A CLINIC */}
      {isCreatingCustom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-purple-100 p-6 sm:p-7 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-purple-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-purple-700 font-mono font-black uppercase">
                    MAXSUS KELISHUV TARIFI
                  </span>
                  <h3 className="text-lg font-black text-slate-900">
                    Klinikaga Individual Tarif Berish
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setIsCreatingCustom(false)} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              {/* Target Clinic Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Qaysi klinika uchun maxsus tarif berilmoqda? *</span>
                </label>
                <select
                  required
                  value={form.clinic_id}
                  onChange={(e) => handleClinicSelectForCustom(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-purple-50/60 border border-purple-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 focus:outline-none"
                >
                  <option value="">-- Klinikani tanlang --</option>
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || 'Klinika'} ({c.id}) — Hozirgi tarifi: {c.plan || 'Standart'}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Ushbu tarif faqat siz tanlagan klinikaga tegishli bo‘ladi va boshqa klinikalarga ko‘rinmaydi.
                </p>
              </div>

              {/* Plan Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tarif nomi *</label>
                  <input
                    type="text"
                    required
                    placeholder="Sadaf Klinika - VIP Individual"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tarif kodi (Unique ID) *</label>
                  <input
                    type="text"
                    required
                    placeholder="IND_SADAF_VIP"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Price & Billing Cycle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kelishilgan narx (so‘m) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-purple-950 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {Number(form.price || 0).toLocaleString('uz-UZ')} so‘m
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">To‘lov davri</label>
                  <select
                    value={form.billing_cycle}
                    onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 focus:outline-none"
                  >
                    <option value="MONTHLY">Oylik (Monthly)</option>
                    <option value="YEARLY">Yillik (Yearly)</option>
                  </select>
                </div>
              </div>

              {/* Notes / Agreement details */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                  <span>Shartnoma / Kelishuv izohi (Super Admin uchun)</span>
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Bosh vrach bilan kelishilgan 30% chegirma, 20 ta shifokor limiti bilan"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 focus:outline-none"
                />
              </div>

              {/* Features */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ushbu klinikaga beriladigan imkoniyatlar (Har biri yangi qatorda)
                </label>
                <textarea
                  rows={5}
                  value={form.features}
                  placeholder="Elektron navbat tizimi&#10;Kassir qabulxonasi&#10;Cheksiz shifokorlar&#10;SMS xabarnomalar"
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Auto Activate Checkbox */}
              <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl flex items-start gap-3">
                <input
                  type="checkbox"
                  id="applyToClinicCheck"
                  checked={form.applyToClinic}
                  onChange={(e) => setForm({ ...form, applyToClinic: e.target.checked })}
                  className="mt-0.5 w-4 h-4 text-purple-600 rounded-md focus:ring-purple-500 border-slate-300"
                />
                <label htmlFor="applyToClinicCheck" className="cursor-pointer">
                  <span className="text-xs font-bold text-purple-950 block">
                    Ushbu individual tarifni darhol klinikaga faollashtirish (Obunani yangilash)
                  </span>
                  <span className="text-[11px] text-purple-700 leading-relaxed block mt-0.5">
                    Belgilansa, tanlangan klinikaning amaldagi obunasi ushbu yangi individual tarifga darhol o‘tkaziladi.
                  </span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreatingCustom(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-purple-600/20 flex items-center gap-2 disabled:opacity-60"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />}
                  <span>Individual Tarifni Yaratish & Berish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: STANDARD PLAN / EDIT PLAN */}
      {(editingPlan || isCreatingStandard) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] text-teal-700 font-mono font-black uppercase">
                  {isCreatingStandard ? 'YANGI STANDART TARIF' : editingPlan?.code}
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {isCreatingStandard ? 'Yangi SaaS Tarifini Yaratish' : 'Tarif Parametrlarini Tahrirlash'}
                </h3>
              </div>
              <button 
                onClick={() => { setEditingPlan(null); setIsCreatingStandard(false); }} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              {isCreatingStandard && (
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

              {/* If editing an individual plan, allow changing clinic or notes */}
              {editingPlan?.is_custom && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Klinika</label>
                  <select
                    value={form.clinic_id}
                    onChange={(e) => handleClinicSelectForCustom(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-purple-50/60 border border-purple-200 rounded-xl text-xs font-bold text-slate-900"
                  >
                    <option value="">-- Klinikani tanlang --</option>
                    {clinics.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || 'Klinika'} ({c.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!isCreatingStandard && (
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
                  rows={5}
                  value={form.features}
                  placeholder="Elektron navbat tizimi&#10;Kassir qabulxonasi&#10;SMS xabarnomalar"
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => { setEditingPlan(null); setIsCreatingStandard(false); }}
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
                  <span>{isCreatingStandard ? 'Tarifni Yaratish' : 'O‘zgarishlarni Saqlash'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: QUICK ASSIGN PLAN TO A CLINIC */}
      {assigningPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-teal-700 font-mono font-bold uppercase">
                    {assigningPlan.code}
                  </span>
                  <h3 className="text-base font-black text-slate-900">
                    Tarifni Klinikaga Biriktirish
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setAssigningPlan(null)} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignToClinicSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="text-[11px] text-slate-500 font-medium">Tanlangan tarif:</span>
                <div className="text-sm font-black text-slate-900 mt-0.5">{assigningPlan.name}</div>
                <div className="text-xs font-bold text-teal-700 mt-0.5">
                  {Number(assigningPlan.price || 0).toLocaleString('uz-UZ')} so‘m / oy
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Qaysi klinikaga biriktirilsin? *</span>
                </label>
                <select
                  required
                  value={assignForm.clinicId}
                  onChange={(e) => {
                    const c = clinics.find(item => item.id === e.target.value);
                    setAssignForm({
                      ...assignForm,
                      clinicId: e.target.value,
                      clinicName: c?.name || ''
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                >
                  <option value="">-- Klinikani tanlang --</option>
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || 'Klinika'} ({c.id}) — Hozirgi: {c.plan || 'STANDART'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Davomiyligi</label>
                  <select
                    value={assignForm.months}
                    onChange={(e) => setAssignForm({ ...assignForm, months: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value={1}>1 oy</option>
                    <option value={3}>3 oy</option>
                    <option value={6}>6 oy</option>
                    <option value={12}>12 oy (1 yil)</option>
                    <option value={24}>24 oy (2 yil)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">To‘lov summasi</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={assignForm.price}
                    onChange={(e) => setAssignForm({ ...assignForm, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAssigningPlan(null)}
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
                  <span>Tarifni Biriktirish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
