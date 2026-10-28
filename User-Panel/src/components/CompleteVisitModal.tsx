import React, { useState } from 'react';
import { X, CheckCircle2, Stethoscope, Pill, DollarSign } from 'lucide-react';
import { UserApiClient } from '../api/client';

interface CompleteVisitModalProps {
  isOpen: boolean;
  ticket: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const CompleteVisitModal: React.FC<CompleteVisitModalProps> = ({ isOpen, ticket, onClose, onSuccess }) => {
  const [diagnosis, setDiagnosis] = useState('O\'tkir chuqur karies (K02.1)');
  const [notes, setNotes] = useState('Kavitet tozalandi, plomba qo\'yildi va silliqlandi.');
  const [prescription, setPrescription] = useState('Nimesil 100mg (kuniga 1 marta og\'riq bo\'lganda), Dentamet gel (kuniga 2 marta).');
  const [cost, setCost] = useState('250000');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !ticket) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await UserApiClient.completeTicket(ticket.id, {
        diagnosis,
        notes,
        prescriptions: [{
          medicineName: prescription,
          dosage: '1 paketik',
          frequency: 'kuniga 1 mahal',
          durationDays: 3,
          instructions: 'Ovqatdan so\'ng'
        }],
        servicesProvided: [
          { serviceId: 'srv_1', name: 'Terapevtik davolash', price: Number(cost) }
        ],
        totalCost: Number(cost)
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Qabulni yakunlash</h2>
              <p className="text-xs text-emerald-100">{ticket.ticketNumber} — {ticket.patientName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              Qo‘yilgan tashxis (Diagnoz) *
            </label>
            <input
              type="text"
              required
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Davolash tafsilotlari & Ko‘rsatmalar</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-blue-600" />
              Retsept & Tavsiya etilgan dori vositalari
            </label>
            <textarea
              rows={2}
              value={prescription}
              onChange={e => setPrescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              Ko‘rsatilgan xizmatlar summasi (so‘m) *
            </label>
            <input
              type="number"
              required
              value={cost}
              onChange={e => setCost(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? 'Saqlanmoqda...' : 'Qabulni yakunlash & Kassa tushumiga kiritish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
