import { currentUser, superAdminUser } from '@/api/adapters/mock/mockClients'

/** Demo login credentials for local development (mock auth only). */
export const demoUsers = {
  client: {
    email: currentUser.email,
    password: 'client',
    name: currentUser.name,
    zone: 'client' as const,
  },
  admin: {
    email: superAdminUser.email,
    password: 'admin',
    name: superAdminUser.name,
    zone: 'admin' as const,
  },
}
