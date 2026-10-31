import React, { useState, useEffect } from 'react';
import { 
  Key, Plus, Trash2, Copy, Check, ShieldCheck, 
  RefreshCw, AlertCircle, Terminal, ExternalLink
} from 'lucide-react';
import { ApiClient } from '../api/client';

export const ApiKeysPage: React.FC = () => {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    clinicName: 'klinika-admin Markaziy Filiali',
    permissions: 'READ,WRITE'
  });

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.getApiKeys();
      if (res.data) {
        setKeys(res.data);
      }
    } catch (e: any) {
      setError(e.message || 'API kalitlarini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clinicName.trim()) return;

    try {
      setSaving(true);
      const res = await ApiClient.createApiKey(form);
      if (res.data) {
        setKeys([res.data, ...keys]);
        setShowAddModal(false);
        setForm({ clinicName: 'klinika-admin Markaziy Filiali', permissions: 'READ,WRITE' });
      }
    } catch (e: any) {
      alert(e.message || 'Kalit yaratishda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!window.confirm('Haqiqatan ham bu API kalitini bekor qilmoqchimisiz? Kalitdan foydalanayotgan integratsiyalar to‘xtaydi.')) return;
    try {
      await ApiClient.deleteApiKey(id);
      setKeys(keys.filter(k => k.id !== id));
    } catch (e: any) {
      alert(e.message || 'O‘chirishda xatolik');
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">API Kalitlari & Integratsiyalar</h1>
            <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 font-bold text-xs rounded-full border border-teal-200">
              {keys.length} ta faol kalit
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Klinikalar, laboratoriyalar va tashqi CRM tizimlari uchun xavfsiz REST API tokenlari
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadKeys}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-sm"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition shadow-md shadow-teal-800/20"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi API kaliti</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Keys Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
            <span className="text-xs font-medium">API kalitlari yuklanmoqda...</span>
          </div>
        ) : keys.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Key className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">API kalitlari mavjud emas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Klinika / Tashkilot</th>
                  <th className="py-3 px-4">Kalit prefiksi</th>
                  <th className="py-3 px-4">Ruxsatlar</th>
                  <th className="py-3 px-4">Holat</th>
                  <th className="py-3 px-4">Yaratilgan sana</th>
                  <th className="py-3 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {k.clinic_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <code className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-800 font-mono text-[11px] font-semibold">
                          {k.key_prefix}
                        </code>
                        <button
                          onClick={() => handleCopy(k.key_prefix, k.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 transition"
                          title="Nusxalash"
                        >
                          {copiedId === k.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-mono font-bold rounded text-[10px]">
                        {k.permissions}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                        <ShieldCheck className="w-3.5 h-3.5" /> Faol
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {k.created_at ? new Date(k.created_at).toLocaleDateString('uz-UZ') : ''}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteKey(k.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Kalitni bekor qilish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Webhook & Docs info */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Terminal className="w-4 h-4 text-teal-700" />
            <span>Developer API Hujjatlari & Webhooklar</span>
          </div>
          <p className="text-xs text-slate-500">
            Klinika navbatlari va to‘lovlarini integratsiya qilish uchun OpenAPI (Swagger) spesifikatsiyasi
          </p>
        </div>

        <a
          href="http://189.74.99.251:5001/health"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200 self-start sm:self-auto"
        >
          <span>API Health Tekshirish</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Add Key Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900">Yangi API Kaliti Yaratish</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Klinika / Tashkilot nomi *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Star Med Clinic"
                  value={form.clinicName}
                  onChange={(e) => setForm({ ...form, clinicName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Ruxsatlar (Scope)</label>
                <select
                  value={form.permissions}
                  onChange={(e) => setForm({ ...form, permissions: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                >
                  <option value="READ,WRITE">To‘liq kirish (READ, WRITE)</option>
                  <option value="READ_ONLY">Faqat o‘qish (READ_ONLY)</option>
                  <option value="QUEUE_ONLY">Faqat navbat boshqaruvi (QUEUE_ONLY)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition shadow-md shadow-teal-800/20 flex items-center gap-2"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Kalitni yaratish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
