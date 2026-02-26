import type { LlmServicePort, ChapterPlanItem } from '../application/ports/llm-service.port';
import type { Tone, ScriptEntry } from '@zeste/shared';

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const MODEL = 'mistral-small-latest';

const TONE_INSTRUCTIONS: Record<string, string> = {
  pedagogue: 'Adopte un ton pédagogue : explique clairement les concepts, utilise des analogies et guide l\'auditeur pas à pas.',
  debate: 'Adopte un ton de débat : l\'hôte et l\'expert confrontent des points de vue différents, avec des arguments structurés.',
  vulgarization: 'Adopte un ton de vulgarisation : rends le sujet accessible à tous, avec humour et des exemples du quotidien.',
  interview: 'Adopte un ton d\'interview : l\'hôte pose des questions pertinentes et l\'expert y répond avec expertise.',
};

const EMOTION_INSTRUCTIONS = `
TAGS D'ÉMOTION (champ "tone") :
Le champ "tone" sera utilisé pour piloter la synthèse vocale. Utilise UNIQUEMENT ces tags :
- Pour l'hôte : "excited", "curious", "surprised", "amused", "happy", "serious", "interested"
- Pour l'expert : "confident", "serious", "sincere", "relaxed", "empathetic", "calm", "satisfied"
- Effets sonores (utilisables par les deux) : "laughing", "sighing"
- Varie les émotions d'une prise de parole à l'autre pour un rendu dynamique et naturel.
- Ne mets JAMAIS deux fois le même tag d'affilée pour le même speaker.`;

export class MistralLlmService implements LlmServicePort {
  private static readonly MAX_CONTINUATIONS = 3;
  private static readonly WORD_COUNT_THRESHOLD = 0.8;

  constructor(private readonly apiKey: string) {}

  async generateChapterPlan(input: {
    sources: string[];
    tone: Tone;
    chapterCount: number;
  }): Promise<ChapterPlanItem[]> {
    const systemPrompt = `Tu es un producteur de podcast en français. ${TONE_INSTRUCTIONS[input.tone] ?? ''}
Génère un plan de chapitres pour un épisode de podcast basé sur les sources fournies.
Réponds UNIQUEMENT avec un tableau JSON valide de la forme : [{"title": "...", "summary": "..."}]
Le plan doit contenir exactement ${input.chapterCount} chapitres.`;

    const userPrompt = `Sources :\n\n${input.sources.join('\n\n---\n\n')}`;

    const content = await this.callMistral(systemPrompt, userPrompt);
    return JSON.parse(content) as ChapterPlanItem[];
  }

  async generateChapterScript(input: {
    chapterTitle: string;
    chapterSummary: string;
    sources: string[];
    tone: Tone;
    targetWordCount: number;
    previousChaptersContext: string[];
  }): Promise<ScriptEntry[]> {
    const script = await this.generateInitialScript(input);
    return this.ensureTargetWordCount(script, input);
  }

  private async generateInitialScript(input: {
    chapterTitle: string;
    chapterSummary: string;
    sources: string[];
    tone: Tone;
    targetWordCount: number;
    previousChaptersContext: string[];
  }): Promise<ScriptEntry[]> {
    const minEntries = Math.max(8, Math.round(input.targetWordCount / 50));
    const wordsPerEntry = Math.round(input.targetWordCount / minEntries);
    const systemPrompt = `Tu es un scénariste de podcast en français avec deux intervenants : "host" (l'hôte) et "expert" (l'invité expert).
${TONE_INSTRUCTIONS[input.tone] ?? ''}
Génère un script de dialogue naturel et COMPLET pour un chapitre de podcast.

CONTRAINTES STRICTES DE LONGUEUR :
- Le script DOIT faire au minimum ${input.targetWordCount} mots au total.
- Le script DOIT contenir au minimum ${minEntries} prises de parole alternées.
- Chaque prise de parole DOIT faire entre ${wordsPerEntry} et ${wordsPerEntry * 2} mots (soit 3-6 phrases complètes). Pas de réponses courtes.
- Développe chaque idée en profondeur : exemples concrets, anecdotes, chiffres, comparaisons, explications détaillées.
- Ne résume JAMAIS, ne condense JAMAIS. Le but est un contenu riche, détaillé et long.
${EMOTION_INSTRUCTIONS}

RAPPEL : ${input.targetWordCount} mots MINIMUM au total. Si tu produis moins, le script sera rejeté.

Réponds UNIQUEMENT avec un tableau JSON valide de la forme : [{"speaker": "host"|"expert", "text": "...", "tone": "..."}]`;

    let userPrompt = `Chapitre : ${input.chapterTitle}\nRésumé : ${input.chapterSummary}\n\nSources :\n${input.sources.join('\n\n---\n\n')}`;

    if (input.previousChaptersContext.length > 0) {
      userPrompt += `\n\nContexte des chapitres précédents :\n${input.previousChaptersContext.join('\n')}`;
    }

    const content = await this.callMistral(systemPrompt, userPrompt);
    return JSON.parse(content) as ScriptEntry[];
  }

