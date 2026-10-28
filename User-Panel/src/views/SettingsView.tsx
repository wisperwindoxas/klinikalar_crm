import React, { useState } from 'react';
import { Settings, Building2, Palette, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { UserApiClient } from '../api/client';
import { formatUzbekPhone } from '../utils/phone';

interface SettingsViewProps {
  clinicData: any;
  onRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ clinicData, onRefresh }) => {
  const clinic = clinicData?.clinic;
  const [name, setName] = useState(clinic?.name || 'SADAF KLINIKA');
  const [primaryColor, setPrimaryColor] = useState(clinic?.primaryColor || '#008B8B');
  const [phone, setPhone] = useState(clinic?.phone || '+998 71 200 00 00');
  const [address, setAddress] = useState(clinic?.address || 'Toshkent sh., Bunyodkor shoh ko\'chasi');
  const [queuePrefix, setQueuePrefix] = useState(clinic?.queuePrefix || 'A');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await UserApiClient.updateBranding({
        name,
        primaryColor,
        phone,
        address,
        queuePrefix
      });
      alert('Klinika White-label sozlamalari muvaffaqiyatli saqlandi!');
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Xatolik');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Klinika sozlamalari (White-Label)</h1>
        <p className="text-xs text-slate-500 mt-0.5">Klinika brendi, ranglar palitrasi va umumiy parametrlari</p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 font-extrabold text-lg">
            {name.charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{name}</h3>
            <p className="text-xs text-slate-400">Joriy tarif: <span className="font-bold text-teal-800">{clinicData?.subscription?.planCode || 'PRO'}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Klinika nomi</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-teal-700" />
              Asosiy brend rangi (Hex)
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                className="w-10 h-8 rounded-lg cursor-pointer border-0 p-0"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Aloqa telefoni</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(formatUzbekPhone(e.target.value))}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Talon prefiksi (Prefix)</label>
            <input
              type="text"
              value={queuePrefix}
              maxLength={2}
              onChange={e => setQueuePrefix(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Manzil</label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div className="pt-3 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-800/20 flex items-center gap-2 transition disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            {saving ? 'Saqlanmoqda...' : 'Sozlamalarni saqlash'}
          </button>
        </div>
      </form>
    </div>
  );
};
