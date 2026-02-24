import { ValueObject } from '../base';

export class AudioDuration extends ValueObject<number> {
  protected validate(value: number): void {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`Audio duration must be a non-negative integer (seconds), got ${value}`);
    }
  }

  get minutes(): number {
    return Math.floor(this.value / 60);
  }

  get seconds(): number {
    return this.value % 60;
  }

  get formatted(): string {
    return `${this.minutes}:${String(this.seconds).padStart(2, '0')}`;
  }
}
