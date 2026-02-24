import { Entity } from '../base';
import { Slug } from '../value-objects';

interface SharedLinkProps {
  projectId: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
}

export class SharedLinkEntity extends Entity {
  readonly projectId: string;
  readonly slug: string;
  readonly isActive: boolean;
  readonly createdAt: string;

  constructor(id: string, props: SharedLinkProps) {
    super(id);
    this.projectId = props.projectId;
    this.slug = props.slug;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
  }

  static create(id: string, projectId: string, slug: string): SharedLinkEntity {
    // Validate slug via value object
    new Slug(slug);

    return new SharedLinkEntity(id, {
      projectId,
      slug,
      isActive: true,
      createdAt: new Date().toISOString(),
    });
  }

  deactivate(): SharedLinkEntity {
    if (!this.isActive) {
      throw new Error('Shared link is already inactive');
    }
    return new SharedLinkEntity(this.id, {
      ...this.toProps(),
      isActive: false,
    });
  }

  private toProps(): SharedLinkProps {
    return {
      projectId: this.projectId,
      slug: this.slug,
      isActive: this.isActive,
      createdAt: this.createdAt,
    };
  }
}
