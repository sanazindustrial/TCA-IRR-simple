
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
    id: 'usr_sanaz',
    name: 'Sanaz Admin',
    email: 'sanazindustrial@gmail.com',
    password: 'admin123',
    role: 'Admin',
  },
  {
    id: 'usr_admin',
    name: 'Admin User',
    email: 'admin@tca.com',
    password: 'admin123',
    role: 'Admin',
  },
  {
    id: 'usr_platform_admin',
    name: 'Platform Admin',
    email: 'admin@tcaplatform.com',
    password: 'admin123456',
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
    id: 'usr_analyst_platform',
    name: 'Platform Analyst',
    email: 'analyst1@tcaplatform.com',
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
