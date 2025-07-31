import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface TranscriptionSession {
  id: string;
  commercial_id: string;
  commercial_name: string;
  start_time: string;
  end_time: string;
  full_transcript: string;
  duration_seconds: number;
  building_id?: string;
  building_name?: string;
}

@Injectable()
export class TranscriptionHistoryService {
  constructor(private prisma: PrismaService) {}

  async saveSession(session: TranscriptionSession) {
    try {
      console.log('📚 Sauvegarde session dans la base de données:', session.id);
      
      const savedSession = await (this.prisma as any).transcriptionSession.create({
        data: {
          id: session.id,
          commercial_id: session.commercial_id,
          commercial_name: session.commercial_name,
          start_time: new Date(session.start_time),
          end_time: new Date(session.end_time),
          full_transcript: session.full_transcript,
          duration_seconds: session.duration_seconds,
          building_id: session.building_id,
          building_name: session.building_name,
        },
      });

      console.log('✅ Session transcription sauvegardée:', savedSession.id);
      
      return { success: true, sessionId: savedSession.id };
    } catch (error) {
      console.error('❌ Erreur sauvegarde session transcription:', error);
      throw error;
    }
  }

  async getHistory(commercialId?: string, limit: number = 50): Promise<TranscriptionSession[]> {
    try {
      console.log('📚 Récupération historique transcriptions:', { commercialId, limit });
      
      const sessions = await (this.prisma as any).transcriptionSession.findMany({
        where: commercialId ? { commercial_id: commercialId } : undefined,
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      const history: TranscriptionSession[] = sessions.map((session: any) => ({
        id: session.id,
        commercial_id: session.commercial_id,
        commercial_name: session.commercial_name,
        start_time: session.start_time.toISOString(),
        end_time: session.end_time.toISOString(),
        full_transcript: session.full_transcript,
        duration_seconds: session.duration_seconds,
        building_id: session.building_id,
        building_name: session.building_name,
      }));
      
      console.log('✅ Historique récupéré:', history.length, 'sessions');
      return history;
    } catch (error) {
      console.error('❌ Erreur récupération historique:', error);
      return [];
    }
  }

  async deleteSession(id: string) {
    try {
      console.log('📚 Suppression session transcription:', id);
      
      await (this.prisma as any).transcriptionSession.delete({
        where: { id },
      });
      
      console.log('✅ Session transcription supprimée');
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur suppression session:', error);
      throw error;
    }
  }
} 