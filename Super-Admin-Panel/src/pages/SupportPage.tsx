import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, MessageSquare, Plus, Search, CheckCircle2, 
  Clock, AlertCircle, Phone, Send, RefreshCw, Filter
} from 'lucide-react';
import { ApiClient } from '../api/client';

export const SupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('RESOLVED');
  const [sendingReply, setSendingReply] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newForm, setNewForm] = useState({
    clinicName: 'Sadaf Tibbiyot Markazi',
    contactName: '',
    contactPhone: '',
    subject: '',
    message: '',
    priority: 'MEDIUM'
  });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.getSupportTickets();
      if (res.data) {
        setTickets(res.data);
      }
    } catch (e: any) {
      setError(e.message || 'Murojaatlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;

    try {
      setSendingReply(true);
      const res = await ApiClient.replySupportTicket(activeTicket.id, replyText, replyStatus);
      if (res.data) {
        setTickets(tickets.map(t => t.id === activeTicket.id ? res.data : t));
        setActiveTicket(null);
        setReplyText('');
      }
    } catch (e: any) {
      alert(e.message || 'Javob yuborishda xatolik');
    } finally {
      setSendingReply(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.contactName.trim() || !newForm.subject.trim()) return;

    try {
      setCreating(true);
      const res = await ApiClient.createSupportTicket(newForm);
      if (res.data) {
        setTickets([res.data, ...tickets]);
        setShowCreateModal(false);
        setNewForm({
          clinicName: 'Sadaf Tibbiyot Markazi',
          contactName: '',
          contactPhone: '',
          subject: '',
          message: '',
          priority: 'MEDIUM'
        });
      }
    } catch (e: any) {
      alert(e.message || 'Murojaat yaratishda xatolik');
    } finally {
      setCreating(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchSearch = 
      (t.subject || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.clinic_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.contact_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">MUHIM (CRITICAL)</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">YUQORI</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">O‘RTACHA</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">ODDIY</span>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'OPEN':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">Ochiq</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">Jarayonda</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Hal qilindi</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">{s}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Qo‘llab-quvvatlash Xizmati (Support Desk)</h1>
            <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 font-bold text-xs rounded-full border border-teal-200">
              {tickets.length} ta murojaat
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Klinika rahbarlari va operatorlaridan kelib tushgan murojaatlar va yechimlar tarixi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadTickets}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-sm"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition shadow-md shadow-teal-800/20"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi murojaat</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Mavzu, klinika yoki murojaatchi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Holat:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-teal-600"
          >
            <option value="ALL">Barchasi</option>
            <option value="OPEN">Ochiq</option>
            <option value="IN_PROGRESS">Jarayonda</option>
            <option value="RESOLVED">Hal qilindi</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
            <span className="text-xs font-medium">Murojaatlar bazadan yuklanmoqda...</span>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <HelpCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">Murojaatlar topilmadi</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTickets.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  setActiveTicket(t);
                  setReplyText(t.reply || '');
                  setReplyStatus(t.status || 'RESOLVED');
                }}
                className="p-5 hover:bg-slate-50/70 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    {getPriorityBadge(t.priority)}
                    <h3 className="text-sm font-extrabold text-slate-900">{t.subject}</h3>
                    {getStatusBadge(t.status)}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">{t.message}</p>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium pt-1">
                    <span>Klinika: <strong className="text-slate-700">{t.clinic_name}</strong></span>
                    <span>Murojaatchi: <strong className="text-slate-700">{t.contact_name}</strong></span>
                    {t.contact_phone && <span>Tel: {t.contact_phone}</span>}
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {t.created_at ? new Date(t.created_at).toLocaleString('uz-UZ') : ''}
                  </span>
                  {t.reply && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Javob berilgan
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ticket Details & Reply Modal */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] text-slate-400 font-mono">TICKET ID: {activeTicket.id}</span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">{activeTicket.subject}</h3>
              </div>
              <button onClick={() => setActiveTicket(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Klinika:</span>
                <span className="font-extrabold text-slate-900">{activeTicket.clinic_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Murojaatchi:</span>
                <span className="font-bold text-slate-800">{activeTicket.contact_name} ({activeTicket.contact_phone || 'Tel ko‘rsatilmagan'})</span>
              </div>
              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-slate-500 font-bold block mb-1">Murojaat matni:</span>
                <p className="text-slate-800 leading-relaxed font-medium bg-white p-3 rounded-lg border border-slate-200">
                  {activeTicket.message}
                </p>
              </div>
            </div>

            <form onSubmit={handleSendReply} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Super Admin Javobi *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Muammo bo‘yicha texnik ko‘rsatma yoki yechim matnini yozing..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Yangi holat</label>
                <select
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                >
                  <option value="RESOLVED">Hal qilindi (RESOLVED)</option>
                  <option value="IN_PROGRESS">Tekshirilmoqda / Jarayonda (IN_PROGRESS)</option>
                  <option value="OPEN">Ochiq qoldirish (OPEN)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTicket(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Yopish
                </button>
                <button
                  type="submit"
                  disabled={sendingReply}
                  className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition shadow-md shadow-teal-800/20 flex items-center gap-2"
                >
                  {sendingReply ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Javobni saqlash & yuborish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900">Yangi Murojaat Yaratish</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Klinika nomi *</label>
                <input
                  type="text"
                  required
                  value={newForm.clinicName}
                  onChange={(e) => setNewForm({ ...newForm, clinicName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Aloqachi F.I.SH *</label>
                  <input
                    type="text"
                    required
                    placeholder="Alisher Zokirov"
                    value={newForm.contactName}
                    onChange={(e) => setNewForm({ ...newForm, contactName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Telefon</label>
                  <input
                    type="text"
                    placeholder="+998 90 000 00 00"
                    value={newForm.contactPhone}
                    onChange={(e) => setNewForm({ ...newForm, contactPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Mavzu *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: TV Tablo ovozli chaqiruv sozlanmadi"
                  value={newForm.subject}
                  onChange={(e) => setNewForm({ ...newForm, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Daraja (Muhimlik)</label>
                <select
                  value={newForm.priority}
                  onChange={(e) => setNewForm({ ...newForm, priority: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                >
                  <option value="CRITICAL">🔴 Favqulodda (CRITICAL)</option>
                  <option value="HIGH">🟠 Yuqori (HIGH)</option>
                  <option value="MEDIUM">🔵 O‘rtacha (MEDIUM)</option>
                  <option value="LOW">⚪ Oddiy (LOW)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Batafsil matn *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Murojaat sababini batafsil tushuntiring..."
                  value={newForm.message}
                  onChange={(e) => setNewForm({ ...newForm, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition shadow-md shadow-teal-800/20 flex items-center gap-2"
                >
                  {creating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Yaratish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
