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

import { API_BASE_URL } from '../config';

class TranscriptionHistoryService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async saveTranscriptionSession(session: TranscriptionSession): Promise<void> {
    try {
      console.log('📚 Sauvegarde session transcription:', session);
      
      const response = await fetch(`${this.baseUrl}/api/transcription-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(session),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      console.log('✅ Session transcription sauvegardée');
    } catch (error) {
      console.error('❌ Erreur sauvegarde session transcription:', error);
      throw error;
    }
  }

  async getTranscriptionHistory(commercialId?: string, limit: number = 50): Promise<TranscriptionSession[]> {
    try {
      const params = new URLSearchParams();
      if (commercialId) {
        params.append('commercial_id', commercialId);
      }
      params.append('limit', limit.toString());

      const response = await fetch(`${this.baseUrl}/api/transcription-history?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data.history || [];
    } catch (error) {
      console.error('❌ Erreur récupération historique transcriptions:', error);
      return [];
    }
  }

  async deleteTranscriptionSession(sessionId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/transcription-history/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      console.log('✅ Session transcription supprimée');
    } catch (error) {
      console.error('❌ Erreur suppression session transcription:', error);
      throw error;
    }
  }
}

export const transcriptionHistoryService = new TranscriptionHistoryService(); 