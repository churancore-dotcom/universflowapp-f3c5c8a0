import { useAuth } from '@/contexts/AuthContext';

/**
 * Email verification has been removed. Always treat users as verified
 * once they're signed in.
 */
export function useEmailVerified() {
  const { user } = useAuth();
  const isVerified = !!user;
  const noop = async () => true;
  const requireVerified = (_action = 'continue'): boolean => !!user;

  return {
    user,
    isVerified,
    loading: false,
    refresh: noop,
    sendCode: noop,
    requireVerified,
    resendVerification: noop,
  };
}
