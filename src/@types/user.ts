// src\@types\user.ts
export interface User {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
  isActive?: boolean;
  createdAt?: string;
}
