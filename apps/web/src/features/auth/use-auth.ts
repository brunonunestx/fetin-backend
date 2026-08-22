import { useContext } from 'react';
import { AuthContext } from '@/features/auth/auth-context';

function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }

  return context;
}

export { useAuth };
