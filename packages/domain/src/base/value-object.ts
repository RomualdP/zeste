export abstract class ValueObject<T> {
  constructor(readonly value: T) {
    this.validate(value);
    Object.freeze(this);
  }

  protected abstract validate(value: T): void;

  equals(other: ValueObject<T>): boolean {
    return JSON.stringify(this.value) === JSON.stringify(other.value);
  }
}
