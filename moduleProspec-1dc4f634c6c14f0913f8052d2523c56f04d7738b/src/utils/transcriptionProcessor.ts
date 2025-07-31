/**
 * Utilitaire pour structurer intelligemment les transcriptions
 */

interface TranscriptionSegment {
  text: string;
  isFinal: boolean;
  timestamp: number;
}

export class TranscriptionProcessor {
  private segments: TranscriptionSegment[] = [];
  private lastProcessedLength = 0;

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
   * Formate la transcription avec une structure de paragraphes
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
        // Finaliser le paragraphe
        result += this.cleanParagraph(currentParagraph) + '\n\n';
        currentParagraph = '';
      }
    }

    // Ajouter le paragraphe en cours s'il reste du texte
    if (currentParagraph) {
      result += this.cleanParagraph(currentParagraph);
    }

    return result.trim();
  }

  /**
   * Détermine si on doit terminer un paragraphe
   */
  private shouldEndParagraph(current: TranscriptionSegment, next?: TranscriptionSegment): boolean {
    if (!next) return true; // Dernier segment

    // Pause très longue (plus de 5 secondes au lieu de 3)
    const timeGap = next.timestamp - current.timestamp;
    if (timeGap > 5000) return true;

    // Changement de contexte (mots-clés de transition plus spécifiques)
    const strongTransitionWords = [
      'premièrement', 'deuxièmement', 'troisièmement',
      'enfin', 'pour conclure', 'en conclusion',
      'd\'abord', 'ensuite', 'par ailleurs',
      'maintenant', 'alors', 'donc'
    ];

    const hasStrongTransition = strongTransitionWords.some(word => 
      next.text.toLowerCase().startsWith(word) || 
      next.text.toLowerCase().includes(` ${word} `)
    );

    if (hasStrongTransition) return true;

    // Longueur du paragraphe (plus de 300 caractères au lieu de 150)
    const currentLength = current.text.length;
    if (currentLength > 300) return true;

    // Vérifier si c'est une nouvelle phrase qui commence par une majuscule
    // et qui n'est pas une continuation naturelle
    const startsNewSentence = /^[A-Z]/.test(next.text) && 
      !['Et', 'Et puis', 'Et aussi', 'Et comme', 'Et si', 'Et quand', 'Et où'].some(start => 
        next.text.startsWith(start)
      );

    // Ne pas segmenter si c'est une continuation naturelle
    if (startsNewSentence && timeGap > 2000) return true;

    return false;
  }

  /**
   * Nettoie et améliore un paragraphe
   */
  private cleanParagraph(text: string): string {
    // Supprimer les espaces multiples
    text = text.replace(/\s+/g, ' ');
    
    // Nettoyer les répétitions de mots consécutifs (hésitations)
    text = text.replace(/\b(\w+)\s+\1\b/g, '$1');
    
    // Nettoyer les répétitions de "et et"
    text = text.replace(/\bet\s+et\b/g, 'et');
    
    // Nettoyer les répétitions de "si jamais si jamais"
    text = text.replace(/\bsi\s+jamais\s+si\s+jamais\b/g, 'si jamais');
    
    // Nettoyer les répétitions de phrases complètes
    text = this.removeDuplicateSentences(text);
    
    // Nettoyer les phrases incomplètes ou trop courtes
    text = this.cleanIncompleteSentences(text);
    
    // Capitaliser la première lettre
    text = text.charAt(0).toUpperCase() + text.slice(1);
    
    // Ajouter un point si pas de ponctuation finale
    if (!/[.!?]$/.test(text)) {
      text += '.';
    }
    
    // Nettoyer les répétitions de ponctuation
    text = text.replace(/[.!?]+$/, text.match(/[.!?]$/)?.[0] || '.');
    
    return text.trim();
  }

  /**
   * Supprime les phrases dupliquées
   */
  private removeDuplicateSentences(text: string): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const uniqueSentences: string[] = [];
    
    sentences.forEach(sentence => {
      const cleanSentence = sentence.trim();
      if (!uniqueSentences.some(existing => 
        this.similarity(existing, cleanSentence) > 0.8
      )) {
        uniqueSentences.push(cleanSentence);
      }
    });
    
    return uniqueSentences.join('. ') + '.';
  }

  /**
   * Nettoie les phrases incomplètes
   */
  private cleanIncompleteSentences(text: string): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const cleanSentences: string[] = [];
    
    sentences.forEach(sentence => {
      const cleanSentence = sentence.trim();
      
      // Ignorer les phrases trop courtes (moins de 3 mots)
      if (cleanSentence.split(/\s+/).length < 3) return;
      
      // Ignorer les phrases qui se terminent par des mots incomplets
      if (/\b\w{1,2}\s*$/.test(cleanSentence)) return;
      
      // Ignorer les phrases qui commencent par des mots de liaison seuls
      if (/^(Et|Ou|Mais|Donc|Alors|Puis|Ensuite|Après|Avant|Pendant|Pendant que|Quand|Où|Comment|Pourquoi|Quoi|Qui|Que|Dont|Où)\s*$/.test(cleanSentence)) return;
      
      cleanSentences.push(cleanSentence);
    });
    
    return cleanSentences.join('. ') + '.';
  }

  /**
   * Calcule la similarité entre deux chaînes (algorithme simple)
   */
  private similarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = Math.max(words1.length, words2.length);
    
    return totalWords > 0 ? commonWords.length / totalWords : 0;
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
    this.lastProcessedLength = 0;
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

  /**
   * Méthode de test pour démontrer la structuration
   */
  static testExample() {
    const processor = new TranscriptionProcessor();
    
    // Simuler une conversation
    const testSegments = [
      { text: "Bonjour, je m'appelle Jean Dupont", isFinal: true },
      { text: "Je travaille pour l'entreprise ABC", isFinal: true },
      { text: "Nous proposons des solutions innovantes", isFinal: true },
      { text: "Donc, laissez-moi vous présenter", isFinal: true },
      { text: "nos produits de qualité", isFinal: true },
      { text: "Premièrement, nous avons", isFinal: true },
      { text: "une gamme complète de services", isFinal: true },
      { text: "Deuxièmement, nos prix sont", isFinal: true },
      { text: "très compétitifs sur le marché", isFinal: true },
      { text: "Enfin, notre support client", isFinal: true },
      { text: "est disponible 24h sur 24", isFinal: true }
    ];

    console.log('=== TEST DE STRUCTURATION ===');
    
    testSegments.forEach((segment, index) => {
      const result = processor.addSegment(segment.text, segment.isFinal);
      console.log(`\n--- Segment ${index + 1} ---`);
      console.log(`Texte: "${segment.text}"`);
      console.log(`Résultat structuré:\n${result}`);
    });

    console.log('\n=== STATISTIQUES FINALES ===');
    console.log(processor.getStats());
    
    return processor.getFormattedTranscription();
  }
} 