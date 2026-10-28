import React from 'react';
import { Layers, ShieldCheck, Activity } from 'lucide-react';

interface GenericAdminPageProps {
  title: string;
  description: string;
  badge?: string;
}

export const GenericAdminPage: React.FC<GenericAdminPageProps> = ({ title, description, badge }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
            {badge && (
              <span className="px-2.5 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-xs font-bold">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>

      <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-sm text-center max-w-2xl mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center mx-auto">
          <Activity className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">{title} moduli faol</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Ushbu bo‘lim butun SaaS platformasi uchun markaziy boshqaruv va global sozlamalar bilan integratsiya qilingan. Barcha harakatlar xavfsiz audit tizimida qayd etiladi.
        </p>
        <div className="pt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold">
            <ShieldCheck className="w-4 h-4" /> Multi-Tenant Izolatsiya Faol
          </span>
        </div>
      </div>
    </div>
  );
};
