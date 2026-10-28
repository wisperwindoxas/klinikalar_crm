import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Stethoscope, Ticket, Users, GitBranch, LayoutGrid,
  CreditCard, BarChart2, FileText, Settings, Bell, Clock,
  Search, Plus, LogOut, UserPlus, ChevronDown
} from 'lucide-react';
import { UserApiClient } from '../api/client';
import { NewPatientModal } from '../components/NewPatientModal';

export const UserLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedBranch, setSelectedBranch] = useState('branch_sadaf_main');
  const [currentTime, setCurrentTime] = useState('12:34');
  const [clinicName, setClinicName] = useState('SADAF KLINIKA');
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);

  useEffect(() => {
    // Clock
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toTimeString().substring(0, 5));
    }, 1000);

    // Initial user login
    UserApiClient.login('azizbek@sadaf.uz', 'sadaf123').then(res => {
      if (res.data?.clinic?.name) {
        setClinicName(res.data.clinic.name);
      }
    });

    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { path: '/operator', label: 'Kassir (Qabul & Talon)', icon: Ticket },
    { path: '/doctor', label: 'Shifokor (Navbat boshqaruvi)', icon: Stethoscope },
    { path: '/', label: 'Menejer (Dashboard)', icon: Home },
    { path: '/patients', label: 'Bemorlar bazasi (EMR)', icon: Users },
    { path: '/doctors', label: 'Shifokorlar (20+)', icon: Stethoscope },
    { path: '/services', label: 'Xizmatlar & To‘lov siyosati', icon: LayoutGrid },
    { path: '/payments', label: 'To‘lovlar & Kassa', icon: CreditCard },
    { path: '/settings', label: 'Tizim sozlamalari', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* 1. SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col flex-shrink-0 z-20 sticky top-0 h-screen">
        {/* Brand Header */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-800">
            <svg className="w-6 h-6 fill-current text-teal-800" viewBox="0 0 24 24">
              <path d="M12 2C7.58 2 4 5.58 4 10c0 2.5 1.15 4.74 2.95 6.22.42.35.68.87.68 1.42V19c0 1.66 1.34 3 3 3h.5c.83 0 1.5-.67 1.5-1.5v-3.5h.74v3.5c0 .83.67 1.5 1.5 1.5h.5c1.66 0 3-1.34 3-3v-1.36c0-.55.26-1.07.68-1.42C20.85 14.74 22 12.5 22 10c0-4.42-3.58-8-8-8zm-2 15h-.5c-.83 0-1.5-.67-1.5-1.5v-.5h2v2zm6 0h-.5v-2h2v.5c0 .83-.67 1.5-1.5 1.5z"/>
            </svg>
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-slate-800">
              {clinicName}
            </div>
            <span className="inline-block px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200/80 rounded-full text-[9px] font-bold">
              Asosiy filiali
            </span>
          </div>
        </div>

        {/* Navigation List with NavLink */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-left ${
                  isActive
                    ? 'bg-teal-800 text-white shadow-sm shadow-teal-800/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="p-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"
              alt="Azizbek"
              className="w-9 h-9 rounded-full object-cover border border-slate-200"
            />
            <div>
              <div className="text-xs font-bold text-slate-800 leading-tight">Azizbek</div>
              <div className="text-[10px] text-slate-400">
                {location.pathname === '/doctor' ? 'Shifokor' : location.pathname === '/operator' ? 'Operator' : 'Menejer'}
              </div>
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

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="relative w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Bemor qidirish (ism, telefon, ID)..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Branch Selector */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl cursor-pointer">
              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
              <select
                value={selectedBranch}
                onChange={e => setSelectedBranch(e.target.value)}
                className="bg-transparent border-0 focus:outline-none text-xs font-bold text-slate-800 cursor-pointer"
              >
                <option value="branch_sadaf_main">Asosiy filial</option>
                <option value="branch_sadaf_chilonzor">Chilonzor filiali</option>
              </select>
            </div>

            {/* Date & Real Time Clock */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>23-sentabr, 2026 Seshanba</span>
            </div>

            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-900 font-mono">
              {currentTime}
            </div>

            <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                5
              </span>
            </button>

            {/* Action Buttons */}
            <button
              onClick={() => navigate('/operator')}
              className="px-3.5 py-2 bg-white border border-teal-600 text-teal-800 hover:bg-teal-50 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yangi qabul</span>
            </button>

            <button
              onClick={() => setIsNewPatientModalOpen(true)}
              className="px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-teal-800/20 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Yangi bemor</span>
            </button>
          </div>
        </header>

        {/* Routed Page Outlet */}
        <div className="p-8 max-w-[1600px] w-full mx-auto">
          <Outlet context={{ selectedBranch }} />
        </div>
      </main>

      <NewPatientModal
        isOpen={isNewPatientModalOpen}
        onClose={() => setIsNewPatientModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
};
