import React from 'react';
import {
  Users,
  Clock,
  Stethoscope,
  CheckCircle2,
  BarChart3,
  Wallet,
  Radio,
  FileText,
  UserPlus,
  Ticket,
  LayoutGrid,
} from 'lucide-react';

interface ManagerDashboardTabProps {
  todayTotal: number;
  waitingTotal: number;
  inConsultationTotal: number;
  completedTotal: number;
  hourlyData: any[];
  hoveredHour: any;
  setHoveredHour: (d: any) => void;
  pb: any;
  activePaySegment: 'all' | 'cash' | 'card' | 'online';
  setActivePaySegment: (seg: 'all' | 'cash' | 'card' | 'online') => void;
  allTicketsList: any[];
  setSearchParams: (params: any) => void;
  time: string;
  doctorsList: any[];
  paymentsList: any[];
  setIsNewPatientModalOpen: (open: boolean) => void;
  navigate: (path: string) => void;
  setEditingDoctorId: (id: any) => void;
  setDoctorForm: (form: any) => void;
  setIsDoctorModalOpen: (open: boolean) => void;
  handleOpenServiceModal: () => void;
}

export const ManagerDashboardTab: React.FC<ManagerDashboardTabProps> = ({
  todayTotal,
  waitingTotal,
  inConsultationTotal,
  completedTotal,
  hourlyData,
  hoveredHour,
  setHoveredHour,
  pb,
  activePaySegment,
  setActivePaySegment,
  allTicketsList,
  setSearchParams,
  time,
  doctorsList,
  paymentsList,
  setIsNewPatientModalOpen,
  navigate,
  setEditingDoctorId,
  setDoctorForm,
  setIsDoctorModalOpen,
  handleOpenServiceModal,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Heading */}
      <div>
        <h2 className="text-xl font-bold text-[#172B4D] tracking-tight">Klinika boshqaruvi</h2>
        <p className="text-xs text-[#64748B] mt-0.5 font-medium">Bugungi holat va tezkor statistikalar</p>
      </div>

      {/* ROW 1: 4 TOP METRIC CARDS (100% 1:1 WITH Meneger.png) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Bugungi bemorlar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1677FF] flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">Bugungi bemorlar</div>
              <div className="text-3xl font-black text-[#172B4D] leading-tight">
                {todayTotal}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center text-xs font-bold text-emerald-600">
              ↑ +12%
            </span>
            <div className="text-[11px] text-slate-400 mt-0.5">Kecha: 114</div>
          </div>
        </div>

        {/* 2. Kutayotganlar */}
        <div className="bg-[#EBF9F1] rounded-2xl p-4 border border-[#C1E9D2] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white text-emerald-600 flex items-center justify-center shadow-xs">
              <Clock className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-600">Kutayotganlar</div>
              <div className="text-3xl font-black text-[#172B4D] leading-tight">
                {waitingTotal}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center text-xs font-bold text-rose-500">
              ↑ +5%
            </span>
            <div className="text-[11px] text-slate-400 mt-0.5">Kecha: 23</div>
          </div>
        </div>

        {/* 3. Qabulda */}
        <div className="bg-[#F3F0FF] rounded-2xl p-4 border border-[#E4DCFD] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white text-purple-600 flex items-center justify-center shadow-xs">
              <Stethoscope className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-600">Qabulda</div>
              <div className="text-3xl font-black text-[#172B4D] leading-tight">
                {inConsultationTotal}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center text-xs font-bold text-emerald-600">
              ↓ -20%
            </span>
            <div className="text-[11px] text-slate-400 mt-0.5">Kecha: 10</div>
          </div>
        </div>

        {/* 4. Yakunlangan */}
        <div className="bg-[#FFFBEB] rounded-2xl p-4 border border-[#FDE68A] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white text-amber-500 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-600">Yakunlangan</div>
              <div className="text-3xl font-black text-[#172B4D] leading-tight">
                {completedTotal}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center text-xs font-bold text-emerald-600">
              ↑ +14%
            </span>
            <div className="text-[11px] text-slate-400 mt-0.5">Kecha: 84</div>
          </div>
        </div>
      </div>

      {/* ROW 2: HOURLY CHART + TO'LOVLAR DONUT + JORIY NAVBATLAR (ANIMATED & REAL DATA) */}
      <div className="grid grid-cols-12 gap-5">
        {/* 1. Soatlik bemorlar soni (Animated Bar Chart) (Col span 5) */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#172B4D]">Soatlik bemorlar oqimi</h3>
                <p className="text-[11px] text-slate-400">Kun davomida qabul qilingan bemorlar taqsimoti</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Real vaqt</span>
            </div>
          </div>

          {/* Hourly Chart Container */}
          <div className="relative pt-6 pb-1">
            {/* Background Guide Lines */}
            <div className="absolute inset-0 top-6 bottom-7 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="border-b border-dashed border-slate-200 w-full"></div>
              <div className="border-b border-dashed border-slate-200 w-full"></div>
              <div className="border-b border-dashed border-slate-200 w-full"></div>
            </div>

            <div className="h-44 flex items-end justify-between gap-1.5 px-1 relative z-10">
              {hourlyData.map((d: any, i: number) => {
                const count = Number(d.count) || 0;
                const maxVal = Math.max(...hourlyData.map((item: any) => Number(item.count) || 0), 5);
                const heightPercent = Math.max(8, Math.round((count / maxVal) * 100));
                const isHovered = hoveredHour?.hour === d.hour;
                const isPeak = count > 0 && count === maxVal;

                return (
                  <div 
                    key={i} 
                    className="flex-1 flex flex-col items-center gap-2 group h-full justify-end relative cursor-pointer"
                    onMouseEnter={() => setHoveredHour(d)}
                    onMouseLeave={() => setHoveredHour(null)}
                  >
                    {/* Floating Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg shadow-lg whitespace-nowrap z-30 pointer-events-none flex items-center gap-1 animate-in fade-in zoom-in duration-150">
                        <span className="font-bold text-amber-300">{count}</span> bemor
                        <span className="text-slate-400">({d.hour})</span>
                      </div>
                    )}

                    {/* Top count pill */}
                    {count > 0 && (
                      <span className={`text-[9px] font-extrabold transition-all duration-300 ${
                        isPeak ? 'text-blue-600 font-black scale-110' : 'text-slate-500'
                      }`}>
                        {count}
                      </span>
                    )}

                    {/* Bar with smooth animation */}
                    <div className="w-full relative flex items-end justify-center h-full">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[22px] rounded-t-lg transition-all duration-700 ease-out ${
                          isPeak
                            ? 'bg-gradient-to-t from-blue-600 to-indigo-500 shadow-md shadow-blue-500/30'
                            : count > 0
                            ? 'bg-gradient-to-t from-blue-500 to-sky-400 group-hover:from-blue-600 group-hover:to-sky-500 shadow-xs'
                            : 'bg-slate-100 group-hover:bg-slate-200'
                        } ${isHovered ? 'brightness-110 -translate-y-1' : ''}`}
                      />
                    </div>

                    <span className={`text-[10px] font-semibold transition-colors ${
                      isHovered ? 'text-blue-600 font-bold' : 'text-slate-400'
                    }`}>
                      {d.hour.split(':')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>Eng yuqori yuklama</span>
            </span>
            <span className="font-bold text-slate-700 font-mono">
              Jami qabul: {hourlyData.reduce((acc: number, cur: any) => acc + (Number(cur.count) || 0), 0)} ta
            </span>
          </div>
        </div>

        {/* 2. To'lovlar Donut Card (Col span 3) */}
        <div className="col-span-12 lg:col-span-3 bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#172B4D]">To‘lovlar</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bugun</span>
          </div>

          <div className="my-1">
            <div className="text-xs text-slate-400 font-medium">Jami tushum:</div>
            <div className="text-xl font-black text-emerald-600 tracking-tight">
              {Number(pb.total || 0).toLocaleString()} <span className="text-xs font-semibold text-emerald-700">so‘m</span>
            </div>
          </div>

          {/* Donut and Legend */}
          <div className="flex items-center justify-between gap-2 my-1">
            {/* Legend */}
            <div className="space-y-1.5 text-xs flex-1">
              <div 
                onMouseEnter={() => setActivePaySegment('cash')}
                onMouseLeave={() => setActivePaySegment('all')}
                className={`p-1.5 rounded-xl transition cursor-pointer ${
                  activePaySegment === 'cash' ? 'bg-emerald-50 scale-105' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00B96B]"></span>
                    <span className="text-slate-700 font-semibold text-[11px]">Naqd</span>
                  </div>
                  <span className="font-bold text-slate-900 text-xs">{pb.cashPercent}%</span>
                </div>
                <div className="text-[10px] text-slate-400 pl-4 font-mono">{Number(pb.cash || 0).toLocaleString()}</div>
              </div>

              <div 
                onMouseEnter={() => setActivePaySegment('card')}
                onMouseLeave={() => setActivePaySegment('all')}
                className={`p-1.5 rounded-xl transition cursor-pointer ${
                  activePaySegment === 'card' ? 'bg-blue-50 scale-105' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0084FF]"></span>
                    <span className="text-slate-700 font-semibold text-[11px]">Karta</span>
                  </div>
                  <span className="font-bold text-slate-900 text-xs">{pb.cardPercent}%</span>
                </div>
                <div className="text-[10px] text-slate-400 pl-4 font-mono">{Number(pb.card || 0).toLocaleString()}</div>
              </div>

              <div 
                onMouseEnter={() => setActivePaySegment('online')}
                onMouseLeave={() => setActivePaySegment('all')}
                className={`p-1.5 rounded-xl transition cursor-pointer ${
                  activePaySegment === 'online' ? 'bg-purple-50 scale-105' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]"></span>
                    <span className="text-slate-700 font-semibold text-[11px]">Onlayn</span>
                  </div>
                  <span className="font-bold text-slate-900 text-xs">{pb.onlinePercent}%</span>
                </div>
                <div className="text-[10px] text-slate-400 pl-4 font-mono">{Number(pb.online || 0).toLocaleString()}</div>
              </div>
            </div>

            {/* SVG Animated Real Donut */}
            {(() => {
              const circ = 238.76;
              const cashLen = ((pb.cashPercent || 0) / 100) * circ;
              const cardLen = ((pb.cardPercent || 0) / 100) * circ;
              const onlineLen = ((pb.onlinePercent || 0) / 100) * circ;
              const cashOff = 0;
              const cardOff = -cashLen;
              const onlineOff = -(cashLen + cardLen);

              return (
                <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
                  <svg className="w-full h-full -rotate-90 transition-transform duration-500" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F1F5F9" strokeWidth="16" />
                    {cashLen > 0 && (
                      <circle
                        cx="50" cy="50" r="38" fill="transparent"
                        stroke="#00B96B"
                        strokeWidth={activePaySegment === 'cash' ? 19 : 16}
                        strokeDasharray={`${cashLen} ${circ}`}
                        strokeDashoffset={cashOff}
                        className="transition-all duration-700 cursor-pointer"
                      />
                    )}
                    {cardLen > 0 && (
                      <circle
                        cx="50" cy="50" r="38" fill="transparent"
                        stroke="#0084FF"
                        strokeWidth={activePaySegment === 'card' ? 19 : 16}
                        strokeDasharray={`${cardLen} ${circ}`}
                        strokeDashoffset={cardOff}
                        className="transition-all duration-700 cursor-pointer"
                      />
                    )}
                    {onlineLen > 0 && (
                      <circle
                        cx="50" cy="50" r="38" fill="transparent"
                        stroke="#8B5CF6"
                        strokeWidth={activePaySegment === 'online' ? 19 : 16}
                        strokeDasharray={`${onlineLen} ${circ}`}
                        strokeDashoffset={onlineOff}
                        className="transition-all duration-700 cursor-pointer"
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-xs font-black text-[#172B4D] leading-none">
                      {activePaySegment === 'cash' ? `${pb.cashPercent}%` :
                       activePaySegment === 'card' ? `${pb.cardPercent}%` :
                       activePaySegment === 'online' ? `${pb.onlinePercent}%` :
                       `${(Number(pb.total || 0) / 1000000).toFixed(1)}M`}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                      {activePaySegment === 'cash' ? 'Naqd' :
                       activePaySegment === 'card' ? 'Karta' :
                       activePaySegment === 'online' ? 'Onlayn' : "so'm"}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* 3. Joriy navbatlar (real vaqt) (Col span 4) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#1677FF] animate-pulse" />
              <h3 className="text-sm font-bold text-[#172B4D]">Joriy navbatlar (real vaqt)</h3>
            </div>
            <button
              onClick={() => setSearchParams({ tab: 'navbatlar' })}
              className="text-xs font-semibold text-[#1677FF] hover:underline cursor-pointer"
            >
              Barchasi
            </button>
          </div>

          {/* List of live queues 100% from PostgreSQL */}
          <div className="divide-y divide-slate-100 space-y-1">
            {(() => {
              const activeStatuses = ['CALLED', 'IN_PROGRESS', 'WAITING'];
              const activeTickets = allTicketsList
                .filter((t: any) => activeStatuses.includes(t.status))
                .sort((a: any, b: any) => {
                  const order: Record<string, number> = { CALLED: 1, IN_PROGRESS: 2, WAITING: 3 };
                  return (order[a.status] || 4) - (order[b.status] || 4);
                });

              const displayTickets = activeTickets.length >= 5
                ? activeTickets.slice(0, 5)
                : [
                    ...activeTickets,
                    ...allTicketsList.filter((t: any) => !activeStatuses.includes(t.status)).slice(0, 5 - activeTickets.length)
                  ];

              if (displayTickets.length === 0) {
                return (
                  <div className="py-7 text-center text-slate-400">
                    <Radio className="w-7 h-7 mx-auto mb-2 text-blue-400 animate-pulse" />
                    <p className="text-xs font-bold text-slate-700">Hozircha navbatlar mavjud emas</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Yangi talon berilganda bu yerda real vaqtda yangilanadi</p>
                  </div>
                );
              }

              return displayTickets.map((q: any, idx: number) => {
                const num = (q.full_number || 'A-001').replace('-', '');
                const isCalled = q.status === 'CALLED';
                const isInProg = q.status === 'IN_PROGRESS' || q.status === 'Qabulda';
                const isWaiting = q.status === 'WAITING';
                const isCompleted = q.status === 'COMPLETED';

                const badgeCls = isCalled ? 'bg-[#FEF3C7] text-[#D97706] ring-1 ring-amber-400' :
                  isInProg ? 'bg-[#DCFCE7] text-[#16A34A] ring-1 ring-emerald-400' :
                  num.startsWith('A') ? 'bg-[#FEE2E2] text-[#DC2626]' :
                  num.startsWith('K') ? 'bg-[#F3E8FF] text-[#9333EA]' :
                  num.startsWith('N') ? 'bg-[#FFEDD5] text-[#EA580C]' : 'bg-[#DBEAFE] text-[#2563EB]';

                return (
                  <div key={q.id || idx} className="flex items-center justify-between py-2.5 hover:bg-slate-50/80 px-2 rounded-xl transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-black font-mono shrink-0 shadow-xs ${badgeCls}`}>
                        {q.full_number || num}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#172B4D] truncate flex items-center gap-1.5">
                          <span>{q.patient_name || 'Bemor'}</span>
                          {q.cabinet_number && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded font-mono font-bold">
                              {q.cabinet_number}-xona
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {q.specialty_name || q.service_name || 'Shifokor qabuli'}
                          {q.doctor_name && <span className="text-slate-500 font-medium"> • {q.doctor_name}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <div className="text-[11px] text-slate-400 font-mono mb-0.5">
                        {q.issued_at ? new Date(q.issued_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : time}
                      </div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isCalled ? 'bg-[#FEF3C7] text-[#D97706] font-black animate-pulse' :
                        isInProg ? 'bg-[#DCFCE7] text-[#16A34A]' :
                        isWaiting ? 'bg-[#DBEAFE] text-[#2563EB]' :
                        isCompleted ? 'bg-purple-100 text-purple-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {isCalled ? 'Chaqirilmoqda' : isInProg ? 'Qabulda' : isWaiting ? 'Kutmoqda' : isCompleted ? 'Yakunlangan' : q.status}
                      </span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* ROW 3: SHIFOKORLAR HOLATI + SO'NGGI TO'LOVLAR TABLES (100% 1:1 WITH Meneger.png) */}
      <div className="grid grid-cols-12 gap-5">
        {/* 1. Shifokorlar holati (Col span 6) */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#1677FF]" />
              <h3 className="text-sm font-bold text-[#172B4D]">Shifokorlar holati</h3>
            </div>
            <button
              onClick={() => setSearchParams({ tab: 'shifokorlar' })}
              className="text-xs font-semibold text-[#1677FF] hover:underline cursor-pointer"
            >
              Barchasi
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-2.5">#</th>
                  <th className="pb-2.5">Shifokor</th>
                  <th className="pb-2.5">Mutaxassislik</th>
                  <th className="pb-2.5">Kabinet</th>
                  <th className="pb-2.5">Kutmoqda</th>
                  <th className="pb-2.5 text-right">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctorsList.slice(0, 5).map((d, idx) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 font-bold text-[#172B4D]">{d.display_name}</td>
                    <td className="py-2.5 text-slate-600">{d.specialty_name || 'Umumiy'}</td>
                    <td className="py-2.5 text-slate-600 font-mono">{d.cabinet_number || d.room_number || '1'}</td>
                    <td className="py-2.5 font-bold text-rose-600 font-mono">{d.waiting_count || 0}</td>
                    <td className="py-2.5 text-right">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#16A34A]">
                        Faol
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. So'nggi to'lovlar (Col span 6) */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-[#172B4D]">So‘nggi to‘lovlar</h3>
            </div>
            <button
              onClick={() => setSearchParams({ tab: 'tolovlar' })}
              className="text-xs font-semibold text-[#1677FF] hover:underline cursor-pointer"
            >
              Barchasi
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-2.5">Vaqt</th>
                  <th className="pb-2.5">Bemor</th>
                  <th className="pb-2.5">Summa</th>
                  <th className="pb-2.5 text-right">Usul</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paymentsList.slice(0, 5).map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 text-slate-400 font-mono">
                      {p.created_at ? new Date(p.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '14:20'}
                    </td>
                    <td className="py-2.5 font-bold text-[#172B4D]">{p.patient_name || 'Bemor'}</td>
                    <td className="py-2.5 font-bold text-[#172B4D] font-mono">
                      {Number(p.amount).toLocaleString()} so'm
                    </td>
                    <td className="py-2.5 text-right">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.method === 'CASH' ? 'bg-[#DCFCE7] text-[#16A34A]' :
                        p.method === 'CARD' ? 'bg-[#DBEAFE] text-[#2563EB]' : 'bg-[#F3E8FF] text-[#9333EA]'
                      }`}>
                        {p.method === 'CASH' ? 'Naqd' : p.method === 'CARD' ? 'Karta' : 'Onlayn'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ROW 4: TEZKOR AMALLAR */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1677FF] flex items-center justify-center font-bold text-sm shadow-xs">
            ⚡
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#172B4D]">Tezkor amallar</h3>
            <p className="text-xs text-slate-400">Yangi bemor, navbat taloni, shifokor va xizmatlarni boshqarish</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Yangi bemor */}
          <button
            onClick={() => setIsNewPatientModalOpen(true)}
            className="bg-[#0084FF] hover:bg-blue-600 text-white rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 transition shadow-sm hover:shadow-md cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold">Yangi bemor</span>
          </button>

          {/* Talon berish */}
          <button
            onClick={() => navigate('/cashier')}
            className="bg-[#00B96B] hover:bg-emerald-600 text-white rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 transition shadow-sm hover:shadow-md cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition">
              <Ticket className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold">Talon berish</span>
          </button>

          {/* Shifokor qo'shish */}
          <button
            onClick={() => {
              setEditingDoctorId(null);
              setDoctorForm({ displayName: '', specialtyId: '', cabinetNumber: '', phone: '+998 ', address: '', username: '', password: 'doctor123' });
              setIsDoctorModalOpen(true);
            }}
            className="bg-[#8B5CF6] hover:bg-purple-600 text-white rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 transition shadow-sm hover:shadow-md cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold">Shifokor qo‘shish</span>
          </button>

          {/* Xizmat qo'shish */}
          <button
            onClick={() => handleOpenServiceModal()}
            className="bg-[#F59E0B] hover:bg-amber-600 text-white rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 transition shadow-sm hover:shadow-md cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold">Xizmat qo‘shish</span>
          </button>
        </div>
      </div>
    </div>
  );
};
