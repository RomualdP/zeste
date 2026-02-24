import { describe, it, expect } from 'vitest';
import { Entity } from './entity';
import { ValueObject } from './value-object';

class TestEntity extends Entity {
  constructor(
    id: string,
    readonly name: string,
  ) {
    super(id);
  }
}

class TestValueObject extends ValueObject<string> {
  protected validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('Value cannot be empty');
    }
  }
}

describe('Entity', () => {
  it('should store id', () => {
    const entity = new TestEntity('123', 'test');
    expect(entity.id).toBe('123');
  });

  it('should be equal when ids match', () => {
    const a = new TestEntity('123', 'name-a');
    const b = new TestEntity('123', 'name-b');
    expect(a.equals(b)).toBe(true);
  });

  it('should not be equal when ids differ', () => {
    const a = new TestEntity('123', 'test');
    const b = new TestEntity('456', 'test');
    expect(a.equals(b)).toBe(false);
  });
});

describe('ValueObject', () => {
  it('should store value', () => {
    const vo = new TestValueObject('hello');
    expect(vo.value).toBe('hello');
  });

  it('should be immutable (frozen)', () => {
    const vo = new TestValueObject('hello');
    expect(Object.isFrozen(vo)).toBe(true);
  });

  it('should throw on invalid value', () => {
    expect(() => new TestValueObject('')).toThrow('Value cannot be empty');
    expect(() => new TestValueObject('   ')).toThrow('Value cannot be empty');
  });

  it('should be equal when values match', () => {
    const a = new TestValueObject('hello');
    const b = new TestValueObject('hello');
    expect(a.equals(b)).toBe(true);
  });

  it('should not be equal when values differ', () => {
    const a = new TestValueObject('hello');
    const b = new TestValueObject('world');
    expect(a.equals(b)).toBe(false);
  });
});
