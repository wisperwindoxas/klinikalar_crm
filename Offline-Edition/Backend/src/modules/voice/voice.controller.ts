import { Request, Response } from 'express';
import fs from 'fs';
import { VoiceService } from './voice.service';

export class VoiceController {
  public static async speak(req: Request, res: Response): Promise<void> {
    try {
      const text = (req.query.text as string || '').trim();
      const voice = (req.query.voice as string || 'uz-UZ-MadinaNeural').trim();

      if (!text) {
        res.status(400).json({
          success: false,
          message: "Matn (text) parametri kiritilishi shart."
        });
        return;
      }

      if (text.length > 250) {
        res.status(400).json({
          success: false,
          message: "Matn uzunligi ko'pi bilan 250 belgidan oshmasligi kerak."
        });
        return;
      }

      const voiceService = VoiceService.getInstance();
      const filePath = await voiceService.getAudioFilePath(text, voice);

      if (!fs.existsSync(filePath)) {
        res.status(500).json({
          success: false,
          message: "Ovoz faylini yaratishda xatolik yuz berdi."
        });
        return;
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');

      const stat = fs.statSync(filePath);
      res.setHeader('Content-Length', stat.size);

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    } catch (error: any) {
      console.error('[VoiceController.speak] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Ovoz hosil qilishda xatolik: ' + (error?.message || 'Server xatosi')
      });
    }
  }

  public static async getVoices(_req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      data: [
        {
          id: 'uz-UZ-MadinaNeural',
          name: 'Madina (Ayol ovozi)',
          gender: 'Female',
          description: "Mayin va aniq tabiiy studiya ovozi",
          isDefault: true
        },
        {
          id: 'uz-UZ-SardorNeural',
          name: 'Sardor (Erkak ovozi)',
          gender: 'Male',
          description: "Vazmin va rasmiy suxandon ovozi",
          isDefault: false
        }
      ]
    });
  }
}
