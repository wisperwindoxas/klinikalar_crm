import React, { useState } from 'react';
import { X, Building2, User, Phone, Mail, Lock, MapPin, CheckCircle2, ChevronDown } from 'lucide-react';
import { ApiClient } from '../api/client';
import { UZBEKISTAN_REGIONS, getDistrictsByRegion, formatAddress } from '../data/uzbekistanRegions';

interface AddClinicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddClinicModal: React.FC<AddClinicModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [clinicName, setClinicName] = useState('');
  const [ownerFullName, setOwnerFullName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('sadaf123');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [planCode, setPlanCode] = useState('STANDARD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const availableDistricts = selectedRegion ? getDistrictsByRegion(selectedRegion) : [];

  const handleRegionChange = (regName: string) => {
    setSelectedRegion(regName);
    setSelectedDistrict('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const fullAddress = formatAddress(selectedRegion, selectedDistrict, streetAddress);

    try {
      await ApiClient.createClinic({
        clinicName,
        ownerFullName,
        phone,
        email,
        password,
        address: fullAddress,
        planCode
      });
      // Keshni tozalash
      ApiClient.clearCache('/super-admin/clinics');
      ApiClient.clearCache('/super-admin/subscriptions');
      ApiClient.clearCache('/super-admin/dashboard');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 my-auto">
        <div className="px-6 py-5 bg-medical-gradient text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-sm">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Yangi klinika qo‘shish</h2>
              <p className="text-xs text-white/90">Yangi tenant va administrator hisobi yaratiladi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Klinika nomi *</label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={clinicName}
                onChange={e => setClinicName(e.target.value)}
                placeholder="Masalan: Shifo Medikal yoki Dental Plus"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-medical-blue/20 focus:border-medical-blue"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Klinika rahbari (Egasi) *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={ownerFullName}
                  onChange={e => setOwnerFullName(e.target.value)}
                  placeholder="Ism Familiya"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-medical-blue/20 focus:border-medical-blue"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Telefon raqami *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-medical-blue/20 focus:border-medical-blue"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email manzili</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="info@clinic.uz"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-medical-blue/20 focus:border-medical-blue"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Boshlang‘ich parol</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-medical-blue/20 focus:border-medical-blue"
                />
              </div>
            </div>
          </div>

          {/* Viloyat va Tuman Tanlash */}
          <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/70">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <MapPin className="w-4 h-4 text-medical-blue" />
              <span>Klinika manzili (Viloyat va Tuman)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Viloyat */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Viloyat *</label>
                <div className="relative">
                  <select
                    value={selectedRegion}
                    onChange={e => handleRegionChange(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-medical-blue/20 focus:border-medical-blue cursor-pointer"
                  >
                    <option value="">Viloyatni tanlang</option>
                    {UZBEKISTAN_REGIONS.map(r => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Tuman / Shahar */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tuman / Shahar *</label>
                <div className="relative">
                  <select
                    value={selectedDistrict}
                    onChange={e => setSelectedDistrict(e.target.value)}
                    disabled={!selectedRegion}
                    className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-medical-blue/20 focus:border-medical-blue cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    <option value="">{selectedRegion ? 'Tumanni tanlang' : 'Oldin viloyatni tanlang'}</option>
                    {availableDistricts.map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Ko'cha / Mo'ljal / Bino */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Ko‘cha, bino yoki mo‘ljal</label>
              <input
                type="text"
                value={streetAddress}
                onChange={e => setStreetAddress(e.target.value)}
                placeholder="Masalan: Amir Temur shox ko‘chasi, 45-uy"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-medical-blue/20 focus:border-medical-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tanlangan tarif</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: 'STARTER', label: 'STARTER', desc: '14 kun sinov' },
                { code: 'STANDARD', label: 'STANDARD', desc: 'Eng ommabop' },
                { code: 'PREMIUM', label: 'PREMIUM', desc: 'To‘liq imkoniyat' }
              ].map(plan => (
                <button
                  type="button"
                  key={plan.code}
                  onClick={() => setPlanCode(plan.code)}
                  className={`py-2 px-2 text-center rounded-xl border transition cursor-pointer ${
                    planCode === plan.code
                      ? 'bg-blue-50 border-medical-blue text-medical-blue-dark ring-2 ring-medical-blue/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-bold">{plan.label}</div>
                  <div className="text-[10px] text-slate-500">{plan.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-medical-gradient hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-medical-blue/25 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? 'Yaratilmoqda...' : 'Klinikani saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
