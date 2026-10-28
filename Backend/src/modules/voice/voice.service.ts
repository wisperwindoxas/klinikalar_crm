import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
// @ts-ignore
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const CACHE_DIR = path.resolve(__dirname, '../../../cache/audio');

const UZ_LETTERS_MAP: Record<string, string> = {
  'K': 'Ka',
  'T': 'Te',
  'N': 'En',
  'U': 'U',
  'J': 'Je',
  'P': 'Pe',
  'S': 'Es',
  'O': 'O',
  'L': 'El',
  'D': 'De',
  'E': 'E',
  'G': 'Ge',
  'A': 'A',
  'B': 'Be',
  'C': 'Se',
  'TR': 'Te Er'
};

const ORDINALS_EXACT: Record<number, string> = {
  1: 'birinchi',
  2: 'ikkinchi',
  3: 'uchinchi',
  4: "to'rtinchi",
  5: 'beshinchi',
  6: 'oltinchi',
  7: 'yettinchi',
  8: 'sakkizinchi',
  9: "to'qqizinchi",
  10: "o'ninchi",
  20: 'yigirmanchi',
  30: "o'ttizinchi",
  40: 'qirqinchi',
  50: 'elliginchi',
  60: 'oltmishinchi',
  70: 'yetmishinchi',
  80: 'saksoninchi',
  90: "to'qsoninchi",
  100: 'yuzinchi'
};

const TENS_WORDS: Record<number, string> = {
  10: "o'n",
  20: 'yigirma',
  30: "o'ttiz",
  40: 'qirq',
  50: 'ellik',
  60: 'oltmish',
  70: 'yetmish',
  80: 'sakson',
  90: "to'qson"
};

const ONES_WORDS: Record<number, string> = {
  1: 'bir',
  2: 'ikki',
  3: 'uch',
  4: "to'rt",
  5: 'besh',
  6: 'olti',
  7: 'yetti',
  8: 'sakkiz',
  9: "to'qqiz"
};

export function numberToUzbekOrdinal(n: number | string): string {
  const num = parseInt(String(n), 10);
  if (isNaN(num) || num <= 0) return `${n}-chi`;

  if (ORDINALS_EXACT[num]) {
    return ORDINALS_EXACT[num];
  }

  if (num < 100) {
    const tens = Math.floor(num / 10) * 10;
    const remainder = num % 10;
    return `${TENS_WORDS[tens]} ${ORDINALS_EXACT[remainder] || `${remainder}-chi`}`;
  }

  if (num < 1000) {
    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;
    const hundredsPrefix = hundreds === 1 ? 'bir yuz' : `${ONES_WORDS[hundreds]} yuz`;
    if (remainder === 0) return `${hundredsPrefix}inchi`;
    if (remainder < 10) return `${hundredsPrefix} ${ORDINALS_EXACT[remainder]}`;
    const tens = Math.floor(remainder / 10) * 10;
    const remOnes = remainder % 10;
    if (remOnes === 0) return `${hundredsPrefix} ${ORDINALS_EXACT[tens]}`;
    return `${hundredsPrefix} ${TENS_WORDS[tens]} ${ORDINALS_EXACT[remOnes]}`;
  }

  return `${num}-chi`;
}

export class VoiceService {
  private static instance: VoiceService;

  private constructor() {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
  }

  public static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  /**
   * Convert ticket into natural, phonetic Uzbek text for speech
   * Example: K015, cab 3, Kardiologiya ->
   * "Talon raqami Ka nol, o'n beshinchi raqam egasi, sizni uchinchi xona, Kardiologiya xonasiga marhamat!"
   */
  public formatTicketAnnouncement(
    ticket: {
      full_number?: string;
      ticketNumber?: string;
      cabinet_number?: string | number;
      cabinetNumber?: string | number;
      specialty_name?: string;
      specialtyName?: string;
      doctor_name?: string;
      doctorName?: string;
      patient_name?: string;
      patientName?: string;
    },
    customTemplate?: string
  ): string {
    const rawNumber = ticket.full_number || ticket.ticketNumber || '';
    const cleanNum = rawNumber.replace(/[^A-Za-z0-9]/g, '');
    const letterPart = cleanNum.replace(/[0-9]/g, '').toUpperCase();
    const digitsPart = cleanNum.replace(/[^0-9]/g, '');

    const spokenLetter = UZ_LETTERS_MAP[letterPart] || letterPart;

    const numVal = parseInt(digitsPart, 10);
    const leadingZerosMatch = digitsPart.match(/^0+/);
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

    const template = customTemplate && customTemplate.trim().length > 0
      ? customTemplate
      : 'Talon raqami {letter}{zeros}, {number} raqam egasi, sizni {cabinet} xona, {specialty} xonasiga marhamat!';

    return template
      .replace(/\{letter\}/g, spokenLetter)
      .replace(/\{zeros\}/g, spokenZeros)
      .replace(/\{number\}/g, spokenTicketNum)
      .replace(/\{cabinet\}/g, spokenCab)
      .replace(/\{specialty\}/g, specialty)
      .replace(/\{doctor\}/g, doctor)
      .replace(/\{patient\}/g, patient);
  }

  /**
   * Generate or retrieve cached MP3 file for the given text and voice
   */
  public async getAudioFilePath(
    text: string,
    voice: string = 'uz-UZ-MadinaNeural'
  ): Promise<string> {
    const validVoice = voice.includes('Sardor')
      ? 'uz-UZ-SardorNeural'
      : 'uz-UZ-MadinaNeural';

    // Generate MD5 hash based on text and voice
    const hash = crypto
      .createHash('md5')
      .update(`${validVoice}_${text.trim()}`)
      .digest('hex');

    const cachedFilePath = path.join(CACHE_DIR, `${hash}.mp3`);

    // Check if cached
    if (fs.existsSync(cachedFilePath) && fs.statSync(cachedFilePath).size > 0) {
      return cachedFilePath;
    }

    // Generate new audio via MsEdgeTTS
    const tempDir = path.join(CACHE_DIR, `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`);
    fs.mkdirSync(tempDir, { recursive: true });

    let tts: any = null;
    try {
      tts = new MsEdgeTTS();
      await tts.setMetadata(validVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      const res = await tts.toFile(tempDir, text);
      const generatedPath = res?.audioFilePath || path.join(tempDir, 'audio.mp3');

      if (fs.existsSync(generatedPath) && fs.statSync(generatedPath).size > 0) {
        fs.renameSync(generatedPath, cachedFilePath);
      } else {
        throw new Error('TTS audio generation resulted in empty file');
      }
    } finally {
      if (tts && typeof tts.close === 'function') {
        try {
          tts.close();
        } catch (_) {}
      }
      try {
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      } catch (_) {}
    }

    return cachedFilePath;
  }
}
