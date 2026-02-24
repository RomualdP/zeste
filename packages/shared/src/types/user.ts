export interface User {
  id: string;
  email: string;
  displayName: string;
  subscriptionActive: boolean;
  subscriptionExpiresAt: string | null;
  createdAt: string;
}
