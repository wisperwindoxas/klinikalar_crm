import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Building2, Users, CreditCard, Layers, DollarSign,
  ArrowUpRight, ArrowDownRight, Clock, AlertCircle, XCircle,
  CheckCircle2, Sliders, MessageSquare, Send, Check, Plus
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
      const res = await ApiClient.getDashboard();
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Super Admin paneli</h1>
          <p className="text-xs text-slate-500 mt-0.5">Barcha klinikalar, obunalar va platforma umumiy statistikasi</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-800/20 flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi klinika qo‘shish</span>
        </button>
      </div>

      {/* 3. METRIC CARDS ROW (6 cards matching Super_Admin.png) */}
      <div className="grid grid-cols-6 gap-4">
        {/* Card 1: Jami klinikalar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="flex items-center text-[11px] font-bold text-emerald-600 gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {data?.metrics?.totalClinicsGrowth || '↑ 12%'}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[11px] font-bold text-slate-400">Jami klinikalar</div>
            <div className="text-2xl font-black text-slate-900">{data?.metrics?.totalClinics || 126}</div>
          </div>
          <div className="h-1 bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full mt-3"></div>
        </div>

        {/* Card 2: Faol klinikalar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="flex items-center text-[11px] font-bold text-emerald-600 gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {data?.metrics?.activeClinicsGrowth || '↑ 15%'}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[11px] font-bold text-slate-400">Faol klinikalar</div>
            <div className="text-2xl font-black text-slate-900">{data?.metrics?.activeClinics || 98}</div>
          </div>
          <div className="h-1 bg-emerald-500 rounded-full mt-3"></div>
        </div>

        {/* Card 3: Sinov (Trial) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex items-center text-[11px] font-bold text-cyan-600 gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {data?.metrics?.trialClinicsGrowth || '↑ 7%'}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[11px] font-bold text-slate-400">Sinov (Trial)</div>
            <div className="text-2xl font-black text-slate-900">{data?.metrics?.trialClinics || 14}</div>
          </div>
          <div className="h-1 bg-cyan-500 rounded-full mt-3"></div>
        </div>

        {/* Card 4: Muddati tugagan */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="flex items-center text-[11px] font-bold text-orange-600 gap-0.5">
              <ArrowDownRight className="w-3.5 h-3.5" />
              {data?.metrics?.expiredClinicsChange || '↓ 20%'}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[11px] font-bold text-slate-400">Muddati tugagan</div>
            <div className="text-2xl font-black text-slate-900">{data?.metrics?.expiredClinics || 10}</div>
          </div>
          <div className="h-1 bg-orange-500 rounded-full mt-3"></div>
        </div>

        {/* Card 5: Bloklangan */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
            <div className="flex items-center text-[11px] font-bold text-slate-400 gap-0.5">
              0%
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[11px] font-bold text-slate-400">Bloklangan</div>
            <div className="text-2xl font-black text-slate-900">{data?.metrics?.blockedClinics || 4}</div>
          </div>
          <div className="h-1 bg-red-500 rounded-full mt-3"></div>
        </div>

        {/* Card 6: Faol foydalanuvchilar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div className="flex items-center text-[11px] font-bold text-emerald-600 gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {data?.metrics?.totalUsersGrowth || '↑ 18%'}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[11px] font-bold text-slate-400">Faol foydalanuvchilar</div>
            <div className="text-2xl font-black text-slate-900">{data?.metrics?.totalUsers || '1 250'}</div>
          </div>
          <div className="h-1 bg-blue-500 rounded-full mt-3"></div>
        </div>
      </div>

      {/* 4. CHARTS ROW (3 columns) */}
      <div className="grid grid-cols-12 gap-5">
        {/* Chart 1: Klinikalar o'sishi */}
        <div className="col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Klinikalar o‘sishi</h3>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              Oxirgi 12 oy ▾
            </span>
          </div>
          <div className="h-44 flex items-end justify-between gap-1.5 pt-4">
            {[
              { m: 'Yanv', v: 45 }, { m: 'Fev', v: 50 }, { m: 'Mar', v: 65 },
              { m: 'Apr', v: 75 }, { m: 'May', v: 70 }, { m: 'Iyun', v: 80 },
              { m: 'Iyl', v: 90 }, { m: 'Avg', v: 92 }, { m: 'Sen', v: 95 },
              { m: 'Okt', v: 105 }, { m: 'Noy', v: 115 }, { m: 'Dek', v: 126 }
            ].map(item => (
              <div key={item.m} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  style={{ height: `${(item.v / 130) * 100}%` }}
                  className="w-full bg-teal-500/80 hover:bg-teal-600 rounded-t-sm transition-all duration-300 relative"
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] py-0.5 px-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                    {item.v}
                  </div>
                </div>
                <span className="text-[9px] text-slate-400 font-semibold">{item.m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Daromad (MRR) */}
        <div className="col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Daromad (MRR)</h3>
              <div className="text-xs text-teal-700 font-bold mt-0.5">58 400 000 so‘m</div>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              Oxirgi 6 oy ▾
            </span>
          </div>
          <div className="h-40 flex items-center justify-center relative">
            <svg className="w-full h-32 overflow-visible" viewBox="0 0 500 150">
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0D9488" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0D9488" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 20,120 Q 100,105 180,90 T 340,50 T 480,30 L 480,150 L 20,150 Z"
                fill="url(#mrrGrad)"
              />
              <path
                d="M 20,120 Q 100,105 180,90 T 340,50 T 480,30"
                fill="none"
                stroke="#008B8B"
                strokeWidth="3.5"
              />
              {[
                { cx: 20, cy: 120 }, { cx: 110, cy: 105 }, { cx: 200, cy: 90 },
                { cx: 290, cy: 70 }, { cx: 380, cy: 50 }, { cx: 480, cy: 30 }
              ].map((p, i) => (
                <circle key={i} cx={p.cx} cy={p.cy} r="4" fill="#008B8B" stroke="#ffffff" strokeWidth="2" />
              ))}
            </svg>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-2">
            <span>Yanv</span><span>Fev</span><span>Mar</span><span>Apr</span><span>May</span><span>Iyun</span>
          </div>
        </div>

        {/* Chart 3: Obuna holati (Donut) */}
        <div className="col-span-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-800 mb-2">Obuna holati</h3>
          <div className="flex items-center justify-center relative my-2">
            <div className="relative w-32 h-32 rounded-full border-[10px] border-emerald-500 flex items-center justify-center">
              <div className="text-center">
                <span className="block text-xl font-black text-slate-900 leading-none">126</span>
                <span className="text-[10px] text-slate-400 font-semibold">klinika</span>
              </div>
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600 font-medium">Faol</span>
              </div>
              <span className="font-bold text-slate-800">98 (78%)</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                <span className="text-slate-600 font-medium">Trial</span>
              </div>
              <span className="font-bold text-slate-800">14 (11%)</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                <span className="text-slate-600 font-medium">Muddati tugagan</span>
              </div>
              <span className="font-bold text-slate-800">10 (8%)</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span className="text-slate-600 font-medium">Bloklangan</span>
              </div>
              <span className="font-bold text-slate-800">4 (3%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. TABLES ROW */}
      <div className="grid grid-cols-2 gap-5">
        {/* Table 1: So'nggi ro'yxatdan o'tgan klinikalar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-800" />
              <h3 className="text-sm font-bold text-slate-800">So‘nggi ro‘yxatdan o‘tgan klinikalar</h3>
            </div>
            <NavLink to="/clinics" className="text-xs font-bold text-teal-800 hover:underline flex items-center gap-1">
              Barchasini ko‘rish →
            </NavLink>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400">
                  <th className="pb-2.5">#</th>
                  <th className="pb-2.5">Klinika nomi</th>
                  <th className="pb-2.5">Egasi</th>
                  <th className="pb-2.5">Tarif</th>
                  <th className="pb-2.5">Holat</th>
                  <th className="pb-2.5 text-right">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {(data?.recentClinics || []).map((c: any) => (
                  <tr key={c.index} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 text-slate-400 font-semibold">{c.index}</td>
                    <td className="py-2.5 font-bold text-slate-800 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center text-[10px] font-bold">
                        {c.name.charAt(0)}
                      </div>
                      <span>{c.name}</span>
                    </td>
                    <td className="py-2.5 text-slate-600">{c.owner}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        c.plan === 'PRO' ? 'bg-cyan-50 text-cyan-700' :
                        c.plan === 'BUSINESS' ? 'bg-indigo-50 text-indigo-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {c.plan}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' :
                        c.status === 'TRIAL' ? 'bg-cyan-50 text-cyan-600' :
                        'bg-orange-50 text-orange-600'
                      }`}>
                        {c.status === 'ACTIVE' ? 'Faol' : c.status === 'TRIAL' ? 'Trial' : 'Muddati tugagan'}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-slate-400 font-medium">{c.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: So'nggi to'lovlar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-teal-800" />
              <h3 className="text-sm font-bold text-slate-800">So‘nggi to‘lovlar</h3>
            </div>
            <NavLink to="/payments" className="text-xs font-bold text-teal-800 hover:underline flex items-center gap-1">
              Barchasini ko‘rish →
            </NavLink>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400">
                  <th className="pb-2.5">#</th>
                  <th className="pb-2.5">Klinika nomi</th>
                  <th className="pb-2.5">Summa</th>
                  <th className="pb-2.5">Tarif</th>
                  <th className="pb-2.5">Holat</th>
                  <th className="pb-2.5 text-right">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {(data?.recentPayments || []).map((p: any) => (
                  <tr key={p.index} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 text-slate-400 font-semibold">{p.index}</td>
                    <td className="py-2.5 font-bold text-slate-800 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-700">
                        {p.clinicName.charAt(0)}
                      </div>
                      <span>{p.clinicName}</span>
                    </td>
                    <td className="py-2.5 font-extrabold text-slate-900">{p.amount}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-50 text-cyan-700">
                        {p.plan}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'To‘landi' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-slate-400 font-medium">{p.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 6. BOTTOM ROW: Tariflar & Platforma Statistikasi */}
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-8 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-800" />
              <h3 className="text-sm font-bold text-slate-800">Tariflar</h3>
            </div>
            <NavLink to="/plans" className="text-xs font-bold text-teal-800 hover:underline">
              Barcha tariflarni boshqarish →
            </NavLink>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {/* Starter */}
            <div className="p-4 rounded-xl border border-teal-200/80 bg-teal-50/30 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-teal-800 tracking-wider">STARTER</span>
                <div className="text-base font-black text-slate-900 mt-1">350 000 so‘m <span className="text-[10px] font-normal text-slate-400">/ oy</span></div>
                <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-teal-600" /> 1 ta filial</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-teal-600" /> 5 ta shifokor</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-teal-600" /> 10 ta operator</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-teal-600" /> 1 000 bemor/oy</li>
                </ul>
              </div>
              <NavLink
                to="/plans"
                className="w-full mt-4 py-1.5 bg-white border border-teal-300 text-teal-800 hover:bg-teal-50 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
              >
                <Sliders className="w-3 h-3" /> Tahrirlash
              </NavLink>
            </div>

            {/* Pro */}
            <div className="p-4 rounded-xl border-2 border-teal-500 bg-teal-50/60 flex flex-col justify-between shadow-sm">
              <div>
                <span className="text-[11px] font-extrabold text-teal-800 tracking-wider">PRO</span>
                <div className="text-base font-black text-slate-900 mt-1">1 200 000 so‘m <span className="text-[10px] font-normal text-slate-400">/ oy</span></div>
                <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-teal-600" /> 3 ta filial</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-teal-600" /> 20 ta shifokor</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-teal-600" /> 50 ta operator</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-teal-600" /> Cheksiz bemor</li>
                </ul>
              </div>
              <NavLink
                to="/plans"
                className="w-full mt-4 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
              >
                <Sliders className="w-3 h-3" /> Tahrirlash
              </NavLink>
            </div>

            {/* Business */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-amber-700 tracking-wider">BUSINESS</span>
                <div className="text-base font-black text-slate-900 mt-1">2 400 000 so‘m <span className="text-[10px] font-normal text-slate-400">/ oy</span></div>
                <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-600" /> 10 ta filial</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-600" /> 50 ta shifokor</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-600" /> Cheksiz operator</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-600" /> Cheksiz bemor</li>
                </ul>
              </div>
              <NavLink
                to="/plans"
                className="w-full mt-4 py-1.5 bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
              >
                <Sliders className="w-3 h-3" /> Tahrirlash
              </NavLink>
            </div>

            {/* Enterprise */}
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-purple-700 tracking-wider">ENTERPRISE</span>
                <div className="text-base font-black text-slate-900 mt-1">Maxsus narx</div>
                <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-purple-600" /> Cheksiz filial</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-purple-600" /> Cheksiz shifokor</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-purple-600" /> Cheksiz operator</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-purple-600" /> Barcha funksiyalar</li>
                </ul>
              </div>
              <NavLink
                to="/plans"
                className="w-full mt-4 py-1.5 bg-white border border-purple-300 text-purple-800 hover:bg-purple-50 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
              >
                <Sliders className="w-3 h-3" /> Tahrirlash
              </NavLink>
            </div>
          </div>
        </div>

        {/* Platforma Statistikasi */}
        <div className="col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-800">Platforma statistikasi</h3>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              Bugun ▾
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="flex items-center justify-between text-slate-400">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-[10px] font-bold text-emerald-600">↑ 12%</span>
              </div>
              <div className="text-[10px] text-slate-400 font-semibold mt-1">Bugungi bemorlar</div>
              <div className="text-base font-extrabold text-slate-900">420</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="flex items-center justify-between text-slate-400">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-bold text-emerald-600">↑ 18%</span>
              </div>
              <div className="text-[10px] text-slate-400 font-semibold mt-1">Bugungi tushum</div>
              <div className="text-base font-extrabold text-slate-900">8 320 000 so‘m</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="flex items-center justify-between text-slate-400">
                <Building2 className="w-4 h-4 text-teal-600" />
                <span className="text-[10px] font-bold text-emerald-600">↑ 6%</span>
              </div>
              <div className="text-[10px] text-slate-400 font-semibold mt-1">Barcha filiallar</div>
              <div className="text-base font-extrabold text-slate-900">286</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="flex items-center justify-between text-slate-400">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-[10px] font-bold text-emerald-600">↑ 9%</span>
              </div>
              <div className="text-[10px] text-slate-400 font-semibold mt-1">Jami shifokorlar</div>
              <div className="text-base font-extrabold text-slate-900">512</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="flex items-center justify-between text-slate-400">
                <MessageSquare className="w-4 h-4 text-cyan-600" />
                <span className="text-[10px] font-bold text-emerald-600">↑ 21%</span>
              </div>
              <div className="text-[10px] text-slate-400 font-semibold mt-1">Yuborilgan SMS</div>
              <div className="text-base font-extrabold text-slate-900">1 482</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="flex items-center justify-between text-slate-400">
                <Send className="w-4 h-4 text-sky-500" />
                <span className="text-[10px] font-bold text-emerald-600">↑ 14%</span>
              </div>
              <div className="text-[10px] text-slate-400 font-semibold mt-1">Yuborilgan Telegram</div>
              <div className="text-base font-extrabold text-slate-900">860</div>
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
