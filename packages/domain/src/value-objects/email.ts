import { ValueObject } from '../base';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email extends ValueObject<string> {
  protected validate(value: string): void {
    if (!EMAIL_REGEX.test(value)) {
      throw new Error(`Invalid email: ${value}`);
    }
  }
}
