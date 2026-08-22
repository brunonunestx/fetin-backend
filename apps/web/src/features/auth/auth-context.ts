import { createContext } from 'react';
import type { AuthUser } from '@/features/auth/auth-types';
import type { UserProfile } from '@/features/profile/profile-types';
import type { SessionEvent } from '@/lib/session-store';

type AuthStatus = 'anonymous' | 'authenticated' | 'error' | 'loading';

type AuthContextValue = {
  exitReason: Exclude<SessionEvent, 'signed-in'> | null;
  logout: () => void;
  profile: UserProfile | null;
  retrySession: () => void;
  status: AuthStatus;
  user: AuthUser | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export { AuthContext };
export type { AuthContextValue, AuthStatus };
