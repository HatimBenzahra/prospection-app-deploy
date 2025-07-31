/**
 * Utilitaire simple pour organiser les transcriptions en paragraphes
 */

interface TranscriptionSegment {
  text: string;
  isFinal: boolean;
  timestamp: number;
}

export class TranscriptionProcessor {
  private segments: TranscriptionSegment[] = [];

  /**
   * Ajoute un nouveau segment de transcription
   */
  addSegment(text: string, isFinal: boolean): string {
    const segment: TranscriptionSegment = {
      text: text.trim(),
      isFinal,
      timestamp: Date.now()
    };

    if (isFinal) {
      this.segments.push(segment);
    } else {
      // Remplacer le dernier segment temporaire ou ajouter un nouveau
      const lastSegment = this.segments[this.segments.length - 1];
      if (lastSegment && !lastSegment.isFinal) {
        lastSegment.text = segment.text;
        lastSegment.timestamp = segment.timestamp;
      } else {
        this.segments.push(segment);
      }
    }

    return this.formatTranscription();
  }

  /**
   * Formate la transcription en paragraphes simples
   */
  private formatTranscription(): string {
    if (this.segments.length === 0) return '';

    let result = '';
    let currentParagraph = '';

    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i];
      const nextSegment = this.segments[i + 1];

      // Ajouter le texte au paragraphe actuel
      if (currentParagraph) {
        currentParagraph += ' ' + segment.text;
      } else {
        currentParagraph = segment.text;
      }

      // Décider si on termine le paragraphe
      const shouldEndParagraph = this.shouldEndParagraph(segment, nextSegment);

      if (shouldEndParagraph) {
        // Finaliser le paragraphe - juste nettoyer les espaces
        result += this.simpleClean(currentParagraph) + '\n\n';
        currentParagraph = '';
      }
    }

    // Ajouter le paragraphe en cours s'il reste du texte
    if (currentParagraph) {
      result += this.simpleClean(currentParagraph);
    }

    return result.trim();
  }

  /**
   * Détermine si on doit terminer un paragraphe
   */
  private shouldEndParagraph(current: TranscriptionSegment, next?: TranscriptionSegment): boolean {
    if (!next) return true; // Dernier segment

    // Pause longue (plus de 3 secondes)
    const timeGap = next.timestamp - current.timestamp;
    if (timeGap > 3000) return true;

    // Changement de contexte (mots-clés de transition)
    const transitionWords = [
      'premièrement', 'deuxièmement', 'troisièmement',
      'enfin', 'pour conclure', 'en conclusion',
      'd\'abord', 'ensuite', 'par ailleurs',
      'maintenant', 'alors', 'donc', 'mais',
      'bonjour', 'salut', 'au revoir', 'merci'
    ];

    const hasTransition = transitionWords.some(word => 
      next.text.toLowerCase().startsWith(word) || 
      next.text.toLowerCase().includes(` ${word} `)
    );

    if (hasTransition) return true;

    // Paragraphe trop long (plus de 200 caractères)
    const currentLength = current.text.length;
    if (currentLength > 200) return true;

    return false;
  }

  /**
   * Nettoyage simple - juste les espaces multiples
   */
  private simpleClean(text: string): string {
    // Supprimer les espaces multiples
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Obtient la transcription formatée actuelle
   */
  getFormattedTranscription(): string {
    return this.formatTranscription();
  }

  /**
   * Efface toutes les données
   */
  clear(): void {
    this.segments = [];
  }

  /**
   * Obtient les statistiques de la transcription
   */
  getStats() {
    const totalText = this.segments
      .filter(s => s.isFinal)
      .map(s => s.text)
      .join(' ');
    
    return {
      segments: this.segments.length,
      finalSegments: this.segments.filter(s => s.isFinal).length,
      totalCharacters: totalText.length,
      totalWords: totalText.split(/\s+/).length,
      duration: this.segments.length > 0 
        ? this.segments[this.segments.length - 1].timestamp - this.segments[0].timestamp
        : 0
    };
  }
} 