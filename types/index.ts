export type UserRole = 'user' | 'manager' | 'admin'

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export type ContactModel = 'Revshare' | 'CPA' | 'Hybrid' | 'Fixed'

export interface Contact {
  id: string
  user_id: string
  name: string
  emails: string          // comma-separated
  telegram_id: string | null
  notes: string | null
  tags: string | null
  is_partner: boolean
  model: ContactModel | null
  country: string | null
  created_at: string
  updated_at: string
  profiles?: Pick<Profile, 'full_name' | 'email'>
}

export interface DashboardStats {
  totalContacts: number
  totalEmailsSent: number
  totalTelegramIds: number
}
