import type { TtsServicePort, TtsSegment, TtsResult } from '../application/ports/tts-service.port';
import { AUDIO } from '@zeste/shared';

const FISH_AUDIO_API_URL = 'https://api.fish.audio/v1/tts';

export class FishAudioTtsService implements TtsServicePort {
  private readonly voiceIds: Record<string, string>;

  constructor(
    private readonly apiKey: string,
    hostVoiceId: string,
    expertVoiceId: string,
  ) {
    this.voiceIds = {
      host: hostVoiceId,
      expert: expertVoiceId,
    };
  }

  async synthesizeChapter(segments: TtsSegment[]): Promise<TtsResult> {
    if (segments.length === 0) {
      return { audioBuffer: Buffer.alloc(0), durationMs: 0 };
    }

    const audioChunks: Buffer[] = [];
    let totalDurationMs = 0;

    for (const segment of segments) {
      const voiceId = this.voiceIds[segment.speaker] ?? '';
      const chunk = await this.synthesizeSegment(segment.text, voiceId, segment.emotion);
      audioChunks.push(chunk);

      // Estimate duration from word count (150 words/min)
      const wordCount = segment.text.split(/\s+/).length;
      totalDurationMs += (wordCount / AUDIO.WORDS_PER_MINUTE) * 60 * 1000;
      totalDurationMs += AUDIO.SILENCE_BETWEEN_REPLIES_MS;
    }

    const audioBuffer = Buffer.concat(audioChunks);
    return { audioBuffer, durationMs: Math.round(totalDurationMs) };
  }

  private async synthesizeSegment(text: string, voiceId: string, emotion?: string): Promise<Buffer> {
    const ttsText = emotion ? `(${emotion}) ${text}` : text;

    const response = await fetch(FISH_AUDIO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'model': 's1',
      },
      body: JSON.stringify({
        text: ttsText,
        reference_id: voiceId,
        format: 'mp3',
        mp3_bitrate: AUDIO.MP3_BITRATE,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Fish Audio API error (${response.status}): ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
