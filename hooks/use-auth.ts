'use client';

import { useContext } from 'react';
import { AuthContext, type AuthContextType } from '@/lib/auth/client-context';

/**i877
 * Hook to access authentication context
 * 
 * @returns Auth context with user data, loading state, and auth functions
 * @throws Error if used outside of AuthClientProvider
 * 
 * @example
 * ```tsx
 * import { useAuth } from '@/hooks/use-auth';
 * 
 * export function MyComponent() {
 *   const { user, isAuthenticated, isAdmin, loading, logout } = useAuth();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (!isAuthenticated) return <div>Please log in</div>;
 *   
 *   return (
 *     <div>
 *       <p>Welcome, {user?.full_name || user?.email}</p>
 *       <p>Role: {user?.role}</p>
 *       {isAdmin && <p>You are an admin</p>}
 *       <button onClick={() => logout()}>Logout</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthClientProvider. ' +
      'Make sure your component is wrapped with <AuthClientProvider> in the app layout.'
    );
  }

  return context;
}
