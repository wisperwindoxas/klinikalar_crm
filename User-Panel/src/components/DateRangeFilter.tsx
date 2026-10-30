import React from 'react';
import { Calendar, RotateCcw } from 'lucide-react';

export type DatePreset = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';

interface DateRangeFilterProps {
  preset: DatePreset;
  startDate: string;
  endDate: string;
  onPresetChange: (preset: DatePreset) => void;
  onDateChange: (start: string, end: string) => void;
  totalCount?: number;
  countLabel?: string;
  className?: string;
}

export const toYMD = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const isDateInRange = (
  dateStr: string | null | undefined,
  preset: DatePreset,
  startDate: string,
  endDate: string
): boolean => {
  if (preset === 'all') return true;
  if (!dateStr) return false;

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;

  const now = new Date();

  if (preset === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return d >= start && d <= end;
  }

  if (preset === 'yesterday') {
    const yest = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const start = new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 0, 0, 0, 0);
    const end = new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 23, 59, 59, 999);
    return d >= start && d <= end;
  }

  if (preset === 'week') {
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return d >= weekAgo && d <= end;
  }

  if (preset === 'month') {
    const monthAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return d >= monthAgo && d <= end;
  }

  if (preset === 'custom') {
    if (startDate && endDate) {
      const start = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T23:59:59.999`);
      return d >= start && d <= end;
    }
    if (startDate) {
      const start = new Date(`${startDate}T00:00:00`);
      return d >= start;
    }
    if (endDate) {
      const end = new Date(`${endDate}T23:59:59.999`);
      return d <= end;
    }
    return true;
  }

  return true;
};

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  preset,
  startDate,
  endDate,
  onPresetChange,
  onDateChange,
  totalCount,
  countLabel = "natija",
  className = ""
}) => {
  const handleSelectPreset = (newPreset: DatePreset) => {
    const now = new Date();
    if (newPreset === 'today') {
      const ymd = toYMD(now);
      onDateChange(ymd, ymd);
      onPresetChange('today');
    } else if (newPreset === 'yesterday') {
      const yest = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const ymd = toYMD(yest);
      onDateChange(ymd, ymd);
      onPresetChange('yesterday');
    } else if (newPreset === 'week') {
      const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      onDateChange(toYMD(weekAgo), toYMD(now));
      onPresetChange('week');
    } else if (newPreset === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      onDateChange(toYMD(monthAgo), toYMD(now));
      onPresetChange('month');
    } else if (newPreset === 'all') {
      onDateChange('', '');
      onPresetChange('all');
    }
  };

  const handleStartDateChange = (val: string) => {
    onDateChange(val, endDate);
    onPresetChange('custom');
  };

  const handleEndDateChange = (val: string) => {
    onDateChange(startDate, val);
    onPresetChange('custom');
  };

  const handleClear = () => {
    onDateChange('', '');
    onPresetChange('all');
  };

  const presets: { id: DatePreset; label: string }[] = [
    { id: 'all', label: 'Barchasi' },
    { id: 'today', label: 'Bugun' },
    { id: 'yesterday', label: 'Kecha' },
    { id: 'week', label: '1 hafta' },
    { id: 'month', label: '1 oy' },
  ];

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs ${className}`}>
      {/* 1. Preset Buttons */}
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
          {presets.map(p => {
            const isActive = preset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer select-none ${
                  isActive
                    ? 'bg-[#0084FF] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {preset === 'custom' && (
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80 text-[11px] font-bold">
            Maxsus sana
          </span>
        )}
      </div>

      {/* 2. Date Pickers & Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="date"
            value={startDate}
            onChange={e => handleStartDateChange(e.target.value)}
            className="bg-transparent border-0 text-slate-700 font-semibold focus:outline-none cursor-pointer text-xs"
            title="Boshlanish sanasi"
          />
          <span className="text-slate-300 font-bold">—</span>
          <input
            type="date"
            value={endDate}
            onChange={e => handleEndDateChange(e.target.value)}
            className="bg-transparent border-0 text-slate-700 font-semibold focus:outline-none cursor-pointer text-xs"
            title="Tugash sanasi"
          />
        </div>

        {(startDate || endDate || preset !== 'all') && (
          <button
            type="button"
            onClick={handleClear}
            title="Sana filtrini tozalash (Barchasi)"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        {totalCount !== undefined && (
          <div className="px-2.5 py-1 bg-slate-100 rounded-xl text-slate-600 font-bold text-xs">
            <span className="text-[#0084FF]">{totalCount}</span> {countLabel}
          </div>
        )}
      </div>
    </div>
  );
};

