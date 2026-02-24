import { ValueObject } from '../base';

export class Password extends ValueObject<string> {
  protected validate(value: string): void {
    if (value.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(value)) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    if (!/\d/.test(value)) {
      throw new Error('Password must contain at least one digit');
    }
  }
}
