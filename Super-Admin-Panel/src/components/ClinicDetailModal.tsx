import React, { useState, useEffect } from 'react';
import {
  X, Building2, Users, CreditCard, Clock, ShieldCheck, Settings,
  Calendar, Search, Plus, Trash2, Edit2, Download, CheckCircle2,
  AlertTriangle, RefreshCw, DollarSign, Wallet, ArrowUpRight,
  UserCheck, Shield, Lock, Phone, Mail, MapPin, Eye, Check, Power
} from 'lucide-react';
import { ApiClient } from '../api/client';
import { UZBEKISTAN_REGIONS } from '../data/uzbekistanRegions';

interface ClinicDetailModalProps {
  clinicId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onClinicUpdated?: () => void;
}

export const ClinicDetailModal: React.FC<ClinicDetailModalProps> = ({
  clinicId,
  isOpen,
  onClose,
  onClinicUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'PAYMENTS' | 'USERS' | 'SUBSCRIPTIONS' | 'AUDIT' | 'SETTINGS'>('PAYMENTS');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Date filters for payments & revenue
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');

  // Search in tabs
  const [userSearch, setUserSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  // User management modals
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    id: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'OPERATOR',
    password: ''
  });

  // Clinic edit form
  const [clinicForm, setClinicForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    region: '',
    district: '',
    status: 'ACTIVE',
    planCode: 'STARTER'
  });

  // Delete clinic confirmation
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteInputName, setDeleteInputName] = useState('');

  useEffect(() => {
    if (isOpen && clinicId) {
      loadDetails();
    }
  }, [isOpen, clinicId]);

  const loadDetails = async (start = startDate, end = endDate) => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const res = await ApiClient.getClinicDetails(clinicId, {
        startDate: start || undefined,
        endDate: end || undefined
      });
      if (res.data) {
        setData(res.data);
        const c = res.data.clinic;
        setClinicForm({
          name: c.name || '',
          phone: c.phone || '',
          email: c.email || '',
          address: c.address || '',
          region: c.region || '',
          district: c.district || '',
          status: c.status || 'ACTIVE',
          planCode: c.planCode || 'STARTER'
        });
      }
    } catch (e: any) {
      console.error('Error loading clinic details:', e);
    } finally {
      setLoading(false);
    }
  };

  const applyDatePreset = (preset: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH') => {
    setDatePreset(preset);
    const now = new Date();
    let s = '';
    let e = '';

    if (preset === 'TODAY') {
      const todayStr = now.toISOString().split('T')[0];
      s = todayStr;
      e = todayStr;
    } else if (preset === 'WEEK') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      s = weekAgo.toISOString().split('T')[0];
      e = now.toISOString().split('T')[0];
    } else if (preset === 'MONTH') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      s = monthAgo.toISOString().split('T')[0];
      e = now.toISOString().split('T')[0];
    }

    setStartDate(s);
    setEndDate(e);
    loadDetails(s, e);
  };

  const handleCustomDateFilter = () => {
    setDatePreset('ALL');
    loadDetails(startDate, endDate);
  };

  // --- USER ACTIONS ---
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId) return;
    setSaving(true);
    try {
      if (isEditUserOpen) {
        await ApiClient.updateClinicUser(clinicId, userForm.id, userForm);
        setIsEditUserOpen(false);
      } else {
        await ApiClient.createClinicUser(clinicId, userForm);
        setIsAddUserOpen(false);
      }
      setUserForm({ id: '', fullName: '', email: '', phone: '', role: 'OPERATOR', password: '' });
      await loadDetails();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!clinicId) return;
    if (!confirm(`Haqiqatan ham "${userName}" foydalanuvchisini o'chirmoqchimisiz?`)) return;
    try {
      await ApiClient.deleteClinicUser(clinicId, userId);
      await loadDetails();
    } catch (err: any) {
      alert(err.message || 'Xatolik');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentActive: boolean) => {
    if (!clinicId) return;
    try {
      const newStatus = currentActive ? 'BLOCKED' : 'ACTIVE';
      await ApiClient.toggleClinicUserStatus(clinicId, userId, newStatus);
      await loadDetails();
    } catch (err: any) {
      alert(err.message || 'Xatolik');
    }
  };

  // --- CLINIC SETTINGS ACTIONS ---
  const handleSaveClinicSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId) return;
    setSaving(true);
    try {
      await ApiClient.updateClinic(clinicId, clinicForm);
      alert('Klinika ma\'lumotlari muvaffaqiyatli saqlandi!');
      await loadDetails();
      if (onClinicUpdated) onClinicUpdated();
    } catch (err: any) {
      alert(err.message || 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClinic = async () => {
    if (!clinicId || !data?.clinic) return;
    if (deleteInputName.trim() !== data.clinic.name.trim()) {
      alert('Klinika nomi to‘g‘ri kiritilmadi!');
      return;
    }
    setSaving(true);
    try {
      await ApiClient.deleteClinic(clinicId);
      alert(`"${data.clinic.name}" klinikasi muvaffaqiyatli o'chirildi.`);
      setIsDeleteOpen(false);
      onClose();
      if (onClinicUpdated) onClinicUpdated();
    } catch (err: any) {
      alert(err.message || 'O‘chirishda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleExtendSub = async (months: number) => {
    if (!clinicId || !data?.subscriptions?.[0]) return;
    try {
      const subId = data.subscriptions[0].id;
      await ApiClient.extendSubscription(subId, months);
      alert(`Obuna ${months} oyga uzaytirildi!`);
      await loadDetails();
      if (onClinicUpdated) onClinicUpdated();
    } catch (err: any) {
      alert(err.message || 'Xatolik');
    }
  };

  const handleChangePlan = async (newPlan: string) => {
    if (!clinicId || !data?.subscriptions?.[0]) return;
    try {
      const subId = data.subscriptions[0].id;
      await ApiClient.changeSubscriptionPlan(subId, newPlan);
      alert(`Tarif muvaffaqiyatli yangilandi: ${newPlan}`);
      await loadDetails();
      if (onClinicUpdated) onClinicUpdated();
    } catch (err: any) {
      alert(err.message || 'Xatolik');
    }
  };

  // Export payments to CSV
  const exportPaymentsToCSV = () => {
    if (!data?.payments || data.payments.length === 0) {
      alert('Eksport qilish uchun to‘lovlar mavjud emas');
      return;
    }
    const headers = ['Chek №', 'Sana', 'Summa', 'Valyuta', 'To‘lov usuli', 'Turi', 'Holati', 'Tafsilot'];
    const rows = data.payments.map((p: any) => [
      p.receiptNumber || p.id,
      new Date(p.createdAt).toLocaleDateString('uz-UZ'),
      p.amount,
      p.currency || 'UZS',
      p.method,
      p.type,
      p.status,
      `"${p.description || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tolovlar_${data.clinic?.code || 'klinika'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen || !clinicId) return null;

  const clinic = data?.clinic;
  const filteredUsers = (data?.users || []).filter((u: any) =>
    u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phone.includes(userSearch) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredAudit = (data?.auditLogs || []).filter((l: any) =>
    (l.action || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
    (l.userFullName || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
    (l.entityType || '').toLowerCase().includes(auditSearch.toLowerCase())
  );

  const selectedRegionObj = UZBEKISTAN_REGIONS.find(r => r.name === clinicForm.region);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
        
        {/* TOP HEADER: CLINIC BRAND & QUICK INFO */}
        <div className="px-6 py-5 bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-2xl text-teal-200 shadow-inner">
              {clinic?.name ? clinic.name.charAt(0).toUpperCase() : 'K'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black tracking-tight text-white">{clinic?.name || 'Klinika Nazorati'}</h2>
                <span className="px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold bg-white/15 text-teal-200 border border-white/10">
                  {clinic?.code || 'KOD'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  clinic?.status === 'ACTIVE' ? 'bg-emerald-500 text-white' :
                  clinic?.status === 'TRIAL' ? 'bg-sky-500 text-white' :
                  clinic?.status === 'SUSPENDED' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
                }`}>
                  {clinic?.status || 'ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-teal-200/90 mt-1 flex items-center gap-4 font-medium">
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {clinic?.address || 'Manzil ko‘rsatilmagan'}</span>
                <span>•</span>
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {clinic?.phone || '-'}</span>
                <span>•</span>
                <span>Tarif: <strong className="text-white font-bold">{clinic?.planCode || 'STARTER'}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadDetails()}
              disabled={loading}
              className="p-2.5 hover:bg-white/10 rounded-xl text-teal-200 hover:text-white transition cursor-pointer"
              title="Yangilash"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-white/15 rounded-xl text-white/80 hover:text-white transition cursor-pointer"
              title="Yopish"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="px-6 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-2 py-2.5">
            {[
              { id: 'PAYMENTS', label: 'To‘lovlar & Tushum', icon: DollarSign, badge: data?.payments?.length },
              { id: 'USERS', label: 'Foydalanuvchilar', icon: Users, badge: data?.users?.length },
              { id: 'SUBSCRIPTIONS', label: 'Obuna & Tarif', icon: CreditCard },
              { id: 'AUDIT', label: 'Audit Jurnali', icon: ShieldCheck, badge: data?.auditLogs?.length },
              { id: 'SETTINGS', label: 'Klinikani boshqarish', icon: Settings },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-teal-800 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Action: Delete Clinic Button */}
          <button
            onClick={() => setIsDeleteOpen(true)}
            className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Klinikani o'chirish</span>
          </button>
        </div>

        {/* TAB CONTENTS (SCROLLABLE BODY) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50">
          
          {/* ========================================================= */}
          {/* TAB 1: PAYMENTS & REVENUE REPORT WITH DATE FILTER         */}
          {/* ========================================================= */}
          {activeTab === 'PAYMENTS' && (
            <div className="space-y-6">
              {/* Financial KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between text-emerald-100 text-xs font-bold">
                    <span>Jami Tushum ({datePreset === 'ALL' ? 'Barcha davr' : datePreset})</span>
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black font-mono mt-2">
                    {Number(data?.revenueStats?.totalRevenue || 0).toLocaleString()} so'm
                  </div>
                  <div className="text-[11px] text-emerald-100 mt-1 font-medium">
                    {data?.revenueStats?.totalPaymentsCount || 0} ta muvaffaqiyatli to‘lov
                  </div>
                </div>

                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                    <span>Naqd Pulda Tushum</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  </div>
                  <div className="text-xl font-black text-slate-800 font-mono mt-2">
                    {Number(data?.revenueStats?.revenueByMethod?.CASH || 0).toLocaleString()} so'm
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Kassa va administrator orqali</div>
                </div>

                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                    <span>Plastik Karta Orqali</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                  </div>
                  <div className="text-xl font-black text-slate-800 font-mono mt-2">
                    {Number(data?.revenueStats?.revenueByMethod?.CARD || 0).toLocaleString()} so'm
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">POS-terminal to'lovlari</div>
                </div>

                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                    <span>Payme / Click / Obuna</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  </div>
                  <div className="text-xl font-black text-slate-800 font-mono mt-2">
                    {Number(
                      (data?.revenueStats?.revenueByMethod?.PAYME || 0) +
                      (data?.revenueStats?.revenueByMethod?.CLICK || 0) +
                      (data?.revenueStats?.revenueByMethod?.ONLINE || 0)
                    ).toLocaleString()} so'm
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Onlayn billing va tarif to'lovlari</div>
                </div>
              </div>

              {/* Date Filter & Export Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mr-1">
                    <Calendar className="w-4 h-4 text-teal-700" />
                    <span>Sana oralig'i:</span>
                  </span>
                  {(['ALL', 'TODAY', 'WEEK', 'MONTH'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => applyDatePreset(p)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        datePreset === p
                          ? 'bg-teal-800 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {p === 'ALL' ? 'Barchasi' : p === 'TODAY' ? 'Bugun' : p === 'WEEK' ? 'Shu hafta' : 'Shu oy'}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
                    />
                    <span className="text-xs text-slate-400">—</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleCustomDateFilter}
                      className="px-3.5 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Filtrlash
                    </button>
                  </div>

                  <button
                    onClick={exportPaymentsToCSV}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    title="Excel (.csv) formatida yuklab olish"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Excel (.csv)</span>
                  </button>
                </div>
              </div>

              {/* Payments History Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">
                    To‘lovlar Jurnali ({data?.payments?.length || 0} ta yozuv)
                  </h3>
                  <span className="text-xs text-slate-500">
                    Klinikaga tegishli barcha tushumlar va billing operatsiyalari
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Chek / ID</th>
                        <th className="py-3 px-4">Sana va Vaqt</th>
                        <th className="py-3 px-4">Tafsilot</th>
                        <th className="py-3 px-4">Turi</th>
                        <th className="py-3 px-4">To‘lov Usuli</th>
                        <th className="py-3 px-4">Summa</th>
                        <th className="py-3 px-4">Holati</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(!data?.payments || data.payments.length === 0) ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                            Ushbu sana oralig'ida to'lovlar topilmadi
                          </td>
                        </tr>
                      ) : (
                        data.payments.map((p: any) => (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4 font-mono font-bold text-slate-700">
                              {p.receiptNumber || p.id}
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {new Date(p.createdAt).toLocaleString('uz-UZ', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-800">
                              {p.description || 'Xizmat to‘lovi'}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.type === 'SUBSCRIPTION' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {p.type === 'SUBSCRIPTION' ? 'Obuna tarifi' : 'Bemor qabuli'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                                {p.method}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono font-black text-slate-900 text-sm">
                              {Number(p.amount || 0).toLocaleString()} {p.currency || "so'm"}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                p.status === 'PAID' || p.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {p.status === 'PAID' ? "To'langan" : p.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: FOYDALANUVCHILAR BOSHQARUVI (USERS MANAGEMENT)     */}
          {/* ========================================================= */}
          {activeTab === 'USERS' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    placeholder="Foydalanuvchi ismi, login, telefon yoki roli bo'yicha qidirish..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <button
                  onClick={() => {
                    setUserForm({ id: '', fullName: '', email: '', phone: '', role: 'OPERATOR', password: '' });
                    setIsAddUserOpen(true);
                  }}
                  className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yangi foydalanuvchi qo'shish</span>
                </button>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Xodim F.I.Sh.</th>
                      <th className="py-3 px-4">Login / Email</th>
                      <th className="py-3 px-4">Telefon</th>
                      <th className="py-3 px-4">Tizimdagi Roli</th>
                      <th className="py-3 px-4">Holati</th>
                      <th className="py-3 px-4">Ro'yxatdan o'tgan</th>
                      <th className="py-3 px-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Ushbu klinikaga biriktirilgan foydalanuvchilar topilmadi
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u: any) => (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-800 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-xs">
                              {u.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div>{u.fullName}</div>
                              <div className="text-[10px] font-mono text-slate-400">{u.id}</div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-medium">{u.email}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">{u.phone || '-'}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              u.role === 'OWNER' || u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                              u.role === 'MANAGER' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              u.role === 'DOCTOR' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              u.role === 'CASHIER' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                                u.isActive
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                              }`}
                              title="Holatni o'zgartirish uchun bosing"
                            >
                              {u.isActive ? 'Faol (Bloklash)' : 'Bloklangan (Yoqish)'}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                            {new Date(u.createdAt).toLocaleDateString('uz-UZ')}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1.5">
                            <button
                              onClick={() => {
                                setUserForm({
                                  id: u.id,
                                  fullName: u.fullName,
                                  email: u.email,
                                  phone: u.phone,
                                  role: u.role,
                                  password: ''
                                });
                                setIsEditUserOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                              title="Tahrirlash"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.fullName)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="O'chirish"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: OBUNALAR TARIXI VA TARIFLAR (SUBSCRIPTIONS)        */}
          {/* ========================================================= */}
          {activeTab === 'SUBSCRIPTIONS' && (
            <div className="space-y-6">
              {/* Current Active Plan Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hozirgi Faol Tarif</span>
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                      {clinic?.planCode || 'STARTER'}
                    </h3>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      Faol Holatda
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Amal qilish muddati: <strong className="text-slate-800">{clinic?.subscriptionEnd ? new Date(clinic.subscriptionEnd).toLocaleDateString('uz-UZ') : 'Noma\'lum'}</strong> gacha
                  </p>
                </div>

                {/* Quick Extend Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 mr-1">Muddati uzaytirish:</span>
                  {[1, 3, 6, 12].map(m => (
                    <button
                      key={m}
                      onClick={() => handleExtendSub(m)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-teal-800 hover:text-white text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      +{m} oy
                    </button>
                  ))}
                  
                  <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>

                  <select
                    value={clinic?.planCode || 'STARTER'}
                    onChange={e => handleChangePlan(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-teal-800 focus:outline-none cursor-pointer"
                  >
                    <option value="STARTER">Tarif: STARTER</option>
                    <option value="STANDARD">Tarif: STANDARD</option>
                    <option value="PRO">Tarif: PRO</option>
                    <option value="BUSINESS">Tarif: BUSINESS</option>
                    <option value="ENTERPRISE">Tarif: ENTERPRISE</option>
                  </select>
                </div>
              </div>

              {/* Subscriptions History Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800">Obunalar Tarixi</h4>
                </div>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Tarif</th>
                      <th className="py-3 px-4">Boshlanish Sanasi</th>
                      <th className="py-3 px-4">Tugash Sanasi</th>
                      <th className="py-3 px-4">To‘langan Summa</th>
                      <th className="py-3 px-4">SMS Balans</th>
                      <th className="py-3 px-4">Holati</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(!data?.subscriptions || data.subscriptions.length === 0) ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Obunalar tarixi mavjud emas
                        </td>
                      </tr>
                    ) : (
                      data.subscriptions.map((s: any) => (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-bold text-teal-800">{s.plan_code || s.planCode}</td>
                          <td className="py-3 px-4 text-slate-600">
                            {s.start_date ? new Date(s.start_date).toLocaleDateString('uz-UZ') : '-'}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {s.end_date ? new Date(s.end_date).toLocaleDateString('uz-UZ') : '-'}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {Number(s.price_paid || 0).toLocaleString()} so'm
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">{s.sms_balance || 1000} ta SMS</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                              {s.status || 'ACTIVE'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: AUDIT JURNALI (ACTIVITY LOGS)                      */}
          {/* ========================================================= */}
          {activeTab === 'AUDIT' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={e => setAuditSearch(e.target.value)}
                    placeholder="Amal nomi, xodim yoki obyekt bo'yicha qidirish..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  Jami amallar: {filteredAudit.length} ta
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Vaqti</th>
                      <th className="py-3 px-4">Amal (Action)</th>
                      <th className="py-3 px-4">Bajaruvchi Xodim</th>
                      <th className="py-3 px-4">Obyekt</th>
                      <th className="py-3 px-4">IP Manzil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAudit.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Audit yozuvlari topilmadi
                        </td>
                      </tr>
                    ) : (
                      filteredAudit.map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                            {new Date(log.createdAt).toLocaleString('uz-UZ', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit', second: '2-digit'
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 font-mono font-bold text-[11px] border border-teal-200">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800">
                            {log.userFullName || 'Tizim / Super Admin'}
                            <span className="text-[10px] text-slate-400 ml-1.5 font-normal font-mono">({log.userRole || 'ADMIN'})</span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-600">{log.entityType || '-'}</td>
                          <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{log.ipAddress || '127.0.0.1'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: KLINIKANI BOSHQARISH & TAHRIRLASH (SETTINGS)       */}
          {/* ========================================================= */}
          {activeTab === 'SETTINGS' && (
            <div className="space-y-6">
              <form onSubmit={handleSaveClinicSettings} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Klinika Ma'lumotlarini Tahrirlash</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Klinikaning asosiy rekvizitlari, filiali va joylashuvini yangilash</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Klinika Nomi *</label>
                    <input
                      type="text"
                      required
                      value={clinicForm.name}
                      onChange={e => setClinicForm({ ...clinicForm, name: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Telefon Raqami *</label>
                    <input
                      type="text"
                      required
                      value={clinicForm.phone}
                      onChange={e => setClinicForm({ ...clinicForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Email Manzili</label>
                    <input
                      type="email"
                      value={clinicForm.email}
                      onChange={e => setClinicForm({ ...clinicForm, email: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Klinika Holati (Status)</label>
                    <select
                      value={clinicForm.status}
                      onChange={e => setClinicForm({ ...clinicForm, status: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <option value="ACTIVE">ACTIVE (Faol)</option>
                      <option value="TRIAL">TRIAL (Sinov muddati)</option>
                      <option value="SUSPENDED">SUSPENDED (Vaqtincha to'xtatilgan)</option>
                      <option value="BLOCKED">BLOCKED (Bloklangan)</option>
                    </select>
                  </div>

                  {/* Viloyat Select */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Viloyat</label>
                    <select
                      value={clinicForm.region}
                      onChange={e => {
                        setClinicForm({
                          ...clinicForm,
                          region: e.target.value,
                          district: ''
                        });
                      }}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <option value="">Viloyatni tanlang</option>
                      {UZBEKISTAN_REGIONS.map(reg => (
                        <option key={reg.id} value={reg.name}>{reg.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tuman Select */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Tuman / Shahar</label>
                    <select
                      value={clinicForm.district}
                      disabled={!selectedRegionObj}
                      onChange={e => setClinicForm({ ...clinicForm, district: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="">Tumanni tanlang</option>
                      {selectedRegionObj?.districts.map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">Aniq Ko'cha va Manzil</label>
                    <input
                      type="text"
                      value={clinicForm.address}
                      onChange={e => setClinicForm({ ...clinicForm, address: e.target.value })}
                      placeholder="Masalan: Bunyodkor ko'chasi 15-uy"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{saving ? 'Saqlanmoqda...' : 'O‘zgarishlarni saqlash'}</span>
                  </button>
                </div>
              </form>

              {/* Danger Zone: Delete Clinic */}
              <div className="p-6 bg-rose-50/70 border border-rose-200 rounded-3xl flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Xavfli Hudud: Klinikani butunlay o‘chirish</span>
                  </h4>
                  <p className="text-xs text-rose-700/80 mt-1 max-w-xl">
                    Ushbu klinikani o‘chirish unga biriktirilgan barcha xodimlar, filiallar va sozlamalarni bekor qiladi. Bu amalni ortga qaytarib bo‘lmaydi.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDeleteOpen(true)}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Klinikani butunlay o‘chirish</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT CLINIC USER                             */}
      {/* ========================================================= */}
      {(isAddUserOpen || isEditUserOpen) && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">
                {isEditUserOpen ? 'Xodim ma\'lumotlarini tahrirlash' : 'Yangi foydalanuvchi qo\'shish'}
              </h3>
              <button
                onClick={() => { setIsAddUserOpen(false); setIsEditUserOpen(false); }}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">F.I.Sh. (To‘liq ism) *</label>
                <input
                  type="text"
                  required
                  value={userForm.fullName}
                  onChange={e => setUserForm({ ...userForm, fullName: e.target.value })}
                  placeholder="Masalan: Karimova Malika"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Login / Email *</label>
                <input
                  type="text"
                  required
                  value={userForm.email}
                  onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="Masalan: malika@klinika.uz"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Telefon raqami</label>
                <input
                  type="text"
                  value={userForm.phone}
                  onChange={e => setUserForm({ ...userForm, phone: e.target.value })}
                  placeholder="+998 (90) 123-45-67"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tizimdagi Roli *</label>
                <select
                  value={userForm.role}
                  onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="MANAGER">MANAGER (Klinika rahbari)</option>
                  <option value="DOCTOR">DOCTOR (Shifokor)</option>
                  <option value="CASHIER">CASHIER (Kassir)</option>
                  <option value="OPERATOR">OPERATOR (Qabulxona registratori)</option>
                  <option value="OWNER">OWNER (Ta'sischi)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isEditUserOpen ? 'Yangi Parol (ixtiyoriy)' : 'Parol *'}
                </label>
                <input
                  type="password"
                  required={!isEditUserOpen}
                  value={userForm.password}
                  onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder={isEditUserOpen ? "O'zgartirmaslik uchun bo'sh qoldiring" : "Kamida 6 ta belgi"}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsAddUserOpen(false); setIsEditUserOpen(false); }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DELETE CLINIC CONFIRMATION DIALOG                  */}
      {/* ========================================================= */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/75 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-900">Klinikani butunlay o‘chirish</h3>
                <p className="text-xs text-rose-700">Ushbu amalni ortga qaytarib bo'lmaydi</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tasdiqlash uchun pastdagi maydonga klinikaning to‘liq nomini kiriting:
              <br />
              <strong className="text-slate-900 font-mono text-sm block mt-1 bg-slate-100 p-2 rounded-lg text-center select-all">
                {clinic?.name}
              </strong>
            </p>

            <input
              type="text"
              value={deleteInputName}
              onChange={e => setDeleteInputName(e.target.value)}
              placeholder="Klinika nomini aynan shu yerga yozing..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-rose-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setIsDeleteOpen(false); setDeleteInputName(''); }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={saving || deleteInputName.trim() !== clinic?.name?.trim()}
                onClick={handleDeleteClinic}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-40"
              >
                {saving ? 'O‘chirilmoqda...' : 'Tasdiqlayman va O‘chiraman'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