  private async ensureTargetWordCount(
    script: ScriptEntry[],
    input: {
      chapterTitle: string;
      chapterSummary: string;
      sources: string[];
      tone: Tone;
      targetWordCount: number;
      previousChaptersContext: string[];
    },
    attempt = 0,
  ): Promise<ScriptEntry[]> {
    const currentWords = this.countWords(script);
    const threshold = input.targetWordCount * MistralLlmService.WORD_COUNT_THRESHOLD;

    if (currentWords >= threshold || attempt >= MistralLlmService.MAX_CONTINUATIONS) {
      return script;
    }

    console.log(`[LLM] Continuation ${attempt + 1}: ${currentWords} words, target ${input.targetWordCount}`);

    const remainingWords = input.targetWordCount - currentWords;
    const continuation = await this.generateContinuation(script, input, remainingWords);
    const merged = [...script, ...continuation];

    return this.ensureTargetWordCount(merged, input, attempt + 1);
  }

  private async generateContinuation(
    existingScript: ScriptEntry[],
    input: {
      chapterTitle: string;
      chapterSummary: string;
      sources: string[];
      tone: Tone;
      targetWordCount: number;
    },
    remainingWords: number,
  ): Promise<ScriptEntry[]> {
    const minEntries = Math.max(4, Math.round(remainingWords / 50));
    const systemPrompt = `Tu es un scénariste de podcast en français avec deux intervenants : "host" et "expert".
${TONE_INSTRUCTIONS[input.tone] ?? ''}
Tu dois CONTINUER un script de podcast existant. Le script actuel est trop court.

CONTRAINTES :
- Génère au minimum ${remainingWords} mots supplémentaires.
- Génère au minimum ${minEntries} nouvelles prises de parole alternées.
- Continue naturellement là où le dialogue s'est arrêté.
- Ne répète PAS ce qui a déjà été dit.
- Explore de nouveaux angles, exemples, anecdotes sur le même sujet.
${EMOTION_INSTRUCTIONS}

Réponds UNIQUEMENT avec un tableau JSON valide de la forme : [{"speaker": "host"|"expert", "text": "...", "tone": "..."}]`;

    const scriptSummary = existingScript.map((e) => `[${e.speaker}]: ${e.text}`).join('\n');
    const userPrompt = `Chapitre : ${input.chapterTitle}\n\nScript existant (${this.countWords(existingScript)} mots, objectif : ${input.targetWordCount} mots) :\n${scriptSummary}\n\nSources :\n${input.sources.join('\n\n---\n\n')}\n\nContinue le dialogue avec au moins ${remainingWords} mots supplémentaires.`;

    const content = await this.callMistral(systemPrompt, userPrompt);
    return JSON.parse(content) as ScriptEntry[];
  }

  private countWords(script: ScriptEntry[]): number {
    return script.reduce((sum, entry) => sum + entry.text.split(/\s+/).filter(Boolean).length, 0);
  }

  private async callMistral(systemPrompt: string, userPrompt: string, maxTokens = 16000): Promise<string> {
    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mistral API error (${response.status}): ${errorText}`);
    }

    const data: any = await response.json();
    const content = data.choices[0]?.message?.content ?? '[]';

    // Extract JSON array from response (Mistral may wrap in object)
    const trimmed = content.trim();
    if (trimmed.startsWith('[')) return trimmed;

    // If response is an object with an array property, extract it
    try {
      const parsed = JSON.parse(trimmed);
      const arrayKey = Object.keys(parsed).find((k) => Array.isArray(parsed[k]));
      if (arrayKey) return JSON.stringify(parsed[arrayKey]);
    } catch {
      // fallback
    }

    return trimmed;
  }
}
