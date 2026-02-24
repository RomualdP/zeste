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

export class MistralLlmService implements LlmServicePort {
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
    const systemPrompt = `Tu es un scénariste de podcast en français avec deux intervenants : "host" (l'hôte) et "expert" (l'invité expert).
${TONE_INSTRUCTIONS[input.tone] ?? ''}
Génère un script de dialogue naturel pour un chapitre de podcast.
Le script doit faire environ ${input.targetWordCount} mots au total.
Réponds UNIQUEMENT avec un tableau JSON valide de la forme : [{"speaker": "host"|"expert", "text": "...", "tone": "..."}]
Alterne les prises de parole de manière naturelle. Chaque entrée fait 2-4 phrases.`;

    let userPrompt = `Chapitre : ${input.chapterTitle}\nRésumé : ${input.chapterSummary}\n\nSources :\n${input.sources.join('\n\n---\n\n')}`;

    if (input.previousChaptersContext.length > 0) {
      userPrompt += `\n\nContexte des chapitres précédents :\n${input.previousChaptersContext.join('\n')}`;
    }

    const content = await this.callMistral(systemPrompt, userPrompt);
    return JSON.parse(content) as ScriptEntry[];
  }

  private async callMistral(systemPrompt: string, userPrompt: string): Promise<string> {
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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mistral API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
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
