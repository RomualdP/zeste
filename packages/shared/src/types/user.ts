import type { UserTier } from '../enums';

export interface User {
  id: string;
  email: string;
  displayName: string;
  tier: UserTier;
  createdAt: string;
}
