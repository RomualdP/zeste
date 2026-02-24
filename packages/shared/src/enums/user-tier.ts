export const UserTier = {
  Free: 'free',
  Premium: 'premium',
} as const;

export type UserTier = (typeof UserTier)[keyof typeof UserTier];
