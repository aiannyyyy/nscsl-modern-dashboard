// Re-export the useAuth hook from AuthContext for convenience
// This allows imports like: import { useAuth } from '@/hooks/useAuth'
// Instead of: import { useAuth } from '@/context/AuthContext'

export { useAuth } from '../context/AuthContext';