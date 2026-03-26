import type {Metadata} from 'next';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from '@/lib/providers/query-provider';
import { ThemeProvider } from '@/lib/providers/theme-provider';
import { AuthClientProvider } from '@/lib/auth/client-context';
import { getAuthUser } from '@/lib/auth/server';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'Mental Health Admin Panel',
  description: 'Admin Panel for Mental Health Platform',
};

// Force dynamic rendering (uses headers from middleware)
export const dynamic = 'force-dynamic'

export default async function RootLayout({children}: {children: React.ReactNode}) {
  // Get user from middleware header (server-side, no fetch)
  const userContext = await getAuthUser()
  
  // Convert to User format for client context (if authenticated)
  const initialUser = userContext ? {
    id: userContext.id,
    email: userContext.email,
    role: userContext.role,
    full_name: undefined,
    avatar_url: undefined,
  } : null

  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <QueryProvider>
            <AuthClientProvider initialUser={initialUser}>
              {children}
            </AuthClientProvider>
          </QueryProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
