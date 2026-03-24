import type {Metadata} from 'next';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from '@/lib/providers/query-provider';
import { ThemeProvider } from '@/lib/providers/theme-provider';
import { AuthProvider } from '@/lib/providers/auth-provider';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'Mental Health Admin Panel',
  description: 'Admin Panel for Mental Health Platform',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
