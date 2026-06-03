export type AppRole = 'admin' | 'manager' | 'user'

export const ROLE_LABELS: Record<AppRole, string> = {
  admin:   'Admin',
  manager: 'Manager',
  user:    'User',
}

/** Admin and manager can see all records; user sees only own (+ granted access) */
export function canViewAll(role: AppRole) {
  return role === 'admin' || role === 'manager'
}

/** Admin = all records. Manager = own records only (others are read-only). User = own records only. */
export function canWrite(role: AppRole, recordUserId: string, currentUserId: string) {
  if (role === 'admin') return true
  return recordUserId === currentUserId   // manager & user: own records only
}

/** Only admin can access the admin panel */
export function isAdmin(role: AppRole) {
  return role === 'admin'
}
