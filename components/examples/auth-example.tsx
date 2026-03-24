'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

/**
 * Example component showing how to use the authentication context
 * 
 * This demonstrates:
 * - Accessing user data and auth state
 * - Checking loading state
 * - Verifying authentication status
 * - Checking user role
 * - Calling logout function
 */
export function AuthExample() {
  const { user, loading, isAuthenticated, isAdmin, isExpert, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Loading authentication...</p>
      </div>
    );
  }

  // Show message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground mb-4">You are not logged in</p>
        <Button onClick={() => router.push('/login')}>
          Go to Login
        </Button>
      </div>
    );
  }

  // User is authenticated - show their info
  return (
    <div className="p-4 border rounded-lg">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">User Information</h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Email:</span>{' '}
              {user?.email}
            </p>
            {user?.full_name && (
              <p>
                <span className="text-muted-foreground">Name:</span>{' '}
                {user.full_name}
              </p>
            )}
            <p>
              <span className="text-muted-foreground">Role:</span>{' '}
              <span className="capitalize">{user?.role}</span>
            </p>
            {user?.avatar_url && (
              <p>
                <span className="text-muted-foreground">Avatar:</span>{' '}
                <a
                  href={user.avatar_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Role-based content */}
        <div>
          <h3 className="font-semibold mb-2">Permissions</h3>
          <div className="space-y-1 text-sm">
            <p className={isAdmin ? 'text-green-600' : 'text-muted-foreground'}>
              {isAdmin ? '✓' : '✗'} Admin
            </p>
            <p className={isExpert ? 'text-green-600' : 'text-muted-foreground'}>
              {isExpert ? '✓' : '✗'} Expert
            </p>
          </div>
        </div>

        {/* Logout button */}
        <Button
          variant="destructive"
          onClick={handleLogout}
          className="w-full"
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
