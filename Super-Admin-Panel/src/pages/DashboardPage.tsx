import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Building2, Users, CreditCard, Layers, DollarSign,
  ArrowUpRight, ArrowDownRight, Clock, AlertCircle, XCircle,
  CheckCircle2, Sliders, MessageSquare, Send, Check, Plus, RefreshCw
} from 'lucide-react';
import { ApiClient } from '../api/client';
import { AddClinicModal } from '../components/AddClinicModal';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.getDashboard();
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const clinicGrowth = data?.charts?.clinicGrowthData || [];
  const maxGrowthCount = Math.max(...clinicGrowth.map((x: any) => Number(x.count)), 5);

  const mrrData = data?.charts?.mrrChartData || [];
  const maxMrr = Math.max(...mrrData.map((x: any) => Number(x.amount)), 1000000);

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Super Admin Boshqaruv Paneli</h1>
            <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 font-extrabold text-xs rounded-full border border-teal-200">
              Real PostgreSQL Ma‘lumotlari
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Barcha klinikalar, obunalar, moliya va platformaning haqiqiy statistikasi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-teal-600/30 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Yangi klinika qo‘shish</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3. METRIC CARDS ROW (6 real cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Jami klinikalar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="flex items-center text-[10px] font-extrabold text-emerald-600 gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              {data?.metrics?.totalClinicsGrowth || '+100%'}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[11px] font-bold text-slate-400">Jami klinikalar</div>
            <div className="text-2xl font-black text-slate-900">{data?.metrics?.totalClinics ?? 0}</div>
          </div>
          <div className="h-1 bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full mt-3"></div>
        </div>

        {/* Card 2: Faol klinikalar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="flex items-center text-[10px] font-extrabold text-emerald-600 gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              Faol
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[11px] font-bold text-slate-400">Faol klinikalar</div>
            <div className="text-2xl font-black text-emerald-600">{data?.metrics?.activeClinics ?? 0}</div>
          </div>
          <div className="h-1 bg-emerald-500 rounded-full mt-3"></div>
        </div>

        {/* Card 3: Sinov (Trial) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex items-center text-[10px] font-extrabold text-cyan-600 gap-0.5">
              Trial
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[11px] font-bold text-slate-400">Sinov (Trial)</div>
            <div className="text-2xl font-black text-cyan-600">{data?.metrics?.trialClinics ?? 0}</div>
          </div>
          <div className="h-1 bg-cyan-500 rounded-full mt-3"></div>
        </div>

        {/* Card 4: Muddati tugagan */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="flex items-center text-[10px] font-extrabold text-orange-600 gap-0.5">
              Tugagan
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[11px] font-bold text-slate-400">Muddati tugagan</div>
            <div className="text-2xl font-black text-slate-900">{data?.metrics?.expiredClinics ?? 0}</div>
          </div>
          <div className="h-1 bg-orange-500 rounded-full mt-3"></div>
        </div>

        {/* Card 5: Bloklangan */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
            <div className="flex items-center text-[10px] font-extrabold text-slate-400 gap-0.5">
              Blok
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[11px] font-bold text-slate-400">To‘xtatilgan</div>
            <div className="text-2xl font-black text-rose-600">{data?.metrics?.blockedClinics ?? 0}</div>
          </div>
          <div className="h-1 bg-rose-500 rounded-full mt-3"></div>
        </div>

        {/* Card 6: Faol foydalanuvchilar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div className="flex items-center text-[10px] font-extrabold text-emerald-600 gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              Faol
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[11px] font-bold text-slate-400">Foydalanuvchilar</div>
            <div className="text-2xl font-black text-slate-900">{data?.metrics?.totalUsers ?? 0}</div>
          </div>
          <div className="h-1 bg-blue-500 rounded-full mt-3"></div>
        </div>
      </div>

      {/* 4. REAL CHARTS ROW (3 columns) */}
      <div className="grid grid-cols-12 gap-5">
        {/* Chart 1: Klinikalar o'sishi */}
        <div className="col-span-12 lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-900">Klinikalar o‘sishi (Real oylik)</h3>
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200/60">
              Oxirgi 6 oy
            </span>
          </div>
          <div className="h-44 flex items-end justify-between gap-2 pt-4 px-1">
            {clinicGrowth.length > 0 ? (
              clinicGrowth.map((item: any) => {
                const heightPct = Math.max(16, Math.min(100, Math.round((Number(item.count) / maxGrowthCount) * 100)));
                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-gradient-to-t from-teal-700 to-teal-500 hover:from-teal-600 hover:to-emerald-500 rounded-t-md transition-all duration-300 relative shadow-xs"
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold py-0.5 px-1.5 rounded-md opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-md">
                        {item.count} klinika
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-extrabold">{item.month}</span>
                  </div>
                );
              })
            ) : (
              <div className="w-full text-center text-slate-400 text-xs py-12">Ma’lumot mavjud emas</div>
            )}
          </div>
        </div>

        {/* Chart 2: Daromad (MRR) */}
        <div className="col-span-12 lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-black text-slate-900">Daromad (MRR & To‘lovlar)</h3>
              <div className="text-sm text-teal-700 font-black mt-0.5">
                {data?.charts?.mrrFormatted || '0 so‘m'}
              </div>
            </div>
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200/60">
              Haqiqiy tushum
            </span>
          </div>

          <div className="h-40 flex items-center justify-center relative">
            {mrrData.length > 0 ? (
              <div className="w-full h-full flex items-end justify-between gap-3 px-2 pt-4">
                {mrrData.map((item: any) => {
                  const barHeight = Math.max(16, Math.min(100, Math.round((Number(item.amount) / maxMrr) * 100)));
                  return (
                    <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5 group">
                      <div
                        style={{ height: `${barHeight}%` }}
                        className="w-full bg-gradient-to-t from-emerald-700 to-teal-500 hover:from-emerald-600 hover:to-teal-400 rounded-t-md transition-all duration-300 relative shadow-xs"
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold py-0.5 px-2 rounded-md opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-md">
                          {Number(item.amount).toLocaleString('uz-UZ')} so‘m
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-extrabold">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-slate-400 text-xs">Daromad ma’lumotlari mavjud emas</div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-medium text-center mt-1">
            Har oylik amalga oshirilgan to‘lovlar va obuna tushumlari
          </div>
        </div>

        {/* Chart 3: Obuna holati (Donut) */}
        <div className="col-span-12 lg:col-span-3 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <h3 className="text-sm font-black text-slate-900 mb-2">Obunalar Taqsimoti</h3>
          <div className="flex items-center justify-center relative my-2">
            <div className="relative w-32 h-32 rounded-full border-[10px] border-emerald-500 flex items-center justify-center bg-emerald-50/20">
              <div className="text-center">
                <span className="block text-2xl font-black text-slate-900 leading-none">
                  {data?.metrics?.totalClinics ?? 0}
                </span>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5 block">klinika</span>
              </div>
            </div>
          </div>
          <div className="space-y-2 text-xs pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600 font-semibold">Faol</span>
              </div>
              <span className="font-extrabold text-slate-900">
                {data?.charts?.subscriptionDistribution?.active ?? 0} ({data?.charts?.subscriptionDistribution?.activePercent || '0%'})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                <span className="text-slate-600 font-semibold">Sinov (Trial)</span>
              </div>
              <span className="font-extrabold text-slate-900">
                {data?.charts?.subscriptionDistribution?.trial ?? 0} ({data?.charts?.subscriptionDistribution?.trialPercent || '0%'})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                <span className="text-slate-600 font-semibold">Muddati tugagan</span>
              </div>
              <span className="font-extrabold text-slate-900">
                {data?.charts?.subscriptionDistribution?.expired ?? 0} ({data?.charts?.subscriptionDistribution?.expiredPercent || '0%'})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="text-slate-600 font-semibold">To‘xtatilgan</span>
              </div>
              <span className="font-extrabold text-slate-900">
                {data?.charts?.subscriptionDistribution?.blocked ?? 0} ({data?.charts?.subscriptionDistribution?.blockedPercent || '0%'})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. TABLES ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Table 1: So'nggi ro'yxatdan o'tgan klinikalar */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-black text-slate-900">So‘nggi Ro‘yxatdan O‘tgan Klinikalar</h3>
            </div>
            <NavLink to="/clinics" className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1">
              Barchasini ko‘rish →
            </NavLink>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400">
                  <th className="pb-2.5">#</th>
                  <th className="pb-2.5">Klinika nomi</th>
                  <th className="pb-2.5">Egasi / Mas’ul</th>
                  <th className="pb-2.5">Tarif</th>
                  <th className="pb-2.5">Holat</th>
                  <th className="pb-2.5 text-right">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {(data?.recentClinics || []).length > 0 ? (
                  data.recentClinics.map((c: any) => (
                    <tr key={c.id || c.index} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 text-slate-400 font-semibold">{c.index}</td>
                      <td className="py-2.5 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center text-xs font-black">
                          {c.name ? c.name.charAt(0).toUpperCase() : 'K'}
                        </div>
                        <span>{c.name}</span>
                      </td>
                      <td className="py-2.5 text-slate-600 font-medium">{c.owner}</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black font-mono bg-teal-50 text-teal-800 border border-teal-200/50">
                          {c.plan}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          c.status === 'TRIAL' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                          'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-slate-400 font-medium font-mono">{c.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Hozircha klinikalar mavjud emas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: So'nggi to'lovlar */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-black text-slate-900">So‘nggi To‘lovlar</h3>
            </div>
            <NavLink to="/payments" className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1">
              Barchasini ko‘rish →
            </NavLink>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400">
                  <th className="pb-2.5">#</th>
                  <th className="pb-2.5">Klinika</th>
                  <th className="pb-2.5">Summa</th>
                  <th className="pb-2.5">Usul</th>
                  <th className="pb-2.5">Holat</th>
                  <th className="pb-2.5 text-right">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {(data?.recentPayments || []).length > 0 ? (
                  data.recentPayments.map((p: any) => (
                    <tr key={p.id || p.index} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 text-slate-400 font-semibold">{p.index}</td>
                      <td className="py-2.5 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-black text-slate-700">
                          {p.clinicName ? p.clinicName.charAt(0).toUpperCase() : 'P'}
                        </div>
                        <span className="truncate max-w-[140px]">{p.clinicName}</span>
                      </td>
                      <td className="py-2.5 font-black text-slate-900">{p.amount}</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                          {p.plan}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-slate-400 font-medium font-mono">{p.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Hozircha to‘lovlar mavjud emas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 6. BOTTOM ROW: Real Tariflar & Real Platforma Statistikasi */}
      <div className="grid grid-cols-12 gap-5">
        {/* Real Plans Grid */}
        <div className="col-span-12 lg:col-span-8 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-black text-slate-900">SaaS Tariflari (Baza Parametrlari)</h3>
            </div>
            <NavLink to="/plans" className="text-xs font-bold text-teal-700 hover:underline">
              Barcha tariflarni boshqarish →
            </NavLink>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(data?.plans && data.plans.length > 0 ? data.plans.slice(0, 4) : []).map((p: any) => {
              const features = Array.isArray(p.features) ? p.features.slice(0, 4) : [];
              return (
                <div key={p.code} className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 flex flex-col justify-between hover:shadow-xs transition">
                  <div>
                    <span className="text-[10px] font-black text-teal-800 tracking-wider font-mono uppercase bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/50">
                      {p.code}
                    </span>
                    <div className="text-sm font-black text-slate-900 mt-2">{p.name}</div>
                    <div className="text-base font-black text-slate-900 mt-1">
                      {Number(p.price || 0).toLocaleString('uz-UZ')} <span className="text-[10px] font-normal text-slate-500">so‘m / {p.billing_cycle === 'MONTHLY' ? 'oy' : 'yil'}</span>
                    </div>

                    <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                      {features.map((f: string, i: number) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                          <span className="truncate text-[11px] font-medium">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <NavLink
                    to="/plans"
                    className="w-full mt-4 py-1.5 bg-white border border-slate-200 hover:border-teal-400 text-slate-700 hover:text-teal-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    <Sliders className="w-3 h-3" /> Tahrirlash
                  </NavLink>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real Platforma Statistikasi */}
        <div className="col-span-12 lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-slate-900">Platforma Ko‘rsatkichlari</h3>
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200/60">
              Bugun
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-[10px] font-bold text-emerald-600">Bugun</span>
              </div>
              <div className="text-[10px] text-slate-400 font-bold mt-1">Bugungi bemorlar</div>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                {data?.platformStats?.todayPatients ?? 0}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-bold text-emerald-600">Bugun</span>
              </div>
              <div className="text-[10px] text-slate-400 font-bold mt-1">Bugungi tushum</div>
              <div className="text-lg font-black text-slate-900 mt-0.5 truncate">
                {data?.platformStats?.todayRevenue || '0 so‘m'}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400">
                <Building2 className="w-4 h-4 text-teal-600" />
                <span className="text-[10px] font-bold text-teal-600">Faol</span>
              </div>
              <div className="text-[10px] text-slate-400 font-bold mt-1">Barcha filiallar</div>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                {data?.platformStats?.totalBranches ?? 1}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400">
                <Users className="w-4 h-4 text-indigo-500" />
                <span className="text-[10px] font-bold text-indigo-600">Faol</span>
              </div>
              <div className="text-[10px] text-slate-400 font-bold mt-1">Jami shifokorlar</div>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                {data?.platformStats?.totalDoctors ?? 0}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400">
                <MessageSquare className="w-4 h-4 text-cyan-600" />
                <span className="text-[10px] font-bold text-cyan-600">Jami</span>
              </div>
              <div className="text-[10px] text-slate-400 font-bold mt-1">Yuborilgan SMS</div>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                {data?.platformStats?.sentSMS ?? 0}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400">
                <Send className="w-4 h-4 text-teal-600" />
                <span className="text-[10px] font-bold text-emerald-600">Yakun</span>
              </div>
              <div className="text-[10px] text-slate-400 font-bold mt-1">Qabul yakunlandi</div>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                {data?.platformStats?.sentTelegram ?? 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddClinicModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
};
