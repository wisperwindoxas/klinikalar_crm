import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Building2, CreditCard, Layers, DollarSign, Users, GitBranch,
  Stethoscope, Settings, Bell, FileText, BarChart3, HelpCircle,
  Tag, Key, Activity, Search, Clock, ChevronDown, LogOut, MessageSquare, ShieldCheck
} from 'lucide-react';
import { LiquidNavPill, NAV_EFFECTS, NavEffect } from '../components/navigation/LiquidNavPill';
import { DancingMenuText } from '../components/navigation/DancingMenuText';
import { ApiClient } from '../api/client';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [notificationCount] = useState(5);
  const [activeEffect, setActiveEffect] = useState<NavEffect>(NAV_EFFECTS[0]);
  const [triggerKey, setTriggerKey] = useState<string>('init');
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('sadaf_super_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    ApiClient.getMe().then(res => {
      if (res.data?.user) {
        setCurrentUser(res.data.user);
        localStorage.setItem('sadaf_super_admin_user', JSON.stringify(res.data.user));
      }
    }).catch(() => {});
  }, []);

  const handleLogout = () => {
    if (window.confirm('Haqiqatan ham Super Admin panelidan chiqmoqchimisiz?')) {
      ApiClient.logout();
      navigate('/login', { replace: true });
    }
  };

  const handleSelectEffect = (targetPath: string) => {
    if (location.pathname !== targetPath) {
      let nextIdx = Math.floor(Math.random() * NAV_EFFECTS.length);
      if (NAV_EFFECTS[nextIdx].id === activeEffect.id) {
        nextIdx = (nextIdx + 1) % NAV_EFFECTS.length;
      }
      setActiveEffect(NAV_EFFECTS[nextIdx]);
      setTriggerKey(`${targetPath}-${Date.now()}`);
    }
  };

  const menuItems = [
    { path: '/', label: 'Bosh sahifa', icon: Home },
    { path: '/clinics', label: 'Klinikalar', icon: Building2 },
    { path: '/subscriptions', label: 'Obunalar boshqaruvi', icon: CreditCard },
    { path: '/sms', label: 'SMS Xizmati & Shlyuz', icon: MessageSquare },
    { path: '/plans', label: 'Tariflar', icon: Layers },
    { path: '/payments', label: 'To‘lovlar', icon: DollarSign },
    { path: '/users', label: 'Foydalanuvchilar', icon: Users },
    { path: '/branches', label: 'Filiallar', icon: GitBranch },
    { path: '/services', label: 'Xizmatlar (Global)', icon: Stethoscope },
    { path: '/settings', label: 'Tizim sozlamalari', icon: Settings },
    { path: '/notifications', label: 'Xabarnomalar', icon: Bell },
    { path: '/audit', label: 'Audit loglar', icon: FileText },
    { path: '/reports', label: 'Hisobotlar', icon: BarChart3 },
    { path: '/support', label: 'Yordam (Support)', icon: HelpCircle },
    { path: '/promo', label: 'Reklama / Promo', icon: Tag },
    { path: '/api-keys', label: 'API kalitlari', icon: Key },
    { path: '/system-status', label: 'Tizim holati', icon: Activity },
  ];

  return (
    <div className="flex min-h-screen bg-[#F1F5F9] p-3.5 gap-3.5">
      {/* 1. SIDEBAR */}
      <aside className="w-64 bg-white border border-slate-200/90 shadow-sm rounded-2xl flex flex-col flex-shrink-0 sticky top-3.5 h-[calc(100vh-1.75rem)] overflow-hidden">
        {/* Brand */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white font-black text-sm shadow-sm shadow-teal-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 tracking-tight leading-none">SADAF</div>
              <div className="text-[10px] text-teal-600 font-bold tracking-wider uppercase mt-0.5">SUPER ADMIN</div>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200">
            v2.6 SaaS
          </span>
        </div>

        {/* Navigation items (Full height scroll, no bottom profile card) */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => handleSelectEffect(item.path)}
                className={`relative group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 overflow-hidden ${
                  isActive
                    ? 'text-teal-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {/* Visual Liquid Indicator */}
                {isActive && (
                  <LiquidNavPill
                    effect={activeEffect}
                    triggerKey={triggerKey}
                  />
                )}

                {/* Menu Icon */}
                <motion.div
                  className="relative z-10 flex-shrink-0"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors duration-200 ${
                      isActive ? 'text-teal-700' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                    strokeWidth={isActive ? 2.6 : 2.2}
                  />
                </motion.div>

                {/* Menu Text */}
                <DancingMenuText
                  text={item.label}
                  isActive={isActive}
                />
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border border-slate-200/90 shadow-sm rounded-2xl px-6 flex items-center justify-between sticky top-3.5 z-10 mb-3.5">
          {/* Search bar */}
          <div className="relative w-96 hidden md:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Klinika, foydalanuvchi, to‘lov, ID bo‘yicha qidirish..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
            />
          </div>

          {/* Right Header Badges */}
          <div className="flex items-center gap-3.5 ml-auto">
            <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>

            <NavLink to="/notifications" className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition" title="Xabarnomalar">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {notificationCount}
              </span>
            </NavLink>

            {/* Current Super Admin Badge */}
            <NavLink
              to="/settings"
              className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 hover:bg-teal-50/60 border border-slate-200/80 hover:border-teal-300 rounded-xl transition cursor-pointer"
              title="Profil va Sozlamalarga o‘tish"
            >
              <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                {currentUser?.fullName?.charAt(0) || 'A'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser?.fullName || 'Super Admin'}
                </div>
                <div className="text-[10px] text-teal-600 font-semibold leading-none">
                  {currentUser?.role || 'SUPER_ADMIN'}
                </div>
              </div>
            </NavLink>

            {/* Chiqish (Logout) Knopkasi */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200/80 rounded-xl transition shadow-xs"
              title="Super Admin panelidan chiqish"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              <span className="hidden sm:inline">Chiqish</span>
            </button>
          </div>
        </header>

        {/* Routed Page Outlet */}
        <div className="max-w-[1600px] w-full mx-auto pb-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
