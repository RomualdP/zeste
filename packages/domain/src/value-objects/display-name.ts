import { ValueObject } from '../base';

export class DisplayName extends ValueObject<string> {
  constructor(value: string) {
    super(value.trim());
  }

  protected validate(value: string): void {
    if (value.length < 1 || value.length > 50) {
      throw new Error('Display name must be between 1 and 50 characters');
    }
  }
}
