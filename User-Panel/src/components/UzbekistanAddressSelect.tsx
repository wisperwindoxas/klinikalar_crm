import React, { useState, useEffect } from 'react';
import { MapPin, Building2, Home, ChevronDown, Check } from 'lucide-react';
import { UZBEKISTAN_REGIONS, getDistrictsByRegion, parseAddress, formatAddress } from '../data/uzbekistanRegions';

interface UzbekistanAddressSelectProps {
  value: string;
  onChange: (fullAddress: string) => void;
  required?: boolean;
  label?: string;
  className?: string;
  showStreetInput?: boolean;
}

export const UzbekistanAddressSelect: React.FC<UzbekistanAddressSelectProps> = ({
  value,
  onChange,
  required = false,
  label = "Yashash Manzili (Viloyat va Tuman)",
  className = "",
  showStreetInput = true
}) => {
  // Parse incoming value or initialize defaults
  const parsed = parseAddress(value || '');
  const [selectedRegion, setSelectedRegion] = useState<string>(parsed.region || '');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(parsed.district || '');

  // Extract mahalla and street
  const extractMahallaAndStreet = (rawStreet: string) => {
    let m = '';
    let s = rawStreet || '';
    if (s.toLowerCase().includes('mahalla') || s.toLowerCase().includes('mfy')) {
      const match = s.match(/([^,]+(?:mahallas?i?|MFY|mfy))/i);
      if (match) {
        m = match[1].replace(/mahallas?i?|MFY|mfy/gi, '').trim();
        s = s.replace(match[0], '').replace(/^[\s,]+|[\s,]+$/g, '').trim();
      }
    }
    return { m, s };
  };

  const initialExtracted = extractMahallaAndStreet(parsed.street || '');
  const [mahallaDetail, setMahallaDetail] = useState<string>(initialExtracted.m);
  const [streetDetail, setStreetDetail] = useState<string>(initialExtracted.s);

  // Keep internal state in sync if parent resets value
  useEffect(() => {
    if (!value) {
      setSelectedRegion('');
      setSelectedDistrict('');
      setMahallaDetail('');
      setStreetDetail('');
    } else {
      const p = parseAddress(value);
      if (p.region && p.region !== selectedRegion) setSelectedRegion(p.region);
      if (p.district && p.district !== selectedDistrict) setSelectedDistrict(p.district);
      const ext = extractMahallaAndStreet(p.street || '');
      if (ext.m !== mahallaDetail) setMahallaDetail(ext.m);
      if (ext.s !== streetDetail) setStreetDetail(ext.s);
    }
  }, [value]);

  const assembleAddress = (reg: string, dist: string, mhl: string, str: string) => {
    const parts: string[] = [];
    if (reg) parts.push(reg);
    if (dist) parts.push(dist);
    if (mhl && mhl.trim()) {
      const cleanM = mhl.trim().replace(/mahallas?i?|mfy/gi, '').trim();
      parts.push(`${cleanM} MFY`);
    }
    if (str && str.trim()) parts.push(str.trim());
    return parts.join(', ');
  };

  const handleRegionChange = (newRegion: string) => {
    setSelectedRegion(newRegion);
    setSelectedDistrict('');
    onChange(assembleAddress(newRegion, '', mahallaDetail, streetDetail));
  };

  const handleDistrictChange = (newDistrict: string) => {
    setSelectedDistrict(newDistrict);
    onChange(assembleAddress(selectedRegion, newDistrict, mahallaDetail, streetDetail));
  };

  const handleMahallaChange = (newMahalla: string) => {
    setMahallaDetail(newMahalla);
    onChange(assembleAddress(selectedRegion, selectedDistrict, newMahalla, streetDetail));
  };

  const handleStreetChange = (newStreet: string) => {
    setStreetDetail(newStreet);
    onChange(assembleAddress(selectedRegion, selectedDistrict, mahallaDetail, newStreet));
  };

  const availableDistricts = selectedRegion ? getDistrictsByRegion(selectedRegion) : [];

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>{label}</span>
            {required && <span className="text-rose-500">*</span>}
          </label>
          {(selectedRegion || selectedDistrict) && (
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/80">
              {[selectedRegion, selectedDistrict].filter(Boolean).join(' • ')}
            </span>
          )}
        </div>
      )}

      {/* Row 1: Viloyat Select & Tuman Select */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 1. Viloyat Select */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 block">
            Viloyat / Shahar <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <MapPin className="w-4 h-4 text-emerald-600" />
            </div>
            <select
              value={selectedRegion}
              onChange={e => handleRegionChange(e.target.value)}
              required={required}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition cursor-pointer appearance-none"
            >
              <option value="">— Viloyatni tanlang —</option>
              {UZBEKISTAN_REGIONS.map(reg => (
                <option key={reg.id} value={reg.name} className="py-1">
                  {reg.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 2. Tuman Select */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 block">
            Tuman / Shahar <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Building2 className="w-4 h-4 text-emerald-600" />
            </div>
            <select
              value={selectedDistrict}
              onChange={e => handleDistrictChange(e.target.value)}
              disabled={!selectedRegion}
              required={required && !!selectedRegion}
              className={`w-full pl-9 pr-8 py-2.5 border rounded-xl text-xs font-bold transition appearance-none cursor-pointer ${
                !selectedRegion
                  ? 'bg-slate-100/70 border-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600'
              }`}
            >
              <option value="">
                {!selectedRegion ? "— Oldin viloyatni tanlang —" : "— Tuman / Shaharni tanlang —"}
              </option>
              {availableDistricts.map((dist, idx) => (
                <option key={idx} value={dist} className="py-1">
                  {dist}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Mahalla & Ko'cha / Uy alohida maydonlari */}
      {showStreetInput && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
          {/* Mahalla / MFY input */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 block">
              Mahalla / MFY nomi
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Building2 className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={mahallaDetail}
                onChange={e => handleMahallaChange(e.target.value)}
                placeholder="Mahalla / MFY (masalan: Yangi hayot MFY)..."
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>
          </div>

          {/* Ko'cha va uy raqami input */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 block">
              Ko'cha va uy / xonadon raqami
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Home className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={streetDetail}
                onChange={e => handleStreetChange(e.target.value)}
                placeholder="Ko'cha, uy / xonadon (masalan: Navoiy ko'chasi 24-uy)..."
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
