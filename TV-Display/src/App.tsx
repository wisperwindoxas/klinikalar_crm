import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Clock, Calendar, Stethoscope, DoorOpen, Users, Bell, FileText, HeartPulse } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { playChime } from './audio/chime';
import appLogo from './assets/logo.png';

const API_BASE_URL = 'http://localhost:5001/api/v1';
const WS_BASE_URL = 'http://localhost:5001';

// O'zbek tili sonlari va tartib raqamlari
const UZ_NUMBERS: Record<string, string> = {
  '0': 'nol', '1': 'bir', '2': 'ikki', '3': 'uch', '4': "to'rt",
  '5': 'besh', '6': 'olti', '7': 'yetti', '8': 'sakkiz', '9': "to'qqiz"
};

const UZ_ORDINAL: Record<string, string> = {
  '1': 'birinchi', '2': 'ikkinchi', '3': 'uchinchi', '4': "to'rtinchi",
  '5': 'beshinchi', '6': 'oltinchi', '7': 'yettinchi', '8': 'sakkizinchi',
  '9': "to'qqizinchi", '10': "o'ninchi", '11': "o'n birinchi", '12': "o'n ikkinchi",
  '13': "o'n uchinchi", '14': "o'n to'rtinchi", '15': "o'n beshinchi",
  '16': "o'n oltinchi", '17': "o'n yettinchi", '18': "o'n sakkizinchi",
  '19': "o'n to'qqizinchi", '20': 'yigirmanchi'
};

const UZ_LETTERS: Record<string, string> = {
  'K': 'Ka', 'T': 'Te', 'N': 'En', 'U': 'U', 'J': 'Je', 'P': 'Pe',
  'S': 'Es', 'O': 'O', 'L': 'El', 'D': 'De', 'E': 'E', 'G': 'Ge',
  'A': 'A', 'B': 'Be', 'C': 'Se', 'TR': 'Te Er'
};

export const App: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [time, setTime] = useState('14:25');
  const [dateStr, setDateStr] = useState('21.02.2026');
  const [dayStr, setDayStr] = useState('Seshanba');
  const [isCallingFlash, setIsCallingFlash] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<'uz-UZ-MadinaNeural' | 'uz-UZ-SardorNeural'>('uz-UZ-MadinaNeural');

  const isAudioEnabledRef = useRef<boolean>(true);
  const selectedVoiceRef = useRef<'uz-UZ-MadinaNeural' | 'uz-UZ-SardorNeural'>('uz-UZ-MadinaNeural');
  const audioQueueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef<boolean>(false);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    isAudioEnabledRef.current = isAudioEnabled;
  }, [isAudioEnabled]);

  useEffect(() => {
    selectedVoiceRef.current = selectedVoice;
  }, [selectedVoice]);

  // Local Web Speech API Fallback (if network or audio stream fails)
  const speakLocalFallback = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'uz-UZ';
      utterance.rate = 0.88;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const uzVoice = voices.find(v => v.lang.includes('uz') || v.lang.includes('UZ'));
      const fallbackVoice = voices.find(v => v.lang.includes('ru') || v.lang.includes('tr') || v.default);
      if (uzVoice) {
        utterance.voice = uzVoice;
      } else if (fallbackVoice) {
        utterance.voice = fallbackVoice;
      }

      utterance.onend = () => {
        isSpeakingRef.current = false;
        processAudioQueue();
      };
      utterance.onerror = () => {
        isSpeakingRef.current = false;
        processAudioQueue();
      };

      isSpeakingRef.current = true;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis fallback error:', e);
      isSpeakingRef.current = false;
      processAudioQueue();
    }
  };

  // High-Quality Human Studio Voice (Microsoft Azure Neural Uzbek Madina / Sardor)
  const speakHumanVoice = (text: string) => {
    if (!isAudioEnabledRef.current) {
      console.log('Audio not active. Please click "Ovozni yoqish".');
      return;
    }

    try {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }

      isSpeakingRef.current = true;
      const voiceToUse = selectedVoiceRef.current;
      const audioUrl = `${API_BASE_URL}/voice/speak?text=${encodeURIComponent(text)}&voice=${voiceToUse}`;
      const audio = new Audio(audioUrl);
      activeAudioRef.current = audio;

      let hasFinished = false;
      const finishPlayback = () => {
        if (hasFinished) return;
        hasFinished = true;
        isSpeakingRef.current = false;
        activeAudioRef.current = null;
        processAudioQueue();
      };

      audio.onended = finishPlayback;

      // Safety timeout: in case browser doesn't fire onended
      const safeDuration = Math.max(4500, text.length * 100);
      setTimeout(() => {
        finishPlayback();
      }, safeDuration);

      audio.onerror = (e) => {
        console.warn('Neural voice stream failed, using local fallback:', e);
        finishPlayback();
        speakLocalFallback(text);
      };

      audio.play().catch((err) => {
        console.warn('Audio.play() error:', err);
        finishPlayback();
        speakLocalFallback(text);
      });
    } catch (err) {
      console.warn('speakHumanVoice exception:', err);
      isSpeakingRef.current = false;
      speakLocalFallback(text);
    }
  };

  const processAudioQueue = () => {
    if (isSpeakingRef.current || audioQueueRef.current.length === 0) return;
    const nextPhrase = audioQueueRef.current.shift();
    if (nextPhrase) {
      speakHumanVoice(nextPhrase);
    }
  };

