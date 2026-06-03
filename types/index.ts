export type UserRole = 'user' | 'manager' | 'admin'

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  user_id: string
  name: string
  emails: string          // comma-separated
  telegram_id: string | null
  notes: string | null
  tags: string | null
  created_at: string
  updated_at: string
  profiles?: Pick<Profile, 'full_name' | 'email'>
}

export interface EmailLog {
  id: string
  user_id: string
  contact_id: string | null
  subject: string
  body: string
  recipients: string      // comma-separated emails sent to
  status: 'sent' | 'failed' | 'pending'
  error_message: string | null
  sent_at: string
  contacts?: Pick<Contact, 'name'>
  profiles?: Pick<Profile, 'full_name' | 'email'>
}

export interface FollowUp {
  id: string
  email_log_id: string
  contact_id: string | null
  subject: string
  body: string
  scheduled_at: string
  sent: boolean
  created_at: string
  contacts?: Pick<Contact, 'name' | 'emails'>
}

export interface DashboardStats {
  totalContacts: number
  totalEmailsSent: number
  totalTelegramIds: number
  pendingFollowUps: number
}
