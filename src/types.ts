// src/types.ts
export type UserRole = 'admin' | 'account' | 'user';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}
