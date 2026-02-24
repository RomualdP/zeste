import { ValueObject } from '../base';

const SLUG_REGEX = /^[a-zA-Z0-9_-]+$/;

export class Slug extends ValueObject<string> {
  protected validate(value: string): void {
    if (!value || !SLUG_REGEX.test(value)) {
      throw new Error(`Invalid slug: ${value}. Must be URL-safe (alphanumeric, hyphens, underscores)`);
    }
  }
}
