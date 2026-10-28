import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight, ShieldCheck, Stethoscope, Ticket, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserApiClient } from '../api/client';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError('Login va parolni kiriting');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await UserApiClient.login(identifier, password);
      if (res.data?.user) {
        const role = res.data.user.role;
        localStorage.setItem('sadaf_user', JSON.stringify(res.data.user));

        if (role === 'CASHIER') {
          navigate('/cashier');
        } else if (role === 'DOCTOR') {
          navigate('/doctor');
        } else {
          navigate('/manager');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Login yoki parol noto‘g‘ri');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRole = (userVal: string, passVal: string) => {
    setIdentifier(userVal);
    setPassword(passVal);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4 select-none font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 space-y-6">
        {/* Logo and Brand */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[#0F766E]/10 border border-[#0F766E]/30 rounded-2xl flex items-center justify-center mx-auto text-[#0F766E] shadow-sm">
            <svg className="w-8 h-8 fill-current text-[#0F766E]" viewBox="0 0 24 24">
              <path d="M12 2C7.58 2 4 5.58 4 10c0 2.5 1.15 4.74 2.95 6.22.42.35.68.87.68 1.42V19c0 1.66 1.34 3 3 3h.5c.83 0 1.5-.67 1.5-1.5v-3.5h.74v3.5c0 .83.67 1.5 1.5 1.5h.5c1.66 0 3-1.34 3-3v-1.36c0-.55.26-1.07.68-1.42C20.85 14.74 22 12.5 22 10c0-4.42-3.58-8-8-8zm-2 15h-.5c-.83 0-1.5-.67-1.5-1.5v-.5h2v2zm6 0h-.5v-2h2v.5c0 .83-.67 1.5-1.5 1.5z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#172B4D] tracking-tight">Klinika</h1>
            <p className="text-xs text-[#0F766E] font-bold uppercase tracking-widest">Elektron Navbat Tizimi</p>
          </div>
        </div>

        {/* Quick Role Fillers */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
            Tezkor kirish (Rolni tanlang):
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickRole('admin', 'admin123')}
              className={`p-2 rounded-xl text-xs font-bold border transition flex flex-col items-center gap-1 ${
                identifier === 'admin'
                  ? 'bg-[#1677FF] text-white border-[#1677FF] shadow-sm'
                  : 'bg-[#F5F7FA] text-[#172B4D] border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Menejer</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickRole('kassir', 'kassir123')}
              className={`p-2 rounded-xl text-xs font-bold border transition flex flex-col items-center gap-1 ${
                identifier === 'kassir'
                  ? 'bg-[#00B96B] text-white border-[#00B96B] shadow-sm'
                  : 'bg-[#F5F7FA] text-[#172B4D] border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>Kassir</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickRole('doctor', 'doctor123')}
              className={`p-2 rounded-xl text-xs font-bold border transition flex flex-col items-center gap-1 ${
                identifier === 'doctor'
                  ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-sm'
                  : 'bg-[#F5F7FA] text-[#172B4D] border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Shifokor</span>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#172B4D]">Login yoki Telefon raqami:</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="Masalan: admin, kassir, doctor"
                className="w-full pl-10 pr-4 py-2.5 bg-[#F5F7FA] border border-slate-200 rounded-xl text-xs font-semibold text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#1677FF]/30 focus:border-[#1677FF]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#172B4D]">Parol:</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-[#F5F7FA] border border-slate-200 rounded-xl text-xs font-semibold text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#1677FF]/30 focus:border-[#1677FF]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#1677FF] hover:bg-[#0958D9] disabled:bg-slate-300 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Kirilmoqda...</span>
            ) : (
              <>
                <span>Tizimga kirish</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <a
            href="http://localhost:3002"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-[#0F766E] hover:underline"
          >
            📺 Katta monitor TV Tablosini ochish (Port: 3002) &rarr;
          </a>
        </div>
      </div>
    </div>
  );
};
