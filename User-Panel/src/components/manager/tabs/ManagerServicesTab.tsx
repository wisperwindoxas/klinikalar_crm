import React from 'react';
import { 
  Stethoscope, FileSpreadsheet, Plus, Tag, DollarSign, CreditCard, 
  Users, Search, Award, Clock, Edit2, Trash2 
} from 'lucide-react';

interface ManagerServicesTabProps {
  servicesList: any[];
  specialtiesList: any[];
  serviceSearch: string;
  setServiceSearch: (val: string) => void;
  serviceSpecialtyFilter: string;
  setServiceSpecialtyFilter: (val: string) => void;
  onExportExcel: () => void;
  onOpenServiceModal: (service?: any) => void;
  onDeleteService: (service: any) => void;
}

export const ManagerServicesTab: React.FC<ManagerServicesTabProps> = ({
  servicesList,
  specialtiesList,
  serviceSearch,
  setServiceSearch,
  serviceSpecialtyFilter,
  setServiceSpecialtyFilter,
  onExportExcel,
  onOpenServiceModal,
  onDeleteService,
}) => {
  const filteredServices = servicesList.filter(s => {
    const matchesSearch = !serviceSearch || 
      s.name?.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      s.specialty_name?.toLowerCase().includes(serviceSearch.toLowerCase());
    const matchesSpec = serviceSpecialtyFilter === 'ALL' || s.specialty_id === serviceSpecialtyFilter;
    return matchesSearch && matchesSpec;
  });

  const totalServicesCount = servicesList.length;
  const avgPrice = totalServicesCount > 0 
    ? Math.round(servicesList.reduce((acc, s) => acc + (Number(s.price || s.base_price) || 0), 0) / totalServicesCount)
    : 0;
  const prePayCount = servicesList.filter(s => s.payment_policy === 'PAY_BEFORE_CALL' || s.payment_policy === 'PAY_BEFORE_TICKET').length;
  const totalDoctorsWithServices = servicesList.reduce((acc, s) => acc + (Number(s.doctor_count) || (Array.isArray(s.doctors) ? s.doctors.length : 0)), 0);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-medical-gradient rounded-3xl p-6 text-white shadow-xl shadow-medical-blue/20 border border-white/25 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-56 h-56 bg-white/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-48 h-48 bg-medical-blue-dark/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/25 backdrop-blur-md text-white border border-white/30 text-xs font-semibold mb-2 shadow-xs transition">
            <Stethoscope className="w-3.5 h-3.5 text-medical-turquoise" />
            <span>Tibbiy Xizmatlar & Mutaxassisliklar</span>
          </div>
          <h3 className="text-2xl font-black tracking-tight text-white drop-shadow-xs">Klinika Xizmatlari Jurnali</h3>
          <p className="text-xs text-white/95 max-w-xl mt-1 leading-relaxed">
            Barcha tibbiy xizmatlar narxi, to'lov siyosati va har bir xizmat turiga biriktirilgan shifokorlar ro'yxati (PostgreSQL)
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={onExportExcel}
            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 text-xs font-bold rounded-2xl flex items-center gap-2 transition shadow-sm cursor-pointer active:scale-95"
            title="Barcha xizmatlarni .xlsx formatida yuklab olish"
          >
            <FileSpreadsheet className="w-4 h-4 text-medical-turquoise" />
            <span>Excelga eksport (.xlsx)</span>
          </button>

          <button
            onClick={() => onOpenServiceModal()}
            className="px-5 py-2.5 bg-white hover:bg-slate-50 text-medical-blue-dark text-xs font-black rounded-2xl flex items-center gap-2 shadow-lg shadow-medical-blue-dark/20 border border-white/80 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-medical-blue-dark stroke-[2.5]" />
            <span>Yangi xizmat</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-medical-blue shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400">Jami xizmatlar</div>
            <div className="text-xl font-black text-slate-800">{totalServicesCount} ta</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-medical-turquoise-dark shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400">O'rtacha narx</div>
            <div className="text-xl font-black text-slate-800 font-mono">{avgPrice.toLocaleString()} <span className="text-xs font-normal text-slate-400">so'm</span></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400">Oldindan to'lov</div>
            <div className="text-xl font-black text-slate-800">{prePayCount} ta</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400">Biriktirilgan shifokorlar</div>
            <div className="text-xl font-black text-slate-800">{totalDoctorsWithServices} nafar</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Xizmat nomi yoki mutaxassislik..."
            value={serviceSearch}
            onChange={e => setServiceSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-medical-blue/20 focus:border-medical-blue transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              onClick={() => setServiceSpecialtyFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                serviceSpecialtyFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Barcha yo'nalishlar
            </button>
            {specialtiesList.slice(0, 5).map((spec: any) => (
              <button
                key={spec.id}
                onClick={() => setServiceSpecialtyFilter(spec.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  serviceSpecialtyFilter === spec.id
                    ? 'bg-medical-blue text-white shadow-xs shadow-medical-blue/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {spec.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 w-12 text-center">№</th>
                <th className="py-3.5 px-4">Xizmat nomi</th>
                <th className="py-3.5 px-4">Mutaxassislik</th>
                <th className="py-3.5 px-4">Narxi</th>
                <th className="py-3.5 px-4">To‘lov tartibi</th>
                <th className="py-3.5 px-4">Biriktirilgan shifokorlar</th>
                <th className="py-3.5 px-4">Holat</th>
                <th className="py-3.5 px-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Tag className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <div className="font-semibold text-slate-600 text-sm">Xizmatlar topilmadi</div>
                    <p className="text-xs text-slate-400 mt-0.5">Qidiruv yoki filtr mezonlarini o'zgartirib ko'ring</p>
                  </td>
                </tr>
              ) : (
                filteredServices.map((srv: any, index: number) => {
                  const docCount = Number(srv.doctor_count) || (Array.isArray(srv.doctors) ? srv.doctors.length : 0);
                  return (
                    <tr 
                      key={srv.id} 
                      onClick={() => onOpenServiceModal(srv)}
                      className="hover:bg-emerald-50/40 transition cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400 group-hover:text-emerald-700">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                            <Tag className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition flex items-center gap-2">
                              <span>{srv.name}</span>
                              <span className="text-[10px] font-normal px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-500">
                                {srv.duration_minutes || 15} daq
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">{srv.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold text-[11px]">
                          <Award className="w-3.5 h-3.5 text-emerald-600" />
                          {srv.specialty_name || 'Umumiy'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-black text-emerald-700 text-sm">
                          {Number(srv.base_price || srv.price).toLocaleString('uz-UZ')} <span className="text-[10px] text-slate-400 font-normal">so‘m</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          srv.payment_policy === 'PAY_BEFORE_CALL' || srv.payment_policy === 'PAY_BEFORE_TICKET'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {srv.payment_policy === 'PAY_BEFORE_CALL' || srv.payment_policy === 'PAY_BEFORE_TICKET' ? (
                            <>
                              <CreditCard className="w-3 h-3 text-amber-700" />
                              <span>Oldindan to‘lov</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-blue-700" />
                              <span>Xizmatdan so‘ng</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
                            docCount > 0 
                              ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
                            <span>{docCount} ta shifokor</span>
                          </span>

                          {Array.isArray(srv.doctors) && srv.doctors.length > 0 && (
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {srv.doctors.slice(0, 3).map((d: any, i: number) => (
                                <div 
                                  key={d.id || i}
                                  title={`${d.display_name} (${d.room_number}-xona)`}
                                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-200 text-slate-700 font-bold text-[9px] flex items-center justify-center"
                                >
                                  {d.display_name?.replace('Dr. ', '').charAt(0)}
                                </div>
                              ))}
                              {srv.doctors.length > 3 && (
                                <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-purple-600 text-white font-bold text-[9px] flex items-center justify-center">
                                  +{srv.doctors.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Faol
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenServiceModal(srv)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Tahrirlash va Shifokorlarni ko'rish"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteService(srv)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="O'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
