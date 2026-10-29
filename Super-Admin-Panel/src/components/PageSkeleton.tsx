import React from 'react';

export const PageSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Title & Action Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 rounded-xl" />
          <div className="h-3.5 w-72 bg-slate-100 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-slate-200 rounded-xl" />
      </div>

      {/* KPI Metric Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-slate-100" />
              <div className="w-12 h-4 bg-slate-100 rounded-md" />
            </div>
            <div className="h-3 w-24 bg-slate-100 rounded" />
            <div className="h-6 w-32 bg-slate-200 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Main Table / Content Skeleton */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-9 w-72 bg-slate-100 rounded-xl" />
          <div className="h-9 w-44 bg-slate-100 rounded-xl" />
        </div>
        <div className="space-y-2.5 pt-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-12 w-full bg-slate-50 border border-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
};

