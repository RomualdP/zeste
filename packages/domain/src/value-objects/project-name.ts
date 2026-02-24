import { ValueObject } from '../base';

const MIN_LENGTH = 1;
const MAX_LENGTH = 100;

export class ProjectName extends ValueObject<string> {
  protected validate(value: string): void {
    const trimmed = value.trim();
    if (trimmed.length < MIN_LENGTH || trimmed.length > MAX_LENGTH) {
      throw new Error(
        `Project name must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters, got ${trimmed.length}`,
      );
    }
  }
}
