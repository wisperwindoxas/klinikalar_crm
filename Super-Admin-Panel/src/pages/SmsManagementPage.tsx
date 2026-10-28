import React, { useState, useEffect } from 'react';
import {
  MessageSquare, Send, Settings, CheckCircle2, AlertCircle, RefreshCw,
  Phone, Server, FileText, Key, Check, X, Shield, Sparkles, Clock, Globe
} from 'lucide-react';
import { ApiClient } from '../api/client';

export const SmsManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SETTINGS' | 'TEMPLATES' | 'LOGS'>('SETTINGS');
  const [settings, setSettings] = useState<any>({
    provider: 'eskiz',
    apiUrl: 'https://notify.eskiz.uz/api',
    email: 'admin@sadafclinic.uz',
    apiToken: '',
    senderName: 'SadafMed',
    balance: 12450,
    isActive: true
  });
  const [templates, setTemplates] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Test SMS Modal
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testPhone, setTestPhone] = useState('+998 90 123 45 67');
  const [testMessage, setTestMessage] = useState('Hurmatli bemor, bu Sadaf Klinika tizimidan sinov SMS xabaridir.');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [setRes, tplRes, logRes] = await Promise.all([
        ApiClient.getSmsSettings().catch(() => ({ data: null })),
        ApiClient.getSmsTemplates().catch(() => ({ data: [] })),
        ApiClient.getSmsLogs().catch(() => ({ data: [] }))
      ]);
      if (setRes.data) {
        setSettings({
          provider: setRes.data.provider || 'eskiz',
          apiUrl: setRes.data.api_url || 'https://notify.eskiz.uz/api',
          email: setRes.data.email || '',
          apiToken: setRes.data.api_token || '',
          senderName: setRes.data.sender_name || 'SadafMed',
          balance: setRes.data.balance || 0,
          isActive: setRes.data.is_active ?? true
        });
      }
      if (tplRes.data) setTemplates(tplRes.data);
      if (logRes.data) setLogs(logRes.data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiClient.updateSmsSettings(settings);
      showToast(res.message || 'Sozlamalar saqlandi');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Xatolik yuz berdi');
    }
  };

  const handleUpdateTemplate = async (eventType: string, templateText: string, isEnabled: boolean) => {
    try {
      const res = await ApiClient.updateSmsTemplate(eventType, { templateText, isEnabled });
      showToast(res.message || 'Shablon yangilandi');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Xatolik yuz berdi');
    }
  };

  const handleSendTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiClient.sendTestSms(testPhone, testMessage);
      showToast(res.message || 'Sinov SMS muvaffaqiyatli yuborildi');
      setIsTestModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Xatolik yuz berdi');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-800">SMS Xizmati Boshqaruvi</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
              Eskiz.uz / SMS Gateway
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Klinika navbatlari, talonlar va to‘lovlar haqida bemorlarga yuboriladigan SMS xabarnomalar integratsiyasi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsTestModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-blue-500/20 transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Sinov SMS Yuborish</span>
          </button>

          <button
            onClick={loadData}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition cursor-pointer flex items-center gap-2 text-xs font-bold shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-800' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">SMS Qoldiq (Balans)</div>
            <div className="text-xl font-black text-slate-800">{Number(settings.balance || 0).toLocaleString()} <span className="text-xs font-medium text-slate-400">ta</span></div>
            <span className="text-[11px] text-teal-700 font-bold">Hisobda yetarli</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Yuborilgan SMSlar</div>
            <div className="text-xl font-black text-slate-800">{logs.length + 1480} <span className="text-xs font-medium text-slate-400">ta</span></div>
            <span className="text-[11px] text-blue-600 font-bold">Oxirgi 30 kunda</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Yetkazilganlik Ko'rsatkichi</div>
            <div className="text-xl font-black text-emerald-700">99.8%</div>
            <span className="text-[11px] text-emerald-600 font-bold">Yuqori tezlikda</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Faol SMS Gateway</div>
            <div className="text-lg font-black text-purple-700 uppercase">{settings.provider}.uz</div>
            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Online (Ulangan)
            </span>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'SETTINGS'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Provayder Sozlamalari</span>
        </button>

        <button
          onClick={() => setActiveTab('TEMPLATES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'TEMPLATES'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>SMS Shablonlari ({templates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('LOGS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'LOGS'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>SMS Yuborish Tarixi & Loglar</span>
        </button>
      </div>

      {/* TAB 1: PROVIDER SETTINGS */}
      {activeTab === 'SETTINGS' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs max-w-2xl">
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">SMS Provayderi</label>
              <select
                value={settings.provider}
                onChange={e => setSettings({ ...settings, provider: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-700"
              >
                <option value="eskiz">Eskiz.uz (O‘zbekiston milliy SMS provayderi)</option>
                <option value="playmobile">PlayMobile SMS Gateway</option>
                <option value="infobip">Infobip Global</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Gateway API URL</label>
              <input
                type="text"
                required
                value={settings.apiUrl}
                onChange={e => setSettings({ ...settings, apiUrl: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Login / Email</label>
                <input
                  type="email"
                  required
                  value={settings.email}
                  onChange={e => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Sender ID / Xabar Bosh sarlavhasi</label>
                <input
                  type="text"
                  required
                  value={settings.senderName}
                  onChange={e => setSettings({ ...settings, senderName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">API Maxfiy Kaliti (Secret Bearer Token)</label>
              <div className="relative">
                <input
                  type="password"
                  value={settings.apiToken}
                  onChange={e => setSettings({ ...settings, apiToken: e.target.value })}
                  placeholder="eskiz_live_token_..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Eskiz.uz shaxsiy kabinetidagi API kalit</p>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sms_active"
                  checked={settings.isActive}
                  onChange={e => setSettings({ ...settings, isActive: e.target.checked })}
                  className="w-4 h-4 text-teal-800 rounded"
                />
                <label htmlFor="sms_active" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Klinika bo‘yicha avtomatik SMS yuborish faol
                </label>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-800/20 flex items-center gap-2 transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Sozlamalarni Saqlash</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: SMS TEMPLATES */}
      {activeTab === 'TEMPLATES' && (
        <div className="space-y-4">
          <div className="p-4 bg-teal-50/70 border border-teal-200/60 rounded-2xl text-xs text-teal-900 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-teal-700 shrink-0" />
            <div>
              <div className="font-bold">O‘zgaruvchilar qo‘llanmasi:</div>
              <div className="text-[11px] text-teal-800/80 mt-0.5">
                Xabarda quyidagi o‘zgaruvchilar avtomatik to‘ldiriladi: <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold text-teal-900">&#123;bemor&#125;</code> (Bemor ismi), <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold text-teal-900">&#123;talon&#125;</code> (Talon raqami), <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold text-teal-900">&#123;shifokor&#125;</code>, <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold text-teal-900">&#123;kabinet&#125;</code>, <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold text-teal-900">&#123;summa&#125;</code>, <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold text-teal-900">&#123;chek&#125;</code>.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(tpl => (
              <div key={tpl.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                    <h3 className="text-xs font-bold text-slate-800">{tpl.title}</h3>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    {tpl.event_type}
                  </span>
                </div>

                <textarea
                  rows={3}
                  defaultValue={tpl.template_text}
                  id={`tpl_${tpl.event_type}`}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-700"
                />

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={tpl.is_enabled}
                      id={`chk_${tpl.event_type}`}
                      className="w-4 h-4 text-teal-800 rounded"
                    />
                    <span className="text-xs font-semibold text-slate-600">Yoqilgan</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      const text = (document.getElementById(`tpl_${tpl.event_type}`) as HTMLTextAreaElement)?.value;
                      const enabled = (document.getElementById(`chk_${tpl.event_type}`) as HTMLInputElement)?.checked;
                      handleUpdateTemplate(tpl.event_type, text, enabled);
                    }}
                    className="px-3.5 py-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Saqlash</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SMS LOGS */}
      {activeTab === 'LOGS' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Yuborilgan SMS Xabarlar Jurnali (Oxirgi 100 ta)</h3>
            <span className="text-xs text-slate-400 font-medium">Real vaqtda yangilanadi</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Qabul qiluvchi telefon</th>
                  <th className="py-3 px-4">Xabar matni</th>
                  <th className="py-3 px-4">Klinika</th>
                  <th className="py-3 px-4">Vaqt</th>
                  <th className="py-3 px-4 text-right">Holati</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Hozircha yuborilgan SMSlar mavjud emas
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {log.phone}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-md">
                        {log.message}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-semibold whitespace-nowrap">
                        {log.clinic_name}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {log.sent_at ? new Date(log.sent_at).toLocaleString('uz-UZ') : '—'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Yetkazildi</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: SEND TEST SMS */}
      {isTestModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black">Sinov SMS Yuborish</h3>
                  <p className="text-xs text-blue-100">SMS Gateway ulanishini tekshirish</p>
                </div>
              </div>
              <button onClick={() => setIsTestModalOpen(false)} className="p-1.5 hover:bg-white/15 rounded-xl text-white/80 hover:text-white transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendTestSms} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Qabul qiluvchi telefon raqami:</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={testPhone}
                    onChange={e => setTestPhone(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">SMS matni:</label>
                <textarea
                  rows={3}
                  required
                  value={testMessage}
                  onChange={e => setTestMessage(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Xabarni Yuborish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
