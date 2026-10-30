import React from 'react';
import { 
  Tv, RefreshCw, Save, Mic, Sparkles, Volume2, Play, VolumeX, CheckCircle2 
} from 'lucide-react';
import { ElectronDisplaySelector } from '../../ElectronDisplaySelector';
import { showNotification } from '../../ToastNotification';

interface ManagerTvSettingsTabProps {
  tvSettings: any;
  setTvSettings: React.Dispatch<React.SetStateAction<any>>;
  isSavingTvSettings: boolean;
  onSaveTvSettings: () => void;
  isPlayingTvPreview: boolean;
  onPlayTvPreview: () => void;
  insertTemplateTag: (tag: string) => void;
  applyPreset: (presetText: string) => void;
  testTicketNum: string;
  setTestTicketNum: (val: string) => void;
  testSpecName: string;
  setTestSpecName: (val: string) => void;
  testCabNum: string;
  setTestCabNum: (val: string) => void;
  testCallStatus: string;
  onSendTvTestCall: () => void;
  onToggleSound: () => void;
}

export const ManagerTvSettingsTab: React.FC<ManagerTvSettingsTabProps> = ({
  tvSettings,
  setTvSettings,
  isSavingTvSettings,
  onSaveTvSettings,
  isPlayingTvPreview,
  onPlayTvPreview,
  insertTemplateTag,
  applyPreset,
  testTicketNum,
  setTestTicketNum,
  testSpecName,
  setTestSpecName,
  testCabNum,
  setTestCabNum,
  testCallStatus,
  onSendTvTestCall,
  onToggleSound,
}) => {
  return (
    <div className="space-y-6">
      {/* ELECTRON MULTI-DISPLAY (HDMI TV) SELECTOR */}
      <ElectronDisplaySelector onNotification={showNotification} />

      {/* Header with Title and Actions */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00897B]/10 border border-[#00897B]/30 flex items-center justify-center text-[#00897B]">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#172B4D]">TV Tablosi va Ovozli E'lon Sozlamalari</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                TV ekrani yozuvlari, shiorlar, yo'riqnomalar va bemorlarni xonaga chaqirish ovozli shablonini to'liq sozlash va boshqarish.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="http://localhost:3002"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-200"
          >
            <Tv className="w-4 h-4 text-[#0084FF]" />
            <span>TV oynasini ochish (3002)</span>
          </a>

          <button
            onClick={onSaveTvSettings}
            disabled={isSavingTvSettings}
            className="px-5 py-2.5 bg-[#00897B] hover:bg-[#00796B] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
          >
            {isSavingTvSettings ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSavingTvSettings ? 'Saqlanmoqda...' : 'Saqlash va TV ga uzatish'}</span>
          </button>
        </div>
      </div>

      {/* Main 2-column Grid */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: OVOZLI CHAQIRUV SHABLONI (SPAN 7) */}
        <div className="col-span-12 xl:col-span-7 space-y-6">
          {/* Card 1: Chaqiruv Matni Shabloni */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#172B4D]">Bemorlarni Chaqirish Ovozli Shabloni</h4>
                  <p className="text-[11px] text-slate-500">Shifokor chaqiruv tugmasini bosganda TV da yangraydigan matn</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-lg border border-purple-200">
                Jonli sintaksis
              </span>
            </div>

            {/* Variable Badges (Click to insert) */}
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-2">
                Mavjud o'zgaruvchi teglar (bosing va matnga qo'shing):
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { tag: '{letter}', label: '{letter}', desc: 'Harf (Ka, Te)' },
                  { tag: '{zeros}', label: '{zeros}', desc: 'Bosh nollar (nol, nol nol)' },
                  { tag: '{number}', label: '{number}', desc: 'Tartib raqam (15-chi, oltinchi)' },
                  { tag: '{cabinet}', label: '{cabinet}', desc: 'Xona / kabinet raqami' },
                  { tag: '{specialty}', label: '{specialty}', desc: 'Mutaxassislik nomi' },
                  { tag: '{doctor}', label: '{doctor}', desc: 'Shifokor ismi' },
                  { tag: '{patient}', label: '{patient}', desc: 'Bemor F.I.Sh.' }
                ].map(item => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => insertTemplateTag(item.tag)}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 hover:border-purple-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title={item.desc}
                  >
                    <span className="font-mono text-purple-600">{item.label}</span>
                    <span className="text-[10px] text-slate-400">({item.desc})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Template Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Chaqiruv matni formulasi</label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {tvSettings.tvVoiceTemplate.length} belgi
                </span>
              </div>
              <textarea
                rows={3}
                value={tvSettings.tvVoiceTemplate}
                onChange={e => setTvSettings({ ...tvSettings, tvVoiceTemplate: e.target.value })}
                className="w-full p-3.5 bg-slate-50/70 focus:bg-white border border-slate-300 focus:border-[#00897B] rounded-2xl text-xs font-medium text-slate-800 leading-relaxed outline-none transition"
                placeholder="Masalan: Talon raqami {letter}{zeros}, {number} raqam egasi, sizni {cabinet} xona, {specialty} xonasiga marhamat!"
              />
            </div>

            {/* Presets (Tezkor Shablonlar) */}
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-2">
                Tezkor tayyor shablonlar:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset("Talon raqami {letter}{zeros}, {number} raqam egasi, sizni {cabinet} xona, {specialty} xonasiga marhamat!")}
                  className="p-2.5 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>1. Standart to'liq shablon</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    Talon raqami Ka nol, 15-chi raqam egasi, sizni 3-xona, Kardiologiyaga marhamat!
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset("Talon {letter}{zeros} {number}, {cabinet}-kabinetga marhamat!")}
                  className="p-2.5 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    <span>2. Qisqa va tezkor</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    Talon Ka nol 15, 3-kabinetga marhamat!
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset("Hurmatli bemor, {letter}{zeros} {number} raqami. Sizni {doctor} qabuliga, {cabinet}-xonaga taklif etamiz!")}
                  className="p-2.5 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    <span>3. Shifokor nomi bilan</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    Hurmatli bemor... Sizni Dr. Karimova qabuliga, 3-xonaga taklif etamiz!
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset("Bemor {patient}, talon {letter}{zeros} {number}. Sizni {cabinet} xona, {specialty}ga marhamat!")}
                  className="p-2.5 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    <span>4. Bemor F.I.Sh. bilan</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    Bemor Aziz Rahimov, talon Ka nol 15. Sizni 3-xona, Kardiologiyaga marhamat!
                  </div>
                </button>
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Haqiqiy o'qilish namunasi (K015, Kardiologiya, 3-xona):</span>
                </div>
                <p className="text-xs font-bold text-slate-800 italic">
                  "{(tvSettings.tvVoiceTemplate || '')
                    .replace(/\{letter\}/g, 'Ka')
                    .replace(/\{zeros\}/g, ' nol')
                    .replace(/\{number\}/g, "o'n beshinchi")
                    .replace(/\{cabinet\}/g, 'uchinchi')
                    .replace(/\{specialty\}/g, 'Kardiologiya')
                    .replace(/\{doctor\}/g, 'Dr. Karimova Malika')
                    .replace(/\{patient\}/g, 'Rahimov Aziz')}"
                </p>
              </div>

              <button
                type="button"
                onClick={onPlayTvPreview}
                disabled={isPlayingTvPreview}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 flex-shrink-0 cursor-pointer shadow-xs disabled:opacity-60"
              >
                {isPlayingTvPreview ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span>{isPlayingTvPreview ? 'Ijro etilmoqda...' : 'Ovozda eshitib ko\'rish'}</span>
              </button>
            </div>
          </div>

          {/* Card 2: TV Ovozini Yoqish/O'chirish va Ovoz Tanlovi */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
            {/* TV Tablo Ovoz Holati Toggle Switch */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition ${
                  tvSettings.tvSoundEnabled
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-200'
                    : 'bg-rose-500/10 text-rose-600 border border-rose-200'
                }`}>
                  {tvSettings.tvSoundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#172B4D]">TV Tablo Ovozli E'lonlari</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      tvSettings.tvSoundEnabled
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {tvSettings.tvSoundEnabled ? 'Faol (Yoqilgan)' : "O'chirilgan (Ovozsiz)"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    TV tabloda bemorlarni chaqirish va qo'ng'iroq signallarini yoqish yoki o'chirish (real-vaqt rejimida TV ga uzatiladi)
                  </p>
                </div>
              </div>

              {/* Switch Button */}
              <button
                type="button"
                onClick={onToggleSound}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${
                  tvSettings.tvSoundEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
                title={tvSettings.tvSoundEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                    tvSettings.tvSoundEnabled ? 'translate-x-9' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Voice Selection */}
            <div>
              <h4 className="text-sm font-bold text-[#172B4D] mb-1">Ovoz Tanlovi (Tabiiy Studiya Suxandoni)</h4>
              <p className="text-[11px] text-slate-500 mb-3.5">
                Bemorlarni chaqirish uchun qaysi tabiiy o'zbek tili inson ovozidan foydalanilsin (TV tabloda xam doimiy saqlanadi):
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Madina (Female) */}
                <label
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3.5 ${
                    tvSettings.tvVoiceName === 'uz-UZ-MadinaNeural'
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="tvVoiceName"
                    checked={tvSettings.tvVoiceName === 'uz-UZ-MadinaNeural'}
                    onChange={() => setTvSettings({ ...tvSettings, tvVoiceName: 'uz-UZ-MadinaNeural' })}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <span>Madina (Ayol ovozi)</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Tavsiya etiladi
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Mayin, jarangdor va aniq tabiiy studiya ovozi. Kasalxona va klinika qabulxonalariga mos.
                    </p>
                  </div>
                </label>

                {/* Sardor (Male) */}
                <label
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3.5 ${
                    tvSettings.tvVoiceName === 'uz-UZ-SardorNeural'
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="tvVoiceName"
                    checked={tvSettings.tvVoiceName === 'uz-UZ-SardorNeural'}
                    onChange={() => setTvSettings({ ...tvSettings, tvVoiceName: 'uz-UZ-SardorNeural' })}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <span>Sardor (Erkak ovozi)</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Vazmin, rasmiy va ishonchli suxandon shifokor ovozi.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TV EKRANIDAGI VIZUAL YOZUVLAR (SPAN 5) */}
        <div className="col-span-12 xl:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-[#0084FF] flex items-center justify-center">
                <Tv className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#172B4D]">TV Ekranidagi Yozuvlar va Matnlar</h4>
                <p className="text-[11px] text-slate-500">Ekrandagi barcha sarlavhalar va yo'riqnomalarni tahrirlash</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Klinika Nomi (Header)</label>
                <input
                  type="text"
                  value={tvSettings.clinicName}
                  onChange={e => setTvSettings({ ...tvSettings, clinicName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Yuqori Shior (Sarlavha)</label>
                  <input
                    type="text"
                    value={tvSettings.tvSloganTitle}
                    onChange={e => setTvSettings({ ...tvSettings, tvSloganTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Yuqori Shior (Osti)</label>
                  <input
                    type="text"
                    value={tvSettings.tvSloganSubtitle}
                    onChange={e => setTvSettings({ ...tvSettings, tvSloganSubtitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Chaqiruv Sarlavhasi</label>
                  <input
                    type="text"
                    value={tvSettings.tvCallingTitle}
                    onChange={e => setTvSettings({ ...tvSettings, tvCallingTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Kutish Rejim Sarlavhasi</label>
                  <input
                    type="text"
                    value={tvSettings.tvStandbyTitle}
                    onChange={e => setTvSettings({ ...tvSettings, tvStandbyTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Kutish Holatidagi Pastki E'lon</label>
                <input
                  type="text"
                  value={tvSettings.tvStandbyFooter}
                  onChange={e => setTvSettings({ ...tvSettings, tvStandbyFooter: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Pastki Ko'k Banner Matni</label>
                <input
                  type="text"
                  value={tvSettings.tvBottomBanner}
                  onChange={e => setTvSettings({ ...tvSettings, tvBottomBanner: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <label className="text-xs font-bold text-slate-700 block">Pastki 3 ta Ko'rsatma Yozuvlari:</label>
                <input
                  type="text"
                  value={tvSettings.tvInstruction1}
                  onChange={e => setTvSettings({ ...tvSettings, tvInstruction1: e.target.value })}
                  placeholder="1-ko'rsatma"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
                <input
                  type="text"
                  value={tvSettings.tvInstruction2}
                  onChange={e => setTvSettings({ ...tvSettings, tvInstruction2: e.target.value })}
                  placeholder="2-ko'rsatma"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
                <input
                  type="text"
                  value={tvSettings.tvInstruction3}
                  onChange={e => setTvSettings({ ...tvSettings, tvInstruction3: e.target.value })}
                  placeholder="3-ko'rsatma"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <button
                type="button"
                onClick={onSaveTvSettings}
                disabled={isSavingTvSettings}
                className="w-full py-3 bg-[#00897B] hover:bg-[#00796B] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer mt-4"
              >
                {isSavingTvSettings ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isSavingTvSettings ? 'Saqlanmoqda...' : 'O\'zgarishlarni TV ga saqlash'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM FULL WIDTH: TV TABLOGA JONLI SINOV CHAQIRUVI */}
        <div className="col-span-12 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#172B4D]">TV Ekraniga Jonli Sinov Chaqiruvi Yuborish</h4>
                <p className="text-[11px] text-slate-500">
                  Hozirgi sozlamalaringiz asosida TV ekranga (port 3002) to'g'ridan-to'g'ri chaqiruv ovozi va vizual kartasini yuborib tekshiring
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Sinov Talon Raqami</label>
              <input
                type="text"
                value={testTicketNum}
                onChange={e => setTestTicketNum(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                placeholder="K015"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Mutaxassislik</label>
              <input
                type="text"
                value={testSpecName}
                onChange={e => setTestSpecName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                placeholder="Kardiologiya"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Kabinet Raqami</label>
              <input
                type="text"
                value={testCabNum}
                onChange={e => setTestCabNum(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                placeholder="3"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={onSendTvTestCall}
                className="w-full py-2.5 bg-[#00897B] hover:bg-[#00796B] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>TV ga Sinov Chaqiruvini Yuborish</span>
              </button>
            </div>
          </div>

          {testCallStatus && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{testCallStatus}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
