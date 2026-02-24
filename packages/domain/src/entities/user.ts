import { Entity } from '../base';
import { Email } from '../value-objects/email';
import { DisplayName } from '../value-objects/display-name';
import { UserTier } from '@zeste/shared';

interface UserProps {
  email: Email;
  displayName: DisplayName;
  tier: UserTier;
  createdAt: string;
}

export class UserEntity extends Entity {
  readonly email: Email;
  readonly displayName: DisplayName;
  readonly tier: UserTier;
  readonly createdAt: string;

  constructor(id: string, props: UserProps) {
    super(id);
    this.email = props.email;
    this.displayName = props.displayName;
    this.tier = props.tier;
    this.createdAt = props.createdAt;
  }

  static create(id: string, email: string, displayName: string): UserEntity {
    return new UserEntity(id, {
      email: new Email(email),
      displayName: new DisplayName(displayName),
      tier: UserTier.Free,
      createdAt: new Date().toISOString(),
    });
  }

  upgradeTier(): UserEntity {
    if (this.tier === UserTier.Premium) {
      throw new Error('User is already premium');
    }
    return new UserEntity(this.id, {
      ...this.toProps(),
      tier: UserTier.Premium,
    });
  }

  downgradeTier(): UserEntity {
    if (this.tier === UserTier.Free) {
      throw new Error('User is already free');
    }
    return new UserEntity(this.id, {
      ...this.toProps(),
      tier: UserTier.Free,
    });
  }

  updateDisplayName(name: string): UserEntity {
    return new UserEntity(this.id, {
      ...this.toProps(),
      displayName: new DisplayName(name),
    });
  }

  private toProps(): UserProps {
    return {
      email: this.email,
      displayName: this.displayName,
      tier: this.tier,
      createdAt: this.createdAt,
    };
  }
}
