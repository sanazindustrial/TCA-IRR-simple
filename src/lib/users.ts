
export type User = {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'Admin' | 'Reviewer' | 'User' | 'AI Adopter';
  avatar?: string;
};

export const users: User[] = [
  {
    id: 'usr_admin',
    name: 'Admin User',
    email: 'admin@tca.com',
    password: 'admin123',
    role: 'Admin',
  },
  {
    id: 'usr_reviewer',
    name: 'Reviewer User',
    email: 'reviewer@tca.com',
    password: 'reviewer123',
    role: 'Reviewer',
  },
  {
    id: 'usr_standard',
    name: 'Standard User',
    email: 'user@tca.com',
    password: 'user123',
    role: 'User',
  },
   {
    id: 'usr_adopter',
    name: 'AI Adopter',
    email: 'adopter@tca.com',
    password: 'adopter123',
    role: 'AI Adopter',
  },
];