const numberToUzbekOrdinal = (n: number | string): string => {
  const num = parseInt(String(n), 10);
  if (isNaN(num) || num <= 0) return `${n}-chi`;

  const ordinals: Record<number, string> = {
    1: 'birinchi', 2: 'ikkinchi', 3: 'uchinchi', 4: "to'rtinchi", 5: 'beshinchi',
    6: 'oltinchi', 7: 'yettinchi', 8: 'sakkizinchi', 9: "to'qqizinchi",
    10: "o'ninchi", 20: 'yigirmanchi', 30: "o'ttizinchi", 40: 'qirqinchi',
    50: 'elliginchi', 60: 'oltmishinchi', 70: 'yetmishinchi', 80: 'saksoninchi',
    90: "to'qsoninchi", 100: 'yuzinchi'
  };

  if (ordinals[num]) return ordinals[num];

  const tensWords: Record<number, string> = {
    10: "o'n", 20: 'yigirma', 30: "o'ttiz", 40: 'qirq',
    50: 'ellik', 60: 'oltmish', 70: 'yetmish', 80: 'sakson', 90: "to'qson"
  };

  const onesWords: Record<number, string> = {
    1: 'bir', 2: 'ikki', 3: 'uch', 4: "to'rt", 5: 'besh',
    6: 'olti', 7: 'yetti', 8: 'sakkiz', 9: "to'qqiz"
  };

  if (num < 100) {
    const tens = Math.floor(num / 10) * 10;
    const remainder = num % 10;
    return `${tensWords[tens]} ${ordinals[remainder] || `${remainder}-chi`}`;
  }

  if (num < 1000) {
    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;
    const hundredsPrefix = hundreds === 1 ? 'bir yuz' : `${onesWords[hundreds]} yuz`;
    if (remainder === 0) return `${hundredsPrefix}inchi`;
    if (remainder < 10) return `${hundredsPrefix} ${ordinals[remainder]}`;
    const tens = Math.floor(remainder / 10) * 10;
    const remOnes = remainder % 10;
    if (remOnes === 0) return `${hundredsPrefix} ${ordinals[tens]}`;
    return `${hundredsPrefix} ${tensWords[tens]} ${ordinals[remOnes]}`;
  }

  return `${num}-chi`;
};

  const buildNaturalVoiceText = (ticket: any): string => {
    const fullNum = ticket.full_number || ticket.ticketNumber || '';
    const cleanNum = fullNum.replace(/[^A-Za-z0-9]/g, '');
    const letter = cleanNum.replace(/[0-9]/g, '').toUpperCase();
    const digits = cleanNum.replace(/[^0-9]/g, '');

    const letterSpoken = UZ_LETTERS[letter] || letter;
    const numVal = parseInt(digits, 10);
    const leadingZerosMatch = digits.match(/^0+/);
    let spokenZeros = '';
    if (leadingZerosMatch && numVal > 0) {
      const zeroCount = leadingZerosMatch[0].length;
      spokenZeros = ' ' + Array(zeroCount).fill('nol').join(' ');
    }

    const spokenTicketNum = numberToUzbekOrdinal(numVal);
    const cabNum = String(ticket.cabinet_number || ticket.cabinetNumber || '1');
    const spokenCab = numberToUzbekOrdinal(cabNum);

    const specialty = ticket.specialty_name || ticket.specialtyName || 'Shifokor';
    const doctor = ticket.doctor_name || ticket.doctorName || '';
    const patient = ticket.patient_name || ticket.patientName || '';

    const template = data?.settings?.tv_voice_template || 'Talon raqami {letter}{zeros}, {number} raqam egasi, sizni {cabinet} xona, {specialty} xonasiga marhamat!';

    return template
      .replace(/\{letter\}/g, letterSpoken)
      .replace(/\{zeros\}/g, spokenZeros)
      .replace(/\{number\}/g, spokenTicketNum)
      .replace(/\{cabinet\}/g, spokenCab)
      .replace(/\{specialty\}/g, specialty)
      .replace(/\{doctor\}/g, doctor)
      .replace(/\{patient\}/g, patient);
  };

  const queueVoiceAnnouncement = (ticket: any) => {
    if (!isAudioEnabledRef.current) {
      console.log('TV ovozi meneger tomonidan o\'chirilgan (jim rejim).');
      return;
    }
    playChime();

    const naturalText = ticket.voiceText || buildNaturalVoiceText(ticket);
    // Highest priority: pause any intro/welcome sound immediately
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    isSpeakingRef.current = false;
    audioQueueRef.current = [naturalText];
    setTimeout(() => {
      processAudioQueue();
    }, 1100);
  };

  useEffect(() => {
    // 1. Clock in Uzbek (DD.MM.YYYY formatida chiroyli)
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }));
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      setDateStr(`${day}.${month}.${year}`);
      const weekdaysUz = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
      setDayStr(weekdaysUz[now.getDay()]);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);

    // Audio unlock listener for browser autoplay policy
    const unlockAudio = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          if (ctx.state === 'suspended') {
            ctx.resume();
          }
        }
      } catch (_) {}
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    // 2. Fetch initial real TV Feed
    fetchFeed();

    // 3. WebSocket Setup with backend
    const socket: Socket = io(WS_BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 15,
      reconnectionDelay: 2000
    });

    socket.on('connect', () => {
      setIsOnline(true);
      socket.emit('join_tenant', {
        tenantId: 'tenant_sadaf_01',
        branchId: 'branch_sadaf_main',
        role: 'TV_DISPLAY'
      });
    });

    socket.on('disconnect', () => {
      setIsOnline(false);
    });

    // Real-time events from Backend
    socket.on('queue.called', (ticket: any) => {
      setIsCallingFlash(true);
      setTimeout(() => setIsCallingFlash(false), 9000);
      queueVoiceAnnouncement(ticket);
      fetchFeed();
    });

    socket.on('tv.settings_updated', (updatedSettings: any) => {
      setData((prev: any) => ({
        ...prev,
        clinicName: updatedSettings.clinic_name || prev?.clinicName,
        settings: updatedSettings
      }));
      if (updatedSettings.tv_voice_name) {
        setSelectedVoice(updatedSettings.tv_voice_name);
      }
      if (updatedSettings.tv_sound_enabled !== undefined) {
        setIsAudioEnabled(Boolean(updatedSettings.tv_sound_enabled));
      }
    });

    socket.on('queue.created', () => fetchFeed());
    socket.on('queue.started', () => fetchFeed());
    socket.on('queue.completed', () => fetchFeed());
    socket.on('queue.skipped', () => fetchFeed());

    // Auto-refresh real data every 5 seconds to ensure 100% sync
    const refreshInterval = setInterval(fetchFeed, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(refreshInterval);
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      socket.disconnect();
    };
  }, []);

  const fetchFeed = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/tv/feed`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setData(json.data);
          setIsOnline(true);
          if (json.data.settings?.tv_voice_name) {
            setSelectedVoice(json.data.settings.tv_voice_name);
          }
          if (json.data.settings?.tv_sound_enabled !== undefined) {
            setIsAudioEnabled(Boolean(json.data.settings.tv_sound_enabled));
          }
        }
      }
    } catch (e) {
      console.warn('TV Feed fetch error:', e);
    }
  };

  const enableAudio = () => {
    setIsAudioEnabled(true);
    playChime();
    setTimeout(() => {
      const welcomeText = "Ovoz tizimi faollashtirildi. Xush kelibsiz!";
      isSpeakingRef.current = true;
      const audioUrl = `${API_BASE_URL}/voice/speak?text=${encodeURIComponent(welcomeText)}&voice=${selectedVoice}`;
      const audio = new Audio(audioUrl);
      activeAudioRef.current = audio;
      audio.onended = () => {
        isSpeakingRef.current = false;
        activeAudioRef.current = null;
      };
      audio.play().catch(() => {
        speakLocalFallback(welcomeText);
      });
    }, 400);
  };

  const toggleVoice = () => {
    const nextVoice = selectedVoice === 'uz-UZ-MadinaNeural' ? 'uz-UZ-SardorNeural' : 'uz-UZ-MadinaNeural';
    setSelectedVoice(nextVoice);
    if (isAudioEnabled) {
      const sampleText = nextVoice.includes('Sardor')
        ? "Sardor ovozi tanlandi."
        : "Madina ovozi tanlandi.";
      const audioUrl = `${API_BASE_URL}/voice/speak?text=${encodeURIComponent(sampleText)}&voice=${nextVoice}`;
      const audio = new Audio(audioUrl);
      audio.play().catch(() => {});
    }
  };

  // Real Active Ticket from PostgreSQL (zero mock fallback)
  const activeTicket = (data?.currentCalled && data.currentCalled.length > 0)
    ? data.currentCalled[0]
    : null;

  // Real Waiting Queue from PostgreSQL (zero mock fallback)
  const upcomingQueue: any[] = (data?.waitingNext || data?.upcomingQueue || []);

  const getBadgeStyle = (num: string) => {
    const prefix = num.charAt(0).toUpperCase();
    if (prefix === 'K') return 'bg-[#E0F2FE] text-[#0284C7]';
    if (prefix === 'N') return 'bg-[#FFEDD5] text-[#EA580C]';
    if (prefix === 'U') return 'bg-[#DCFCE7] text-[#16A34A]';
    if (prefix === 'T') return 'bg-[#DBEAFE] text-[#2563EB]';
    if (prefix === 'S') return 'bg-[#F3E8FF] text-[#9333EA]';
    if (prefix === 'P') return 'bg-[#DBEAFE] text-[#2563EB]';
    if (prefix === 'J') return 'bg-[#FEF3C7] text-[#D97706]';
    return 'bg-[#F1F5F9] text-[#475569]';
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#EBF3F8] text-[#172B4D] select-none font-sans overflow-hidden">
      {/* 1. TOP NAVY BANNER (100% 1:1 WITH tv.png) */}
      <header className="h-[96px] bg-[#002B49] text-white px-8 flex items-center justify-between shadow-md flex-shrink-0 z-10">
        {/* Brand Left */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-transparent flex items-center justify-center flex-shrink-0 filter drop-shadow-md">
            <img src={data?.settings?.logo_url || appLogo} alt="klinika-admin Logo" className="w-full h-full object-contain bg-transparent" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none text-white">
              {data?.settings?.clinic_name || data?.clinicName || 'klinika-admin'}
            </h1>
            <p className="text-xs text-[#64B5F6] font-medium tracking-wide mt-1 flex items-center gap-2">
              <span>Navbat Tizimi</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] bg-white/10">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                <span>{isOnline ? 'Jonli' : 'Aloqa yo\'q'}</span>
              </span>
            </p>
          </div>
        </div>

        {/* Center Slogan */}
        <div className="text-center">
          <h2 className="text-xl font-black text-white tracking-wide">
            {data?.settings?.tv_slogan_title || 'Sog‘lig‘ingiz biz uchun muhim!'}
          </h2>
          <p className="text-xs text-[#90CAF9] font-medium mt-0.5">
            {data?.settings?.tv_slogan_subtitle || 'Navbat bilan qabulga marhamat!'}
          </p>
        </div>

        {/* Right Date & Huge Digital Time */}
        <div className="flex items-center gap-5">
          {/* Sana (21.02.2026 formatida katta va chiroyli) */}
          <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center border border-sky-400/30">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="text-2xl font-black text-white tracking-widest font-mono leading-none">
                {dateStr}
              </div>
              <div className="text-xs text-sky-200 font-semibold tracking-wide mt-1">
                {dayStr}
              </div>
            </div>
          </div>

          <div className="h-10 w-[1px] bg-white/20"></div>

          <div className="text-5xl font-black text-white tracking-tight font-mono">
            {time}
          </div>

          {/* Meneger panelida tanlangan Ovoz (Madina / Sardor) */}
          <div
            className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold flex items-center gap-2 shadow-sm"
            title="Meneger panelidan belgilangan ovoz suxandoni"
          >
            <span className={`w-2.5 h-2.5 rounded-full ${selectedVoice.includes('Madina') ? 'bg-emerald-400' : 'bg-sky-400'} animate-pulse`}></span>
            <span>{selectedVoice.includes('Madina') ? 'Madina (Ayol)' : 'Sardor (Erkak)'}</span>
          </div>

          {/* TV Audio Status Pill (Meneger paneli bilan boshqariladigan) */}
          <button
            onClick={enableAudio}
            className={`px-3.5 py-2 rounded-xl border font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer ${
              isAudioEnabled
                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                : 'bg-rose-500/25 border-rose-400 text-rose-300'
            }`}
            title={isAudioEnabled ? "Ovoz tizimi faol (Meneger ruxsat bergan)" : "Ovoz o'chirilgan (Meneger paneli orqali yoqiladi)"}
          >
            {isAudioEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-300 animate-pulse" />
                <span>Ovoz: Faol</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-rose-300" />
                <span>Ovoz: O'chirilgan</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 2. MAIN DISPLAY CONTENT (100% 1:1 WITH tv.png) */}
      <main className="flex-1 p-6 grid grid-cols-12 gap-6 min-h-0">
        {/* LEFT COLUMN: ACTIVE CALLED TICKET CARD (SPAN 8) */}
        <section className={`col-span-8 bg-white rounded-3xl p-8 border border-slate-200/90 shadow-lg flex flex-col justify-between transition-all duration-300 ${
          isCallingFlash ? 'ring-8 ring-emerald-400/60 scale-[1.008]' : ''
        }`}>
          {/* Header Badge */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-3 px-4 py-2.5 bg-[#00897B]/10 border border-[#00897B]/30 rounded-2xl">
              <div className="w-9 h-9 rounded-xl bg-[#00897B] text-white flex items-center justify-center">
                <Volume2 className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black text-[#00695C]">
                {activeTicket ? (data?.settings?.tv_calling_title || 'Hozir chaqirilmoqda!') : (data?.settings?.tv_standby_title || 'Qabul xonasi')}
              </span>
            </div>

            {activeTicket && (
              <span className="animate-pulse px-3.5 py-1.5 bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-full shadow">
                Chaqirilmoqda
              </span>
            )}
          </div>

          {/* Central Section: Ticket & Doctor/Cabinet */}
          <div className="grid grid-cols-12 gap-6 items-stretch my-auto py-4">
            {/* GIANT TICKET NUMBER BOX (Col span 7) */}
            <div className="col-span-7 bg-[#006856] rounded-3xl flex flex-col items-center justify-center p-8 shadow-inner border border-[#004D40] min-h-[220px]">
              {activeTicket ? (
                <span className="text-white font-black text-8xl md:text-9xl tracking-wider select-text drop-shadow-md font-mono">
                  {activeTicket.full_number}
                </span>
              ) : (
                <div className="text-center">
                  <span className="text-white font-black text-5xl md:text-6xl tracking-wider drop-shadow-md">
                    klinika-admin
                  </span>
                  <div className="text-emerald-200 text-xs font-semibold mt-2">
                    {upcomingQueue.length > 0 ? `${upcomingQueue.length} ta bemor navbatda` : 'Elektron navbat tizimi'}
                  </div>
                </div>
              )}
            </div>

            {/* DOCTOR & CABINET BOXES (Col span 5) */}
            <div className="col-span-5 flex flex-col justify-between gap-4">
              {/* Doctor Card */}
              <div className="flex-1 bg-[#F0F7FD] border border-[#D0E5F7] rounded-3xl p-5 flex items-center gap-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] flex-shrink-0">
                  <Stethoscope className="w-8 h-8" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-2xl font-black text-[#172B4D] truncate">
                    {activeTicket ? activeTicket.specialty_name : 'Qabul kutilmoqda'}
                  </h3>
                  <p className="text-base text-slate-500 font-medium truncate mt-0.5">
                    {activeTicket ? activeTicket.doctor_name : 'Shifokor qabuli'}
                  </p>
                </div>
              </div>

              {/* Cabinet Card */}
              <div className="flex-1 bg-[#F0F7FD] border border-[#D0E5F7] rounded-3xl p-5 flex items-center gap-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] flex-shrink-0">
                  <DoorOpen className="w-8 h-8" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-3xl font-black text-[#172B4D] truncate">
                    {activeTicket ? `${activeTicket.cabinet_number} - kabinet` : 'Qabulxona'}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Green Banner */}
          <div className="bg-[#D8F3DC] text-[#15803D] border border-[#B7E4C7] rounded-2xl py-4 px-6 text-center text-3xl font-black tracking-wide shadow-sm">
            {activeTicket
              ? `Marhamat, ${activeTicket.cabinet_number}-kabinetga!`
              : (data?.settings?.tv_standby_footer || 'Iltimos, navbat raqamingiz chaqirilishini kuting!')}
          </div>
        </section>

        {/* RIGHT COLUMN: UPCOMING QUEUE TABLE (SPAN 4) (100% Real from PostgreSQL) */}
        <section className="col-span-4 bg-white rounded-3xl border border-slate-200/90 shadow-lg flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[#0B2545] text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                <Clock className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">Keyingi navbatlar</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-white">
              {upcomingQueue.length} ta
            </span>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 px-5 py-2.5 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <div className="col-span-4">Talon №</div>
            <div className="col-span-5">Mutaxassislik</div>
            <div className="col-span-3 text-right">Kabinet</div>
          </div>

          {/* Table List with Real Database Tickets */}
          <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
            {upcomingQueue.length > 0 ? (
              upcomingQueue.map((item: any, idx: number) => {
                const ticketNum = item.full_number;
                const specialty = item.specialty_name || 'Shifokor';
                const cab = item.cabinet_number || '1';
                const badgeCls = getBadgeStyle(ticketNum);

                return (
                  <div
                    key={item.id || idx}
                    className="grid grid-cols-12 items-center px-5 py-3 hover:bg-slate-50/80 transition"
                  >
                    {/* Talon badge */}
                    <div className="col-span-4">
                      <span className={`inline-block px-3 py-1 rounded-lg text-sm font-black font-mono tracking-wide ${badgeCls}`}>
                        {ticketNum}
                      </span>
                    </div>

                    {/* Specialty */}
                    <div className="col-span-5 text-sm font-bold text-slate-700 truncate pr-2">
                      {specialty}
                    </div>

                    {/* Cabinet */}
                    <div className="col-span-3 text-right">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-black text-sm">
                        {cab}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
                <Users className="w-8 h-8 text-slate-300" />
                <p>Navbatda kutayotgan bemorlar yo'q</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 3. BOTTOM FOOTER BAR (100% 1:1 WITH tv.png) */}
      <footer className="px-6 pb-6 pt-1 flex items-center gap-6 flex-shrink-0">
        {/* Left Card: 3 Instruction Items */}
        <div className="flex-1 bg-white rounded-2xl p-4 border border-slate-200/90 shadow-md flex items-center justify-around">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-600 max-w-[140px] leading-tight">
              {data?.settings?.tv_instruction_1 || 'Iltimos, navbatingizni kuting'}
            </span>
          </div>

          <div className="h-8 w-[1px] bg-slate-200"></div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <Bell className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-600 max-w-[160px] leading-tight">
              {data?.settings?.tv_instruction_2 || "Navbat raqami ovozli e'lon qilinadi"}
            </span>
          </div>

          <div className="h-8 w-[1px] bg-slate-200"></div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-600 max-w-[200px] leading-tight">
              {data?.settings?.tv_instruction_3 || 'Talon raqamini va kabinet raqamini diqqat bilan tinglang'}
            </span>
          </div>
        </div>

        {/* Right Card: Cyan Slogan Box */}
        <div className="bg-[#0077B6] rounded-2xl p-4 text-white flex items-center gap-3 px-8 shadow-md flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
            <HeartPulse className="w-5 h-5" />
          </div>
          <span className="text-sm font-bold tracking-tight">
            {data?.settings?.tv_bottom_banner || 'Sizning sog‘lig‘ingiz – bizning ustuvor vazifamiz!'}
          </span>
        </div>
      </footer>
    </div>
  );
};
