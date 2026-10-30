import React from 'react';
import { 
  ShieldCheck, FileSpreadsheet, UserPlus, Search, Shield, 
  Phone, Edit2, Trash2 
} from 'lucide-react';

interface ManagerEmployeesTabProps {
  usersList: any[];
  userSearch: string;
  setUserSearch: (val: string) => void;
  onExportExcel: () => void;
  onOpenNewUser: () => void;
  onEditUser: (user: any) => void;
  onDeleteUser: (user: any) => void;
}

export const ManagerEmployeesTab: React.FC<ManagerEmployeesTabProps> = ({
  usersList,
  userSearch,
  setUserSearch,
  onExportExcel,
  onOpenNewUser,
  onEditUser,
  onDeleteUser,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#172B4D]">Xodimlar va Rollar Boshqaruvi</h3>
              <p className="text-xs text-slate-500">Klinika xodimlari, shifokorlar, kassirlar va tizim administratorlari (PostgreSQL users)</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onExportExcel}
            className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs transition cursor-pointer"
            title="Xodimlar ro'yxatini Excel (.csv) formatida yuklab olish"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excelga eksport</span>
          </button>

          <button
            onClick={onOpenNewUser}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shadow-indigo-500/20 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Yangi xodim qo'shish</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Xodim F.I.Sh., login yoki roli bo'yicha qidirish..."
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold px-2">
          <span>Jami xodimlar: <strong className="text-slate-800">{usersList.length}</strong> nafar</span>
          <span>•</span>
          <span>Shifokorlar: <strong className="text-blue-600">{usersList.filter(u => u.role_code === 'DOCTOR').length}</strong></span>
          <span>•</span>
          <span>Kassirlar: <strong className="text-emerald-600">{usersList.filter(u => u.role_code === 'CASHIER' || u.role_name?.toLowerCase().includes('kassir')).length}</strong></span>
        </div>
      </div>

      {/* Users Table (Spisok - bosganda tahrirlash ochiladi) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-6">
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Xodim F.I.Sh.</th>
                <th className="py-3.5 px-4">Login (Username)</th>
                <th className="py-3.5 px-4">Tizimdagi Roli</th>
                <th className="py-3.5 px-4">Telefon</th>
                <th className="py-3.5 px-4">Holati</th>
                <th className="py-3.5 px-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usersList
                .filter(u => {
                  const q = userSearch.toLowerCase();
                  return (
                    (u.full_name || '').toLowerCase().includes(q) ||
                    (u.username || '').toLowerCase().includes(q) ||
                    (u.role_code || '').toLowerCase().includes(q) ||
                    (u.phone || '').toLowerCase().includes(q)
                  );
                })
                .map((u: any) => (
                  <tr
                    key={u.id}
                    onClick={() => onEditUser(u)}
                    className="hover:bg-indigo-50/50 cursor-pointer transition group"
                    title="Tahrirlash va ma'lumotlarni ko'rish uchun bosing"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs text-white shadow-2xs group-hover:scale-105 transition ${
                          u.role_code === 'MANAGER' ? 'bg-gradient-to-br from-blue-600 to-indigo-700' :
                          u.role_code === 'CASHIER' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                          'bg-gradient-to-br from-purple-500 to-indigo-600'
                        }`}>
                          {u.full_name?.substring(0, 2).toUpperCase() || 'US'}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 text-xs group-hover:text-indigo-600 transition block">
                            {u.full_name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {u.id}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 font-bold">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                        @{u.username}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold ${
                        u.role_code === 'MANAGER' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                        u.role_code === 'CASHIER' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        'bg-purple-100 text-purple-700 border border-purple-200'
                      }`}>
                        <Shield className="w-3 h-3" />
                        <span>{u.role_name || u.role_code || 'Xodim'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{u.phone || '-'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Faol
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onEditUser(u)}
                          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                          title="Tahrirlash"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteUser(u)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
