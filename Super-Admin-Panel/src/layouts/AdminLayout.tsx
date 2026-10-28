import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Building2, CreditCard, Layers, DollarSign, Users, GitBranch,
  Stethoscope, Settings, Bell, FileText, BarChart3, HelpCircle,
  Tag, Key, Activity, Search, Clock, ChevronDown, LogOut, MessageSquare
} from 'lucide-react';
import { LiquidNavPill, NAV_EFFECTS, NavEffect } from '../components/navigation/LiquidNavPill';
import { DancingMenuText } from '../components/navigation/DancingMenuText';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const [notificationCount] = useState(5);
  const [activeEffect, setActiveEffect] = useState<NavEffect>(NAV_EFFECTS[0]);
  const [triggerKey, setTriggerKey] = useState<string>('init');

  // Idle state: triggers playful letter dance if active menu stays idle for 3 seconds
  const [isIdle, setIsIdle] = useState<boolean>(false);

  useEffect(() => {
    setIsIdle(false);
    const timer = setTimeout(() => {
      setIsIdle(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleSelectEffect = (targetPath: string) => {
    if (location.pathname !== targetPath) {
      setIsIdle(false);
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
      {/* 1. LEFT SIDEBAR (Floating Island Card) */}
      <aside className="w-72 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col flex-shrink-0 z-20 sticky top-3.5 h-[calc(100vh-28px)] overflow-hidden">
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-800 flex items-center justify-center text-white shadow-md shadow-teal-700/20">
              <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
                <path d="M12 2C7.58 2 4 5.58 4 10c0 2.5 1.15 4.74 2.95 6.22.42.35.68.87.68 1.42V19c0 1.66 1.34 3 3 3h.5c.83 0 1.5-.67 1.5-1.5v-3.5h.74v3.5c0 .83.67 1.5 1.5 1.5h.5c1.66 0 3-1.34 3-3v-1.36c0-.55.26-1.07.68-1.42C20.85 14.74 22 12.5 22 10c0-4.42-3.58-8-8-8zm-2 15h-.5c-.83 0-1.5-.67-1.5-1.5v-.5h2v2zm6 0h-.5v-2h2v.5c0 .83-.67 1.5-1.5 1.5z"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight text-slate-800">SADAF</span>
                <span className="text-[10px] font-extrabold text-teal-700 uppercase tracking-widest px-1.5 py-0.5 bg-teal-50 rounded">SaaS</span>
              </div>
              <span className="inline-block mt-0.5 px-2 py-0.5 bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-800 border border-teal-200/80 rounded-full text-[9px] font-black uppercase tracking-wider">
                Super Admin
              </span>
            </div>
          </div>
        </div>

        {/* Navigation List with 15 Random Liquid & Bouncing Animated Effects */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => handleSelectEffect(item.path)}
                className="relative w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[13px] transition-all text-left group select-none"
              >
                {/* 15 Random Liquid Animated Pill Indicator */}
                {isActive && (
                  <LiquidNavPill effect={activeEffect} triggerKey={triggerKey} />
                )}

                {/* Animated Icon: Larger (22px) and Bolder (strokeWidth 2.6) + Idle Floating */}
                <motion.div
                  whileHover={{ scale: 1.18, rotate: [0, -4, 4, 0] }}
                  whileTap={{ scale: 0.88 }}
                  animate={
                    isActive && isIdle
                      ? {
                          y: [0, -4, 2, -2, 0],
                          rotate: [0, -6, 6, -3, 0],
                          scale: [1, 1.12, 0.96, 1],
                        }
                      : {}
                  }
                  transition={{
                    type: 'spring',
                    stiffness: 450,
                    damping: 18,
                    ...(isActive && isIdle
                      ? {
                          duration: 1.4,
                          repeat: Infinity,
                          repeatDelay: 1.2,
                          ease: 'easeInOut',
                        }
                      : {}),
                  }}
                  className="relative z-10 flex items-center justify-center flex-shrink-0"
                >
                  <Icon
                    className={`w-[22px] h-[22px] transition-all duration-200 ${
                      isActive
                        ? 'text-teal-100 drop-shadow-[0_2px_10px_rgba(45,212,191,0.7)]'
                        : 'text-slate-400 group-hover:text-teal-700 group-hover:scale-110'
                    }`}
                    strokeWidth={isActive ? 2.6 : 2.2}
                  />
                </motion.div>

                {/* Dancing Letters on Active Idle (after 3 seconds) */}
                <DancingMenuText
                  text={item.label}
                  isActive={isActive}
                  isIdle={isIdle}
                  MenuIcon={Icon}
                />
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="p-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
              alt="Azizbek"
              className="w-9 h-9 rounded-full object-cover border border-slate-200"
            />
            <div>
              <div className="text-xs font-bold text-slate-800 leading-tight">Azizbek</div>
              <div className="text-[10px] text-slate-400">Super Admin</div>
            </div>
          </div>
          <button
            onClick={() => alert('Sessiya yakunlandi.')}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Chiqish"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar (Floating Card with spacing from sidebar and content) */}
        <header className="h-16 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-sm rounded-2xl px-6 flex items-center justify-between sticky top-3.5 z-10 mb-3.5">
          {/* Search bar */}
          <div className="relative w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Klinika, foydalanuvchi, to‘lov, ID bo‘yicha qidirish..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
            />
          </div>

          {/* Right Header Badges */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>23-sentabr, 2026 Seshanba</span>
            </div>

            <NavLink to="/notifications" className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {notificationCount}
              </span>
            </NavLink>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-xl cursor-pointer">
              <span className="text-sm">🇺🇿</span>
              <span>UZ</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
              alt="Avatar"
              className="w-9 h-9 rounded-full object-cover border border-teal-500/30 ring-2 ring-teal-500/10 cursor-pointer"
            />
          </div>
        </header>

        {/* Routed Page Outlet */}
        <div className="max-w-[1600px] w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
