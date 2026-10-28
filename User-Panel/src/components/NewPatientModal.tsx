import React, { useState } from 'react';
import { X, UserPlus, Phone, Calendar, MapPin, FileText, CheckCircle2, User, RefreshCw, Sparkles } from 'lucide-react';
import { UserApiClient } from '../api/client';
import { formatUzbekPhone } from '../utils/phone';
import { UzbekistanAddressSelect } from './UzbekistanAddressSelect';

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (patient: any) => void;
}

export const NewPatientModal: React.FC<NewPatientModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [birthDate, setBirthDate] = useState('1995-05-15');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatUzbekPhone(e.target.value));
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((phone === '+998 ' || phone === '+998' || phone.length <= 5) && e.key === 'Backspace') {
      e.preventDefault();
      setPhone('+998 ');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Bemor F.I.Sh. kiritilishi shart');
      return;
    }
    if (phone.replace(/\D/g, '').length < 9) {
      setError("Telefon raqami to'liq kiritilishi shart (+998 ...)");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await UserApiClient.createPatient({
        fullName: fullName.trim(),
        phone: phone.trim(),
        birthDate,
        gender,
        address: address.trim(),
        notes: notes.trim()
      });
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#00897B] via-[#00796B] to-[#004D40] text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
              <UserPlus className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">Yangi Bemor Ro‘yxatga Olish</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  EMR Karta
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">Klinika elektron bazasida yangi tibbiy karta ochiladi</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 hover:bg-white/15 rounded-xl text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>{error}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Bemor To‘liq Ismi (F.I.SH) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <User className="w-4 h-4 text-[#00897B]" />
              </div>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Masalan: Karimov Akmal Rustamovich"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00897B]/20 focus:border-[#00897B] transition"
              />
            </div>
          </div>

          {/* Phone & BirthDate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Telefon Raqami <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Phone className="w-4 h-4 text-[#00897B]" />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={handlePhoneChange}
                  onKeyDown={handlePhoneKeyDown}
                  placeholder="+998 (90) 123-45-67"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00897B]/20 focus:border-[#00897B] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tug‘ilgan Sana
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Calendar className="w-4 h-4 text-[#00897B]" />
                </div>
                <input
                  type="date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00897B]/20 focus:border-[#00897B] transition"
                />
              </div>
            </div>
          </div>

          {/* Gender & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Jinsi</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('MALE')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    gender === 'MALE'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>👨 Erkak</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGender('FEMALE')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    gender === 'FEMALE'
                      ? 'bg-pink-50 border-pink-500 text-pink-700 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>👩 Ayol</span>
                </button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <UzbekistanAddressSelect
                value={address}
                onChange={setAddress}
                label="Bemor Yashash Manzili (Viloyat va Tuman)"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Dastlabki Shikoyat / Qaydlar
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-3 text-slate-400 pointer-events-none">
                <FileText className="w-4 h-4 text-[#00897B]" />
              </div>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Bemorning shikoyati, allergik holatlari yoki qo'shimcha ma'lumotlar..."
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00897B]/20 focus:border-[#00897B] transition"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#00897B] hover:bg-[#00796B] text-white text-xs font-bold rounded-xl shadow-md shadow-[#00897B]/20 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{loading ? 'Saqlanmoqda...' : 'Bemorni Saqlash'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
