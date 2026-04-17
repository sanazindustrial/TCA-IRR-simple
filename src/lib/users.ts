
export type User = {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'Admin' | 'Analyst' | 'User' | 'AI Adopter';
  avatar?: string;
};

export const users: User[] = [];
