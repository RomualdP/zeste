import { Entity } from '../base';
import { Email } from '../value-objects/email';
import { DisplayName } from '../value-objects/display-name';

interface UserProps {
  email: Email;
  displayName: DisplayName;
  subscriptionActive: boolean;
  subscriptionExpiresAt: string | null;
  createdAt: string;
}

export class UserEntity extends Entity {
  readonly email: Email;
  readonly displayName: DisplayName;
  readonly subscriptionActive: boolean;
  readonly subscriptionExpiresAt: string | null;
  readonly createdAt: string;

  constructor(id: string, props: UserProps) {
    super(id);
    this.email = props.email;
    this.displayName = props.displayName;
    this.subscriptionActive = props.subscriptionActive;
    this.subscriptionExpiresAt = props.subscriptionExpiresAt;
    this.createdAt = props.createdAt;
  }

  static create(id: string, email: string, displayName: string): UserEntity {
    return new UserEntity(id, {
      email: new Email(email),
      displayName: new DisplayName(displayName),
      subscriptionActive: false,
      subscriptionExpiresAt: null,
      createdAt: new Date().toISOString(),
    });
  }

  activateSubscription(expiresAt: string): UserEntity {
    return new UserEntity(this.id, {
      ...this.toProps(),
      subscriptionActive: true,
      subscriptionExpiresAt: expiresAt,
    });
  }

  deactivateSubscription(): UserEntity {
    return new UserEntity(this.id, {
      ...this.toProps(),
      subscriptionActive: false,
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
      subscriptionActive: this.subscriptionActive,
      subscriptionExpiresAt: this.subscriptionExpiresAt,
      createdAt: this.createdAt,
    };
  }
}
