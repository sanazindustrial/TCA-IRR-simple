
export type User = {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'Admin' | 'Analyst' | 'User' | 'AI Adopter';
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
    id: 'usr_analyst',
    name: 'Analyst User',
    email: 'analyst@tca.com',
    password: 'analyst123',
    role: 'Analyst',
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
